/**
 * Tests untuk lib/match/detail-helpers.ts
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §4.1 (scoring)
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 5
 */

import { describe, it, expect } from "vitest";
import {
  computePlayerStats,
  team1Won,
  team2Won,
  isDraw,
  OUTCOME_LABEL,
  OUTCOME_EMOJI,
  OUTCOME_COLOR,
  OUTCOME_BG,
} from "@/lib/match/detail-helpers";
import { SCORING } from "@/lib/constants";

describe("computePlayerStats", () => {
  it("team1 wins (21-18): team1 player → win +3", () => {
    const r = computePlayerStats(21, 18, "team1");
    expect(r).toEqual({ outcome: "win", pointsEarned: SCORING.WIN_POINTS });
  });

  it("team1 wins: team2 player → loss +1", () => {
    const r = computePlayerStats(21, 18, "team2");
    expect(r).toEqual({ outcome: "loss", pointsEarned: SCORING.LOSS_POINTS });
  });

  it("team2 wins (15-21): team1 player → loss +1", () => {
    const r = computePlayerStats(15, 21, "team1");
    expect(r.outcome).toBe("loss");
    expect(r.pointsEarned).toBe(SCORING.LOSS_POINTS);
  });

  it("team2 wins: team2 player → win +3", () => {
    const r = computePlayerStats(15, 21, "team2");
    expect(r.outcome).toBe("win");
    expect(r.pointsEarned).toBe(SCORING.WIN_POINTS);
  });

  it("draw (10-10): kedua side → draw +2", () => {
    expect(computePlayerStats(10, 10, "team1")).toEqual({
      outcome: "draw",
      pointsEarned: SCORING.DRAW_POINTS,
    });
    expect(computePlayerStats(10, 10, "team2")).toEqual({
      outcome: "draw",
      pointsEarned: SCORING.DRAW_POINTS,
    });
  });

  it("0-0 draw edge", () => {
    expect(computePlayerStats(0, 0, "team1").outcome).toBe("draw");
  });
});

describe("team1Won / team2Won / isDraw", () => {
  it("team1Won true when t1 > t2", () => {
    expect(team1Won(21, 18)).toBe(true);
    expect(team1Won(18, 21)).toBe(false);
    expect(team1Won(10, 10)).toBe(false);
  });

  it("team2Won true when t2 > t1", () => {
    expect(team2Won(18, 21)).toBe(true);
    expect(team2Won(21, 18)).toBe(false);
    expect(team2Won(10, 10)).toBe(false);
  });

  it("isDraw true when equal", () => {
    expect(isDraw(10, 10)).toBe(true);
    expect(isDraw(0, 0)).toBe(true);
    expect(isDraw(10, 11)).toBe(false);
  });
});

describe("UI mappings", () => {
  it("OUTCOME_LABEL coverage", () => {
    expect(OUTCOME_LABEL.win).toBeTruthy();
    expect(OUTCOME_LABEL.loss).toBeTruthy();
    expect(OUTCOME_LABEL.draw).toBeTruthy();
  });

  it("OUTCOME_EMOJI coverage", () => {
    expect(OUTCOME_EMOJI.win).toBeTruthy();
    expect(OUTCOME_EMOJI.loss).toBeTruthy();
    expect(OUTCOME_EMOJI.draw).toBeTruthy();
  });

  it("OUTCOME_COLOR coverage", () => {
    expect(OUTCOME_COLOR.win).toBeTruthy();
    expect(OUTCOME_COLOR.loss).toBeTruthy();
    expect(OUTCOME_COLOR.draw).toBeTruthy();
  });

  it("OUTCOME_BG coverage", () => {
    expect(OUTCOME_BG.win).toBeTruthy();
    expect(OUTCOME_BG.loss).toBeTruthy();
    expect(OUTCOME_BG.draw).toBeTruthy();
  });
});
