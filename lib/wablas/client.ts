/**
 * Wablas WhatsApp Gateway client (Sprint 42).
 *
 * Drop-in replacement of lib/fonnte/client.ts. Same signatures.
 *
 * Env:
 * - WABLAS_TOKEN — required for production
 * - WABLAS_API_URL — full endpoint URL, defaults to https://wablas.com/api/send-message
 *   (server zone is per-account, contoh: https://solo.wablas.com/api/send-message)
 *
 * Refs: https://wablas.com/documentation
 */

import "server-only";
import {
  buildAuthorizationHeader,
  buildWablasPayload,
  parseWablasResponse,
  type WablasResponse,
} from "./format";

const DEFAULT_API_URL = "https://wablas.com/api/send-message";
const REQUEST_TIMEOUT_MS = 8000;

interface SendMessageOptions {
  /** Phone in any common format — normalized to 62xxx internally */
  target: string;
  /** Message body */
  message: string;
}

export async function sendWhatsApp(
  options: SendMessageOptions
): Promise<WablasResponse> {
  const token = process.env.WABLAS_TOKEN;
  if (!token) {
    throw new Error("WABLAS_TOKEN environment variable is not set");
  }
  const apiUrl = process.env.WABLAS_API_URL ?? DEFAULT_API_URL;
  // Sprint 42: optional bypass IP whitelist via secret key.
  // Wablas format: Authorization: TOKEN.SECRET
  const secret = process.env.WABLAS_SECRET_KEY ?? null;
  const authHeader = buildAuthorizationHeader(token, secret);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildWablasPayload(options.target, options.message),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Surface response body for debugging (esp. 403/401 token issues)
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        // ignore
      }
      throw new Error(
        `Wablas HTTP ${res.status} ${res.statusText} (endpoint=${apiUrl})${
          bodyText ? ` body=${bodyText.slice(0, 200)}` : ""
        }`
      );
    }

    const json = (await res.json()) as unknown;
    const parsed = parseWablasResponse(json);
    if (!parsed.status) {
      throw new Error(
        `Wablas API error: ${parsed.message ?? "unknown"} (endpoint=${apiUrl})`
      );
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send OTP via WhatsApp. Dev fallback: logs OTP to console kalau
 * WABLAS_TOKEN tidak set (untuk testing tanpa kuota).
 */
export async function sendOtp(
  phone: string,
  code: string
): Promise<WablasResponse> {
  if (!process.env.WABLAS_TOKEN && process.env.NODE_ENV !== "production") {
    console.log("\n┌─────────────────────────────────────────");
    console.log("│  🔐 DEV OTP (Wablas not configured)");
    console.log(`│  Phone : ${phone}`);
    console.log(`│  Code  : ${code}`);
    console.log("│  Copy code above untuk verify di /login/verify");
    console.log("└─────────────────────────────────────────\n");
    return { status: true, message: "dev", data: null };
  }

  const message = `*Carsel Club*

Kode verifikasi kamu: *${code}*

Kode berlaku 5 menit. Jangan share ke siapa pun.`;

  return sendWhatsApp({ target: phone, message });
}
