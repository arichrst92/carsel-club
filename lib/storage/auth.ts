/**
 * Server-side wrapper untuk authenticated upload flows.
 *
 * - Auth: butuh user session valid
 * - Rate limit: per-user (in-memory, Sprint 1 scope)
 * - Size guard via MAX_UPLOAD_BYTES
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 * - Auth: lib/auth/get-current-user.ts
 */

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkUploadRate } from "./rate-limit";
import type { User } from "@/lib/db/types";

export type UploadAuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

/**
 * Validate auth + rate limit. Returns { ok, user } untuk handler proceed,
 * atau { ok: false, error } untuk return ke client.
 */
export async function checkUploadAuth(): Promise<UploadAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Login dulu untuk upload" };
  }
  const rate = checkUploadRate(user.id);
  if (!rate.ok) {
    const minutes = Math.ceil(rate.retryAfterMs / 60000);
    return {
      ok: false,
      error: `Upload terlalu sering. Coba lagi dalam ${minutes} menit.`,
    };
  }
  return { ok: true, user };
}
