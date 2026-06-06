/**
 * Tests untuk lib/match/generator-fix-partners.ts
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §2.2 (Fix Partners)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formInitialPairs,
  extractPairs,
  roundRobinMatchups,
  generateFixPartnersRound,
  type FixPartnersPlayer,
  type Pair,
} from "@/lib/match/generator-fix-partners";
import type { PairHistory } from "@/lib/match/generator";

function makePlayers(
  count: number,
  pointsMap?: Record<number, number>
): FixPartnersPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    sessionMatches: 0,
    sessionPoints: pointsMap?.[i + 1] ?? 0,
  }));
}

describe("formInitialPairs", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("empty input → empty pairs", () => {
    expect(formInitialPairs([], "americano")).toEqual([]);
  });

  it("1 player → empty pairs (can't form)", () => {
    expect(formInitialPairs(makePlayers(1), "americano")).toEqual([]);
  });

  it("2 players → 1 pair", () => {
    const r = formInitialPairs(makePlayers(2), "americano");
    expect(r).toHaveLength(1);
    expect(r[0].sort()).toEqual(["p1", "p2"]);
  });

  it("8 players Americano → 4 pairs (adjacent shuffle)", () => {
    const r = formInitialPairs(makePlayers(8), "americano");
    expect(r).toHaveLength(4);
    // All players covered
    const allIds = r.flatMap((pair) => pair);
    expect(new Set(allIds).size).toBe(8);
  });

  it("odd 7 players → 3 pairs (drop last)", () => {
    const r = formInitialPairs(makePlayers(7), "americano");
    expect(r).toHaveLength(3);
    expect(r.flatMap((p) => p)).toHaveLength(6);
  });

  it("Mexicano: top+bottom pairing by sessionPoints DESC", () => {
    // 4 pemain: p1=40, p2=30, p3=20, p4=10
    // Rank: p1, p2, p3, p4
    // Pair: (p1, p4), (p2, p3)
    const players: FixPartnersPlayer[] = [
      { id: "p1", sessionMatches: 0, sessionPoints: 40 },
      { id: "p2", sessionMatches: 0, sessionPoints: 30 },
      { id: "p3", sessionMatches: 0, sessionPoints: 20 },
      { id: "p4", sessionMatches: 0, sessionPoints: 10 },
    ];
    const r = formInitialPairs(players, "mexicano");
    expect(r).toHaveLength(2);
    expect(r[0].sort()).toEqual(["p1", "p4"]);
    expect(r[1].sort()).toEqual(["p2", "p3"]);
  });

  it("Mexicano tied points: tiebreak random (still produces valid pairs)", () => {
    // 4 pemain dengan sessionPoints sama → trigger tiebreak branch
    const players: FixPartnersPlayer[] = [
      { id: "p1", sessionMatches: 0, sessionPoints: 20 },
      { id: "p2", sessionMatches: 0, sessionPoints: 20 },
      { id: "p3", sessionMatches: 0, sessionPoints: 20 },
      { id: "p4", sessionMatches: 0, sessionPoints: 20 },
    ];
    const r = formInitialPairs(players, "mexicano");
    expect(r).toHaveLength(2);
    // Semua pemain ter-cover, distinct
    const ids = r.flatMap((p) => p);
    expect(new Set(ids).size).toBe(4);
  });

  it("Mexicano 6 players: rank 1+6, 2+5, 3+4", () => {
    const players: FixPartnersPlayer[] = [
      { id: "p1", sessionMatches: 0, sessionPoints: 60 },
      { id: "p2", sessionMatches: 0, sessionPoints: 50 },
      { id: "p3", sessionMatches: 0, sessionPoints: 40 },
      { id: "p4", sessionMatches: 0, sessionPoints: 30 },
      { id: "p5", sessionMatches: 0, sessionPoints: 20 },
      { id: "p6", sessionMatches: 0, sessionPoints: 10 },
    ];
    const r = formInitialPairs(players, "mexicano");
    expect(r).toHaveLength(3);
    expect(r[0].sort()).toEqual(["p1", "p6"]);
    expect(r[1].sort()).toEqual(["p2", "p5"]);
    expect(r[2].sort()).toEqual(["p3", "p4"]);
  });

  it("tournament treated as Americano (random pair)", () => {
    const r = formInitialPairs(makePlayers(4), "tournament");
    expect(r).toHaveLength(2);
  });
});

describe("extractPairs", () => {
  it("empty → empty", () => {
    expect(extractPairs([])).toEqual([]);
  });

  it("1 match → 2 pairs", () => {
    const r = extractPairs([
      {
        team1P1Id: "p1",
        team1P2Id: "p2",
        team2P1Id: "p3",
        team2P2Id: "p4",
      },
    ]);
    expect(r).toHaveLength(2);
    expect(r[0].sort()).toEqual(["p1", "p2"]);
    expect(r[1].sort()).toEqual(["p3", "p4"]);
  });

  it("dedupe — pair sama di 2 match → cuma 1 entry", () => {
    const r = extractPairs([
      {
        team1P1Id: "p1",
        team1P2Id: "p2",
        team2P1Id: "p3",
        team2P2Id: "p4",
      },
      {
        team1P1Id: "p1", // same pair (p1+p2)
        team1P2Id: "p2",
        team2P1Id: "p5",
        team2P2Id: "p6",
      },
    ]);
    expect(r).toHaveLength(3);
  });

  it("dedupe handle order — (p1,p2) sama dengan (p2,p1)", () => {
    const r = extractPairs([
      {
        team1P1Id: "p1",
        team1P2Id: "p2",
        team2P1Id: "p3",
        team2P2Id: "p4",
      },
      {
        team1P1Id: "p2", // swap order, still p1+p2 logically
        team1P2Id: "p1",
        team2P1Id: "p5",
        team2P2Id: "p6",
      },
    ]);
    expect(r).toHaveLength(3); // (p1,p2), (p3,p4), (p5,p6)
  });
});

describe("roundRobinMatchups", () => {
  it("<2 pairs → empty", () => {
    expect(roundRobinMatchups(0, 0)).toEqual([]);
    expect(roundRobinMatchups(1, 0)).toEqual([]);
  });

  it("2 pairs round 0: [0,1]", () => {
    expect(roundRobinMatchups(2, 0)).toEqual([[0, 1]]);
  });

  it("4 pairs: 3 rounds cover semua kombinasi", () => {
    const r0 = roundRobinMatchups(4, 0);
    const r1 = roundRobinMatchups(4, 1);
    const r2 = roundRobinMatchups(4, 2);

    // Each round has 2 matchups
    expect(r0).toHaveLength(2);
    expect(r1).toHaveLength(2);
    expect(r2).toHaveLength(2);

    // Union semua matchup = all C(4,2)=6 unique pairings
    const allMatchups = [...r0, ...r1, ...r2].map((m) =>
      m[0] < m[1] ? `${m[0]}-${m[1]}` : `${m[1]}-${m[0]}`
    );
    expect(new Set(allMatchups).size).toBe(6); // all unique
  });

  it("6 pairs round 0: 3 matchups", () => {
    const r = roundRobinMatchups(6, 0);
    expect(r).toHaveLength(3);
    // All indices covered
    const indices = r.flatMap((m) => m);
    expect(new Set(indices).size).toBe(6);
  });

  it("6 pairs: 5 rounds cover semua C(6,2)=15", () => {
    const all: string[] = [];
    for (let r = 0; r < 5; r++) {
      const matchups = roundRobinMatchups(6, r);
      for (const m of matchups) {
        all.push(m[0] < m[1] ? `${m[0]}-${m[1]}` : `${m[1]}-${m[0]}`);
      }
    }
    expect(new Set(all).size).toBe(15);
  });
});

describe("generateFixPartnersRound", () => {
  const samplePairs: Pair[] = [
    ["p1", "p2"],
    ["p3", "p4"],
    ["p5", "p6"],
    ["p7", "p8"],
  ];

  it("throws kalau <2 pair", () => {
    expect(() =>
      generateFixPartnersRound([], 2, new Map(), 0)
    ).toThrow(/minimal 2 pair/i);
    expect(() =>
      generateFixPartnersRound([["p1", "p2"]], 2, new Map(), 0)
    ).toThrow();
  });

  it("4 pairs 2 courts round 0: 2 match, no sit-out", () => {
    const r = generateFixPartnersRound(samplePairs, 2, new Map(), 0);
    expect(r.matches).toHaveLength(2);
    expect(r.sitOuts).toEqual([]);
  });

  it("4 pairs 1 court round 0: 1 match + 2 pair sit-out", () => {
    const r = generateFixPartnersRound(samplePairs, 1, new Map(), 0);
    expect(r.matches).toHaveLength(1);
    expect(r.sitOuts).toHaveLength(4); // 2 pairs × 2 players
  });

  it("court number numbered sequentially", () => {
    const r = generateFixPartnersRound(samplePairs, 2, new Map(), 0);
    expect(r.matches.map((m) => m.courtNumber)).toEqual([1, 2]);
  });

  it("pairs preserved across rounds (no rotation within pair)", () => {
    const r0 = generateFixPartnersRound(samplePairs, 2, new Map(), 0);
    const r1 = generateFixPartnersRound(samplePairs, 2, new Map(), 1);
    // Each match in r0 + r1 still pairs (p1,p2), (p3,p4), etc.
    for (const m of [...r0.matches, ...r1.matches]) {
      const t1Set = new Set(m.team1);
      const t2Set = new Set(m.team2);
      // team1 dan team2 harus salah satu dari samplePairs
      const isValidPair = samplePairs.some(
        (pair) =>
          (t1Set.has(pair[0]) && t1Set.has(pair[1])) ||
          (t2Set.has(pair[0]) && t2Set.has(pair[1]))
      );
      expect(isValidPair).toBe(true);
    }
  });

  it("opponent rotates across rounds (round robin)", () => {
    const opponents = new Set<string>();
    for (let r = 0; r < 3; r++) {
      const result = generateFixPartnersRound(samplePairs, 2, new Map(), r);
      for (const m of result.matches) {
        opponents.add([...m.team1, ...m.team2].sort().join(","));
      }
    }
    // 4 pairs, 3 rounds → 6 unique matchups (C(4,2))
    expect(opponents.size).toBe(6);
  });

  it("pair history violations counted", () => {
    const history: PairHistory = new Map();
    // p1+p2 sudah pernah bareng
    history.set("p1", new Set(["p2"]));
    history.set("p2", new Set(["p1"]));
    // p3+p4 sudah pernah bareng
    history.set("p3", new Set(["p4"]));
    history.set("p4", new Set(["p3"]));

    const r = generateFixPartnersRound(samplePairs, 1, history, 0);
    // Match 1: (p1,p2) vs (p3,p4) → both pairs in history → 2 violations
    expect(r.violations).toBe(2);
  });
});
