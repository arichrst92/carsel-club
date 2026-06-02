/**
 * Tests untuk lib/match/stats-helpers.ts
 *
 * Refs:
 * - Flow: docs/CarselClubBackend/STATE_MACHINES.md §3 (Stats Sync Algorithm)
 * - Flow: docs/PADEL_APP_KONSEP.md §4.1 (Scoring: W=3, D=2, L=1)
 * - Flow: docs/PADEL_APP_KONSEP.md §5 (Tier thresholds — Rookie→Master)
 * - DB:   lib/db/schema.ts (users.totalPoints/totalMatches/currentTierId)
 */

import { describe, it, expect } from "vitest";
import {
  computeImpact,
  computeDelta,
  isZeroDelta,
  computeTierId,
  type TeamImpact,
} from "@/lib/match/stats-helpers";
import { SCORING, TIERS } from "@/lib/constants";

describe("computeImpact", () => {
  it("team1 menang saat t1 > t2 (W=3, L=1)", () => {
    const r = computeImpact(21, 18);
    expect(r.team1).toEqual({ points: SCORING.WIN_POINTS, outcome: "win" });
    expect(r.team2).toEqual({ points: SCORING.LOSS_POINTS, outcome: "loss" });
  });

  it("team2 menang saat t2 > t1", () => {
    const r = computeImpact(15, 21);
    expect(r.team1).toEqual({ points: SCORING.LOSS_POINTS, outcome: "loss" });
    expect(r.team2).toEqual({ points: SCORING.WIN_POINTS, outcome: "win" });
  });

  it("draw saat t1 == t2 (kedua tim D=2)", () => {
    const r = computeImpact(10, 10);
    expect(r.team1).toEqual({ points: SCORING.DRAW_POINTS, outcome: "draw" });
    expect(r.team2).toEqual({ points: SCORING.DRAW_POINTS, outcome: "draw" });
  });

  it("draw 0-0 valid (edge case)", () => {
    const r = computeImpact(0, 0);
    expect(r.team1.outcome).toBe("draw");
    expect(r.team2.outcome).toBe("draw");
  });

  it("selisih 1 poin tetap dihitung win/loss", () => {
    const r = computeImpact(11, 10);
    expect(r.team1.outcome).toBe("win");
    expect(r.team2.outcome).toBe("loss");
  });
});

describe("computeDelta", () => {
  const win: TeamImpact = { points: 3, outcome: "win" };
  const loss: TeamImpact = { points: 1, outcome: "loss" };
  const draw: TeamImpact = { points: 2, outcome: "draw" };

  it("oldImpact null + newImpact null = no-op", () => {
    const d = computeDelta(null, null);
    expect(d).toEqual({
      pointsDelta: 0,
      matchesDelta: 0,
      winsDelta: 0,
      lossesDelta: 0,
      drawsDelta: 0,
    });
  });

  it("apply pertama kali (live→completed win): +3 pts, +1 match, +1 win", () => {
    const d = computeDelta(null, win);
    expect(d).toEqual({
      pointsDelta: 3,
      matchesDelta: 1,
      winsDelta: 1,
      lossesDelta: 0,
      drawsDelta: 0,
    });
  });

  it("apply loss: +1 pts, +1 match, +1 loss", () => {
    const d = computeDelta(null, loss);
    expect(d).toEqual({
      pointsDelta: 1,
      matchesDelta: 1,
      winsDelta: 0,
      lossesDelta: 1,
      drawsDelta: 0,
    });
  });

  it("apply draw: +2 pts, +1 match, +1 draw", () => {
    const d = computeDelta(null, draw);
    expect(d).toEqual({
      pointsDelta: 2,
      matchesDelta: 1,
      winsDelta: 0,
      lossesDelta: 0,
      drawsDelta: 1,
    });
  });

  it("reverse (completed→live, was win): -3 pts, -1 match, -1 win", () => {
    const d = computeDelta(win, null);
    expect(d).toEqual({
      pointsDelta: -3,
      matchesDelta: -1,
      winsDelta: -1,
      lossesDelta: 0,
      drawsDelta: 0,
    });
  });

  it("edit completed win → loss: net change in outcome only (matches stays)", () => {
    const d = computeDelta(win, loss);
    expect(d).toEqual({
      pointsDelta: -2, // 1 - 3
      matchesDelta: 0,
      winsDelta: -1,
      lossesDelta: 1,
      drawsDelta: 0,
    });
  });

  it("edit completed win → draw", () => {
    const d = computeDelta(win, draw);
    expect(d).toEqual({
      pointsDelta: -1, // 2 - 3
      matchesDelta: 0,
      winsDelta: -1,
      lossesDelta: 0,
      drawsDelta: 1,
    });
  });

  it("edit completed loss → win (reversal)", () => {
    const d = computeDelta(loss, win);
    expect(d).toEqual({
      pointsDelta: 2, // 3 - 1
      matchesDelta: 0,
      winsDelta: 1,
      lossesDelta: -1,
      drawsDelta: 0,
    });
  });

  it("edit completed draw → draw (same outcome, no delta)", () => {
    const d = computeDelta(draw, draw);
    expect(d).toEqual({
      pointsDelta: 0,
      matchesDelta: 0,
      winsDelta: 0,
      lossesDelta: 0,
      drawsDelta: 0,
    });
  });
});

