import { describe, expect, it } from "vitest";
import {
  recomputeStats,
  emptyStats,
  diffStats,
} from "@/lib/stats/recompute";
import { SCORING } from "@/lib/constants";
import type { UserMatchOutcome } from "@/lib/stats/advanced";

const o = (outcome: "win" | "loss" | "draw"): UserMatchOutcome => ({
  matchId: `m${Math.random()}`,
  partnerUserId: null,
  opponent1UserId: null,
  opponent2UserId: null,
  outcome,
});

describe("emptyStats", () => {
  it("zeros all fields", () => {
    expect(emptyStats()).toEqual({
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      totalPoints: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
    });
  });
});

describe("recomputeStats", () => {
  it("empty list → emptyStats", () => {
    expect(recomputeStats([])).toEqual(emptyStats());
  });

  it("single win", () => {
    const r = recomputeStats([o("win")]);
    expect(r.totalMatches).toBe(1);
    expect(r.totalWins).toBe(1);
    expect(r.totalPoints).toBe(SCORING.WIN_POINTS);
    expect(r.currentWinStreak).toBe(1);
    expect(r.bestWinStreak).toBe(1);
  });

  it("single loss", () => {
    const r = recomputeStats([o("loss")]);
    expect(r.totalLosses).toBe(1);
    expect(r.totalPoints).toBe(SCORING.LOSS_POINTS);
    expect(r.currentWinStreak).toBe(0);
  });

  it("single draw", () => {
    const r = recomputeStats([o("draw")]);
    expect(r.totalDraws).toBe(1);
    expect(r.totalPoints).toBe(SCORING.DRAW_POINTS);
    expect(r.currentWinStreak).toBe(0);
  });

  it("streak accumulates then resets on loss", () => {
    const r = recomputeStats([
      o("win"),
      o("win"),
      o("win"),
      o("loss"),
      o("win"),
    ]);
    expect(r.totalWins).toBe(4);
    expect(r.totalLosses).toBe(1);
    expect(r.bestWinStreak).toBe(3);
    expect(r.currentWinStreak).toBe(1);
  });

  it("draw resets streak", () => {
    const r = recomputeStats([o("win"), o("win"), o("draw"), o("win")]);
    expect(r.bestWinStreak).toBe(2);
    expect(r.currentWinStreak).toBe(1);
  });

  it("best streak persists when current resets", () => {
    const r = recomputeStats([
      o("win"),
      o("win"),
      o("win"),
      o("win"),
      o("loss"),
    ]);
    expect(r.bestWinStreak).toBe(4);
    expect(r.currentWinStreak).toBe(0);
  });

  it("totalMatches = wins + losses + draws", () => {
    const r = recomputeStats([o("win"), o("loss"), o("draw")]);
    expect(r.totalMatches).toBe(3);
    expect(r.totalWins + r.totalLosses + r.totalDraws).toBe(3);
  });

  it("points sum uses SCORING constants", () => {
    const r = recomputeStats([
      o("win"), // +W
      o("loss"), // +L
      o("draw"), // +D
    ]);
    expect(r.totalPoints).toBe(
      SCORING.WIN_POINTS + SCORING.LOSS_POINTS + SCORING.DRAW_POINTS
    );
  });

  it("long mixed sequence", () => {
    const seq: ("win" | "loss" | "draw")[] = [
      "win",
      "win",
      "loss",
      "win",
      "win",
      "win",
      "win",
      "win",
      "draw",
      "win",
    ];
    const r = recomputeStats(seq.map(o));
    expect(r.totalMatches).toBe(10);
    expect(r.totalWins).toBe(8);
    expect(r.totalLosses).toBe(1);
    expect(r.totalDraws).toBe(1);
    expect(r.bestWinStreak).toBe(5);
    expect(r.currentWinStreak).toBe(1);
  });
});

describe("diffStats", () => {
  it("identical → empty", () => {
    const a = recomputeStats([o("win")]);
    const b = recomputeStats([o("win")]);
    expect(diffStats(a, b)).toEqual([]);
  });

  it("surfaces changed fields only", () => {
    const before = emptyStats();
    const after = recomputeStats([o("win"), o("win")]);
    const d = diffStats(before, after);
    const fields = d.map((e) => e.field);
    expect(fields).toContain("totalMatches");
    expect(fields).toContain("totalWins");
    expect(fields).toContain("totalPoints");
    expect(fields).toContain("currentWinStreak");
    expect(fields).toContain("bestWinStreak");
    expect(fields).not.toContain("totalLosses");
    expect(fields).not.toContain("totalDraws");
  });

  it("before/after values captured correctly", () => {
    const a = { ...emptyStats(), totalWins: 5 };
    const b = { ...emptyStats(), totalWins: 10 };
    const d = diffStats(a, b);
    expect(d).toContainEqual({
      field: "totalWins",
      before: 5,
      after: 10,
    });
  });
});
