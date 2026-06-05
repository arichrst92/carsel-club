/**
 * Tests untuk lib/match/generator-mexicano.ts
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §3.4 (Mexicano Logic)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateMexicanoRound,
  type MexicanoPlayer,
} from "@/lib/match/generator-mexicano";
import type { PairHistory } from "@/lib/match/generator";

function makePlayers(
  count: number,
  pointsMap?: Record<number, number>
): MexicanoPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    sessionMatches: 1,
    sessionPoints: pointsMap?.[i + 1] ?? 0,
  }));
}

describe("generateMexicanoRound — input validation", () => {
  it("throws untuk <4 pemain", () => {
    expect(() =>
      generateMexicanoRound(makePlayers(3), 1, new Map(), false)
    ).toThrow(/minimal 4 pemain/i);
  });

  it("throws untuk 0 pemain", () => {
    expect(() =>
      generateMexicanoRound([], 1, new Map(), true)
    ).toThrow();
  });
});

describe("generateMexicanoRound — first round (random fallback)", () => {
  it("4 pemain → 1 match", () => {
    const r = generateMexicanoRound(
      makePlayers(4),
      1,
      new Map(),
      true
    );
    expect(r.matches).toHaveLength(1);
    expect(r.sitOuts).toEqual([]);
  });

  it("8 pemain 2 court", () => {
    const r = generateMexicanoRound(makePlayers(8), 2, new Map(), true);
    expect(r.matches).toHaveLength(2);
    expect(r.sitOuts).toEqual([]);
  });

  it("5 pemain → 1 match + 1 sit out (Americano random)", () => {
    const r = generateMexicanoRound(makePlayers(5), 1, new Map(), true);
    expect(r.matches).toHaveLength(1);
    expect(r.sitOuts).toHaveLength(1);
  });
});

describe("generateMexicanoRound — ranking-based (round 2+)", () => {
  it("4 pemain dengan ranking jelas → P1+P4 vs P2+P3", () => {
    // points: p1=30, p2=20, p3=10, p4=0 → rank 1,2,3,4 = p1,p2,p3,p4
    const players: MexicanoPlayer[] = [
      { id: "p1", sessionMatches: 1, sessionPoints: 30 },
      { id: "p2", sessionMatches: 1, sessionPoints: 20 },
      { id: "p3", sessionMatches: 1, sessionPoints: 10 },
      { id: "p4", sessionMatches: 1, sessionPoints: 0 },
    ];
    const r = generateMexicanoRound(players, 1, new Map(), false);
    expect(r.matches).toHaveLength(1);
    const m = r.matches[0];
    // P1 + P4 vs P2 + P3
    expect(m.team1.sort()).toEqual(["p1", "p4"]);
    expect(m.team2.sort()).toEqual(["p2", "p3"]);
  });

  it("8 pemain 2 court: top 4 di court 1, next 4 di court 2", () => {
    const players: MexicanoPlayer[] = [
      { id: "p1", sessionMatches: 1, sessionPoints: 80 },
      { id: "p2", sessionMatches: 1, sessionPoints: 70 },
      { id: "p3", sessionMatches: 1, sessionPoints: 60 },
      { id: "p4", sessionMatches: 1, sessionPoints: 50 },
      { id: "p5", sessionMatches: 1, sessionPoints: 40 },
      { id: "p6", sessionMatches: 1, sessionPoints: 30 },
      { id: "p7", sessionMatches: 1, sessionPoints: 20 },
      { id: "p8", sessionMatches: 1, sessionPoints: 10 },
    ];
    const r = generateMexicanoRound(players, 2, new Map(), false);
    expect(r.matches).toHaveLength(2);

    // Court 1: top 4 (p1-p4) → P1+P4 vs P2+P3
    const c1 = r.matches[0];
    expect(c1.team1.sort()).toEqual(["p1", "p4"]);
    expect(c1.team2.sort()).toEqual(["p2", "p3"]);

    // Court 2: next 4 (p5-p8) → P5+P8 vs P6+P7
    const c2 = r.matches[1];
    expect(c2.team1.sort()).toEqual(["p5", "p8"]);
    expect(c2.team2.sort()).toEqual(["p6", "p7"]);
  });

  it("sit-out: pemain dgn sessionMatches lebih tinggi sit-out duluan", () => {
    const players: MexicanoPlayer[] = [
      { id: "lazy1", sessionMatches: 0, sessionPoints: 5 },
      { id: "lazy2", sessionMatches: 0, sessionPoints: 4 },
      { id: "lazy3", sessionMatches: 0, sessionPoints: 3 },
      { id: "lazy4", sessionMatches: 0, sessionPoints: 2 },
      { id: "busy", sessionMatches: 5, sessionPoints: 100 },
    ];
    const r = generateMexicanoRound(players, 1, new Map(), false);
    expect(r.sitOuts).toContain("busy");
    expect(r.sitOuts).toHaveLength(1);
  });
});

describe("generateMexicanoRound — edge cases", () => {
  it("tied points produces valid match (no NaN/duplicate)", () => {
    // All players same points
    const players = makePlayers(8, {
      1: 50,
      2: 50,
      3: 50,
      4: 50,
      5: 50,
      6: 50,
      7: 50,
      8: 50,
    });
    const r = generateMexicanoRound(players, 2, new Map(), false);
    expect(r.matches).toHaveLength(2);
    // Each match has 4 distinct
    for (const m of r.matches) {
      const ids = [...m.team1, ...m.team2];
      expect(new Set(ids).size).toBe(4);
    }
  });

  it("court limit: 4 pemain dgn 3 court request → 1 court actual", () => {
    const r = generateMexicanoRound(makePlayers(4, { 1: 10, 2: 5, 3: 3, 4: 1 }), 3, new Map(), false);
    expect(r.matches).toHaveLength(1);
    expect(r.sitOuts).toEqual([]);
  });

  it("court limit: 9 pemain 3 court request → 2 court actual + 1 sit", () => {
    const players = makePlayers(9);
    const r = generateMexicanoRound(players, 3, new Map(), false);
    expect(r.matches).toHaveLength(2);
    expect(r.sitOuts).toHaveLength(1);
  });

  it("court number numbered sequentially", () => {
    const players = makePlayers(12);
    const r = generateMexicanoRound(players, 3, new Map(), false);
    expect(r.matches.map((m) => m.courtNumber)).toEqual([1, 2, 3]);
  });
});

describe("generateMexicanoRound — pair history violations counted", () => {
  it("forced repeat tracked as violation", () => {
    // 4 pemain, rank: p1, p2, p3, p4. Mexicano output: P1+P4 vs P2+P3.
    const players: MexicanoPlayer[] = [
      { id: "p1", sessionMatches: 1, sessionPoints: 4 },
      { id: "p2", sessionMatches: 1, sessionPoints: 3 },
      { id: "p3", sessionMatches: 1, sessionPoints: 2 },
      { id: "p4", sessionMatches: 1, sessionPoints: 1 },
    ];
    // Record bahwa p1+p4 sudah pernah bareng
    const history: PairHistory = new Map();
    history.set("p1", new Set(["p4"]));
    history.set("p4", new Set(["p1"]));

    const r = generateMexicanoRound(players, 1, history, false);
    // Pairing tetap p1+p4 (Mexicano deterministic), violations = 1
    expect(r.violations).toBe(1);
  });

  it("team2 pair history juga ke-track sebagai violation", () => {
    // 4 pemain rank: p1 p2 p3 p4. Mexicano: team1=[p1,p4], team2=[p2,p3]
    const players: MexicanoPlayer[] = [
      { id: "p1", sessionMatches: 1, sessionPoints: 4 },
      { id: "p2", sessionMatches: 1, sessionPoints: 3 },
      { id: "p3", sessionMatches: 1, sessionPoints: 2 },
      { id: "p4", sessionMatches: 1, sessionPoints: 1 },
    ];
    // Record p2+p3 sudah pernah bareng (akan jadi team2 di output)
    const history: PairHistory = new Map();
    history.set("p2", new Set(["p3"]));
    history.set("p3", new Set(["p2"]));

    const r = generateMexicanoRound(players, 1, history, false);
    expect(r.violations).toBe(1);
  });

  it("both team1 + team2 pair violations counted (total 2)", () => {
    const players: MexicanoPlayer[] = [
      { id: "p1", sessionMatches: 1, sessionPoints: 4 },
      { id: "p2", sessionMatches: 1, sessionPoints: 3 },
      { id: "p3", sessionMatches: 1, sessionPoints: 2 },
      { id: "p4", sessionMatches: 1, sessionPoints: 1 },
    ];
    const history: PairHistory = new Map();
    history.set("p1", new Set(["p4"]));
    history.set("p4", new Set(["p1"]));
    history.set("p2", new Set(["p3"]));
    history.set("p3", new Set(["p2"]));

    const r = generateMexicanoRound(players, 1, history, false);
    expect(r.violations).toBe(2);
  });

  it("no violations kalau history kosong", () => {
    const r = generateMexicanoRound(
      makePlayers(8, { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 }),
      2,
      new Map(),
      false
    );
    expect(r.violations).toBe(0);
  });
});

describe("generateMexicanoRound — non-random Math.random spy untuk sit-out tiebreak", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deterministic dgn Math.random fixed", () => {
    const players: MexicanoPlayer[] = [
      { id: "a", sessionMatches: 1, sessionPoints: 50 },
      { id: "b", sessionMatches: 1, sessionPoints: 40 },
      { id: "c", sessionMatches: 1, sessionPoints: 30 },
      { id: "d", sessionMatches: 1, sessionPoints: 20 },
    ];
    const r1 = generateMexicanoRound(players, 1, new Map(), false);
    const r2 = generateMexicanoRound(players, 1, new Map(), false);
    expect(r1.matches[0].team1.sort()).toEqual(
      r2.matches[0].team1.sort()
    );
  });
});
