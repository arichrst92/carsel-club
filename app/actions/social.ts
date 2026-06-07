"use server";

/**
 * Social actions — block + follow (Sprint 23).
 *
 * Block side-effect: kalau A block B, juga unfollow di kedua arah +
 * auto-reject any pending friend request between them.
 *
 * Refs:
 * - DB: user_blocks + follows + friend_requests + friendships
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 23
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  userBlocks,
  follows,
  friendRequests,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { event } from "@/lib/log";

export type SocialActionState = {
  error?: string;
  success?: string;
} | null;

export async function blockUserAction(
  targetUserId: string
): Promise<SocialActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (targetUserId === me.id) return { error: "Tidak bisa block diri sendiri" };

  try {
    await db.transaction(async (tx) => {
      // Insert block (idempotent — unique constraint OK)
      const [existing] = await tx
        .select({ blockerId: userBlocks.blockerId })
        .from(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerId, me.id),
            eq(userBlocks.blockedId, targetUserId)
          )
        )
        .limit(1);
      if (!existing) {
        await tx.insert(userBlocks).values({
          blockerId: me.id,
          blockedId: targetUserId,
        });
      }

      // Side-effect: remove follows in both directions
      await tx
        .delete(follows)
        .where(
          or(
            and(
              eq(follows.followerId, me.id),
              eq(follows.followingId, targetUserId)
            ),
            and(
              eq(follows.followerId, targetUserId),
              eq(follows.followingId, me.id)
            )
          )
        );

      // Side-effect: reject pending friend requests in either direction
      await tx
        .update(friendRequests)
        .set({ status: "rejected", reviewedAt: new Date() })
        .where(
          and(
            eq(friendRequests.status, "pending"),
            or(
              and(
                eq(friendRequests.fromUserId, me.id),
                eq(friendRequests.toUserId, targetUserId)
              ),
              and(
                eq(friendRequests.fromUserId, targetUserId),
                eq(friendRequests.toUserId, me.id)
              )
            )
          )
        );
    });
  } catch (e) {
    console.error("[blockUserAction]", e);
    return { error: "Gagal block. Coba lagi." };
  }

  event("user_blocked", { blockerId: me.id, blockedId: targetUserId });

  revalidatePath(`/u/${targetUserId}`);
  revalidatePath("/friends");
  return { success: "Pengguna diblokir" };
}

export async function unblockUserAction(
  targetUserId: string
): Promise<SocialActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .delete(userBlocks)
      .where(
        and(
          eq(userBlocks.blockerId, me.id),
          eq(userBlocks.blockedId, targetUserId)
        )
      );
  } catch (e) {
    console.error("[unblockUserAction]", e);
    return { error: "Gagal unblock." };
  }

  event("user_unblocked", { blockerId: me.id, blockedId: targetUserId });

  revalidatePath(`/u/${targetUserId}`);
  return { success: "Pengguna dibuka blokirnya" };
}

export async function followUserAction(
  targetUserId: string
): Promise<SocialActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (targetUserId === me.id) return { error: "Tidak bisa follow diri sendiri" };

  // Block check (either direction)
  const [block] = await db
    .select({ blockerId: userBlocks.blockerId })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerId, me.id),
          eq(userBlocks.blockedId, targetUserId)
        ),
        and(
          eq(userBlocks.blockerId, targetUserId),
          eq(userBlocks.blockedId, me.id)
        )
      )
    )
    .limit(1);
  if (block) return { error: "Tidak bisa follow user yang di-block" };

  try {
    const [existing] = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, me.id),
          eq(follows.followingId, targetUserId)
        )
      )
      .limit(1);
    if (!existing) {
      await db.insert(follows).values({
        followerId: me.id,
        followingId: targetUserId,
      });
    }
  } catch (e) {
    console.error("[followUserAction]", e);
    return { error: "Gagal follow. Coba lagi." };
  }

  event("user_followed", { followerId: me.id, followingId: targetUserId });

  revalidatePath(`/u/${targetUserId}`);
  return { success: "Mengikuti!" };
}

export async function unfollowUserAction(
  targetUserId: string
): Promise<SocialActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, me.id),
          eq(follows.followingId, targetUserId)
        )
      );
  } catch (e) {
    console.error("[unfollowUserAction]", e);
    return { error: "Gagal unfollow." };
  }

  event("user_unfollowed", { followerId: me.id, followingId: targetUserId });

  revalidatePath(`/u/${targetUserId}`);
  return { success: "Berhenti mengikuti" };
}
