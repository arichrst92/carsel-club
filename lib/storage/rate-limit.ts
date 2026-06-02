/**
 * In-memory rate limit untuk upload per user.
 *
 * Sprint 1 scope: solo VPS, single Node process — in-memory cukup.
 * Kalau scale ke multi-instance / serverless, migrate ke DB-backed (Postgres
 * row count pakai pattern lib/auth/rate-limit.ts) atau Redis.
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 jam
const MAX_PER_WINDOW = 30;

const store = new Map<string, number[]>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAtMs: number }
  | { ok: false; retryAfterMs: number };

/**
 * Cek + record upload attempt untuk user.
 * Atomic: kalau allowed, langsung tambahin ke window.
 *
 * @param userId  unique identifier user
 * @param now     current timestamp ms (injectable for tests)
 */
export function checkUploadRate(
  userId: string,
  now: number = Date.now()
): RateLimitResult {
  const cutoff = now - WINDOW_MS;
  const existing = store.get(userId) ?? [];
  // Filter stale entries
  const recent = existing.filter((t) => t > cutoff);

  if (recent.length >= MAX_PER_WINDOW) {
    const oldest = recent[0];
    return {
      ok: false,
      retryAfterMs: oldest + WINDOW_MS - now,
    };
  }

  recent.push(now);
  store.set(userId, recent);

  return {
    ok: true,
    remaining: MAX_PER_WINDOW - recent.length,
    resetAtMs: recent[0] + WINDOW_MS,
  };
}

/**
 * Reset rate limit. Kalau userId null → clear semua (untuk test).
 */
export function resetUploadRate(userId?: string): void {
  if (userId === undefined) {
    store.clear();
  } else {
    store.delete(userId);
  }
}

export const RATE_LIMIT_CONFIG = {
  windowMs: WINDOW_MS,
  maxPerWindow: MAX_PER_WINDOW,
} as const;
