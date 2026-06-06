/**
 * Pure leaderboard sort + rank helpers (Sprint 32).
 *
 * Refs:
 * - Types: lib/leaderboard/types.ts
 * - Used by: lib/db/queries/leaderboard-v2.ts + UI
 */

import type {
  LeaderboardEntry,
  LeaderboardSort,
  RankedEntry,
} from "./types";

export const WINRATE_MIN_MATCHES = 5;

/**
 * Compute win rate percent (0-100) from wins / matches.
 * Pure: matches=0 → 0.
 */
export function computeWinRate(wins: number, matches: number): number {
  if (matches <= 0) return 0;
  return (wins / matches) * 100;
}

/**
 * Sort metric value untuk given metric.
 * - point: totalPoints
 * - winrate: winRate (require ≥ WINRATE_MIN_MATCHES, else -1 to sink)
 * - match: totalMatches
 */
export function getSortValue(
  row: LeaderboardEntry,
  sort: LeaderboardSort
): number {
  if (sort === "point") return row.totalPoints;
  if (sort === "match") return row.totalMatches;
  // winrate
  return row.totalMatches >= WINRATE_MIN_MATCHES ? row.winRate : -1;
}

/**
 * Sort + assign ranks. Stable order untuk same-value rows via id asc.
 */
export function sortAndRank(
  entries: LeaderboardEntry[],
  sort: LeaderboardSort
): RankedEntry[] {
  const copy = entries.map((e) => ({ ...e }));
  copy.sort((a, b) => {
    const diff = getSortValue(b, sort) - getSortValue(a, sort);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
  return copy.map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * Find user's row in a sorted list.
 */
export function findEntry(
  rows: RankedEntry[],
  userId: string
): RankedEntry | null {
  return rows.find((r) => r.id === userId) ?? null;
}

/**
 * Climbers detection: compare two snapshots (current vs prior) and surface
 * users whose rank improved most. Returns top-K rank gainers.
 *
 * - rankDelta = priorRank - currentRank (positive = climbed up)
 * - Only includes users present di both snapshots
 * - Minimum rankDelta untuk surface (default 5)
 */
export type Climber = {
  id: string;
  displayName: string;
  currentRank: number;
  priorRank: number;
  rankDelta: number;
};

export function topClimbers(
  current: RankedEntry[],
  prior: RankedEntry[],
  k: number,
  minDelta = 5
): Climber[] {
  const priorRankById = new Map<string, number>();
  for (const e of prior) priorRankById.set(e.id, e.rank);
  const climbers: Climber[] = [];
  for (const c of current) {
    const pr = priorRankById.get(c.id);
    if (pr === undefined) continue;
    const rankDelta = pr - c.rank;
    if (rankDelta < minDelta) continue;
    climbers.push({
      id: c.id,
      displayName: c.displayName,
      currentRank: c.rank,
      priorRank: pr,
      rankDelta,
    });
  }
  climbers.sort((a, b) => {
    if (b.rankDelta !== a.rankDelta) return b.rankDelta - a.rankDelta;
    return a.currentRank - b.currentRank;
  });
  return climbers.slice(0, k);
}

/**
 * Distinct city list dari entries (excluding null).
 * Sorted alphabetical.
 */
export function distinctCities(entries: LeaderboardEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) {
    if (e.city) set.add(e.city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
