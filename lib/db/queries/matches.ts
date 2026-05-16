/**
 * Match & MatchRoundSet query helpers.
 */

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matches, matchRoundSets } from "@/lib/db/schema";
import {
  recordPair,
  type PairHistory,
} from "@/lib/match/generator";

/**
 * Get all rounds in a session with their matches.
 * Returns rounds in ascending order (Round 1 first).
 */
export async function getRoundsWithMatches(sessionId: string) {
  const rounds = await db
    .select()
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId))
    .orderBy(asc(matchRoundSets.roundNumber));

  if (rounds.length === 0) return [];

  const roundIds = rounds.map((r) => r.id);

  const allMatches = await db
    .select()
    .from(matches)
    .where(inArray(matches.matchRoundSetId, roundIds))
    .orderBy(asc(matches.courtNumber));

  // Group matches by round
  return rounds.map((round) => ({
    ...round,
    matches: allMatches.filter((m) => m.matchRoundSetId === round.id),
  }));
}

/**
 * Build pair-history for a session from all existing matches.
 * Used by generator to avoid repeat partners.
 */
export async function buildPairHistoryForSession(
  sessionId: string
): Promise<PairHistory> {
  const pastMatches = await db
    .select({
      team1P1Id: matches.team1P1Id,
      team1P2Id: matches.team1P2Id,
      team2P1Id: matches.team2P1Id,
      team2P2Id: matches.team2P2Id,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matches.matchRoundSetId, matchRoundSets.id))
    .where(eq(matchRoundSets.sessionId, sessionId));

  const history: PairHistory = new Map();

  for (const m of pastMatches) {
    recordPair(history, m.team1P1Id, m.team1P2Id);
    recordPair(history, m.team2P1Id, m.team2P2Id);
  }

  return history;
}

/**
 * Get next round number for a session.
 */
export async function getNextRoundNumber(sessionId: string): Promise<number> {
  const rows = await db
    .select({ roundNumber: matchRoundSets.roundNumber })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId))
    .orderBy(asc(matchRoundSets.roundNumber));

  return (rows.at(-1)?.roundNumber ?? 0) + 1;
}