describe("isZeroDelta", () => {
  it("returns true untuk all-zero delta", () => {
    expect(
      isZeroDelta({
        pointsDelta: 0,
        matchesDelta: 0,
        winsDelta: 0,
        lossesDelta: 0,
        drawsDelta: 0,
      })
    ).toBe(true);
  });

  it("returns false kalau ada pointsDelta non-zero", () => {
    expect(
      isZeroDelta({
        pointsDelta: 1,
        matchesDelta: 0,
        winsDelta: 0,
        lossesDelta: 0,
        drawsDelta: 0,
      })
    ).toBe(false);
  });

  it("returns false kalau ada matchesDelta non-zero", () => {
    expect(
      isZeroDelta({
        pointsDelta: 0,
        matchesDelta: 1,
        winsDelta: 0,
        lossesDelta: 0,
        drawsDelta: 0,
      })
    ).toBe(false);
  });

  it("returns false kalau ada winsDelta non-zero", () => {
    expect(
      isZeroDelta({
        pointsDelta: 0,
        matchesDelta: 0,
        winsDelta: 1,
        lossesDelta: 0,
        drawsDelta: 0,
      })
    ).toBe(false);
  });

  it("returns false kalau ada lossesDelta non-zero", () => {
    expect(
      isZeroDelta({
        pointsDelta: 0,
        matchesDelta: 0,
        winsDelta: 0,
        lossesDelta: 1,
        drawsDelta: 0,
      })
    ).toBe(false);
  });

  it("returns false kalau ada drawsDelta non-zero", () => {
    expect(
      isZeroDelta({
        pointsDelta: 0,
        matchesDelta: 0,
        winsDelta: 0,
        lossesDelta: 0,
        drawsDelta: 1,
      })
    ).toBe(false);
  });

  it("returns false untuk negative deltas (reverse case)", () => {
    expect(
      isZeroDelta({
        pointsDelta: -3,
        matchesDelta: -1,
        winsDelta: -1,
        lossesDelta: 0,
        drawsDelta: 0,
      })
    ).toBe(false);
  });
});

describe("computeTierId", () => {
  const ROOKIE = TIERS[0]; // id=1
  const BRONZE = TIERS[1]; // id=2
  const SILVER = TIERS[2]; // id=3
  const GOLD = TIERS[3]; // id=4
  const PLATINUM = TIERS[4]; // id=5
  const MASTER = TIERS[5]; // id=6

  it("zero stats → Rookie", () => {
    expect(computeTierId(0, 0)).toBe(ROOKIE.id);
  });

  it("memenuhi Bronze threshold (50 pts + 10 matches)", () => {
    expect(computeTierId(BRONZE.minPoints, BRONZE.minMatches)).toBe(BRONZE.id);
  });

  it("cukup poin tapi kurang match → tetap tier sebelumnya", () => {
    expect(computeTierId(BRONZE.minPoints, BRONZE.minMatches - 1)).toBe(
      ROOKIE.id
    );
  });

  it("cukup match tapi kurang poin → tetap tier sebelumnya", () => {
    expect(computeTierId(BRONZE.minPoints - 1, BRONZE.minMatches)).toBe(
      ROOKIE.id
    );
  });

  it("Silver threshold", () => {
    expect(computeTierId(SILVER.minPoints, SILVER.minMatches)).toBe(SILVER.id);
  });

  it("Gold threshold", () => {
    expect(computeTierId(GOLD.minPoints, GOLD.minMatches)).toBe(GOLD.id);
  });

  it("Platinum threshold", () => {
    expect(computeTierId(PLATINUM.minPoints, PLATINUM.minMatches)).toBe(
      PLATINUM.id
    );
  });

  it("Master threshold", () => {
    expect(computeTierId(MASTER.minPoints, MASTER.minMatches)).toBe(MASTER.id);
  });

  it("way above Master tetap Master (tier tertinggi)", () => {
    expect(computeTierId(99999, 99999)).toBe(MASTER.id);
  });

  it("intermediate stats (between Bronze and Silver) → Bronze", () => {
    expect(
      computeTierId(
        Math.floor((BRONZE.minPoints + SILVER.minPoints) / 2),
        Math.floor((BRONZE.minMatches + SILVER.minMatches) / 2)
      )
    ).toBe(BRONZE.id);
  });

  it("pragmatic downgrade — edit decrease bisa turunin tier (per STATE_MACHINES §4)", () => {
    // User was Silver, edit decrease stats to below Bronze
    expect(computeTierId(10, 5)).toBe(ROOKIE.id);
  });
});
