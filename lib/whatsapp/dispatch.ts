/**
 * Unified WhatsApp dispatcher with provider failover (Sprint 42).
 *
 * Strategy:
 * - Try primary (Wablas) with 8s timeout
 * - On any failure (network, 4xx/5xx, API status=false, timeout) → fallback to Fonnte
 * - Returns which provider succeeded for observability
 *
 * Callers (auth + notifications) use this exclusively — no direct Wablas/Fonnte
 * import elsewhere in the codebase.
 *
 * Why failover (not clean-cut):
 * - Wablas is new for us; reliability unknown in first week of production
 * - Existing Fonnte env still configured; can be removed in Sprint 43 once
 *   Wablas proven stable
 *
 * Refs:
 * - lib/wablas/client.ts (primary)
 * - lib/fonnte/client.ts (fallback)
 */

import "server-only";
import * as wablas from "@/lib/wablas/client";
import * as fonnte from "@/lib/fonnte/client";

export type Provider = "wablas" | "fonnte";

export type DispatchResult = {
  provider: Provider;
  ok: boolean;
  error?: string;
};

interface SendOptions {
  target: string;
  message: string;
}

function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * Try Wablas first, fallback to Fonnte if either:
 * - Wablas not configured
 * - Wablas throws (network/timeout/non-2xx/API error status)
 */
export async function sendWhatsApp(
  options: SendOptions
): Promise<DispatchResult> {
  // Primary: Wablas
  if (process.env.WABLAS_TOKEN) {
    try {
      await wablas.sendWhatsApp(options);
      return { provider: "wablas", ok: true };
    } catch (e) {
      console.warn(
        "[whatsapp] Wablas failed, falling back to Fonnte:",
        describeError(e)
      );
    }
  }

  // Fallback: Fonnte
  if (process.env.FONNTE_TOKEN) {
    try {
      await fonnte.sendWhatsApp(options);
      return { provider: "fonnte", ok: true };
    } catch (e) {
      const err = describeError(e);
      console.error("[whatsapp] Fonnte also failed:", err);
      return { provider: "fonnte", ok: false, error: err };
    }
  }

  // Neither configured
  return {
    provider: "wablas",
    ok: false,
    error: "no WhatsApp provider configured",
  };
}

/**
 * Send OTP via primary → fallback chain. Dev console fallback handled
 * inside individual client's sendOtp (when no token).
 */
export async function sendOtp(
  phone: string,
  code: string
): Promise<DispatchResult> {
  if (process.env.WABLAS_TOKEN) {
    try {
      await wablas.sendOtp(phone, code);
      return { provider: "wablas", ok: true };
    } catch (e) {
      console.warn(
        "[whatsapp] Wablas OTP failed, falling back to Fonnte:",
        describeError(e)
      );
    }
  }

  // Fonnte handles dev console fallback when FONNTE_TOKEN missing + NODE_ENV !== production
  try {
    await fonnte.sendOtp(phone, code);
    return { provider: "fonnte", ok: true };
  } catch (e) {
    const err = describeError(e);
    console.error("[whatsapp] Fonnte OTP also failed:", err);
    return { provider: "fonnte", ok: false, error: err };
  }
}
