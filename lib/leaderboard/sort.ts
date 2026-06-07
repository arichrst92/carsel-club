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

/**
 * @deprecated Sprint 52: threshold dropped to keep ordering correct for small
 * leaderboards. Kept exported for backwards compat with tests / unused calls.
 */
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
 * - winrate: winRate (Sprint 52 — no threshold, raw value)
 * - match: totalMatches
 */
export function getSortValue(
  row: LeaderboardEntry,
  sort: LeaderboardSort
): number {
  if (sort === "point") return row.totalPoints;
  if (sort === "match") return row.totalMatches;
  // winrate — Sprint 52: drop ≥5-matches threshold. With small communities
  // (2–4 players, all <5 matches) it forced everyone to sort value -1,
  // making rank order alphabetical by UUID — i.e. 0% WR ahead of 100% WR.
  // Now the secondary tie-break (totalMatches DESC) handles the credibility
  // angle: 100% WR with more matches beats 100% WR with fewer.
  return row.winRate;
}

/**
 * Tie-break metric — used when primary sort value ties.
 * Mirrors session-leaderboard logic (Sprint 50):
 * - point + winrate → tie-break by totalMatches DESC
 *   (sample size strengthens credibility for both)
 * - match → tie-break by totalPoints DESC
 */
function getTieBreakValue(
  row: LeaderboardEntry,
  sort: LeaderboardSort
): number {
  if (sort === "match") return row.totalPoints;
  return row.totalMatches;
}

/**
 * Sort + assign ranks. Smart tie-breaks:
 *   1. Primary metric DESC
 *   2. Complementary metric DESC (matches for point/winrate, points for match)
 *   3. Alphabetical by displayName (then id) for fully-tied rows
 */
export function sortAndRank(
  entries: LeaderboardEntry[],
  sort: LeaderboardSort
): RankedEntry[] {
  const copy = entries.map((e) => ({ ...e }));
  copy.sort((a, b) => {
    const primary = getSortValue(b, sort) - getSortValue(a, sort);
    if (primary !== 0) return primary;
    const tie = getTieBreakValue(b, sort) - getTieBreakValue(a, sort);
    if (tie !== 0) return tie;
    const byName = a.displayName.localeCompare(b.displayName);
    if (byName !== 0) return byName;
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
