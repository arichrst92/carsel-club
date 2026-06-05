/**
 * Tests untuk lib/match/swap.ts
 *
 * Refs:
 * - DB: matches.distinct_players CHECK constraint
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 15
 */

import { describe, it, expect } from "vitest";
import {
  applySwap,
  validateSwap,
  hasDistinctPlayers,
  slotLabel,
  ALL_SLOTS,
  type MatchSlots,
} from "@/lib/match/swap";

function mkMatch(
  a: string,
  b: string,
  c: string,
  d: string
): MatchSlots {
  return {
    team1P1Id: a,
    team1P2Id: b,
    team2P1Id: c,
    team2P2Id: d,
  };
}

describe("hasDistinctPlayers", () => {
  it("4 unique → true", () => {
    expect(hasDistinctPlayers(mkMatch("p1", "p2", "p3", "p4"))).toBe(true);
  });

  it("duplicate → false", () => {
    expect(hasDistinctPlayers(mkMatch("p1", "p1", "p3", "p4"))).toBe(false);
    expect(hasDistinctPlayers(mkMatch("p1", "p2", "p1", "p4"))).toBe(false);
    expect(hasDistinctPlayers(mkMatch("p1", "p2", "p3", "p2"))).toBe(false);
  });

  it("semua sama → false", () => {
    expect(hasDistinctPlayers(mkMatch("p1", "p1", "p1", "p1"))).toBe(false);
  });
});

describe("applySwap — same match", () => {
  it("swap team1P1 ↔ team2P1 (cross team)", () => {
    const m = mkMatch("p1", "p2", "p3", "p4");
    const { newA, newB } = applySwap(m, "team1P1Id", m, "team2P1Id", true);
    expect(newA).toEqual(mkMatch("p3", "p2", "p1", "p4"));
    expect(newB).toBe(newA); // same reference
  });

  it("swap team1P1 ↔ team1P2 (within team)", () => {
    const m = mkMatch("p1", "p2", "p3", "p4");
    const { newA } = applySwap(m, "team1P1Id", m, "team1P2Id", true);
    expect(newA).toEqual(mkMatch("p2", "p1", "p3", "p4"));
  });
});

describe("applySwap — different match", () => {
  it("swap p1 (matchA team1P1) ↔ p5 (matchB team1P1)", () => {
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p5", "p6", "p7", "p8");
    const { newA, newB } = applySwap(a, "team1P1Id", b, "team1P1Id", false);
    expect(newA.team1P1Id).toBe("p5");
    expect(newB.team1P1Id).toBe("p1");
    expect(newA).toEqual(mkMatch("p5", "p2", "p3", "p4"));
    expect(newB).toEqual(mkMatch("p1", "p6", "p7", "p8"));
  });

  it("swap p2 (matchA team1P2) ↔ p7 (matchB team2P1)", () => {
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p5", "p6", "p7", "p8");
    const { newA, newB } = applySwap(a, "team1P2Id", b, "team2P1Id", false);
    expect(newA).toEqual(mkMatch("p1", "p7", "p3", "p4"));
    expect(newB).toEqual(mkMatch("p5", "p6", "p2", "p8"));
  });
});

describe("validateSwap — self-swap", () => {
  it("same match + same slot → reject", () => {
    const m = mkMatch("p1", "p2", "p3", "p4");
    const r = validateSwap(m, "team1P1Id", m, "team1P1Id", true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/slot lain/i);
  });

  it("same match + different slot → ok", () => {
    const m = mkMatch("p1", "p2", "p3", "p4");
    expect(validateSwap(m, "team1P1Id", m, "team2P1Id", true).ok).toBe(true);
  });
});

describe("validateSwap — same player ID", () => {
  it("matchA.slotA === matchB.slotB ID → reject", () => {
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p1", "p5", "p6", "p7"); // p1 di kedua match (skema fishy)
    const r = validateSwap(a, "team1P1Id", b, "team1P1Id", false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/tidak perlu/i);
  });
});

describe("validateSwap — duplicate result", () => {
  it("cross-match swap yang ngebuat duplicate di match A → reject", () => {
    // matchA: p1, p2, p3, p4
    // matchB: p1, p5, p6, p7  (sengaja p1 duplikat across matches — usually
    // tidak terjadi, tapi test path)
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p99", "p5", "p1", "p7");
    // swap matchA.team1P1Id (p1) ↔ matchB.team2P1Id (p1) → same ID
    const r1 = validateSwap(a, "team1P1Id", b, "team2P1Id", false);
    expect(r1.ok).toBe(false);
  });

  it("cross-match swap valid → ok", () => {
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p5", "p6", "p7", "p8");
    expect(
      validateSwap(a, "team1P1Id", b, "team1P1Id", false).ok
    ).toBe(true);
  });

  it("cross-match: newA dapat duplicate (matchA udah punya idB)", () => {
    // matchA: p1, p2, p3, p4 — sudah ada p2
    // matchB: p2, p5, p6, p7 — slotB=team1P1Id berisi p2
    // Swap matchA.team1P1Id (p1) ↔ matchB.team1P1Id (p2)
    // → newA = p2, p2, p3, p4 — duplicate
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p2", "p5", "p6", "p7");
    const r = validateSwap(a, "team1P1Id", b, "team1P1Id", false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/match A/i);
  });

  it("cross-match: newB dapat duplicate (matchB udah punya idA)", () => {
    // matchA: p1, p2, p3, p4
    // matchB: p5, p6, p1, p7 — punya p1 di team2P1Id
    // Swap matchA.team1P1Id (p1) ↔ matchB.team1P2Id (p6)
    // → newA = p6, p2, p3, p4 (distinct)
    // → newB = p5, p1, p1, p7 (duplicate!)
    const a = mkMatch("p1", "p2", "p3", "p4");
    const b = mkMatch("p5", "p6", "p1", "p7");
    const r = validateSwap(a, "team1P1Id", b, "team1P2Id", false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/match B/i);
  });

  it("same-match swap valid → ok", () => {
    const m = mkMatch("p1", "p2", "p3", "p4");
    expect(validateSwap(m, "team1P1Id", m, "team2P2Id", true).ok).toBe(true);
  });
});

describe("ALL_SLOTS", () => {
  it("4 slots", () => {
    expect(ALL_SLOTS).toEqual([
      "team1P1Id",
      "team1P2Id",
      "team2P1Id",
      "team2P2Id",
    ]);
  });
});

describe("slotLabel", () => {
  it.each([
    ["team1P1Id", "Tim 1 · P1"],
    ["team1P2Id", "Tim 1 · P2"],
    ["team2P1Id", "Tim 2 · P1"],
    ["team2P2Id", "Tim 2 · P2"],
  ] as const)("%s → %s", (slot, label) => {
    expect(slotLabel(slot)).toBe(label);
  });
});
