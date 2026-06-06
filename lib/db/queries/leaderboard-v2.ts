/**
 * Leaderboard v2 query (Sprint 32) — filterable by city + period.
 *
 * Strategy:
 * - all_time + global: read pre-aggregated columns dari users (fast path)
 * - all_time + regional: same query + city filter
 * - weekly/monthly: aggregate completed matches in window via session_participants
 *   join (computes wins/losses/draws/points dari source records in window)
 *
 * Refs:
 * - DB: users, session_participants, matches, match_round_sets, sessions, tier_definitions
 * - Pure helpers: lib/leaderboard/sort.ts + period.ts
 */

import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  tierDefinitions,
  sessionParticipants,
  matches,
  matchRoundSets,
  sessions,
} from "@/lib/db/schema";
import { computeWinRate, sortAndRank } from "@/lib/leaderboard/sort";
import { periodSinceDate } from "@/lib/leaderboard/period";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardSort,
  RankedEntry,
} from "@/lib/leaderboard/types";
import { SCORING } from "@/lib/constants";

export type GetLeaderboardOptions = {
  sort?: LeaderboardSort;
  period?: LeaderboardPeriod;
  city?: string | null; // null = global
};

export async function getLeaderboardV2(
  options: GetLeaderboardOptions = {}
): Promise<RankedEntry[]> {
  const sort = options.sort ?? "point";
  const period = options.period ?? "all_time";
  const city = options.city ?? null;

  const entries =
    period === "all_time"
      ? await getAllTimeEntries(city)
      : await getPeriodEntries(period, city);

  return sortAndRank(entries, sort);
}

async function getAllTimeEntries(
  city: string | null
): Promise<LeaderboardEntry[]> {
  const conditions = city ? [eq(users.city, city)] : [];
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      city: users.city,
      avatarUrl: users.avatarUrl,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(500);

  return rows.map((r) => ({
    ...r,
    winRate: computeWinRate(r.totalWins, r.totalMatches),
  }));
}

/**
 * Period-scoped aggregate: count only matches completed since `since`.
 *
 * Joins:
 *   users → session_participants → matches (where match has user as either p1/p2)
 *
 * Per-user aggregates:
 *   wins   = count where their team won
 *   losses = count where their team lost
 *   draws  = count where match was draw
 *   points = wins*WIN + losses*LOSS + draws*DRAW
 *   matches = wins+losses+draws (counted matches)
 *
 * SQL-side aggregation via sql template since drizzle's groupBy is tricky
 * across multiple "side" joins. We compose with raw filtered counts.
 */
async function getPeriodEntries(
  period: LeaderboardPeriod,
  city: string | null
): Promise<LeaderboardEntry[]> {
  const since = periodSinceDate(new Date(), period);
  if (!since) {
    // shouldn't happen — guard
    return getAllTimeEntries(city);
  }

  // Step 1: aggregate per-user wins/losses/draws di window from matches
  // Each user appears in matches via session_participants slots:
  //   team1P1Id, team1P2Id, team2P1Id, team2P2Id
  // We compute outcomes by team membership.
  //
  // For simplicity we run TWO queries (team1 + team2) and merge JS-side.
  const t1Outcomes = await aggregateOutcomes("team1", since);
  const t2Outcomes = await aggregateOutcomes("team2", since);

  // Merge per userId
  const merged = new Map<
    string,
    { wins: number; losses: number; draws: number }
  >();
  for (const row of [...t1Outcomes, ...t2Outcomes]) {
    const cur =
      merged.get(row.userId) ?? { wins: 0, losses: 0, draws: 0 };
    cur.wins += row.wins;
    cur.losses += row.losses;
    cur.draws += row.draws;
    merged.set(row.userId, cur);
  }

  if (merged.size === 0) return [];

  // Step 2: read user rows
  const userIds = [...merged.keys()];
  const userConditions = [
    sql`${users.id} = ANY(${userIds})`,
    ...(city ? [eq(users.city, city)] : []),
  ];
  const userRows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      city: users.city,
      avatarUrl: users.avatarUrl,
      tierName: tierDefinitions.name,
      tierColor: tierDefinitions.color,
    })
    .from(users)
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(and(...userConditions));

  const entries: LeaderboardEntry[] = [];
  for (const u of userRows) {
    const agg = merged.get(u.id) ?? { wins: 0, losses: 0, draws: 0 };
    const totalMatches = agg.wins + agg.losses + agg.draws;
    const totalPoints =
      agg.wins * SCORING.WIN_POINTS +
      agg.losses * SCORING.LOSS_POINTS +
      agg.draws * SCORING.DRAW_POINTS;
    entries.push({
      ...u,
      totalPoints,
      totalMatches,
      totalWins: agg.wins,
      totalLosses: agg.losses,
      totalDraws: agg.draws,
      winRate: computeWinRate(agg.wins, totalMatches),
    });
  }
  return entries;
}

