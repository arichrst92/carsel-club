/**
 * Tests untuk lib/auth/otp.ts
 *
 * Refs:
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §5.7 (OTP rate limit)
 * - DB:   lib/db/schema.ts (otp_verifications.codeHash, expiresAt, maxAttempts)
 * - Auth: Fonnte WA gateway expects Indonesian E.164-ish format (62...)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  computeOtpExpiry,
  normalizePhone,
  isValidIndonesianPhone,
  OTP_CONFIG,
} from "@/lib/auth/otp";

describe("generateOtpCode", () => {
  it("returns 6 digit string", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("first digit selalu 1-9 (no leading zero)", () => {
    // Run 200x untuk verify range
    for (let i = 0; i < 200; i++) {
      const code = generateOtpCode();
      expect(code[0]).not.toBe("0");
    }
  });

  it("value di range [100000, 999999]", () => {
    for (let i = 0; i < 50; i++) {
      const n = parseInt(generateOtpCode(), 10);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });

  it("distribusi acak (50× test menghasilkan banyak unique values)", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) codes.add(generateOtpCode());
    // Anti-test deterministic: minimal 30 unique (kelonggaran clash)
    expect(codes.size).toBeGreaterThan(30);
  });
});

describe("hashOtpCode", () => {
  it("deterministic — same input → same hash", () => {
    expect(hashOtpCode("123456")).toBe(hashOtpCode("123456"));
  });

  it("different inputs → different hash", () => {
    expect(hashOtpCode("123456")).not.toBe(hashOtpCode("123457"));
  });

  it("output adalah hex string 64 char (SHA-256)", () => {
    const hash = hashOtpCode("000000");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("known SHA-256 value untuk input '123456'", () => {
    // Pre-computed: SHA-256("123456") = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
    expect(hashOtpCode("123456")).toBe(
      "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
    );
  });
});

describe("verifyOtpCode", () => {
  it("returns true untuk valid code/hash pair", () => {
    const hash = hashOtpCode("123456");
    expect(verifyOtpCode("123456", hash)).toBe(true);
  });

  it("returns false untuk wrong code", () => {
    const hash = hashOtpCode("123456");
    expect(verifyOtpCode("000000", hash)).toBe(false);
  });

  it("returns false untuk corrupted hash (length mismatch)", () => {
    expect(verifyOtpCode("123456", "not-a-hash")).toBe(false);
  });

  it("returns false untuk empty stored hash", () => {
    expect(verifyOtpCode("123456", "")).toBe(false);
  });

  it("timing-safe (different lengths return early false)", () => {
    expect(verifyOtpCode("123456", "abc")).toBe(false);
  });
});

describe("computeOtpExpiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Date 5 menit ke depan", () => {
    const expiry = computeOtpExpiry();
    const now = new Date();
    expect(expiry.getTime() - now.getTime()).toBe(5 * 60 * 1000);
  });

  it("returns Date instance", () => {
    expect(computeOtpExpiry()).toBeInstanceOf(Date);
  });
});

describe("normalizePhone", () => {
  it("'08123456789' → '628123456789'", () => {
    expect(normalizePhone("08123456789")).toBe("628123456789");
  });

  it("'8123456789' → '628123456789'", () => {
    expect(normalizePhone("8123456789")).toBe("628123456789");
  });

  it("'628123456789' tetap '628123456789'", () => {
    expect(normalizePhone("628123456789")).toBe("628123456789");
  });

  it("'+628123456789' strip + sign → '628123456789'", () => {
    expect(normalizePhone("+628123456789")).toBe("628123456789");
  });

  it("strip spaces dan dashes", () => {
    expect(normalizePhone("0812-3456-789")).toBe("6281234567890".slice(0, 12));
    expect(normalizePhone("0812 3456 789")).toBe("6281234567890".slice(0, 12));
  });

  it("strip random non-digits", () => {
    expect(normalizePhone("(0812) 3456-789")).toBe("6281234567890".slice(0, 12));
  });

  it("empty string returns '62' fallback", () => {
    expect(normalizePhone("")).toBe("62");
  });
});

describe("isValidIndonesianPhone", () => {
  it("nomor seluler valid 12 digit", () => {
    expect(isValidIndonesianPhone("628123456789")).toBe(true);
  });

  it("nomor seluler 11 digit valid", () => {
    expect(isValidIndonesianPhone("62812345678")).toBe(true);
  });

  it("nomor seluler 15 digit valid (edge max)", () => {
    expect(isValidIndonesianPhone("628123456789012")).toBe(true);
  });

  it("nomor terlalu pendek invalid", () => {
    expect(isValidIndonesianPhone("6281234567")).toBe(false); // 10 digit
  });

  it("nomor terlalu panjang invalid", () => {
    expect(isValidIndonesianPhone("6281234567890123")).toBe(false); // 16 digit
  });

  it("no '628' prefix invalid", () => {
    expect(isValidIndonesianPhone("621234567890")).toBe(false);
  });

  it("non-digit invalid", () => {
    expect(isValidIndonesianPhone("62abc123456")).toBe(false);
  });

  it("empty invalid", () => {
    expect(isValidIndonesianPhone("")).toBe(false);
  });
});

describe("OTP_CONFIG", () => {
  it("exports expected config shape", () => {
    expect(OTP_CONFIG).toEqual({
      length: 6,
      ttlMinutes: 5,
      maxAttempts: 5,
    });
  });
});
