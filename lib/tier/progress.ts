/**
 * Pure helpers untuk tier ring progress display (Sprint 40).
 *
 * Computes % progress dari tier saat ini ke tier berikutnya berdasarkan
 * dual-criteria (points + matches). Used by Profile hero conic-gradient ring.
 *
 * Refs:
 * - lib/constants.ts TIERS
 * - lib/match/stats-helpers.ts computeTierId
 */

import { TIERS } from "@/lib/constants";

export type TierProgress = {
  currentTierId: number;
  currentTierName: string;
  nextTierId: number | null;
  nextTierName: string | null;
  /** 0..1 fraction toward next tier (max of points + matches progress). */
  fraction: number;
  /** 0..100 integer percent untuk display. */
  percent: number;
  /** Closest threshold gap remaining ke next tier. */
  pointsToGo: number;
  matchesToGo: number;
};

/**
 * Compute progress toward next tier.
 *
 * - If at max tier (no next) → fraction=1, gaps=0.
 * - fraction = min(pointsFraction, matchesFraction) since user must meet BOTH
 *   to promote. Higher of the two would over-state progress.
 */
export function computeTierProgress(
  currentTierId: number,
  totalPoints: number,
  totalMatches: number
): TierProgress {
  const current = TIERS.find((t) => t.id === currentTierId) ?? TIERS[0];
  const next = TIERS.find((t) => t.id === currentTierId + 1) ?? null;
  if (!next) {
    return {
      currentTierId: current.id,
      currentTierName: current.name,
      nextTierId: null,
      nextTierName: null,
      fraction: 1,
      percent: 100,
      pointsToGo: 0,
      matchesToGo: 0,
    };
  }
  const ptsSpan = Math.max(1, next.minPoints - current.minPoints);
  const mtcSpan = Math.max(1, next.minMatches - current.minMatches);
  const ptsProgress = Math.max(
    0,
    Math.min(1, (totalPoints - current.minPoints) / ptsSpan)
  );
  const mtcProgress = Math.max(
    0,
    Math.min(1, (totalMatches - current.minMatches) / mtcSpan)
  );
  // BOTH must be met to promote — use the lagging dimension
  const fraction = Math.min(ptsProgress, mtcProgress);
  return {
    currentTierId: current.id,
    currentTierName: current.name,
    nextTierId: next.id,
    nextTierName: next.name,
    fraction,
    percent: Math.round(fraction * 100),
    pointsToGo: Math.max(0, next.minPoints - totalPoints),
    matchesToGo: Math.max(0, next.minMatches - totalMatches),
  };
}
