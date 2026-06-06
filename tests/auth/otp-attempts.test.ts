import { describe, expect, it } from "vitest";
import {
  checkAttempt,
  recordFailedAttempt,
} from "@/lib/auth/otp-attempts";

describe("checkAttempt", () => {
  it("fresh (0 attempts, max 5) → allowed, 5 remaining", () => {
    expect(checkAttempt(0, 5)).toEqual({ status: "allowed", remaining: 5 });
  });

  it("just under max (4/5) → allowed, 1 remaining", () => {
    expect(checkAttempt(4, 5)).toEqual({ status: "allowed", remaining: 1 });
  });

  it("at max → locked_out", () => {
    expect(checkAttempt(5, 5)).toEqual({ status: "locked_out" });
  });

  it("above max (drift) → locked_out", () => {
    expect(checkAttempt(99, 5)).toEqual({ status: "locked_out" });
  });
});

describe("recordFailedAttempt", () => {
  it("first failure (0→1, max 5)", () => {
    const r = recordFailedAttempt(0, 5);
    expect(r.newAttempts).toBe(1);
    expect(r.remaining).toBe(4);
    expect(r.message).toContain("Sisa percobaan: 4");
  });

  it("near-max failure (3→4)", () => {
    const r = recordFailedAttempt(3, 5);
    expect(r.newAttempts).toBe(4);
    expect(r.remaining).toBe(1);
    expect(r.message).toContain("Sisa percobaan: 1");
  });

  it("final failure (4→5) → lockout message", () => {
    const r = recordFailedAttempt(4, 5);
    expect(r.newAttempts).toBe(5);
    expect(r.remaining).toBe(0);
    expect(r.message).toContain("Terlalu banyak");
    expect(r.message).not.toContain("Sisa");
  });

  it("over-max edge (5→6) → still lockout message + remaining=0", () => {
    const r = recordFailedAttempt(5, 5);
    expect(r.newAttempts).toBe(6);
    expect(r.remaining).toBe(0);
    expect(r.message).toContain("Terlalu banyak");
  });

  it("custom max (3 attempts)", () => {
    expect(recordFailedAttempt(0, 3).remaining).toBe(2);
    expect(recordFailedAttempt(1, 3).remaining).toBe(1);
    expect(recordFailedAttempt(2, 3).remaining).toBe(0);
  });
});
