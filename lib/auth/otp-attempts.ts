/**
 * Pure helpers untuk OTP attempt enforcement (Sprint 37).
 *
 * Extracted dari verifyOtpAction untuk testability + audit clarity.
 *
 * Rules:
 * - currentAttempts >= maxAttempts → lockedOut (no verification allowed)
 * - On wrong code: increment attempts, return remaining count
 * - On right code: skip increment (caller marks verified)
 */

export type AttemptCheck =
  | { status: "locked_out" }
  | { status: "allowed"; remaining: number };

export function checkAttempt(
  currentAttempts: number,
  maxAttempts: number
): AttemptCheck {
  if (currentAttempts >= maxAttempts) return { status: "locked_out" };
  return {
    status: "allowed",
    remaining: maxAttempts - currentAttempts,
  };
}

export type FailedAttemptResult = {
  newAttempts: number;
  remaining: number;
  message: string;
};

export function recordFailedAttempt(
  currentAttempts: number,
  maxAttempts: number
): FailedAttemptResult {
  const newAttempts = currentAttempts + 1;
  const remaining = Math.max(0, maxAttempts - newAttempts);
  const message =
    remaining > 0
      ? `Wrong code. Attempts remaining: ${remaining}`
      : "Too many attempts. Resend the OTP.";
  return { newAttempts, remaining, message };
}
