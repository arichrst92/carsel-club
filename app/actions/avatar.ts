"use server";

/**
 * Avatar upload Server Actions.
 *
 * - updateAvatarAction: receive multipart File, validate, process via sharp,
 *   persist ke storage, update users.avatarUrl.
 * - removeAvatarAction: clear users.avatarUrl + delete storage file.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/profile.html (avatar di hero)
 * - DB: users.avatarUrl text
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 8
 * - Storage: lib/storage/index.ts saveImage (avatar preset → 400x400 webp)
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  saveImage,
  storage,
  MAX_UPLOAD_BYTES,
} from "@/lib/storage";
import { checkUploadRate } from "@/lib/storage/rate-limit";
import { event, error as logError } from "@/lib/log";

export type AvatarActionState = {
  error?: string;
  success?: string;
  avatarUrl?: string;
} | null;

export async function updateAvatarAction(
  _prev: AvatarActionState,
  formData: FormData
): Promise<AvatarActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Rate limit per user (Sprint 1 helper)
  const rate = checkUploadRate(user!.id);
  if (!rate.ok) {
    const min = Math.ceil(rate.retryAfterMs / 60000);
    return { error: `Upload too frequent. Try again in ${min} minutes.` };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Pick a file first" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);
    return { error: `File too large. Maximum ${mb} MB.` };
  }

  // Convert File → Buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    logError("avatar_upload_read_failed", { error: e });
    return { error: "Failed to read file." };
  }

  // Sprint 52: use unique key per upload so the public URL changes — otherwise
  // browsers/CDN serve the previously cached avatar from `avatars/{userId}.webp`
  // and users perceive "edit photo doesn't work". Mirrors the cover photo fix.
  const key = `avatars/${user!.id}-${nanoid(10)}.webp`;

  // Capture previous avatar URL so we can clean it up after the new one persists
  const [prev] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user!.id))
    .limit(1);
  const prevAvatarUrl = prev?.avatarUrl ?? null;

  let savedUrl: string;
  try {
    const saved = await saveImage(buffer, "avatar", key);
    savedUrl = saved.url;
  } catch (e) {
    logError("avatar_upload_save_failed", { error: e, userId: user!.id });
    const msg = e instanceof Error ? e.message : "Failed to upload avatar.";
    return { error: msg };
  }

  // Update DB
  try {
    await db
      .update(users)
      .set({ avatarUrl: savedUrl, updatedAt: new Date() })
      .where(eq(users.id, user!.id));
  } catch (e) {
    logError("avatar_db_update_failed", { error: e });
    return { error: "Failed to save to profile. Try again." };
  }

  // Best-effort cleanup: delete the previous avatar file (if any) so we don't
  // accumulate orphans. Only attempt for keys we own (avatars/...) and only
  // when the URL maps onto a known storage key. Failures are logged, not fatal.
  if (prevAvatarUrl) {
    try {
      const prevKey = extractAvatarKeyFromUrl(prevAvatarUrl);
      if (prevKey && prevKey !== key) {
        await storage.deleteFile(prevKey);
      }
    } catch (e) {
      logError("avatar_prev_delete_failed", {
        error: e,
        prevUrl: prevAvatarUrl,
      });
    }
  }

  event("upload_success", { kind: "avatar", url: savedUrl });

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/home");
  revalidatePath("/leaderboard");
  return { success: "Avatar updated!", avatarUrl: savedUrl };
}

export async function removeAvatarAction(): Promise<AvatarActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Read current URL so we can derive the actual storage key (post-Sprint 52
  // the key embeds a nanoid; legacy avatars still use `avatars/{id}.webp`).
  const [prev] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, user!.id))
    .limit(1);
  const prevAvatarUrl = prev?.avatarUrl ?? null;

  // Best-effort delete from storage — try the URL-derived key first, then fall
  // back to the legacy fixed key in case the URL got lost somehow.
  try {
    const prevKey = prevAvatarUrl
      ? extractAvatarKeyFromUrl(prevAvatarUrl)
      : null;
    await storage.deleteFile(prevKey ?? `avatars/${user!.id}.webp`);
  } catch (e) {
    logError("avatar_delete_failed", { error: e });
    // Don't fail action — continue dengan DB update
  }

  try {
    await db
      .update(users)
      .set({ avatarUrl: null, updatedAt: new Date() })
      .where(eq(users.id, user!.id));
  } catch (e) {
    logError("avatar_remove_db_failed", { error: e });
    return { error: "Failed to remove avatar." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/home");
  revalidatePath("/leaderboard");
  return { success: "Avatar removed." };
}

/**
 * Pull the storage key (e.g. "avatars/abc-xyz.webp") from a public avatar URL.
 * Handles both relative ("/uploads/avatars/...") and absolute CDN URLs.
 * Returns null when the URL doesn't look like a managed avatar — we don't want
 * to attempt deletion of arbitrary external URLs.
 */
function extractAvatarKeyFromUrl(url: string): string | null {
  const marker = "avatars/";
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  // Strip any query string (?v=…) — storage uses the bare key.
  const tail = url.slice(idx).split("?")[0].split("#")[0];
  return tail || null;
}
