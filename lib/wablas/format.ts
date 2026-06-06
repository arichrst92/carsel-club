/**
 * Pure helpers untuk Wablas API formatting (Sprint 42).
 *
 * Wablas accepts Indonesian phone format `62xxxxxxxxx` (no +, no leading 0).
 * Same convention as Fonnte for compatibility.
 *
 * Refs:
 * - Wablas docs: https://wablas.com/documentation
 * - Used by: lib/wablas/client.ts
 */

/**
 * Normalize raw phone input ke Indonesian E.164 tanpa "+" prefix.
 * - "08123" → "628123"
 * - "+628123" → "628123"
 * - "8123" → "628123" (assume Indonesian)
 * - "628123" → "628123" (already normalized)
 * - Strips spaces, dashes, dots, parens
 * - Empty/null safe
 */
export function normalizeWablasPhone(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  const stripPlus = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
  const digits = stripPlus.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

/**
 * Build URL-encoded payload untuk Wablas send-message endpoint.
 */
export function buildWablasPayload(
  target: string,
  message: string
): string {
  const params = new URLSearchParams();
  params.set("phone", normalizeWablasPhone(target));
  params.set("message", message);
  return params.toString();
}

/**
 * Build Authorization header value untuk Wablas API.
 *
 * - Tanpa secret: just `token`
 * - Dengan secret: `token.secret` (Wablas format, untuk bypass IP whitelist)
 *
 * Secret bisa di-set di dashboard Wablas → API → Secret Key. Kalau IP
 * whitelist aktif tapi client IP dynamic (e.g., dev local), secret allow
 * request lolos tanpa cek whitelist.
 */
export function buildAuthorizationHeader(
  token: string,
  secret?: string | null
): string {
  if (secret && secret.length > 0) {
    return `${token}.${secret}`;
  }
  return token;
}

export type WablasResponse = {
  status: boolean;
  message: string | null;
  data: unknown;
};

/**
 * Defensive parser. Wablas may return:
 * - { status: true, message: "...", data: {...} }  (success)
 * - { status: false, message: "...", reason: "..." }  (error)
 * - status sometimes "true" (string) — coerce
 */
export function parseWablasResponse(body: unknown): WablasResponse {
  if (!body || typeof body !== "object") {
    return { status: false, message: "invalid response", data: null };
  }
  const obj = body as Record<string, unknown>;
  const rawStatus = obj.status;
  const status = rawStatus === true || rawStatus === "true";
  const message =
    typeof obj.message === "string" && obj.message.length > 0
      ? obj.message
      : typeof obj.reason === "string" && obj.reason.length > 0
        ? obj.reason
        : null;
  return { status, message, data: obj.data ?? null };
}
