/**
 * OTP generation, hashing, and validation helpers.
 * Codes are 6-digit numeric. Hashed via SHA-256 before storage.
 *
 * Storage table: otp_verifications (see schema.sql)
 */

import { randomInt, createHash, timingSafeEqual } from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

/**
 * Generate a 6-digit numeric OTP code.
 * Uses crypto.randomInt for cryptographic randomness.
 */
export function generateOtpCode(): string {
  // 100000 to 999999 inclusive → always 6 digits, never leading zero
  return randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP code using SHA-256.
 * Hashing is sufficient because OTPs are short-lived (5 min) and rate-limited.
 */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Verify a plain OTP code against a stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyOtpCode(plainCode: string, storedHash: string): boolean {
  const computedHash = hashOtpCode(plainCode);

  // Buffers must be same length for timingSafeEqual
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/**
 * Compute OTP expiration timestamp (5 minutes from now).
 */
export function computeOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Normalize Indonesian phone number to E.164 format (+62...).
 * Accepts: "08123456789", "8123456789", "628123456789", "+628123456789".
 * Returns: "628123456789" (no plus, suitable for Fonnte).
 */
export function normalizePhone(input: string): string {
  // Strip all non-digits
  let digits = input.replace(/\D/g, "");

  // 08... → 8... (drop leading 0)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 62... already prefixed
  if (digits.startsWith("62")) {
    return digits;
  }

  // 8... → 628... (add Indonesia country code)
  return "62" + digits;
}

/**
 * Validate normalized Indonesian phone number.
 * Indonesian mobile: 62 8XX XXXX XXXX (total 10-13 digits after 62).
 */
export function isValidIndonesianPhone(normalized: string): boolean {
  // Must start with "628" and be 11-15 digits total
  return /^628\d{8,12}$/.test(normalized);
}

export const OTP_CONFIG = {
  length: OTP_LENGTH,
  ttlMinutes: OTP_TTL_MINUTES,
  maxAttempts: OTP_MAX_ATTEMPTS,
};
