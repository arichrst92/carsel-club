/**
 * Tests untuk lib/match/generator.ts
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §3 (Match Generation, sit-out rotation fairness)
 * - Flow: docs/PADEL_APP_KONSEP.md §2.4 (Pemain ganjil — sit-out fair)
 * - GUI:  docs/CarselClubPrototype/generate-match.html (mode auto/manual)
 * - DB:   lib/db/schema.ts (matches.team1P1Id..team2P2Id, distinct_players CHECK)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateRound,
  shuffle,
  recordPair,
  type GeneratorPlayer,
  type PairHistory,
} from "@/lib/match/generator";

function makePlayers(count: number, baseMatches = 0): GeneratorPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    sessionMatches: baseMatches,
  }));
}

function uniquePlayers(team: [string, string], other: [string, string]): boolean {
  const all = [...team, ...other];
  return new Set(all).size === 4;
}

describe("generateRound — input validation", () => {
  it("throws kalau <4 pemain aktif", () => {
    expect(() => generateRound(makePlayers(3), 1, new Map())).toThrow(
      /minimal 4 pemain/i
    );
  });

  it("throws untuk 0 pemain", () => {
    expect(() => generateRound([], 1, new Map())).toThrow();
  });

  it("throws untuk 1 pemain", () => {
    expect(() => generateRound(makePlayers(1), 1, new Map())).toThrow();
  });
});

describe("generateRound — exact 4 pemain, 1 court", () => {
  it("menghasilkan 1 match, no sit-out", () => {
    const r = generateRound(makePlayers(4), 1, new Map());
    expect(r.matches).toHaveLength(1);
    expect(r.sitOuts).toEqual([]);
    expect(r.matches[0].courtNumber).toBe(1);
  });

  it("4 pemain unik di match (no duplicates)", () => {
    const r = generateRound(makePlayers(4), 1, new Map());
    expect(uniquePlayers(r.matches[0].team1, r.matches[0].team2)).toBe(true);
  });
});

describe("generateRound — multi-court", () => {
  it("8 pemain 2 court → 2 match, no sit-out", () => {
    const r = generateRound(makePlayers(8), 2, new Map());
    expect(r.matches).toHaveLength(2);
    expect(r.sitOuts).toEqual([]);
  });

  it("12 pemain 3 court → 3 match", () => {
    const r = generateRound(makePlayers(12), 3, new Map());
    expect(r.matches).toHaveLength(3);
    expect(r.sitOuts).toEqual([]);
  });

  it("court numbers urut 1, 2, 3", () => {
    const r = generateRound(makePlayers(12), 3, new Map());
    expect(r.matches.map((m) => m.courtNumber)).toEqual([1, 2, 3]);
  });

  it("kalau request 3 court tapi cuma cukup 1, batasi ke 1 court", () => {
    const r = generateRound(makePlayers(5), 3, new Map());
    expect(r.matches).toHaveLength(1); // 5 pemain → 1 match (4 playing, 1 sit-out)
    expect(r.sitOuts).toHaveLength(1);
  });
});

describe("generateRound — sit-out fairness", () => {
  it("5 pemain 1 court: pemain dengan sessionMatches tertinggi sit-out duluan", () => {
    const players: GeneratorPlayer[] = [
      { id: "p1", sessionMatches: 5 }, // most matches → sit out
      { id: "p2", sessionMatches: 1 },
      { id: "p3", sessionMatches: 1 },
      { id: "p4", sessionMatches: 1 },
      { id: "p5", sessionMatches: 1 },
    ];
    const r = generateRound(players, 1, new Map());
    expect(r.sitOuts).toEqual(["p1"]);
  });

  it("9 pemain 2 court: pemain teratas sit-out", () => {
    const players: GeneratorPlayer[] = [
      { id: "high1", sessionMatches: 10 },
      ...makePlayers(8).map((p, i) => ({ ...p, id: `low${i}`, sessionMatches: 0 })),
    ];
    const r = generateRound(players, 2, new Map());
    expect(r.matches).toHaveLength(2); // 8 playing
    expect(r.sitOuts).toContain("high1");
    expect(r.sitOuts).toHaveLength(1);
  });

  it("ties di sit-out (semua sessionMatches sama) pakai random tiebreak", () => {
    // Run 50× untuk verify tie distribution tidak deterministic
    const players = makePlayers(5, 1);
    const sitOutCounts = new Map<string, number>();
    for (let i = 0; i < 50; i++) {
      const r = generateRound(players, 1, new Map());
      const sitOut = r.sitOuts[0];
      sitOutCounts.set(sitOut, (sitOutCounts.get(sitOut) ?? 0) + 1);
    }
    // Setidaknya 2 pemain berbeda pernah sit-out (probabilistik: prob ~1 untuk 50 trials)
    expect(sitOutCounts.size).toBeGreaterThanOrEqual(2);
  });
});

describe("generateRound — anti-repeat partner", () => {
  it("zero violations saat history kosong", () => {
    const r = generateRound(makePlayers(4), 1, new Map());
    expect(r.violations).toBe(0);
  });

  it("violations counted saat ada history forced repeat", () => {
    const history: PairHistory = new Map();
    // Record semua pairing yang mungkin di antara 4 pemain
    recordPair(history, "p1", "p2");
    recordPair(history, "p1", "p3");
    recordPair(history, "p1", "p4");
    recordPair(history, "p2", "p3");
    recordPair(history, "p2", "p4");
    recordPair(history, "p3", "p4");
    const r = generateRound(makePlayers(4), 1, history);
    // 4 pemain, semua pasangan sudah pernah → violations ≥ 1
    expect(r.violations).toBeGreaterThanOrEqual(1);
  });

  it("saat ada room, prefer pairing yang belum pernah bareng", () => {
    const history: PairHistory = new Map();
    // p1 sudah pernah bareng p2 (avoid kalau bisa)
    recordPair(history, "p1", "p2");
    // 8 pemain, 2 court — algoritma harus bisa hindari pairing p1+p2 lagi
    const players = makePlayers(8);
    const r = generateRound(players, 2, history);
    expect(r.violations).toBe(0); // banyak pilihan, harus ketemu yg 0
  });
});

describe("generateRound — semua pemain distinct di output", () => {
  it("tidak ada pemain muncul di 2 match dalam 1 round", () => {
    const r = generateRound(makePlayers(12), 3, new Map());
    const allPlayingIds: string[] = [];
    for (const m of r.matches) {
      allPlayingIds.push(...m.team1, ...m.team2);
    }
    expect(new Set(allPlayingIds).size).toBe(allPlayingIds.length);
  });

  it("4 unique players di setiap match (per DB CHECK distinct_players)", () => {
    const r = generateRound(makePlayers(12), 3, new Map());
    for (const m of r.matches) {
      const set = new Set([...m.team1, ...m.team2]);
      expect(set.size).toBe(4);
    }
  });

  it("sit-outs tidak overlap dengan playing", () => {
    const r = generateRound(makePlayers(10), 2, new Map());
    const playingIds = new Set<string>();
    for (const m of r.matches) {
      for (const id of [...m.team1, ...m.team2]) {
        playingIds.add(id);
      }
    }
    for (const sitId of r.sitOuts) {
      expect(playingIds.has(sitId)).toBe(false);
    }
  });
});

describe("shuffle (Fisher-Yates)", () => {
  it("preserve all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(input.length);
    expect(out.sort()).toEqual([...input].sort());
  });

  it("does NOT mutate input", () => {
    const input = [1, 2, 3];
    const inputCopy = [...input];
    shuffle(input);
    expect(input).toEqual(inputCopy);
  });

  it("empty array returns empty", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("single element returns same single element", () => {
    expect(shuffle(["a"])).toEqual(["a"]);
  });

  it("statistically permutes (50× test, multiple unique orderings)", () => {
    const orderings = new Set<string>();
    for (let i = 0; i < 50; i++) {
      orderings.add(shuffle([1, 2, 3, 4]).join(","));
    }
    expect(orderings.size).toBeGreaterThan(1);
  });
});

describe("recordPair", () => {
  it("adds symmetric entry (a→b dan b→a)", () => {
    const history: PairHistory = new Map();
    recordPair(history, "a", "b");
    expect(history.get("a")?.has("b")).toBe(true);
    expect(history.get("b")?.has("a")).toBe(true);
  });

  it("multiple records accumulate", () => {
    const history: PairHistory = new Map();
    recordPair(history, "a", "b");
    recordPair(history, "a", "c");
    expect(history.get("a")?.has("b")).toBe(true);
    expect(history.get("a")?.has("c")).toBe(true);
  });

  it("duplicate record idempotent (Set semantics)", () => {
    const history: PairHistory = new Map();
    recordPair(history, "a", "b");
    recordPair(history, "a", "b");
    expect(history.get("a")?.size).toBe(1);
  });

  it("memulai dari empty map → creates entries on demand", () => {
    const history: PairHistory = new Map();
    expect(history.has("a")).toBe(false);
    recordPair(history, "a", "b");
    expect(history.has("a")).toBe(true);
    expect(history.has("b")).toBe(true);
  });
});

describe("generateRound — deterministic via mocked Math.random", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("output stable dgn Math.random fixed", () => {
    const r1 = generateRound(makePlayers(4), 1, new Map());
    const r2 = generateRound(makePlayers(4), 1, new Map());
    expect(r1.matches[0].team1).toEqual(r2.matches[0].team1);
    expect(r1.matches[0].team2).toEqual(r2.matches[0].team2);
  });
});
