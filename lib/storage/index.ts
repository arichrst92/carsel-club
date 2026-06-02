/**
 * Storage singleton + high-level helpers.
 *
 * Env vars:
 * - UPLOAD_DIR                   absolute path to storage root
 * - NEXT_PUBLIC_UPLOAD_URL_BASE  public URL prefix
 * - MAX_UPLOAD_BYTES             reject pre-process kalau lebih besar
 *
 * Default dev: ./uploads + /uploads
 * Prod: /var/www/carsel-uploads + /uploads (via Nginx alias) atau CDN URL
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 * - Deployment: docs/DEPLOYMENT.md
 */

import path from "node:path";
import { LocalStorageProvider } from "./local";
import {
  validateImageBuffer,
  processImage,
  type ImagePreset,
} from "./image";
import type { StorageProvider, SavedFile } from "./types";
import { event } from "@/lib/log";

export type { ImagePreset, ProcessedImage } from "./image";
export type { StorageProvider, SaveFileInput, SavedFile } from "./types";
export { validateImageBuffer, processImage } from "./image";
export { checkUploadRate, resetUploadRate, RATE_LIMIT_CONFIG } from "./rate-limit";

const DEFAULT_DEV_DIR = path.resolve(process.cwd(), "uploads");
const DEFAULT_URL_BASE = "/uploads";
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function buildStorage(): StorageProvider {
  const baseDir = process.env.UPLOAD_DIR ?? DEFAULT_DEV_DIR;
  const urlBase = process.env.NEXT_PUBLIC_UPLOAD_URL_BASE ?? DEFAULT_URL_BASE;
  return new LocalStorageProvider({ baseDir, urlBase });
}

export const storage: StorageProvider = buildStorage();

export const MAX_UPLOAD_BYTES = (() => {
  const raw = process.env.MAX_UPLOAD_BYTES;
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
})();

/**
 * High-level: validate + process + persist image, dalam 1 call.
 * Returns SavedFile dengan public URL.
 *
 * Throws kalau:
 * - buffer kosong / tipe bukan image yang allowed
 * - buffer > MAX_UPLOAD_BYTES (pre-process)
 * - sharp gagal process (corrupt image)
 * - filesystem write gagal
 */
export async function saveImage(
  buffer: Buffer,
  preset: ImagePreset,
  key: string
): Promise<SavedFile> {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File terlalu besar. Maksimum ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
    );
  }
  const detected = await validateImageBuffer(buffer);
  const processed = await processImage(buffer, preset);
  const saved = await storage.saveFile({
    buffer: processed.buffer,
    key,
    contentType: processed.contentType,
  });
  event("upload_success", {
    preset,
    key,
    originalMime: detected.mime,
    originalBytes: buffer.byteLength,
    processedBytes: processed.bytes,
    width: processed.width,
    height: processed.height,
  });
  return saved;
}
