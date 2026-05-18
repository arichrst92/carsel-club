/**
 * Leaderboard queries.
 *
 * v1 strategy: fetch all users + sort in JS (fine for closed beta scale ~50 users).
 * Migrate to indexed SQL ORDER BY for scale (v2+).
 */

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, tierDefinitions } from "@/lib/db/schema";

export type LeaderboardSort = "point" | "winrate" | "match";

export type LeaderboardRow = {
  rank: number;
  id: string;
  displayName: string;
  city: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  winRate: number; // 0-100
  tierName: string | null;
  tierColor: string | null;
};

function computeWinRate(wins: number, matches: number): number {
  return matches > 0 ? (wins / matches) * 100 : 0;
}

function getSortValue(row: LeaderboardRow, sort: LeaderboardSort): number {
  switch (sort) {
    case "point":
      return row.totalPoints;
    case "winrate":
      // require minimum 5 matches to be ranked by winrate (avoid 100% from 1 match)
      return row.totalMatches >= 5 ? row.winRate : -1;
    case "match":
      return row.totalMatches;
  }
}

export async function getLeaderboard(sort: LeaderboardSort = "point") {
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      city: users.city,
      avatarUrl: users.avatarUrl,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .orderBy(desc(users.totalPoints))
    .limit(200);

  const withWinRate: LeaderboardRow[] = rows.map((r) => ({
    ...r,
    winRate: computeWinRate(r.totalWins, r.totalMatches),
    rank: 0,
  }));

  // Sort by selected metric
  withWinRate.sort((a, b) => getSortValue(b, sort) - getSortValue(a, sort));

  // Assign ranks (1-indexed)
  withWinRate.forEach((r, i) => {
    r.rank = i + 1;
  });

  return withWinRate;
}

export function findMyEntry(
  rows: LeaderboardRow[],
  userId: string
): LeaderboardRow | null {
  return rows.find((r) => r.id === userId) ?? null;
}
