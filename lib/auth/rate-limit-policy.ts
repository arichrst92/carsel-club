/**
 * Unified rate-limit decision (Sprint 41).
 *
 * Composes two distinct limits ke single decision:
 * - Request rate: max N requests per window (e.g., 3 OTP / 10 min)
 * - Attempt rate: max M verification attempts per OTP code (e.g., 5)
 *
 * Pure: testable. Caller passes pre-fetched counts.
 *
 * Refs:
 * - lib/auth/rate-limit.ts (existing DB-backed counter)
 * - lib/auth/otp-attempts.ts (Sprint 37 per-code attempt enforcement)
 * - Used by: app/actions/auth.ts (loginAction + verifyOtpAction)
 */

export type RateLimitInput = {
  requestsInWindow: number;
  requestLimit: number;
  attempts: number;
  attemptLimit: number;
};

export type RateLimitDecision =
  | { allowed: true; remainingRequests: number; remainingAttempts: number }
  | {
      allowed: false;
      reason: "too_many_requests" | "too_many_attempts";
      retryAfterSeconds: number | null;
    };

/**
 * Decide whether action proceeds. Requests checked first because expensive
 * (network OTP send) — attempts only matter once a code exists.
 */
export function decideRateLimit(
  input: RateLimitInput,
  retryAfterSecondsForRequests: number | null = null
): RateLimitDecision {
  if (input.requestsInWindow >= input.requestLimit) {
    return {
      allowed: false,
      reason: "too_many_requests",
      retryAfterSeconds: retryAfterSecondsForRequests,
    };
  }
  if (input.attempts >= input.attemptLimit) {
    return {
      allowed: false,
      reason: "too_many_attempts",
      retryAfterSeconds: null,
    };
  }
  return {
    allowed: true,
    remainingRequests: input.requestLimit - input.requestsInWindow,
    remainingAttempts: input.attemptLimit - input.attempts,
  };
}

/**
 * Localized denial messages for action results.
 */
export function rateLimitMessage(decision: RateLimitDecision): string {
  if (decision.allowed) return "";
  if (decision.reason === "too_many_requests") {
    if (decision.retryAfterSeconds === null) {
      return "Terlalu banyak request OTP. Coba lagi nanti.";
    }
    const mins = Math.ceil(decision.retryAfterSeconds / 60);
    return `Too many OTP requests. Try again in ${mins} minutes.`;
  }
  return "Too many code attempts. Resend the OTP.";
}
