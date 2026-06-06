import { describe, expect, it } from "vitest";
import {
  decideRateLimit,
  rateLimitMessage,
} from "@/lib/auth/rate-limit-policy";

describe("decideRateLimit", () => {
  const base = {
    requestsInWindow: 0,
    requestLimit: 3,
    attempts: 0,
    attemptLimit: 5,
  };

  it("fresh state → allowed", () => {
    const r = decideRateLimit(base);
    expect(r.allowed).toBe(true);
    if (r.allowed) {
      expect(r.remainingRequests).toBe(3);
      expect(r.remainingAttempts).toBe(5);
    }
  });

  it("just below request limit → allowed", () => {
    const r = decideRateLimit({ ...base, requestsInWindow: 2 });
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.remainingRequests).toBe(1);
  });

  it("at request limit → denied", () => {
    const r = decideRateLimit({ ...base, requestsInWindow: 3 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("too_many_requests");
  });

  it("over request limit (drift) → denied", () => {
    const r = decideRateLimit({ ...base, requestsInWindow: 99 });
    expect(r.allowed).toBe(false);
  });

  it("retryAfterSeconds passed through", () => {
    const r = decideRateLimit(
      { ...base, requestsInWindow: 3 },
      300
    );
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.retryAfterSeconds).toBe(300);
  });

  it("at attempt limit (request ok) → denied attempts", () => {
    const r = decideRateLimit({ ...base, attempts: 5 });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("too_many_attempts");
  });

  it("requests checked before attempts (priority)", () => {
    const r = decideRateLimit({
      ...base,
      requestsInWindow: 3,
      attempts: 5,
    });
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toBe("too_many_requests");
  });

  it("custom thresholds", () => {
    expect(
      decideRateLimit({
        requestsInWindow: 1,
        requestLimit: 1,
        attempts: 0,
        attemptLimit: 1,
      }).allowed
    ).toBe(false);
    expect(
      decideRateLimit({
        requestsInWindow: 0,
        requestLimit: 1,
        attempts: 0,
        attemptLimit: 1,
      }).allowed
    ).toBe(true);
  });
});

describe("rateLimitMessage", () => {
  it("allowed → empty string", () => {
    expect(
      rateLimitMessage({
        allowed: true,
        remainingRequests: 1,
        remainingAttempts: 5,
      })
    ).toBe("");
  });

  it("too_many_requests no retry → generic", () => {
    const msg = rateLimitMessage({
      allowed: false,
      reason: "too_many_requests",
      retryAfterSeconds: null,
    });
    expect(msg).toContain("Terlalu banyak request");
    expect(msg).not.toContain("menit");
  });

  it("too_many_requests with retry → includes minutes", () => {
    const msg = rateLimitMessage({
      allowed: false,
      reason: "too_many_requests",
      retryAfterSeconds: 90,
    });
    expect(msg).toContain("2 menit");
  });

  it("too_many_requests retry rounding (61s → 2 menit)", () => {
    const msg = rateLimitMessage({
      allowed: false,
      reason: "too_many_requests",
      retryAfterSeconds: 61,
    });
    expect(msg).toContain("2 menit");
  });

  it("too_many_attempts → kirim ulang", () => {
    const msg = rateLimitMessage({
      allowed: false,
      reason: "too_many_attempts",
      retryAfterSeconds: null,
    });
    expect(msg).toContain("Kirim ulang OTP");
  });
});
