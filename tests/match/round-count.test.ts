/**
 * Tests untuk lib/match/round-count.ts
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §3.3 (Smart Default Round Count)
 */

import { describe, it, expect } from "vitest";
import {
  suggestRoundCount,
  ROUND_COUNT_CONFIG,
} from "@/lib/match/round-count";

describe("suggestRoundCount — Americano (no fix partner)", () => {
  it("8 pemain → 7 round", () => {
    const r = suggestRoundCount({
      format: "americano",
      fixPartners: false,
      playerCount: 8,
    });
    expect(r.suggested).toBe(7);
    expect(r.reason).toMatch(/Americano: 8 pemain/);
  });

  it("4 pemain → 3 round", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: 4,
      }).suggested
    ).toBe(3);
  });

  it("12 pemain → 11 round", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: 12,
      }).suggested
    ).toBe(11);
  });
});

describe("suggestRoundCount — Americano + Fix Partners", () => {
  it("8 pemain (4 pair) → 3 round", () => {
    const r = suggestRoundCount({
      format: "americano",
      fixPartners: true,
      playerCount: 8,
    });
    expect(r.suggested).toBe(3);
    expect(r.reason).toMatch(/Fix Partners.*4 pair.*3 round/);
  });

  it("12 pemain (6 pair) → 5 round", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: true,
        playerCount: 12,
      }).suggested
    ).toBe(5);
  });

  it("odd 9 pemain (5 pair, round up) → 4 round", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: true,
        playerCount: 9,
      }).suggested
    ).toBe(4);
  });
});

describe("suggestRoundCount — Mexicano", () => {
  it("default 6 round terlepas dari playerCount", () => {
    const r = suggestRoundCount({
      format: "mexicano",
      fixPartners: false,
      playerCount: 8,
    });
    expect(r.suggested).toBe(6);
    expect(r.min).toBe(5);
    expect(r.max).toBe(7);
    expect(r.reason).toMatch(/Mexicano/);
  });

  it("fixPartners flag tidak affect Mexicano default", () => {
    expect(
      suggestRoundCount({
        format: "mexicano",
        fixPartners: true,
        playerCount: 12,
      }).suggested
    ).toBe(6);
  });

  it("playerCount = 16 still 6", () => {
    expect(
      suggestRoundCount({
        format: "mexicano",
        fixPartners: false,
        playerCount: 16,
      }).suggested
    ).toBe(6);
  });
});

describe("suggestRoundCount — Tournament treated as Americano", () => {
  it("tournament no fix partner: n-1", () => {
    const r = suggestRoundCount({
      format: "tournament",
      fixPartners: false,
      playerCount: 6,
    });
    expect(r.suggested).toBe(5);
    expect(r.reason).toMatch(/Tournament: 6 pemain/);
  });

  it("tournament fix partner: (n/2)-1", () => {
    const r = suggestRoundCount({
      format: "tournament",
      fixPartners: true,
      playerCount: 8,
    });
    expect(r.suggested).toBe(3);
    expect(r.reason).toMatch(/Tournament.*Fix Partners/);
  });
});

describe("suggestRoundCount — edge cases", () => {
  it("0 pemain Americano → 1 (absolute min)", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: 0,
      }).suggested
    ).toBe(1);
  });

  it("1 pemain → 1 (clamped)", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: 1,
      }).suggested
    ).toBe(1);
  });

  it("very large playerCount clamped ke max 30", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: 100,
      }).suggested
    ).toBe(30);
  });

  it("negative playerCount handled (floor to 0)", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: -5,
      }).suggested
    ).toBe(1);
  });

  it("fractional playerCount → floor", () => {
    expect(
      suggestRoundCount({
        format: "americano",
        fixPartners: false,
        playerCount: 8.7,
      }).suggested
    ).toBe(7);
  });
});

describe("ROUND_COUNT_CONFIG", () => {
  it("americanoDefault function", () => {
    expect(ROUND_COUNT_CONFIG.americanoDefault(8)).toBe(7);
    expect(ROUND_COUNT_CONFIG.americanoDefault(0)).toBe(1);
  });

  it("americanoFixPartnersDefault function", () => {
    expect(ROUND_COUNT_CONFIG.americanoFixPartnersDefault(8)).toBe(3);
    expect(ROUND_COUNT_CONFIG.americanoFixPartnersDefault(2)).toBe(1);
  });

  it("mexicano constants", () => {
    expect(ROUND_COUNT_CONFIG.mexicanoDefault).toBe(6);
    expect(ROUND_COUNT_CONFIG.mexicanoRange).toEqual([5, 7]);
  });

  it("absolute range", () => {
    expect(ROUND_COUNT_CONFIG.absoluteRange).toEqual([1, 30]);
  });
});
