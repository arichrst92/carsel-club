/**
 * Pure helpers untuk stats recompute (Sprint 35).
 *
 * Given list of completed matches dari user's POV (UserMatchOutcome),
 * compute total wins/losses/draws/matches/points + best win streak.
 *
 * Match list MUST be ordered by endedAt ascending untuk streak correctness.
 *
 * Refs:
 * - Types: lib/stats/advanced.ts (UserMatchOutcome)
 * - Used by: app/actions/admin.ts (recomputeUserStatsAction)
 */

import { SCORING } from "@/lib/constants";
import type { UserMatchOutcome } from "./advanced";

export type RecomputedStats = {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalPoints: number;
  currentWinStreak: number;
  bestWinStreak: number;
};

export function emptyStats(): RecomputedStats {
  return {
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    totalPoints: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
  };
}

/**
 * Recompute aggregates dari outcome list (ordered).
 *
 * - totalMatches = outcomes.length
 * - per-outcome points via SCORING constants
 * - streak: win adds 1, anything else resets to 0
 */
export function recomputeStats(
  outcomes: UserMatchOutcome[]
): RecomputedStats {
  const r = emptyStats();
  for (const o of outcomes) {
    r.totalMatches++;
    if (o.outcome === "win") {
      r.totalWins++;
      r.totalPoints += SCORING.WIN_POINTS;
      r.currentWinStreak++;
      if (r.currentWinStreak > r.bestWinStreak) {
        r.bestWinStreak = r.currentWinStreak;
      }
    } else if (o.outcome === "loss") {
      r.totalLosses++;
      r.totalPoints += SCORING.LOSS_POINTS;
      r.currentWinStreak = 0;
    } else {
      r.totalDraws++;
      r.totalPoints += SCORING.DRAW_POINTS;
      r.currentWinStreak = 0;
    }
  }
  return r;
}

/**
 * Diff helper — surface fields yang berubah antara dua stats objects.
 * Useful untuk admin recompute reporting.
 */
export type StatsDiff = {
  field: keyof RecomputedStats;
  before: number;
  after: number;
}[];

export function diffStats(
  before: RecomputedStats,
  after: RecomputedStats
): StatsDiff {
  const out: StatsDiff = [];
  const keys: (keyof RecomputedStats)[] = [
    "totalMatches",
    "totalWins",
    "totalLosses",
    "totalDraws",
    "totalPoints",
    "currentWinStreak",
    "bestWinStreak",
  ];
  for (const k of keys) {
    if (before[k] !== after[k]) {
      out.push({ field: k, before: before[k], after: after[k] });
    }
  }
  return out;
}
