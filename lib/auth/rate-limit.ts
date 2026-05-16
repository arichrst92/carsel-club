/**
 * Rate limiting helpers for OTP requests (via Drizzle).
 *
 * v1 strategy: count rows di otp_verifications table.
 * Cukup untuk closed beta. Migrate ke Redis kalau perlu scale.
 */

import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { otpVerifications } from "@/lib/db/schema";

const OTP_REQUEST_WINDOW_MIN = 10;
const OTP_REQUEST_MAX = 3;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfterMinutes: number };

export async function checkOtpRequestRate(
  phone: string
): Promise<RateLimitResult> {
  const windowStart = new Date(
    Date.now() - OTP_REQUEST_WINDOW_MIN * 60 * 1000
  );

  try {
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.whatsappNumber, phone),
          gte(otpVerifications.createdAt, windowStart)
        )
      );

    if (total >= OTP_REQUEST_MAX) {
      return {
        ok: false,
        reason: `Terlalu banyak request OTP. Coba lagi dalam ${OTP_REQUEST_WINDOW_MIN} menit.`,
        retryAfterMinutes: OTP_REQUEST_WINDOW_MIN,
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("[rate-limit] error:", e);
    return { ok: true }; // fail-open
  }
}
