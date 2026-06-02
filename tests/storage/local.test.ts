/**
 * Tests untuk lib/storage/local.ts
 *
 * Strategy: pakai os.tmpdir() untuk isolated test directory.
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { LocalStorageProvider } from "@/lib/storage/local";

let tmpDir: string;
let provider: LocalStorageProvider;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "carsel-storage-"));
  provider = new LocalStorageProvider({
    baseDir: tmpDir,
    urlBase: "/uploads",
  });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("LocalStorageProvider constructor", () => {
  it("throws kalau baseDir kosong", () => {
    expect(
      () => new LocalStorageProvider({ baseDir: "", urlBase: "/uploads" })
    ).toThrow(/baseDir/i);
  });

  it("throws kalau urlBase kosong", () => {
    expect(
      () => new LocalStorageProvider({ baseDir: "/tmp/x", urlBase: "" })
    ).toThrow(/urlBase/i);
  });

  it("normalize baseDir ke absolute path", () => {
    // baseDir relatif sudah di-resolve di constructor
    const p = new LocalStorageProvider({
      baseDir: tmpDir,
      urlBase: "/uploads",
    });
    expect(p.getUrl("foo.webp")).toBe("/uploads/foo.webp");
  });

  it("strip trailing slash dari urlBase", () => {
    const p = new LocalStorageProvider({
      baseDir: tmpDir,
      urlBase: "/uploads///",
    });
    expect(p.getUrl("foo.webp")).toBe("/uploads/foo.webp");
  });
});

describe("saveFile", () => {
  it("persist file dan return SavedFile metadata", async () => {
    const buf = Buffer.from("test bytes");
    const result = await provider.saveFile({
      key: "avatars/u1.webp",
      buffer: buf,
      contentType: "image/webp",
    });
    expect(result.key).toBe("avatars/u1.webp");
    expect(result.url).toBe("/uploads/avatars/u1.webp");
    expect(result.bytes).toBe(buf.byteLength);

    const onDisk = await fs.readFile(path.join(tmpDir, "avatars/u1.webp"));
    expect(onDisk.equals(buf)).toBe(true);
  });

  it("auto-mkdir parent dirs (nested key)", async () => {
    const buf = Buffer.from("nested");
    await provider.saveFile({
      key: "sessions/abc/group/x.webp",
      buffer: buf,
      contentType: "image/webp",
    });
    const onDisk = await fs.readFile(
      path.join(tmpDir, "sessions/abc/group/x.webp")
    );
    expect(onDisk.equals(buf)).toBe(true);
  });

  it("overwrite existing file silently", async () => {
    await provider.saveFile({
      key: "foo.webp",
      buffer: Buffer.from("first"),
      contentType: "image/webp",
    });
    await provider.saveFile({
      key: "foo.webp",
      buffer: Buffer.from("second"),
      contentType: "image/webp",
    });
    const onDisk = await fs.readFile(path.join(tmpDir, "foo.webp"));
    expect(onDisk.toString()).toBe("second");
  });
});

describe("deleteFile", () => {
  it("removes existing file", async () => {
    await provider.saveFile({
      key: "x.webp",
      buffer: Buffer.from("data"),
      contentType: "image/webp",
    });
    await provider.deleteFile("x.webp");
    await expect(fs.access(path.join(tmpDir, "x.webp"))).rejects.toThrow();
  });

  it("idempotent kalau file tidak exist (ENOENT)", async () => {
    await expect(provider.deleteFile("missing.webp")).resolves.toBeUndefined();
  });

  it("no-op kalau key invalid (path traversal)", async () => {
    // Tidak throw, cuma tidak melakukan apa-apa
    await expect(provider.deleteFile("../etc/passwd")).resolves.toBeUndefined();
  });

  it("ENOENT di-handle sebagai idempotent (no-throw)", async () => {
    const ghost = new LocalStorageProvider({
      baseDir: "/nonexistent-ghost-12345",
      urlBase: "/uploads",
    });
    // unlink ke baseDir yang tidak exist → ENOENT, handled.
    await expect(ghost.deleteFile("file.txt")).resolves.toBeUndefined();
  });

  it("re-throws error non-ENOENT (mis. unlink ke directory → EISDIR/EPERM)", async () => {
    // Setup: bikin file di subdirectory supaya direktori `foo` exist
    await provider.saveFile({
      key: "foo/inner.webp",
      buffer: Buffer.from("x"),
      contentType: "image/webp",
    });
    // Sekarang coba unlink direktorinya — bukan file, jadi unlink throws
    // EISDIR (Linux/macOS), EPERM, atau OperationNotPermitted. Bukan ENOENT,
    // jadi harus di-re-throw.
    await expect(provider.deleteFile("foo")).rejects.toThrow();
  });
});

describe("exists", () => {
  it("returns true untuk existing file", async () => {
    await provider.saveFile({
      key: "x.webp",
      buffer: Buffer.from("data"),
      contentType: "image/webp",
    });
    expect(await provider.exists("x.webp")).toBe(true);
  });

  it("returns false untuk missing file", async () => {
    expect(await provider.exists("missing.webp")).toBe(false);
  });

  it("returns false untuk invalid key", async () => {
    expect(await provider.exists("../etc/passwd")).toBe(false);
  });
});

describe("getUrl", () => {
  it("compose URL dari urlBase + key", () => {
    expect(provider.getUrl("avatars/u1.webp")).toBe(
      "/uploads/avatars/u1.webp"
    );
  });

  it("works dengan absolute URL base (CDN)", () => {
    const p = new LocalStorageProvider({
      baseDir: tmpDir,
      urlBase: "https://cdn.carsel.club/u",
    });
    expect(p.getUrl("avatars/u1.webp")).toBe(
      "https://cdn.carsel.club/u/avatars/u1.webp"
    );
  });

  it("throws untuk invalid key di getUrl", () => {
    expect(() => provider.getUrl("../etc/passwd")).toThrow(/'\.\.'/i);
  });
});

describe("path safety (resolveKey via public methods)", () => {
  it("rejects empty key", async () => {
    await expect(
      provider.saveFile({
        key: "",
        buffer: Buffer.from("x"),
        contentType: "image/webp",
      })
    ).rejects.toThrow(/kosong/i);
  });

  it("rejects key dengan null byte", async () => {
    await expect(
      provider.saveFile({
        key: "foo\0.webp",
        buffer: Buffer.from("x"),
        contentType: "image/webp",
      })
    ).rejects.toThrow(/null byte/i);
  });

  it("rejects absolute path (/)", async () => {
    await expect(
      provider.saveFile({
        key: "/etc/passwd",
        buffer: Buffer.from("x"),
        contentType: "image/webp",
      })
    ).rejects.toThrow(/absolute path/i);
  });

  it("rejects Windows-style absolute path (\\\\)", async () => {
    await expect(
      provider.saveFile({
        key: "\\Windows\\system32",
        buffer: Buffer.from("x"),
        contentType: "image/webp",
      })
    ).rejects.toThrow(/absolute path/i);
  });

  it("rejects '..' path traversal", async () => {
    await expect(
      provider.saveFile({
        key: "../escape.webp",
        buffer: Buffer.from("x"),
        contentType: "image/webp",
      })
    ).rejects.toThrow(/\.\./i);
  });

  it("rejects nested '..' inside path", async () => {
    await expect(
      provider.saveFile({
        key: "avatars/../../escape.webp",
        buffer: Buffer.from("x"),
        contentType: "image/webp",
      })
    ).rejects.toThrow(/\.\./i);
  });
});
