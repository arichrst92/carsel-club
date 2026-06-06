/**
 * Tournament bracket queries (Sprint 31).
 */

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matchRoundSets,
  matches,
  sessionParticipants,
  tournamentBrackets,
  users,
} from "@/lib/db/schema";

export type BracketMatchRow = {
  id: string;
  bracketRound: number;
  bracketSlot: number;
  status: "pending" | "live" | "completed";
  team1Score: number;
  team2Score: number;
  team1Players: { id: string; displayName: string }[];
  team2Players: { id: string; displayName: string }[];
};

export type BracketView = {
  totalRounds: number;
  currentRound: number;
  seedingMethod: "by_join_order" | "random";
  matchesByRound: Record<number, BracketMatchRow[]>;
};

export async function getBracketForSession(
  sessionId: string
): Promise<BracketView | null> {
  const [bracket] = await db
    .select({
      totalRounds: tournamentBrackets.totalRounds,
      currentRound: tournamentBrackets.currentRound,
      seedingMethod: tournamentBrackets.seedingMethod,
    })
    .from(tournamentBrackets)
    .where(eq(tournamentBrackets.sessionId, sessionId))
    .limit(1);
  if (!bracket) return null;

  const rows = await db
    .select({
      id: matches.id,
      bracketRound: matches.bracketRound,
      bracketSlot: matches.bracketSlot,
      status: matches.status,
      team1Score: matches.team1Score,
      team2Score: matches.team2Score,
      t1p1Id: matches.team1P1Id,
      t1p2Id: matches.team1P2Id,
      t2p1Id: matches.team2P1Id,
      t2p2Id: matches.team2P2Id,
    })
    .from(matches)
    .innerJoin(
      matchRoundSets,
      eq(matches.matchRoundSetId, matchRoundSets.id)
    )
    .where(
      and(
        eq(matchRoundSets.sessionId, sessionId),
        isNotNull(matches.bracketRound)
      )
    )
    .orderBy(asc(matches.bracketRound), asc(matches.bracketSlot));

  // Batch participant → user lookup
  const partIds = new Set<string>();
  for (const r of rows) {
    partIds.add(r.t1p1Id);
    partIds.add(r.t1p2Id);
    partIds.add(r.t2p1Id);
    partIds.add(r.t2p2Id);
  }
  const partList = [...partIds];
  const partRows =
    partList.length === 0
      ? []
      : await db
          .select({
            id: sessionParticipants.id,
            userId: sessionParticipants.userId,
            guestName: sessionParticipants.guestName,
          })
          .from(sessionParticipants)
          .where(eq(sessionParticipants.sessionId, sessionId));
  const partMap = new Map<
    string,
    { userId: string | null; guestName: string | null }
  >();
  for (const p of partRows) {
    partMap.set(p.id, { userId: p.userId, guestName: p.guestName });
  }

  const userIds = [
    ...new Set(
      partRows
        .map((p) => p.userId)
        .filter((id): id is string => !!id)
    ),
  ];
  const userRows =
    userIds.length === 0
      ? []
      : await db
          .select({ id: users.id, displayName: users.displayName })
          .from(users);
  const nameById = new Map<string, string>();
  for (const u of userRows) nameById.set(u.id, u.displayName);

  function nameFor(participantId: string): { id: string; displayName: string } {
    const p = partMap.get(participantId);
    if (!p) return { id: participantId, displayName: "?" };
    if (p.userId) {
      return {
        id: p.userId,
        displayName: nameById.get(p.userId) ?? "User",
      };
    }
    return {
      id: participantId,
      displayName: p.guestName ?? "Guest",
    };
  }

  const matchesByRound: Record<number, BracketMatchRow[]> = {};
  for (const r of rows) {
    const round = r.bracketRound!;
    const row: BracketMatchRow = {
      id: r.id,
      bracketRound: round,
      bracketSlot: r.bracketSlot!,
      status: r.status,
      team1Score: r.team1Score,
      team2Score: r.team2Score,
      team1Players: [nameFor(r.t1p1Id), nameFor(r.t1p2Id)],
      team2Players: [nameFor(r.t2p1Id), nameFor(r.t2p2Id)],
    };
    (matchesByRound[round] = matchesByRound[round] ?? []).push(row);
  }

  return {
    totalRounds: bracket.totalRounds,
    currentRound: bracket.currentRound,
    seedingMethod: bracket.seedingMethod,
    matchesByRound,
  };
}
