/**
 * Logo data URL helper untuk OG image routes (Sprint 50).
 *
 * Next/og (Satori) butuh URL absolut / data URL untuk render <img>.
 * Daripada fetch HTTP setiap request, kita baca file dari disk sekali
 * di cold start, encode base64, cache di module-level.
 *
 * Refs:
 * - public/full-logo.png (logo dgn tulisan "CARSEL CLUB")
 * - public/icon.png (icon-only square)
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedFullLogo: string | null = null;
let cachedIcon: string | null = null;

async function loadAsDataUrl(relativePath: string): Promise<string | null> {
  try {
    const absPath = path.join(process.cwd(), "public", relativePath);
    const buf = await readFile(absPath);
    const ext = path.extname(relativePath).slice(1) || "png";
    const mime = ext === "png" ? "image/png" : `image/${ext}`;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch (e) {
    console.warn(`[og/logo] gagal load ${relativePath}:`, e);
    return null;
  }
}

/**
 * Logo lengkap (icon + tulisan "CARSEL CLUB").
 * Cocok untuk OG cards yang punya brand strip.
 */
export async function getFullLogoDataUrl(): Promise<string | null> {
  if (cachedFullLogo) return cachedFullLogo;
  cachedFullLogo = await loadAsDataUrl("full-logo.png");
  return cachedFullLogo;
}

/**
 * Icon square (tanpa tulisan).
 * Cocok untuk corner badge atau favicon-style.
 */
export async function getIconDataUrl(): Promise<string | null> {
  if (cachedIcon) return cachedIcon;
  cachedIcon = await loadAsDataUrl("icon.png");
  return cachedIcon;
}
