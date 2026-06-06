import { describe, expect, it } from "vitest";
import {
  aggregatePartnerStats,
  aggregateOpponentStats,
  topPartners,
  topNemesis,
  summarizeOutcomes,
  type UserMatchOutcome,
} from "@/lib/stats/advanced";

const o = (
  matchId: string,
  partner: string | null,
  opp1: string | null,
  opp2: string | null,
  outcome: "win" | "loss" | "draw"
): UserMatchOutcome => ({
  matchId,
  partnerUserId: partner,
  opponent1UserId: opp1,
  opponent2UserId: opp2,
  outcome,
});

describe("aggregatePartnerStats", () => {
  it("empty", () => {
    expect(aggregatePartnerStats([])).toEqual([]);
  });

  it("groups by partner userId, computes W/L/D + rate", () => {
    const outcomes = [
      o("m1", "P1", "X", "Y", "win"),
      o("m2", "P1", "X", "Y", "loss"),
      o("m3", "P1", "X", "Y", "draw"),
      o("m4", "P2", "X", "Y", "win"),
    ];
    const agg = aggregatePartnerStats(outcomes);
    const p1 = agg.find((a) => a.userId === "P1")!;
    expect(p1).toMatchObject({
      played: 3,
      won: 1,
      lost: 1,
      drew: 1,
    });
    expect(p1.winRate).toBeCloseTo(1 / 3, 3);
    const p2 = agg.find((a) => a.userId === "P2")!;
    expect(p2).toMatchObject({ played: 1, won: 1, lost: 0, drew: 0 });
    expect(p2.winRate).toBe(1);
  });

  it("guest partner (null) excluded", () => {
    const outcomes = [
      o("m1", null, "X", "Y", "win"),
      o("m2", "P1", "X", "Y", "win"),
    ];
    const agg = aggregatePartnerStats(outcomes);
    expect(agg).toHaveLength(1);
    expect(agg[0].userId).toBe("P1");
  });

  it("winRate=0 for all-loss partner", () => {
    const outcomes = [
      o("m1", "P1", "X", "Y", "loss"),
      o("m2", "P1", "X", "Y", "loss"),
    ];
    const [p] = aggregatePartnerStats(outcomes);
    expect(p.winRate).toBe(0);
    expect(p.lost).toBe(2);
  });
});

describe("aggregateOpponentStats", () => {
  it("empty", () => {
    expect(aggregateOpponentStats([])).toEqual([]);
  });

  it("counts each opponent separately per match", () => {
    const outcomes = [
      o("m1", "P1", "O1", "O2", "win"),
      o("m2", "P1", "O1", "O3", "loss"),
    ];
    const agg = aggregateOpponentStats(outcomes);
    const o1 = agg.find((a) => a.userId === "O1")!;
    expect(o1.played).toBe(2);
    expect(o1.won).toBe(1);
    expect(o1.lost).toBe(1);
    const o2 = agg.find((a) => a.userId === "O2")!;
    expect(o2.played).toBe(1);
    expect(o2.won).toBe(1);
    const o3 = agg.find((a) => a.userId === "O3")!;
    expect(o3.lost).toBe(1);
  });

  it("guest opponents (null) excluded individually", () => {
    const outcomes = [o("m1", "P1", null, "O2", "win")];
    const agg = aggregateOpponentStats(outcomes);
    expect(agg).toHaveLength(1);
    expect(agg[0].userId).toBe("O2");
  });

  it("draw outcome", () => {
    const outcomes = [o("m1", "P1", "O1", "O2", "draw")];
    const agg = aggregateOpponentStats(outcomes);
    expect(agg[0].drew).toBe(1);
    expect(agg[0].won).toBe(0);
    expect(agg[0].lost).toBe(0);
  });
});

