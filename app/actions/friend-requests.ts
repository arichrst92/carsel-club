"use server";

/**
 * Friend request flow (Sprint 22).
 *
 * Replace existing addFriendAction (instant mutual) dgn request/accept.
 * Existing friendships table intact untuk accepted pairs.
 *
 * Refs:
 * - DB: friend_requests + friendships (existing)
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 22
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  friendRequests,
  friendships,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canonicalPair } from "@/lib/db/queries/friends";
import {
  normalizePhone,
  isValidIndonesianPhone,
} from "@/lib/auth/otp";
import { event } from "@/lib/log";
import {
  checkFriendRequestPolicy,
  denialMessage,
} from "@/lib/privacy/friend-request-policy";
import {
  notifyFriendRequest,
  notifyFriendAccepted,
} from "@/lib/notifications/generate";

export type FriendRequestState = {
  error?: string;
  success?: string;
  foundUser?: {
    id: string;
    displayName: string;
    whatsappNumber: string;
    city: string | null;
  };
} | null;

// Search user by phone (reused — same as Sprint pattern)
export async function searchUserForRequestAction(
  _prev: FriendRequestState,
  formData: FormData
): Promise<FriendRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const rawPhone = String(formData.get("phone") ?? "").trim();
  if (!rawPhone) return { error: "Nomor WhatsApp wajib diisi" };
  const phone = normalizePhone(rawPhone);
  if (!isValidIndonesianPhone(phone)) {
    return { error: "Nomor WhatsApp Indonesia tidak valid" };
  }

  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      city: users.city,
    })
    .from(users)
    .where(eq(users.whatsappNumber, phone))
    .limit(1);
  if (!user) return { error: "User dengan nomor itu belum daftar Carsel Club" };
  if (user.id === me.id) return { error: "Itu nomor kamu sendiri 😅" };

  return { foundUser: user };
}

export async function sendFriendRequestAction(
  toUserId: string,
  message?: string
): Promise<FriendRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (toUserId === me.id) return { error: "Tidak bisa add diri sendiri" };

  // Target user exists?
  const [target] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      friendRequestPolicy: users.friendRequestPolicy,
    })
    .from(users)
    .where(eq(users.id, toUserId))
    .limit(1);
  if (!target) return { error: "User tidak ditemukan" };

  // Sprint 38: enforce target's friend request policy
  if (target.friendRequestPolicy === "off") {
    return { error: denialMessage("off") };
  }
  if (target.friendRequestPolicy === "friends_of_friends") {
    // Count mutual friends via friendships table — check overlap
    const myFriends = await db
      .select({
        lo: friendships.userIdLo,
        hi: friendships.userIdHi,
      })
      .from(friendships)
      .where(
        or(
          eq(friendships.userIdLo, me.id),
          eq(friendships.userIdHi, me.id)
        )
      );
    const myFriendIds = new Set(
      myFriends.map((f) => (f.lo === me.id ? f.hi : f.lo))
    );
    const targetFriends = await db
      .select({
        lo: friendships.userIdLo,
        hi: friendships.userIdHi,
      })
      .from(friendships)
      .where(
        or(
          eq(friendships.userIdLo, toUserId),
          eq(friendships.userIdHi, toUserId)
        )
      );
    const mutual = targetFriends.filter((f) =>
      myFriendIds.has(f.lo === toUserId ? f.hi : f.lo)
    );
    const check = checkFriendRequestPolicy(
      "friends_of_friends",
      mutual.length
    );
    if (!check.allowed) {
      return { error: denialMessage("no_mutual_friends") };
    }
  }

  // Already friends?
  const [lo, hi] = canonicalPair(me.id, toUserId);
  const [existingFriendship] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(eq(friendships.userIdLo, lo), eq(friendships.userIdHi, hi)))
    .limit(1);
  if (existingFriendship)
    return { error: `${target.displayName} sudah jadi friend` };

  // Existing pending? (either direction)
  const [existingReq] = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(
      or(
        and(
          eq(friendRequests.fromUserId, me.id),
          eq(friendRequests.toUserId, toUserId)
        ),
        and(
          eq(friendRequests.fromUserId, toUserId),
          eq(friendRequests.toUserId, me.id)
        )
      )
    )
    .limit(1);

  if (existingReq) {
    if (existingReq.status === "pending") {
      if (existingReq.fromUserId === me.id) {
        return { error: "Request sudah dikirim, tunggu approval" };
      }
      return {
        error: `${target.displayName} sudah kirim request ke kamu — accept dari Incoming`,
      };
    }
    if (existingReq.status === "rejected") {
      // Allow re-send: update existing rejected → pending
      await db
        .update(friendRequests)
        .set({
          status: "pending",
          message: message?.trim() || null,
          createdAt: new Date(),
          reviewedAt: null,
          fromUserId: me.id,
          toUserId,
        })
        .where(eq(friendRequests.id, existingReq.id));
    }
  } else {
    try {
      await db.insert(friendRequests).values({
        fromUserId: me.id,
        toUserId,
        message: message?.trim() || null,
      });
    } catch (e) {
      console.error("[sendFriendRequestAction]", e);
      return { error: "Gagal kirim request. Coba lagi." };
    }
  }

  event("friend_request_sent", {
    fromUserId: me.id,
    toUserId,
  });
  notifyFriendRequest(toUserId, {
    fromUserId: me.id,
    fromDisplayName: me.displayName,
    message: message?.trim() || null,
  });

  revalidatePath("/friends");
  return { success: `Request terkirim ke ${target.displayName}!` };
}

export async function acceptFriendRequestAction(
  requestId: string
): Promise<FriendRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [req] = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId))
    .limit(1);
  if (!req) return { error: "Request tidak ditemukan" };
  if (req.toUserId !== me.id) return { error: "Hanya recipient yang bisa accept" };
  if (req.status !== "pending") return { error: "Request sudah di-proses" };

  const [lo, hi] = canonicalPair(req.fromUserId, req.toUserId);

  try {
    await db.transaction(async (tx) => {
      // Idempotent friendship insert (skip kalau sudah ada — race)
      const [existing] = await tx
        .select({ id: friendships.id })
        .from(friendships)
        .where(and(eq(friendships.userIdLo, lo), eq(friendships.userIdHi, hi)))
        .limit(1);
      if (!existing) {
        await tx.insert(friendships).values({ userIdLo: lo, userIdHi: hi });
      }
      await tx
        .update(friendRequests)
        .set({ status: "accepted", reviewedAt: new Date() })
        .where(eq(friendRequests.id, requestId));
    });
  } catch (e) {
    console.error("[acceptFriendRequestAction]", e);
    return { error: "Gagal accept." };
  }

  event("friend_request_accepted", {
    fromUserId: req.fromUserId,
    toUserId: req.toUserId,
  });
  notifyFriendAccepted(req.fromUserId, {
    byUserId: me.id,
    byDisplayName: me.displayName,
  });

  revalidatePath("/friends");
  return { success: "Friend di-accept!" };
}

export async function rejectFriendRequestAction(
  requestId: string
): Promise<FriendRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [req] = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId))
    .limit(1);
  if (!req) return { error: "Request tidak ditemukan" };
  if (req.toUserId !== me.id) return { error: "Hanya recipient yang bisa reject" };
  if (req.status !== "pending") return { error: "Request sudah di-proses" };

  try {
    await db
      .update(friendRequests)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(friendRequests.id, requestId));
  } catch (e) {
    console.error("[rejectFriendRequestAction]", e);
    return { error: "Gagal reject." };
  }

  event("friend_request_rejected", {
    fromUserId: req.fromUserId,
    toUserId: req.toUserId,
  });

  revalidatePath("/friends");
  return { success: "Request di-reject" };
}

export async function cancelOutgoingRequestAction(
  requestId: string
): Promise<FriendRequestState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [req] = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      status: friendRequests.status,
    })
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId))
    .limit(1);
  if (!req) return { error: "Request tidak ditemukan" };
  if (req.fromUserId !== me.id) return { error: "Hanya sender yang bisa cancel" };
  if (req.status !== "pending") return { error: "Request sudah di-proses" };

  try {
    await db.delete(friendRequests).where(eq(friendRequests.id, requestId));
  } catch (e) {
    console.error("[cancelOutgoingRequestAction]", e);
    return { error: "Gagal cancel." };
  }

  revalidatePath("/friends");
  return { success: "Request di-cancel" };
}
