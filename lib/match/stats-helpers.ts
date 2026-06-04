/**
 * Pure helpers untuk match stats sync.
 *
 * Diekstrak dari stats-sync.ts supaya bisa di-unit-test tanpa DB.
 * Lihat: docs/CarselClubBackend/STATE_MACHINES.md §3 (Stats Sync Algorithm)
 * Lihat: docs/PADEL_APP_KONSEP.md §4.1 (Scoring rules W3/D2/L1)
 */

import { SCORING, TIERS } from "@/lib/constants";

export type Outcome = "win" | "loss" | "draw";

export type TeamImpact = {
  points: number;
  outcome: Outcome;
};

// Re-export Outcome label di helper untuk consistency (avoid drift)
// — sumber labels: lib/match/detail-helpers.ts

export type StatsDelta = {
  pointsDelta: number;
  matchesDelta: number;
  winsDelta: number;
  lossesDelta: number;
  drawsDelta: number;
};

/**
 * Compute per-team impact dari match score.
 * - t1 > t2 → team1 win (+W pts), team2 loss (+L pts)
 * - t2 > t1 → kebalik
 * - t1 == t2 → draw (+D pts both)
 */
export function computeImpact(
  t1: number,
  t2: number
): { team1: TeamImpact; team2: TeamImpact } {
  if (t1 > t2) {
    return {
      team1: { points: SCORING.WIN_POINTS, outcome: "win" },
      team2: { points: SCORING.LOSS_POINTS, outcome: "loss" },
    };
  }
  if (t2 > t1) {
    return {
      team1: { points: SCORING.LOSS_POINTS, outcome: "loss" },
      team2: { points: SCORING.WIN_POINTS, outcome: "win" },
    };
  }
  return {
    team1: { points: SCORING.DRAW_POINTS, outcome: "draw" },
    team2: { points: SCORING.DRAW_POINTS, outcome: "draw" },
  };
}

/**
 * Compute stats delta from old impact → new impact.
 * - oldImpact null = match belum completed (no stats applied yet)
 * - newImpact null = match akan keluar dari completed (reverse)
 * - Both set = edit completed (delta math)
 */
export function computeDelta(
  oldImpact: TeamImpact | null,
  newImpact: TeamImpact | null
): StatsDelta {
  const old = {
    points: oldImpact?.points ?? 0,
    counted: oldImpact !== null,
    win: oldImpact?.outcome === "win" ? 1 : 0,
    loss: oldImpact?.outcome === "loss" ? 1 : 0,
    draw: oldImpact?.outcome === "draw" ? 1 : 0,
  };
  const next = {
    points: newImpact?.points ?? 0,
    counted: newImpact !== null,
    win: newImpact?.outcome === "win" ? 1 : 0,
    loss: newImpact?.outcome === "loss" ? 1 : 0,
    draw: newImpact?.outcome === "draw" ? 1 : 0,
  };
  return {
    pointsDelta: next.points - old.points,
    matchesDelta: (next.counted ? 1 : 0) - (old.counted ? 1 : 0),
    winsDelta: next.win - old.win,
    lossesDelta: next.loss - old.loss,
    drawsDelta: next.draw - old.draw,
  };
}

/**
 * Apakah delta semua zero (no-op)? Pakai untuk skip DB write.
 */
export function isZeroDelta(d: StatsDelta): boolean {
  return (
    d.pointsDelta === 0 &&
    d.matchesDelta === 0 &&
    d.winsDelta === 0 &&
    d.lossesDelta === 0 &&
    d.drawsDelta === 0
  );
}

/**
 * Compute user's tier ID dari lifetime stats.
 * Pick tier tertinggi yang memenuhi BOTH minPoints AND minMatches.
 * Default fallback ke tier paling rendah (Rookie, ID=1).
 *
 * Lihat: docs/PADEL_APP_KONSEP.md §5 (tier system, no relegation tapi
 * pragmatic edit can decrease tier — see STATE_MACHINES.md §4).
 */
export function computeTierId(
  totalPoints: number,
  totalMatches: number
): number {
  // TIERS di-declare `as const` → TIERS[0].id literal type `1`. Annotate
  // sebagai `number` supaya assignment dari tier.id (union literal) valid.
  let highest: number = TIERS[0].id;
  for (const tier of TIERS) {
    if (totalPoints >= tier.minPoints && totalMatches >= tier.minMatches) {
      highest = tier.id;
    }
  }
  return highest;
}