describe("topPartners", () => {
  it("filters minPlayed", () => {
    const list = [
      { userId: "A", played: 2, won: 2, lost: 0, drew: 0, winRate: 1 },
      { userId: "B", played: 5, won: 3, lost: 2, drew: 0, winRate: 0.6 },
    ];
    const top = topPartners(list, 5, 3);
    expect(top.map((t) => t.userId)).toEqual(["B"]);
  });

  it("orders by winRate desc, then won desc, then userId asc", () => {
    const list = [
      { userId: "C", played: 10, won: 6, lost: 4, drew: 0, winRate: 0.6 },
      { userId: "B", played: 10, won: 7, lost: 3, drew: 0, winRate: 0.7 },
      { userId: "A", played: 10, won: 7, lost: 3, drew: 0, winRate: 0.7 },
      { userId: "D", played: 5, won: 5, lost: 0, drew: 0, winRate: 1 },
    ];
    const top = topPartners(list, 4, 3);
    expect(top.map((t) => t.userId)).toEqual(["D", "A", "B", "C"]);
  });

  it("returns at most k", () => {
    const list = Array.from({ length: 10 }, (_, i) => ({
      userId: `U${i}`,
      played: 5,
      won: 5 - i,
      lost: i,
      drew: 0,
      winRate: (5 - i) / 5,
    }));
    expect(topPartners(list, 3, 3)).toHaveLength(3);
  });

  it("default minPlayed=3", () => {
    const list = [
      { userId: "A", played: 2, won: 2, lost: 0, drew: 0, winRate: 1 },
    ];
    expect(topPartners(list, 5)).toEqual([]);
  });

  it("won tiebreak fires when winRate equal", () => {
    const list = [
      { userId: "A", played: 4, won: 2, lost: 2, drew: 0, winRate: 0.5 },
      { userId: "B", played: 10, won: 5, lost: 5, drew: 0, winRate: 0.5 },
    ];
    expect(topPartners(list, 2, 3).map((t) => t.userId)).toEqual(["B", "A"]);
  });
});

describe("topNemesis", () => {
  it("orders by lossRate desc", () => {
    const list = [
      { userId: "A", played: 5, won: 1, lost: 4, drew: 0, winRate: 0.2 },
      { userId: "B", played: 5, won: 3, lost: 2, drew: 0, winRate: 0.6 },
      { userId: "C", played: 5, won: 0, lost: 5, drew: 0, winRate: 0 },
    ];
    const nemesis = topNemesis(list, 3, 3);
    expect(nemesis.map((n) => n.userId)).toEqual(["C", "A", "B"]);
  });

  it("filters minPlayed", () => {
    const list = [
      { userId: "A", played: 2, won: 0, lost: 2, drew: 0, winRate: 0 },
      { userId: "B", played: 4, won: 1, lost: 3, drew: 0, winRate: 0.25 },
    ];
    expect(topNemesis(list, 5, 3).map((n) => n.userId)).toEqual(["B"]);
  });

  it("lost tiebreak fires when lossRate equal", () => {
    const list = [
      { userId: "B", played: 10, won: 5, lost: 5, drew: 0, winRate: 0.5 },
      { userId: "A", played: 4, won: 2, lost: 2, drew: 0, winRate: 0.5 },
    ];
    expect(topNemesis(list, 2, 3).map((n) => n.userId)).toEqual(["B", "A"]);
  });

  it("userId tiebreak when lossRate + lost equal", () => {
    const list = [
      { userId: "B", played: 4, won: 0, lost: 4, drew: 0, winRate: 0 },
      { userId: "A", played: 4, won: 0, lost: 4, drew: 0, winRate: 0 },
    ];
    expect(topNemesis(list, 2, 3).map((n) => n.userId)).toEqual(["A", "B"]);
  });

  it("default minPlayed=3", () => {
    const list = [
      { userId: "A", played: 2, won: 0, lost: 2, drew: 0, winRate: 0 },
    ];
    expect(topNemesis(list, 5)).toEqual([]);
  });

  it("empty list", () => {
    expect(topNemesis([], 5, 3)).toEqual([]);
  });

  it("minPlayed=0 clamped to 1 (excludes played=0 entries)", () => {
    const list = [
      { userId: "A", played: 0, won: 0, lost: 0, drew: 0, winRate: 0 },
      { userId: "B", played: 2, won: 0, lost: 2, drew: 0, winRate: 0 },
    ];
    const r = topNemesis(list, 5, 0);
    expect(r.map((x) => x.userId)).toEqual(["B"]);
  });
});

describe("topPartners minPlayed clamp", () => {
  it("minPlayed=0 clamped to 1", () => {
    const list = [
      { userId: "A", played: 0, won: 0, lost: 0, drew: 0, winRate: 0 },
      { userId: "B", played: 2, won: 2, lost: 0, drew: 0, winRate: 1 },
    ];
    const r = topPartners(list, 5, 0);
    expect(r.map((x) => x.userId)).toEqual(["B"]);
  });
});

describe("summarizeOutcomes", () => {
  it("empty list", () => {
    expect(summarizeOutcomes([])).toEqual({
      played: 0,
      won: 0,
      lost: 0,
      drew: 0,
      winRate: 0,
    });
  });

  it("counts each outcome", () => {
    const outcomes = [
      o("m1", "P1", "X", "Y", "win"),
      o("m2", "P1", "X", "Y", "win"),
      o("m3", "P1", "X", "Y", "loss"),
      o("m4", "P1", "X", "Y", "draw"),
    ];
    const s = summarizeOutcomes(outcomes);
    expect(s).toEqual({
      played: 4,
      won: 2,
      lost: 1,
      drew: 1,
      winRate: 0.5,
    });
  });
});
