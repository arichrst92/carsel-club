import { describe, expect, it } from "vitest";
import {
  computeWinRate,
  getSortValue,
  sortAndRank,
  findEntry,
  topClimbers,
  distinctCities,
  WINRATE_MIN_MATCHES,
} from "@/lib/leaderboard/sort";
import type { LeaderboardEntry } from "@/lib/leaderboard/types";

const make = (
  id: string,
  overrides: Partial<LeaderboardEntry> = {}
): LeaderboardEntry => ({
  id,
  displayName: id.toUpperCase(),
  city: null,
  avatarUrl: null,
  tierName: null,
  tierColor: null,
  totalPoints: 0,
  totalMatches: 0,
  totalWins: 0,
  totalLosses: 0,
  totalDraws: 0,
  winRate: 0,
  ...overrides,
});

describe("computeWinRate", () => {
  it("zero matches → 0", () => {
    expect(computeWinRate(0, 0)).toBe(0);
    expect(computeWinRate(5, 0)).toBe(0);
  });

  it("normal ratio", () => {
    expect(computeWinRate(3, 4)).toBe(75);
    expect(computeWinRate(1, 1)).toBe(100);
  });

  it("negative matches treated as 0", () => {
    expect(computeWinRate(0, -1)).toBe(0);
  });
});

describe("getSortValue", () => {
  it("point", () => {
    expect(getSortValue(make("a", { totalPoints: 123 }), "point")).toBe(123);
  });

  it("match", () => {
    expect(getSortValue(make("a", { totalMatches: 42 }), "match")).toBe(42);
  });

  it("winrate requires min matches", () => {
    const high = make("a", {
      totalMatches: 1,
      totalWins: 1,
      winRate: 100,
    });
    expect(getSortValue(high, "winrate")).toBe(-1);
    const ok = make("b", {
      totalMatches: WINRATE_MIN_MATCHES,
      totalWins: 4,
      winRate: 80,
    });
    expect(getSortValue(ok, "winrate")).toBe(80);
  });
});

describe("sortAndRank", () => {
  it("empty list", () => {
    expect(sortAndRank([], "point")).toEqual([]);
  });

  it("sorts by points desc, assigns sequential ranks", () => {
    const list = [
      make("a", { totalPoints: 10 }),
      make("c", { totalPoints: 30 }),
      make("b", { totalPoints: 20 }),
    ];
    const r = sortAndRank(list, "point");
    expect(r.map((x) => [x.id, x.rank])).toEqual([
      ["c", 1],
      ["b", 2],
      ["a", 3],
    ]);
  });

  it("stable tiebreak by id asc", () => {
    const list = [
      make("z", { totalPoints: 100 }),
      make("a", { totalPoints: 100 }),
      make("m", { totalPoints: 100 }),
    ];
    const r = sortAndRank(list, "point");
    expect(r.map((x) => x.id)).toEqual(["a", "m", "z"]);
  });

  it("winrate sort respects min matches", () => {
    const list = [
      make("a", {
        totalPoints: 1,
        totalMatches: 1,
        totalWins: 1,
        winRate: 100,
      }),
      make("b", {
        totalPoints: 2,
        totalMatches: 10,
        totalWins: 6,
        winRate: 60,
      }),
    ];
    const r = sortAndRank(list, "winrate");
    expect(r[0].id).toBe("b");
    expect(r[1].id).toBe("a");
  });

  it("returns cloned entries (no mutation)", () => {
    const list = [make("a", { totalPoints: 10 })];
    const r = sortAndRank(list, "point");
    expect(r[0]).not.toBe(list[0]);
  });
});

describe("findEntry", () => {
  it("found", () => {
    const r = sortAndRank([make("a"), make("b", { totalPoints: 10 })], "point");
    expect(findEntry(r, "a")?.id).toBe("a");
  });

  it("not found", () => {
    expect(findEntry([], "x")).toBeNull();
  });
});

describe("topClimbers", () => {
  const e = (id: string, rank: number) =>
    ({ ...make(id), rank }) as ReturnType<typeof sortAndRank>[number];

  it("empty inputs", () => {
    expect(topClimbers([], [], 5)).toEqual([]);
  });

  it("ignores users only in current snapshot", () => {
    const current = [e("a", 1)];
    const prior: ReturnType<typeof sortAndRank> = [];
    expect(topClimbers(current, prior, 5)).toEqual([]);
  });

  it("computes positive delta = climbed up", () => {
    const current = [e("a", 1), e("b", 5)];
    const prior = [e("a", 10), e("b", 6)];
    const r = topClimbers(current, prior, 5, 1);
    expect(r.map((x) => [x.id, x.rankDelta])).toEqual([
      ["a", 9],
      ["b", 1],
    ]);
  });

  it("filters by minDelta", () => {
    const current = [e("a", 1)];
    const prior = [e("a", 3)];
    expect(topClimbers(current, prior, 5, 5)).toEqual([]);
    expect(topClimbers(current, prior, 5, 2)[0].id).toBe("a");
  });

  it("ignores negative delta (dropped users)", () => {
    const current = [e("a", 10)];
    const prior = [e("a", 1)];
    expect(topClimbers(current, prior, 5, 1)).toEqual([]);
  });

  it("ties on delta → currentRank ascending", () => {
    const current = [e("a", 2), e("b", 5)];
    const prior = [e("a", 12), e("b", 15)];
    const r = topClimbers(current, prior, 5, 1);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("limits to k", () => {
    const current = Array.from({ length: 10 }, (_, i) => e(`u${i}`, i + 1));
    const prior = current.map((c) => ({ ...c, rank: c.rank + 20 }));
    expect(topClimbers(current, prior, 3, 1)).toHaveLength(3);
  });
});

describe("distinctCities", () => {
  it("returns sorted unique non-null cities", () => {
    const list = [
      make("a", { city: "Bandung" }),
      make("b", { city: "Jakarta" }),
      make("c", { city: null }),
      make("d", { city: "Jakarta" }),
      make("e", { city: "Surabaya" }),
    ];
    expect(distinctCities(list)).toEqual(["Bandung", "Jakarta", "Surabaya"]);
  });

  it("empty", () => {
    expect(distinctCities([])).toEqual([]);
  });

  it("all null", () => {
    expect(distinctCities([make("a"), make("b")])).toEqual([]);
  });
});
