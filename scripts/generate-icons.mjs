#!/usr/bin/env node
/**
 * Generate PWA icons + favicon dari docs/Images/icon.png.
 *
 * Sprint 51 update: SEMUA icon (kecuali badge monochrome) sekarang
 * pakai background PUTIH solid + logo fit-to-size (centered, 80%
 * inner area). Sebelumnya Sprint 45 pakai transparent background utk
 * standard + teal solid utk maskable — tidak konsisten di home screen
 * (terlihat transparan di iOS/Android home).
 *
 * Output ke public/:
 *   icon-192.png          — PWA standard (white bg)
 *   icon-512.png          — PWA larger (white bg)
 *   icon-maskable-512.png — Android maskable, inner safe area 60%
 *                           (white bg supaya OS masking nya bersih)
 *   badge-72.png          — push notification monochrome
 *                           (transparent bg + tint, per WebPush spec)
 *   apple-touch-icon.png  — iOS specific 180x180 (white bg)
 *   favicon.ico           — browser tab icon (32x32 PNG)
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Requires sharp.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "docs/Images/icon.png");
const PUBLIC_DIR = join(ROOT, "public");

if (!existsSync(SOURCE)) {
  console.error(`✗ Source not found: ${SOURCE}`);
  process.exit(1);
}

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

const srcBuf = readFileSync(SOURCE);

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Compose logo (fit-to-inner) di atas solid white background.
 *
 * @param {number} size  Output dimension (px).
 * @param {number} pad   Inner padding ratio 0..0.5. 0.10 = logo
 *                       menempati 80% sisi (10% padding each side).
 * @param {string} filename
 */
async function makeWithWhiteBg(size, pad, filename) {
  const inner = Math.round(size * (1 - pad * 2));
  const innerBuf = await sharp(srcBuf)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: WHITE,
    },
  })
    .composite([{ input: innerBuf, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  writeFileSync(join(PUBLIC_DIR, filename), buf);
  console.log(`✓ ${filename} (${size}×${size} white bg, ${buf.length} bytes)`);
}

/**
 * Maskable icon — Android masking applies safe area (~60% inner).
 * Logo lebih kecil supaya OS bisa crop ke shape apa pun (round, squircle,
 * tear-drop). Background tetap putih supaya kontras bagus saat di-mask.
 */
async function makeMaskable(size, filename) {
  await makeWithWhiteBg(size, 0.2, filename); // 60% inner = 20% pad each side
}

/**
 * Badge — push notification monochrome badge.
 * Per spec: transparent bg, single color (OS tint). Pakai logo silhouette.
 */
async function makeBadge(size, filename) {
  const buf = await sharp(srcBuf)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, filename), buf);
  console.log(`✓ ${filename} (${size}×${size} badge, ${buf.length} bytes)`);
}

async function makeFavicon() {
  // 32×32 PNG renamed sebagai .ico (modern browsers accept it).
  // White bg supaya tab favicon kontras di dark/light mode.
  const buf = await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: WHITE,
    },
  })
    .composite([
      {
        input: await sharp(srcBuf)
          .resize(28, 28, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), buf);
  console.log(`✓ favicon.ico (32×32 PNG white bg, ${buf.length} bytes)`);
}

// PWA standard icons (white bg, 90% inner)
await makeWithWhiteBg(192, 0.05, "icon-192.png");
await makeWithWhiteBg(512, 0.05, "icon-512.png");

// Maskable — Android adaptive icons (white bg, 60% inner)
await makeMaskable(512, "icon-maskable-512.png");

// iOS apple-touch-icon — iOS uses this for "Add to Home Screen"
// iOS doesn't mask, jadi gunakan 90% inner like standard.
await makeWithWhiteBg(180, 0.05, "apple-touch-icon.png");

// Badge for push notifications (transparent silhouette per WebPush spec)
await makeBadge(72, "badge-72.png");

// Favicon
await makeFavicon();

console.log("\nAll icons generated to public/ — white bg + fit-to-size");
console.log("Don't forget to rerun `npm run build` and reinstall PWA on device");
console.log("to pick up new icons (browser caches manifest icons aggressively).");
