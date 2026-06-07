"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { friendships, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { canonicalPair } from "@/lib/db/queries/friends";
import {
  normalizePhone,
  isValidIndonesianPhone,
} from "@/lib/auth/otp";

export type FriendActionState = {
  error?: string;
  success?: string;
  foundUser?: {
    id: string;
    displayName: string;
    whatsappNumber: string;
    city: string | null;
  };
} | null;

// Search user by phone (similar to searchMemberAction but for friends context)
export async function searchUserForFriendAction(
  _prev: FriendActionState,
  formData: FormData
): Promise<FriendActionState> {
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

  if (!user) {
    return { error: "User dengan nomor itu belum daftar Carsel Club" };
  }

  if (user.id === me.id) {
    return { error: "Itu nomor kamu sendiri 😅" };
  }

  return { foundUser: user };
}

// Add friend (mutual instant)
export async function addFriendAction(
  _prev: FriendActionState,
  formData: FormData
): Promise<FriendActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const friendId = String(formData.get("friend_id") ?? "").trim();
  if (!friendId) return { error: "Friend ID invalid" };
  if (friendId === me.id) return { error: "Tidak bisa add diri sendiri" };

  // Verify friend exists
  const [friend] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, friendId))
    .limit(1);
  if (!friend) return { error: "User tidak ditemukan" };

  const [lo, hi] = canonicalPair(me.id, friendId);

  // Check existing
  const [existing] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(and(eq(friendships.userIdLo, lo), eq(friendships.userIdHi, hi)))
    .limit(1);
  if (existing) return { error: `${friend.displayName} sudah jadi friend` };

  try {
    await db.insert(friendships).values({ userIdLo: lo, userIdHi: hi });
  } catch (e) {
    console.error("[addFriendAction]", e);
    return { error: "Gagal add friend. Coba lagi." };
  }

  revalidatePath("/friends");
  return { success: `${friend.displayName} is now a friend!` };
}

// Remove friend
export async function removeFriendAction(
  friendId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [lo, hi] = canonicalPair(me.id, friendId);

  try {
    await db
      .delete(friendships)
      .where(and(eq(friendships.userIdLo, lo), eq(friendships.userIdHi, hi)));
  } catch (e) {
    console.error("[removeFriendAction]", e);
    return { error: "Gagal remove friend." };
  }

  revalidatePath("/friends");
  return null;
}
