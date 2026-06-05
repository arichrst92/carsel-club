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
    return { error: `Upload terlalu sering. Coba lagi dalam ${min} menit.` };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Pilih file dulu" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);
    return { error: `File terlalu besar. Maksimum ${mb} MB.` };
  }

  // Convert File → Buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    logError("avatar_upload_read_failed", { error: e });
    return { error: "Gagal baca file." };
  }

  // Process + persist via storage helper
  const key = `avatars/${user!.id}.webp`;
  let savedUrl: string;
  try {
    const saved = await saveImage(buffer, "avatar", key);
    savedUrl = saved.url;
  } catch (e) {
    logError("avatar_upload_save_failed", { error: e, userId: user!.id });
    const msg = e instanceof Error ? e.message : "Gagal upload avatar.";
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
    return { error: "Gagal simpan ke profil. Coba lagi." };
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

  // Best-effort delete from storage
  try {
    await storage.deleteFile(`avatars/${user!.id}.webp`);
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
    return { error: "Gagal hapus avatar." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/home");
  revalidatePath("/leaderboard");
  return { success: "Avatar dihapus." };
}
