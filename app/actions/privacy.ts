"use server";

/**
 * Privacy preferences + account lifecycle actions (Sprint 38).
 *
 * - updatePrivacyPrefsAction: per-field display toggles + friend request policy
 * - deleteAccountAction: soft-delete (users.deletedAt + anonymize displayName)
 *
 * Refs:
 * - DB: users.display_flags + friend_request_policy + deleted_at
 * - Pure: lib/privacy/display-flags.ts + friend-request-policy.ts
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logoutAction } from "./auth";
import { sanitizeDisplayFlags } from "@/lib/privacy/display-flags";
import type { FriendRequestPolicy } from "@/lib/privacy/friend-request-policy";
import { event } from "@/lib/log";

export type PrivacyActionState = {
  error?: string;
  success?: string;
} | null;

const VALID_POLICIES: FriendRequestPolicy[] = [
  "anyone",
  "friends_of_friends",
  "off",
];

export async function updatePrivacyPrefsAction(
  _prev: PrivacyActionState,
  formData: FormData
): Promise<PrivacyActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const flags = sanitizeDisplayFlags({
    showCity: formData.get("flag.showCity") === "1",
    showStats: formData.get("flag.showStats") === "1",
    showAchievements: formData.get("flag.showAchievements") === "1",
    showMatches: formData.get("flag.showMatches") === "1",
  });

  const policyRaw = String(
    formData.get("friend_request_policy") ?? "anyone"
  );
  const friendRequestPolicy: FriendRequestPolicy = VALID_POLICIES.includes(
    policyRaw as FriendRequestPolicy
  )
    ? (policyRaw as FriendRequestPolicy)
    : "anyone";

  try {
    await db
      .update(users)
      .set({
        displayFlags: flags as Record<string, unknown>,
        friendRequestPolicy,
        updatedAt: new Date(),
      })
      .where(eq(users.id, me.id));
  } catch (e) {
    console.error("[updatePrivacyPrefsAction]", e);
    return { error: "Gagal simpan. Coba lagi." };
  }

  event("privacy_prefs_updated", {
    userId: me.id,
    friendRequestPolicy,
    flags: Object.keys(flags),
  });

  revalidatePath("/profile/settings/privacy");
  revalidatePath("/profile");
  return { success: "Privacy disimpan" };
}

/**
 * Soft-delete account. Anonymizes displayName, nulls avatar/cover/bio,
 * keeps stats intact (referential integrity untuk historical matches).
 *
 * Logged out at the end via logoutAction.
 */
export async function deleteAccountAction(
  _prev: PrivacyActionState,
  formData: FormData
): Promise<PrivacyActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "HAPUS") {
    return {
      error: "Ketik HAPUS persis untuk konfirmasi penghapusan akun.",
    };
  }

  try {
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        displayName: "[Akun dihapus]",
        avatarUrl: null,
        city: null,
        // Force private + lock friend reqs after deletion
        profileVisibility: "private",
        friendRequestPolicy: "off",
        updatedAt: new Date(),
      })
      .where(eq(users.id, me.id));
  } catch (e) {
    console.error("[deleteAccountAction]", e);
    return { error: "Gagal hapus akun. Hubungi support." };
  }

  event("account_deleted", { userId: me.id });

  // Best-effort logout (clears session cookie) — will redirect to /login
  await logoutAction();
  return null;
}
