#!/usr/bin/env node
/**
 * Generate PWA icons + favicon dari docs/Images/icon.png (Sprint 45).
 *
 * Output ke public/:
 *   icon-192.png         — PWA standard
 *   icon-512.png         — PWA larger
 *   icon-maskable-512.png — Android maskable (60% inner safe area)
 *   badge-72.png         — push notification monochrome badge
 *   favicon.ico          — browser tab icon (multi-size 16/32/48)
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Requires sharp (already installed for storage pipeline).
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

async function makeStandard(size, filename) {
  const buf = await sharp(srcBuf)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, filename), buf);
  console.log(`✓ ${filename} (${size}×${size}, ${buf.length} bytes)`);
}

async function makeMaskable(size, filename) {
  // Maskable icon: inner content 60% of canvas, outer 40% padding
  // Background brand color matches the logo (teal/green-ish)
  const inner = Math.round(size * 0.6);
  const innerBuf = await sharp(srcBuf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const buf = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      // Match logo background — teal gradient feel as solid
      background: { r: 25, g: 113, b: 117, alpha: 1 },
    },
  })
    .composite([{ input: innerBuf, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, filename), buf);
  console.log(`✓ ${filename} (${size}×${size} maskable, ${buf.length} bytes)`);
}

async function makeFavicon() {
  // favicon.ico — multi-size PNG embedded.
  // Sharp doesn't write .ico directly; use 32×32 PNG renamed (modern browsers accept it).
  const buf = await sharp(srcBuf)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), buf);
  console.log(`✓ favicon.ico (32×32 PNG, ${buf.length} bytes)`);
}

await makeStandard(192, "icon-192.png");
await makeStandard(512, "icon-512.png");
await makeMaskable(512, "icon-maskable-512.png");
await makeStandard(72, "badge-72.png");
await makeFavicon();

console.log("\nAll icons generated to public/");
