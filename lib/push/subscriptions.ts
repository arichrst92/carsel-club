/**
 * Pure helpers untuk push subscription validation + parsing (Sprint 27).
 *
 * Browser PushSubscription.toJSON() shape:
 *   { endpoint: string, keys: { p256dh: string, auth: string } }
 *
 * Refs:
 * - DB: push_subscriptions
 * - Used by: app/actions/push.ts, lib/push/send.ts
 */

import type { PushSubscriptionPayload } from "./types";

/**
 * Validate that raw input has correct PushSubscription shape.
 * Returns parsed payload or null.
 */
export function parsePushSubscription(
  raw: unknown
): PushSubscriptionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const endpoint = obj.endpoint;
  if (typeof endpoint !== "string" || endpoint.length === 0) return null;
  if (endpoint.length > 1024) return null;
  if (!endpoint.startsWith("https://")) return null;

  const keys = obj.keys;
  if (!keys || typeof keys !== "object") return null;
  const k = keys as Record<string, unknown>;
  if (typeof k.p256dh !== "string" || k.p256dh.length === 0) return null;
  if (typeof k.auth !== "string" || k.auth.length === 0) return null;
  // p256dh base64 should be ~87 chars uncompressed; auth ~22 chars.
  // Loose bounds to allow padding/encoding variants.
  if (k.p256dh.length > 256) return null;
  if (k.auth.length > 128) return null;

  return {
    endpoint,
    keys: { p256dh: k.p256dh, auth: k.auth },
  };
}

/**
 * Truncate user-agent string ke max len (safe for DB column).
 */
export function sanitizeUserAgent(ua: unknown, maxLen = 500): string | null {
  if (typeof ua !== "string") return null;
  const trimmed = ua.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}
