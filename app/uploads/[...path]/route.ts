/**
 * Dev fallback untuk serve files dari UPLOAD_DIR.
 *
 * Di production, Nginx (atau CDN) yang serve `/uploads/*` — lihat
 * `docs/DEPLOYMENT.md`. Route ini fallback kalau Nginx tidak dikonfigurasi
 * (handy untuk dev local).
 *
 * Security: path safety mirror `lib/storage/local.ts`.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  // Resolve di dalam handler (bukan module scope) supaya tidak trigger
  // Turbopack NFT warning saat build trace.
  const baseDir = path.resolve(
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads")
  );
  const { path: segments } = await ctx.params;

  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const key = segments.join("/");

  // Path safety
  if (
    key.includes("..") ||
    key.includes("\0") ||
    key.startsWith("/") ||
    key.startsWith("\\")
  ) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  const absolute = path.join(baseDir, key);
  const rel = path.relative(baseDir, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    const contentType =
      CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Mild caching for dev; prod headers diset oleh Nginx.
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "read failed" }, { status: 500 });
  }
}
