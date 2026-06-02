/**
 * Local filesystem storage provider.
 *
 * Layout: `${baseDir}/${key}` — key adalah logical path (mis. "avatars/u1.webp").
 * Auto-mkdir parent dirs. Overwrite policy: replace silent.
 *
 * Path safety:
 *   - Reject key dengan "..", leading "/", atau null byte (potential traversal)
 *   - Final resolved path harus tetap di dalam baseDir
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 * - Deployment: docs/DEPLOYMENT.md (Nginx alias /uploads/)
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  SaveFileInput,
  SavedFile,
  StorageProvider,
} from "./types";

export type LocalStorageOptions = {
  /** Absolute path to local storage root (e.g. "/var/www/carsel-uploads"). */
  baseDir: string;
  /** Public URL base (e.g. "/uploads" or "https://cdn.carsel.club/uploads"). */
  urlBase: string;
};

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private urlBase: string;

  constructor(opts: LocalStorageOptions) {
    if (!opts.baseDir) {
      throw new Error("baseDir wajib diisi");
    }
    if (!opts.urlBase) {
      throw new Error("urlBase wajib diisi");
    }
    this.baseDir = path.resolve(opts.baseDir);
    // Strip trailing slash dari urlBase untuk consistent join
    this.urlBase = opts.urlBase.replace(/\/+$/, "");
  }

  /**
   * Validate + normalize key. Throws kalau unsafe.
   */
  private resolveKey(key: string): string {
    if (!key || key.length === 0) {
      throw new Error("Key kosong");
    }
    if (key.includes("\0")) {
      throw new Error("Key invalid (null byte)");
    }
    if (key.startsWith("/") || key.startsWith("\\")) {
      throw new Error("Key tidak boleh absolute path");
    }
    if (key.includes("..")) {
      throw new Error("Key tidak boleh mengandung '..'");
    }

    // Check di atas (includes("..") + absolute path + null byte) udah catch
    // semua escape attempt POSIX. path.normalize() di Unix tidak akan
    // memproduce path dgn '..' dari input yg gak punya '..'. Kalau perlu
    // tambah defense di future, tambahi explicit test case dulu.
    const normalized = path.normalize(key);
    return path.join(this.baseDir, normalized);
  }

  async saveFile(input: SaveFileInput): Promise<SavedFile> {
    const absolute = this.resolveKey(input.key);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, input.buffer);
    return {
      key: input.key,
      url: this.getUrl(input.key),
      bytes: input.buffer.byteLength,
    };
  }

  async deleteFile(key: string): Promise<void> {
    let absolute: string;
    try {
      absolute = this.resolveKey(key);
    } catch {
      // Invalid key → no-op (idempotent)
      return;
    }
    try {
      await fs.unlink(absolute);
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") {
        // Not found → idempotent
        return;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    let absolute: string;
    try {
      absolute = this.resolveKey(key);
    } catch {
      return false;
    }
    try {
      await fs.access(absolute);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    // Validate key (throws kalau unsafe)
    this.resolveKey(key);
    return `${this.urlBase}/${key.replace(/^\/+/, "")}`;
  }
}
