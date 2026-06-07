"use server";

/**
 * Session cover photo upload + foto grup post-match.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/session-detail.html (cover hero)
 * - DB: sessions.coverPhotoUrl
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 9
 * - Storage: lib/storage/index.ts saveImage cover preset (1200x600 webp)
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { sessions, sessionGroupPhotos } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import { countGroupPhotos } from "@/lib/db/queries/session-photos";
import { saveImage, storage, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { checkUploadRate } from "@/lib/storage/rate-limit";
import { event, error as logError } from "@/lib/log";

export type CoverPhotoState = {
  error?: string;
  success?: string;
  coverPhotoUrl?: string;
} | null;

export async function updateCoverPhotoAction(
  sessionId: string,
  _prev: CoverPhotoState,
  formData: FormData
): Promise<CoverPhotoState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Staff check (host atau co-host)
  if (!(await isSessionStaff(sessionId, user!.id))) {
    return { error: "Hanya host/co-host yang bisa ubah cover" };
  }

  // Rate limit per user
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

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    logError("cover_upload_read_failed", { error: e });
    return { error: "Gagal baca file." };
  }

  // Sprint 50 fix: unique filename per upload supaya browser tidak
  // serve stale cached image. Sebelumnya fixed `cover.webp` →
  // nginx + browser cache hold old image walaupun DB url di-update.
  const key = `sessions/${sessionId}/cover-${nanoid(10)}.webp`;
  let savedUrl: string;
  try {
    const saved = await saveImage(buffer, "cover", key);
    savedUrl = saved.url;
  } catch (e) {
    logError("cover_upload_save_failed", { error: e, sessionId });
    const msg = e instanceof Error ? e.message : "Gagal upload cover.";
    return { error: msg };
  }

  try {
    await db
      .update(sessions)
      .set({ coverPhotoUrl: savedUrl, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    logError("cover_db_update_failed", { error: e });
    return { error: "Gagal simpan ke sesi. Coba lagi." };
  }

  event("upload_success", { kind: "cover", sessionId, url: savedUrl });

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/home");
  revalidatePath("/find");
  revalidatePath(`/s/${sessionId}`);
  return { success: "Cover berhasil diubah!", coverPhotoUrl: savedUrl };
}

export async function removeCoverPhotoAction(
  sessionId: string
): Promise<CoverPhotoState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!(await isSessionStaff(sessionId, user!.id))) {
    return { error: "Hanya host/co-host yang bisa hapus cover" };
  }

  try {
    await storage.deleteFile(`sessions/${sessionId}/cover.webp`);
  } catch (e) {
    logError("cover_delete_failed", { error: e });
  }

  try {
    await db
      .update(sessions)
      .set({ coverPhotoUrl: null, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (e) {
    logError("cover_remove_db_failed", { error: e });
    return { error: "Gagal hapus cover." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/home");
  revalidatePath("/find");
  revalidatePath(`/s/${sessionId}`);
  return { success: "Cover dihapus." };
}

// ============================================================
// SESSION GROUP PHOTOS (Sprint 10)
// ============================================================

const MAX_GROUP_PHOTOS = 5;

export type GroupPhotoState = {
  error?: string;
  success?: string;
  url?: string;
} | null;

export async function addGroupPhotoAction(
  sessionId: string,
  _prev: GroupPhotoState,
  formData: FormData
): Promise<GroupPhotoState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!(await isSessionStaff(sessionId, user!.id))) {
    return { error: "Hanya host/co-host yang bisa upload foto grup" };
  }

  // Count check (max 5)
  const existing = await countGroupPhotos(sessionId);
  if (existing >= MAX_GROUP_PHOTOS) {
    return {
      error: `Maksimal ${MAX_GROUP_PHOTOS} foto grup per session.`,
    };
  }

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

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    logError("group_photo_read_failed", { error: e });
    return { error: "Gagal baca file." };
  }

  const photoId = nanoid(12);
  const storageKey = `sessions/${sessionId}/group/${photoId}.webp`;
  let savedUrl: string;
  try {
    const saved = await saveImage(buffer, "photo", storageKey);
    savedUrl = saved.url;
  } catch (e) {
    logError("group_photo_save_failed", { error: e, sessionId });
    const msg = e instanceof Error ? e.message : "Gagal upload foto.";
    return { error: msg };
  }

  try {
    await db.insert(sessionGroupPhotos).values({
      sessionId,
      storageKey,
      url: savedUrl,
      uploadedByUserId: user!.id,
    });
  } catch (e) {
    logError("group_photo_db_insert_failed", { error: e });
    // Best-effort cleanup
    try {
      await storage.deleteFile(storageKey);
    } catch {}
    return { error: "Gagal simpan ke sesi. Coba lagi." };
  }

  event("upload_success", {
    kind: "group_photo",
    sessionId,
    photoId,
  });

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/s/${sessionId}`);
  return { success: "Foto ditambahkan", url: savedUrl };
}

export async function removeGroupPhotoAction(
  photoId: string
): Promise<GroupPhotoState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Load to get sessionId + storageKey
  const [photo] = await db
    .select({
      id: sessionGroupPhotos.id,
      sessionId: sessionGroupPhotos.sessionId,
      storageKey: sessionGroupPhotos.storageKey,
    })
    .from(sessionGroupPhotos)
    .where(eq(sessionGroupPhotos.id, photoId))
    .limit(1);

  if (!photo) return { error: "Foto tidak ditemukan" };

  if (!(await isSessionStaff(photo.sessionId, user!.id))) {
    return { error: "Hanya host/co-host yang bisa hapus foto" };
  }

  try {
    await storage.deleteFile(photo.storageKey);
  } catch (e) {
    logError("group_photo_delete_storage_failed", { error: e });
  }

  try {
    await db
      .delete(sessionGroupPhotos)
      .where(eq(sessionGroupPhotos.id, photoId));
  } catch (e) {
    logError("group_photo_delete_db_failed", { error: e });
    return { error: "Gagal hapus foto." };
  }

  revalidatePath(`/sessions/${photo.sessionId}`);
  revalidatePath(`/s/${photo.sessionId}`);
  return { success: "Foto dihapus." };
}
