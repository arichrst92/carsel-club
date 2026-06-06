/**
 * Session leaderboard query (Sprint 47).
 *
 * Returns participants of a session ranked by their in-session stats
 * (sessionPoints / sessionMatches / sessionWins).
 *
 * Refs:
 * - DB: session_participants + users + tier_definitions
 * - Pure sort: lib/leaderboard/sort.ts (reused)
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matchRoundSets,
  matches,
  sessionParticipants,
  sessions,
  tierDefinitions,
  users,
} from "@/lib/db/schema";
import { computeWinRate } from "@/lib/leaderboard/sort";

export type SessionLeaderboardRow = {
  participantId: string;
  userId: string | null; // null untuk guest
  displayName: string;
  avatarUrl: string | null;
  tierName: string | null;
  isPlaying: boolean;
  role: "host" | "co_host" | "player" | "guest";
  sessionPoints: number;
  sessionMatches: number;
  sessionWins: number;
  sessionLosses: number;
  sessionDraws: number;
  winRate: number; // 0-100
};

export async function listSessionLeaderboard(
  sessionId: string
): Promise<SessionLeaderboardRow[]> {
  const rows = await db
    .select({
      participantId: sessionParticipants.id,
      userId: sessionParticipants.userId,
      guestName: sessionParticipants.guestName,
      role: sessionParticipants.role,
      isPlaying: sessionParticipants.isPlaying,
      sessionPoints: sessionParticipants.sessionPoints,
      sessionMatches: sessionParticipants.sessionMatches,
      sessionWins: sessionParticipants.sessionWins,
      sessionLosses: sessionParticipants.sessionLosses,
      sessionDraws: sessionParticipants.sessionDraws,
      uDisplayName: users.displayName,
      uAvatarUrl: users.avatarUrl,
      tierName: tierDefinitions.name,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(users.id, sessionParticipants.userId))
    .leftJoin(tierDefinitions, eq(tierDefinitions.id, users.currentTierId))
    .where(eq(sessionParticipants.sessionId, sessionId))
    .orderBy(desc(sessionParticipants.sessionPoints));

  return rows.map((r) => ({
    participantId: r.participantId,
    userId: r.userId,
    displayName: r.userId
      ? (r.uDisplayName ?? "User")
      : (r.guestName ?? "Guest"),
    avatarUrl: r.uAvatarUrl ?? null,
    tierName: r.tierName ?? null,
    isPlaying: r.isPlaying,
    role: r.role,
    sessionPoints: r.sessionPoints,
    sessionMatches: r.sessionMatches,
    sessionWins: r.sessionWins,
    sessionLosses: r.sessionLosses,
    sessionDraws: r.sessionDraws,
    winRate: computeWinRate(r.sessionWins, r.sessionMatches),
  }));
}

export type SessionLeaderboardHero = {
  sessionId: string;
  sessionTitle: string;
  playerCount: number;
  completedMatches: number;
  totalPoints: number;
};

export async function getSessionLeaderboardHero(
  sessionId: string
): Promise<SessionLeaderboardHero | null> {
  const [s] = await db
    .select({
      id: sessions.id,
      title: sessions.title,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!s) return null;

  // Count playing participants
  const participants = await db
    .select({
      isPlaying: sessionParticipants.isPlaying,
      sessionPoints: sessionParticipants.sessionPoints,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));
  const playerCount = participants.filter((p) => p.isPlaying).length;
  const totalPoints = participants.reduce(
    (acc, p) => acc + p.sessionPoints,
    0
  );

  // Count completed matches in this session
  const matchRows = await db
    .select({ id: matches.id })
    .from(matches)
    .innerJoin(
      matchRoundSets,
      eq(matchRoundSets.id, matches.matchRoundSetId)
    )
    .where(
      and(
        eq(matchRoundSets.sessionId, sessionId),
        eq(matches.status, "completed")
      )
    );

  return {
    sessionId: s.id,
    sessionTitle: s.title,
    playerCount,
    completedMatches: matchRows.length,
    totalPoints,
  };
}
