/**
 * Storage abstraction layer.
 *
 * StorageProvider interface — implemented by lib/storage/local.ts (filesystem
 * di VPS untuk Sprint 1). Nanti bisa di-swap ke S3-compatible (Cloudflare R2,
 * Vercel Blob, Supabase Storage) tanpa ubah business code.
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md (Storage decisions di Working Agreements)
 */

export type SaveFileInput = {
  /** Logical path (e.g. "avatars/{userId}.webp"). NO leading slash, NO ".." */
  key: string;
  /** Raw bytes to persist. Caller is responsible for pre-processing. */
  buffer: Buffer;
  /** MIME type to associate (e.g. "image/webp"). */
  contentType: string;
};

export type SavedFile = {
  key: string;
  url: string;
  bytes: number;
};

export interface StorageProvider {
  /**
   * Persist file. Overwrite kalau key sudah ada (no version control).
   * Returns metadata + public URL.
   */
  saveFile(input: SaveFileInput): Promise<SavedFile>;

  /**
   * Delete file. Idempotent — no-throw kalau key tidak exist.
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Cek apakah key sudah ada di storage.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Compute public URL untuk key. Synchronous — tidak query backend.
   */
  getUrl(key: string): string;
}
