/**
 * Logo data URL helper untuk OG image routes (Sprint 50).
 *
 * Sprint 50 update: source `public/full-logo.png` 1.4 MB — terlalu
 * besar untuk Satori (next/og). Kita resize via sharp ke 256×256 max
 * di module load → ~10–30 KB base64, render reliable.
 *
 * Cache di module-level supaya cuma 1× decode + encode per cold start.
 *
 * Refs:
 * - public/full-logo.png (logo dgn tulisan "CARSEL CLUB", 1.4 MB raw)
 * - public/icon.png      (icon-only square, 1.4 MB raw)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

let cachedFullLogo: string | null = null;
let cachedIcon: string | null = null;
let cachedFullLogoTried = false;
let cachedIconTried = false;

async function tryRead(absPath: string): Promise<Buffer | null> {
  try {
    return await readFile(absPath);
  } catch {
    return null;
  }
}

async function loadAsDataUrl(
  relativePath: string,
  maxDim = 256
): Promise<string | null> {
  // Try beberapa kemungkinan lokasi
  const candidates = [
    path.join(process.cwd(), "public", relativePath),
    path.join(process.cwd(), "..", "public", relativePath),
    path.join(process.cwd(), "..", "..", "public", relativePath),
    path.resolve("public", relativePath),
  ];

  let rawBuf: Buffer | null = null;
  let foundPath = "";
  for (const candidate of candidates) {
    rawBuf = await tryRead(candidate);
    if (rawBuf) {
      foundPath = candidate;
      break;
    }
  }

  if (!rawBuf) {
    console.warn(
      `[og/logo] gagal load ${relativePath} — tried: ${candidates.join(", ")}`
    );
    return null;
  }

  // Resize via sharp supaya Satori tidak choke
  try {
    const optimized = await sharp(rawBuf)
      .resize(maxDim, maxDim, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9, quality: 90 })
      .toBuffer();

    const dataUrl = `data:image/png;base64,${optimized.toString("base64")}`;
    console.info(
      `[og/logo] loaded + resized ${relativePath} from ${foundPath}: ${rawBuf.length} → ${optimized.length} bytes`
    );
    return dataUrl;
  } catch (e) {
    console.warn(
      `[og/logo] sharp resize gagal untuk ${relativePath}, fallback raw:`,
      e
    );
    // Fallback: pakai raw kalau resize gagal
    const ext = path.extname(relativePath).slice(1) || "png";
    const mime = ext === "png" ? "image/png" : `image/${ext}`;
    return `data:${mime};base64,${rawBuf.toString("base64")}`;
  }
}

/**
 * Logo lengkap (icon + tulisan "CARSEL CLUB"). Auto-resized ke max 256px.
 */
export async function getFullLogoDataUrl(): Promise<string | null> {
  if (cachedFullLogoTried) return cachedFullLogo;
  cachedFullLogoTried = true;
  cachedFullLogo = await loadAsDataUrl("full-logo.png", 256);
  return cachedFullLogo;
}

/**
 * Icon square (tanpa tulisan). Auto-resized ke max 128px (lebih kecil).
 */
export async function getIconDataUrl(): Promise<string | null> {
  if (cachedIconTried) return cachedIcon;
  cachedIconTried = true;
  cachedIcon = await loadAsDataUrl("icon.png", 128);
  return cachedIcon;
}
