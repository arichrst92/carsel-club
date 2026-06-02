/**
 * Image processing pipeline — sharp.
 *
 * Pipeline:
 *   1. Validate magic bytes (file-type) — reject non-image / type yang tidak
 *      allowed list. Mitigates upload misuse.
 *   2. Resize sesuai preset (avatar/cover/photo).
 *   3. Convert ke WebP (~50-80% lebih kecil dari JPEG).
 *   4. Strip metadata (EXIF, GPS) — default sharp behavior, privacy.
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 * - Decision: WebP output, sharp full pipeline (Working Agreements)
 */

import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

/** Preset menentukan resize behavior + quality. */
export type ImagePreset = "avatar" | "cover" | "photo";

export type ProcessedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  bytes: number;
};

const ALLOWED_INPUT_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

const PRESETS: Record<
  ImagePreset,
  {
    width: number;
    height: number;
    fit: "cover" | "inside";
    quality: number;
    /** true = preserve original size kalau lebih kecil dari target box. */
    withoutEnlargement: boolean;
  }
> = {
  // avatar & cover crop ke fixed size, upscale OK untuk small images.
  avatar: {
    width: 400,
    height: 400,
    fit: "cover",
    quality: 82,
    withoutEnlargement: false,
  },
  cover: {
    width: 1200,
    height: 600,
    fit: "cover",
    quality: 82,
    withoutEnlargement: false,
  },
  // photo: max 1600 di kedua dimensi, preserve aspect ratio, TIDAK upscale
  // (foto kecil tetap kecil).
  photo: {
    width: 1600,
    height: 1600,
    fit: "inside",
    quality: 85,
    withoutEnlargement: true,
  },
};

/**
 * Validate magic bytes (file-type) bukan trust extension.
 * Throws kalau invalid atau mime tidak allowed.
 */
export async function validateImageBuffer(
  buffer: Buffer
): Promise<{ mime: string }> {
  if (buffer.length === 0) {
    throw new Error("Buffer kosong");
  }
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    throw new Error("Tidak bisa deteksi tipe file (mungkin corrupt)");
  }
  if (!ALLOWED_INPUT_MIMES.has(detected.mime)) {
    throw new Error(
      `Tipe file ${detected.mime} tidak diperbolehkan. Gunakan JPEG/PNG/WebP/HEIC/AVIF.`
    );
  }
  return { mime: detected.mime };
}

/**
 * Process image: resize + convert ke webp + strip metadata.
 * Pre-condition: caller sudah panggil validateImageBuffer().
 */
export async function processImage(
  buffer: Buffer,
  preset: ImagePreset
): Promise<ProcessedImage> {
  const cfg = PRESETS[preset];
  const pipeline = sharp(buffer, { failOn: "error" }).rotate(); // auto-rotate based on EXIF
  const out = await pipeline
    .resize({
      width: cfg.width,
      height: cfg.height,
      fit: cfg.fit,
      withoutEnlargement: cfg.withoutEnlargement,
    })
    .webp({ quality: cfg.quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: out.data,
    contentType: "image/webp",
    width: out.info.width,
    height: out.info.height,
    bytes: out.info.size,
  };
}
