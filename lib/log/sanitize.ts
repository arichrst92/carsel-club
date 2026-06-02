/**
 * Sanitize context — strip / redact PII sebelum di-persist ke DB.
 *
 * Aturan:
 * - Key dengan substring (case-insensitive) blacklist → ganti value dgn "[REDACTED]"
 * - Phone numbers → keep only last 4 digits (mis. "628123456789" → "***6789")
 * - Truncate string >2000 char (avoid bloat)
 * - Drop circular references / non-serializable values
 * - Nested objects: recurse (depth max 5 untuk safety)
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2 (privacy)
 */

import type { LogContext } from "./types";

const REDACT_KEYS = [
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "auth",
  "cookie",
  "sessionsecret",
  "session_secret",
  "fonnte_token",
  "auth_session_secret",
];

const PHONE_KEYS = ["phone", "whatsapp", "whatsappnumber", "whatsapp_number"];

const MAX_STRING_LEN = 2000;
const MAX_DEPTH = 5;
const REDACTED = "[REDACTED]";

function isRedactKey(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT_KEYS.some((needle) => lower.includes(needle));
}

function isPhoneKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PHONE_KEYS.some((needle) => lower === needle || lower.endsWith(needle));
}

/**
 * Mask phone: pertahankan 4 digit terakhir.
 * "628123456789" → "***6789"
 * "" / short → "***"
 */
export function maskPhone(value: unknown): string {
  if (typeof value !== "string") return REDACTED;
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "***";
  return `***${digits.slice(-4)}`;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === "string") {
    return (value as string).length > MAX_STRING_LEN
      ? (value as string).slice(0, MAX_STRING_LEN) + "…"
      : value;
  }
  if (t === "number" || t === "boolean") return value;
  if (t === "bigint") return (value as bigint).toString();
  if (t === "function" || t === "symbol") return REDACTED;
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, depth + 1));
  }
  // By elimination: remaining typeof is "object" (string/number/boolean/
  // bigint/function/symbol handled di atas, null/undefined handled awal,
  // array handled tepat di atas). Tidak butuh `if (t === "object")` check.
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack:
        value.stack && value.stack.length > MAX_STRING_LEN
          ? value.stack.slice(0, MAX_STRING_LEN) + "…"
          : value.stack,
    };
  }
  return sanitizeContext(value as LogContext, depth + 1);
}

/**
 * Recursively sanitize context object. Returns new object (input not mutated).
 */
export function sanitizeContext(
  ctx: LogContext,
  depth = 0
): LogContext {
  if (depth > MAX_DEPTH) return { _truncated: true };
  const result: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (isRedactKey(key)) {
      result[key] = REDACTED;
    } else if (isPhoneKey(key)) {
      result[key] = maskPhone(value);
    } else {
      result[key] = sanitizeValue(value, depth + 1);
    }
  }
  return result;
}
