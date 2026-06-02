/**
 * Tests untuk lib/storage/rate-limit.ts
 *
 * Refs:
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 1
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  checkUploadRate,
  resetUploadRate,
  RATE_LIMIT_CONFIG,
} from "@/lib/storage/rate-limit";

beforeEach(() => {
  resetUploadRate();
});

describe("checkUploadRate — basic flow", () => {
  it("first request ok, remaining = max-1", () => {
    const r = checkUploadRate("u1", 1000);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.remaining).toBe(RATE_LIMIT_CONFIG.maxPerWindow - 1);
    }
  });

  it("multiple requests dalam window terhitung cumulative", () => {
    for (let i = 0; i < 5; i++) checkUploadRate("u1", 1000 + i);
    const r = checkUploadRate("u1", 1100);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.remaining).toBe(RATE_LIMIT_CONFIG.maxPerWindow - 6);
    }
  });

  it("blocks setelah max requests", () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkUploadRate("u1", 1000 + i);
    }
    const r = checkUploadRate("u1", 1000 + RATE_LIMIT_CONFIG.maxPerWindow);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("retryAfterMs roughly = window dari request pertama", () => {
    const start = 1000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkUploadRate("u1", start + i);
    }
    const blockedAt = start + RATE_LIMIT_CONFIG.maxPerWindow;
    const r = checkUploadRate("u1", blockedAt);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      // retryAfter = oldest + windowMs - now ≈ windowMs - (maxRequests-1)
      const expected =
        start + RATE_LIMIT_CONFIG.windowMs - blockedAt;
      expect(r.retryAfterMs).toBe(expected);
    }
  });
});

describe("checkUploadRate — sliding window", () => {
  it("expired entries di-prune (sliding window)", () => {
    // Fill at t=0
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkUploadRate("u1", i);
    }
    // After window passes, semua expired → reset
    const later = RATE_LIMIT_CONFIG.windowMs + 1000;
    const r = checkUploadRate("u1", later);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.remaining).toBe(RATE_LIMIT_CONFIG.maxPerWindow - 1);
    }
  });

  it("partial window: only oldest entries expire", () => {
    // 10 requests at t=0
    for (let i = 0; i < 10; i++) checkUploadRate("u1", i);
    // 15 requests at t=windowMs/2 (still within window for older entries until they expire)
    for (let i = 0; i < 15; i++) {
      checkUploadRate("u1", RATE_LIMIT_CONFIG.windowMs / 2 + i);
    }
    // At t = windowMs + 100, the first 10 are expired, only 15 remain
    const r = checkUploadRate(
      "u1",
      RATE_LIMIT_CONFIG.windowMs + 100
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      // 15 existing + 1 new = 16; remaining = max - 16
      expect(r.remaining).toBe(RATE_LIMIT_CONFIG.maxPerWindow - 16);
    }
  });
});

describe("checkUploadRate — isolation per user", () => {
  it("user yang berbeda di-track terpisah", () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkUploadRate("u1", 1000 + i);
    }
    // u1 blocked
    expect(
      checkUploadRate("u1", 1000 + RATE_LIMIT_CONFIG.maxPerWindow).ok
    ).toBe(false);
    // u2 fresh — allowed
    expect(checkUploadRate("u2", 1100).ok).toBe(true);
  });
});

describe("resetUploadRate", () => {
  it("reset spesifik user", () => {
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkUploadRate("u1", 1000 + i);
    }
    expect(
      checkUploadRate("u1", 1000 + RATE_LIMIT_CONFIG.maxPerWindow).ok
    ).toBe(false);
    resetUploadRate("u1");
    expect(checkUploadRate("u1", 1100).ok).toBe(true);
  });

  it("reset semua user (no arg)", () => {
    checkUploadRate("u1", 100);
    checkUploadRate("u2", 100);
    resetUploadRate();
    const r1 = checkUploadRate("u1", 200);
    const r2 = checkUploadRate("u2", 200);
    if (r1.ok && r2.ok) {
      expect(r1.remaining).toBe(RATE_LIMIT_CONFIG.maxPerWindow - 1);
      expect(r2.remaining).toBe(RATE_LIMIT_CONFIG.maxPerWindow - 1);
    } else {
      throw new Error("expected ok=true");
    }
  });

  it("delete user yang belum pernah dipanggil is safe", () => {
    expect(() => resetUploadRate("nonexistent")).not.toThrow();
  });
});

describe("RATE_LIMIT_CONFIG", () => {
  it("exports expected config shape", () => {
    expect(RATE_LIMIT_CONFIG.windowMs).toBe(60 * 60 * 1000);
    expect(RATE_LIMIT_CONFIG.maxPerWindow).toBe(30);
  });
});

describe("checkUploadRate — default now (real timestamp)", () => {
  it("works tanpa explicit now param", () => {
    resetUploadRate();
    const r = checkUploadRate("default-user");
    expect(r.ok).toBe(true);
  });
});