/**
 * Per-team outcome aggregator. Returns rows: {userId, wins, losses, draws}.
 *
 * Joins sessionParticipants ON (matches.teamXP1Id OR teamXP2Id) — done via
 * two separate selects + UNION-like merging at SQL level.
 */
async function aggregateOutcomes(
  team: "team1" | "team2",
  since: Date
): Promise<{ userId: string; wins: number; losses: number; draws: number }[]> {
  const t1Score = matches.team1Score;
  const t2Score = matches.team2Score;
  const teamWinExpr =
    team === "team1"
      ? sql`${t1Score} > ${t2Score}`
      : sql`${t2Score} > ${t1Score}`;
  const teamLossExpr =
    team === "team1"
      ? sql`${t1Score} < ${t2Score}`
      : sql`${t2Score} < ${t1Score}`;
  const drawExpr = sql`${t1Score} = ${t2Score}`;

  const p1Col =
    team === "team1" ? matches.team1P1Id : matches.team2P1Id;
  const p2Col =
    team === "team1" ? matches.team1P2Id : matches.team2P2Id;

  // For both p1 and p2 slots, union-merge via 2 queries
  const rows1 = await runTeamSlot(p1Col, since, teamWinExpr, teamLossExpr, drawExpr);
  const rows2 = await runTeamSlot(p2Col, since, teamWinExpr, teamLossExpr, drawExpr);
  return [...rows1, ...rows2];
}

type MatchPlayerColumn =
  | typeof matches.team1P1Id
  | typeof matches.team1P2Id
  | typeof matches.team2P1Id
  | typeof matches.team2P2Id;

async function runTeamSlot(
  slotCol: MatchPlayerColumn,
  since: Date,
  winExpr: ReturnType<typeof sql>,
  lossExpr: ReturnType<typeof sql>,
  drawExpr: ReturnType<typeof sql>
): Promise<{ userId: string; wins: number; losses: number; draws: number }[]> {
  const rows = await db
    .select({
      userId: sessionParticipants.userId,
      wins: sql<number>`sum(case when ${winExpr} then 1 else 0 end)::int`,
      losses: sql<number>`sum(case when ${lossExpr} then 1 else 0 end)::int`,
      draws: sql<number>`sum(case when ${drawExpr} then 1 else 0 end)::int`,
    })
    .from(matches)
    .innerJoin(sessionParticipants, eq(sessionParticipants.id, slotCol))
    .innerJoin(matchRoundSets, eq(matchRoundSets.id, matches.matchRoundSetId))
    .innerJoin(sessions, eq(sessions.id, matchRoundSets.sessionId))
    .where(
      and(
        eq(matches.status, "completed"),
        gte(matches.endedAt, since),
        isNotNull(sessionParticipants.userId)
      )
    )
    .groupBy(sessionParticipants.userId);
  return rows
    .filter((r): r is typeof r & { userId: string } => !!r.userId)
    .map((r) => ({
      userId: r.userId,
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      draws: r.draws ?? 0,
    }));
}
