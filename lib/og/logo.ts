/**
 * Logo data URL helper untuk OG image routes (Sprint 50).
 *
 * Next/og (Satori) butuh URL absolut / data URL untuk render <img>.
 * Daripada fetch HTTP setiap request, kita baca file dari disk sekali
 * di cold start, encode base64, cache di module-level.
 *
 * Strategy: try beberapa kemungkinan lokasi public folder, karena di
 * standalone build cwd bisa beda dari source root.
 *
 * Refs:
 * - public/full-logo.png (logo dgn tulisan "CARSEL CLUB")
 * - public/icon.png (icon-only square)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

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

async function loadAsDataUrl(relativePath: string): Promise<string | null> {
  // Try beberapa kemungkinan lokasi — paling umum production: cwd/public
  const candidates = [
    path.join(process.cwd(), "public", relativePath),
    // Standalone Next.js — public di parent dari standalone dir
    path.join(process.cwd(), "..", "public", relativePath),
    path.join(process.cwd(), "..", "..", "public", relativePath),
    // Dev common
    path.resolve("public", relativePath),
  ];

  for (const candidate of candidates) {
    const buf = await tryRead(candidate);
    if (buf) {
      const ext = path.extname(relativePath).slice(1) || "png";
      const mime = ext === "png" ? "image/png" : `image/${ext}`;
      const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
      console.info(
        `[og/logo] loaded ${relativePath} from ${candidate} (${buf.length} bytes)`
      );
      return dataUrl;
    }
  }

  console.warn(
    `[og/logo] gagal load ${relativePath} — tried: ${candidates.join(", ")}`
  );
  return null;
}

/**
 * Logo lengkap (icon + tulisan "CARSEL CLUB").
 * Cocok untuk OG cards yang punya brand strip.
 */
export async function getFullLogoDataUrl(): Promise<string | null> {
  if (cachedFullLogoTried) return cachedFullLogo;
  cachedFullLogoTried = true;
  cachedFullLogo = await loadAsDataUrl("full-logo.png");
  return cachedFullLogo;
}

/**
 * Icon square (tanpa tulisan).
 * Cocok untuk corner badge atau favicon-style.
 */
export async function getIconDataUrl(): Promise<string | null> {
  if (cachedIconTried) return cachedIcon;
  cachedIconTried = true;
  cachedIcon = await loadAsDataUrl("icon.png");
  return cachedIcon;
}
