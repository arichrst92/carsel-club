/**
 * Tests untuk lib/storage/image.ts
 *
 * Strategy: generate real image bytes pakai sharp di test (1x1 dst), pass
 * through pipeline, assert output properties. Tidak butuh tmpdir.
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 */

import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  validateImageBuffer,
  processImage,
  type ImagePreset,
} from "@/lib/storage/image";

async function makePng(width = 100, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  })
    .png()
    .toBuffer();
}

async function makeJpeg(width = 100, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 50, g: 100, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();
}

async function makeWebp(width = 100, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 200, b: 50 },
    },
  })
    .webp()
    .toBuffer();
}

describe("validateImageBuffer", () => {
  it("throws untuk empty buffer", async () => {
    await expect(validateImageBuffer(Buffer.alloc(0))).rejects.toThrow(
      /kosong/i
    );
  });

  it("throws untuk non-image bytes (plain text)", async () => {
    const buf = Buffer.from("hello world", "utf-8");
    await expect(validateImageBuffer(buf)).rejects.toThrow(
      /tidak bisa deteksi/i
    );
  });

  it("accepts JPEG", async () => {
    const buf = await makeJpeg();
    const r = await validateImageBuffer(buf);
    expect(r.mime).toBe("image/jpeg");
  });

  it("accepts PNG", async () => {
    const buf = await makePng();
    const r = await validateImageBuffer(buf);
    expect(r.mime).toBe("image/png");
  });

  it("accepts WebP", async () => {
    const buf = await makeWebp();
    const r = await validateImageBuffer(buf);
    expect(r.mime).toBe("image/webp");
  });

  it("rejects mime yang tidak ada di allowed list (e.g. PDF)", async () => {
    // Minimal valid PDF header
    const pdfBuf = Buffer.from(
      "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n"
    );
    await expect(validateImageBuffer(pdfBuf)).rejects.toThrow(
      /tidak diperbolehkan/i
    );
  });
});

describe("processImage — avatar preset", () => {
  it("resize ke 400x400 + webp", async () => {
    const input = await makePng(800, 800);
    const r = await processImage(input, "avatar");
    expect(r.width).toBe(400);
    expect(r.height).toBe(400);
    expect(r.contentType).toBe("image/webp");
    expect(r.bytes).toBeGreaterThan(0);
  });

  it("non-square input cropped ke 400x400", async () => {
    const input = await makePng(1200, 600);
    const r = await processImage(input, "avatar");
    expect(r.width).toBe(400);
    expect(r.height).toBe(400);
  });

  it("upscale small image juga ke 400x400", async () => {
    const input = await makePng(100, 100);
    const r = await processImage(input, "avatar");
    expect(r.width).toBe(400);
    expect(r.height).toBe(400);
  });
});

describe("processImage — cover preset", () => {
  it("resize ke 1200x600", async () => {
    const input = await makeJpeg(2000, 1500);
    const r = await processImage(input, "cover");
    expect(r.width).toBe(1200);
    expect(r.height).toBe(600);
    expect(r.contentType).toBe("image/webp");
  });

  it("portrait input dipotong ke 1200x600 landscape (fit cover)", async () => {
    const input = await makePng(800, 1200);
    const r = await processImage(input, "cover");
    expect(r.width).toBe(1200);
    expect(r.height).toBe(600);
  });
});

describe("processImage — photo preset", () => {
  it("preserve aspect ratio dengan max width 1600", async () => {
    const input = await makeJpeg(3200, 2000);
    const r = await processImage(input, "photo");
    expect(r.width).toBe(1600);
    expect(r.height).toBe(1000); // proportional
    expect(r.contentType).toBe("image/webp");
  });

  it("smaller-than-max image NOT upscaled (withoutEnlargement)", async () => {
    const input = await makeJpeg(800, 600);
    const r = await processImage(input, "photo");
    expect(r.width).toBe(800);
    expect(r.height).toBe(600);
  });

  it("portrait orientation preserved", async () => {
    const input = await makePng(1000, 2000);
    const r = await processImage(input, "photo");
    expect(r.width).toBe(800); // scaled down dari 1000
    expect(r.height).toBe(1600); // 2000 → 1600 max
  });
});

describe("processImage — output validity", () => {
  it("output buffer adalah valid WebP yang bisa di-parse sharp", async () => {
    const input = await makePng(500, 500);
    const r = await processImage(input, "avatar");
    const meta = await sharp(r.buffer).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(400);
  });

  it.each<ImagePreset>(["avatar", "cover", "photo"])(
    "preset '%s' produce non-empty webp",
    async (preset) => {
      const input = await makeJpeg(1000, 800);
      const r = await processImage(input, preset);
      expect(r.bytes).toBeGreaterThan(0);
      expect(r.contentType).toBe("image/webp");
    }
  );
});
