/**
 * Public share queries — no auth required.
 * Used by /s/[id] live viewer.
 */

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matches,
  matchRoundSets,
  sessionParticipants,
  sessions,
  tierDefinitions,
  users,
} from "@/lib/db/schema";

export async function getPublicSessionView(sessionId: string) {
  const [session] = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      venueName: sessions.venueName,
      mapsUrl: sessions.mapsUrl,
      coverPhotoUrl: sessions.coverPhotoUrl,
      scheduledAt: sessions.scheduledAt,
      scheduledEndAt: sessions.scheduledEndAt,
      format: sessions.format,
      visibility: sessions.visibility,
      numCourts: sessions.numCourts,
      status: sessions.status,
      hostId: sessions.hostId,
      hostName: users.displayName,
    })
    .from(sessions)
    .leftJoin(users, eq(users.id, sessions.hostId))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

  // Get all participants (for name lookup + leaderboard)
  const participants = await db
    .select({
      id: sessionParticipants.id,
      userId: sessionParticipants.userId,
      guestName: sessionParticipants.guestName,
      role: sessionParticipants.role,
      isPlaying: sessionParticipants.isPlaying,
      sessionPoints: sessionParticipants.sessionPoints,
      sessionMatches: sessionParticipants.sessionMatches,
      sessionWins: sessionParticipants.sessionWins,
      sessionLosses: sessionParticipants.sessionLosses,
      sessionDraws: sessionParticipants.sessionDraws,
      userDisplayName: users.displayName,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(users.id, sessionParticipants.userId))
    .where(eq(sessionParticipants.sessionId, sessionId));

  // Latest round + matches
  const rounds = await db
    .select()
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId))
    .orderBy(desc(matchRoundSets.roundNumber));

  let currentRound = null;
  let currentMatches: typeof matches.$inferSelect[] = [];

  if (rounds.length > 0) {
    currentRound = rounds[0];
    currentMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.matchRoundSetId, currentRound.id))
      .orderBy(asc(matches.courtNumber));
  }

  const totalRounds = rounds.length;

  return {
    session,
    participants,
    currentRound,
    currentMatches,
    totalRounds,
  };
}

// ============================================================
// getPublicMatchView — Sprint 6: per-match share
// ============================================================

export type PublicMatchPlayer = {
  participantId: string;
  side: "team1" | "team2";
  slot: 1 | 2;
  name: string;
  isMember: boolean;
  avatarUrl: string | null;
  tierName: string | null;
  tierColor: string | null;
};

export async function getPublicMatchView(matchId: string) {
  const [row] = await db
    .select({
      mId: matches.id,
      mStatus: matches.status,
      mCourtNumber: matches.courtNumber,
      mT1Score: matches.team1Score,
      mT2Score: matches.team2Score,
      mStartedAt: matches.startedAt,
      mEndedAt: matches.endedAt,
      mT1P1: matches.team1P1Id,
      mT1P2: matches.team1P2Id,
      mT2P1: matches.team2P1Id,
      mT2P2: matches.team2P2Id,
      rNumber: matchRoundSets.roundNumber,
      sId: sessions.id,
      sTitle: sessions.title,
      sVenueName: sessions.venueName,
      sFormat: sessions.format,
      sStatus: sessions.status,
      sScheduledAt: sessions.scheduledAt,
      hostName: users.displayName,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matchRoundSets.id, matches.matchRoundSetId))
    .innerJoin(sessions, eq(sessions.id, matchRoundSets.sessionId))
    .leftJoin(users, eq(users.id, sessions.hostId))
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!row) return null;

  // Fetch 4 players
  const partIds = [row.mT1P1, row.mT1P2, row.mT2P1, row.mT2P2];
  const partRows = await db
    .select({
      pId: sessionParticipants.id,
      pUserId: sessionParticipants.userId,
      pGuestName: sessionParticipants.guestName,
      uDisplayName: users.displayName,
      uAvatarUrl: users.avatarUrl,
      tName: tierDefinitions.name,
      tColor: tierDefinitions.color,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(users.id, sessionParticipants.userId))
    .leftJoin(
      tierDefinitions,
      eq(tierDefinitions.id, users.currentTierId)
    )
    .where(inArray(sessionParticipants.id, partIds));

  const byId = new Map(partRows.map((r) => [r.pId, r]));

  function makePlayer(
    pid: string,
    side: "team1" | "team2",
    slot: 1 | 2
  ): PublicMatchPlayer {
    const p = byId.get(pid);
    return {
      participantId: pid,
      side,
      slot,
      name: p?.pGuestName ?? p?.uDisplayName ?? "?",
      isMember: !!p?.pUserId,
      avatarUrl: p?.uAvatarUrl ?? null,
      tierName: p?.tName ?? null,
      tierColor: p?.tColor ?? null,
    };
  }

  const players: PublicMatchPlayer[] = [
    makePlayer(row.mT1P1, "team1", 1),
    makePlayer(row.mT1P2, "team1", 2),
    makePlayer(row.mT2P1, "team2", 1),
    makePlayer(row.mT2P2, "team2", 2),
  ];

  return {
    match: {
      id: row.mId,
      status: row.mStatus,
      courtNumber: row.mCourtNumber,
      team1Score: row.mT1Score,
      team2Score: row.mT2Score,
      startedAt: row.mStartedAt,
      endedAt: row.mEndedAt,
    },
    round: {
      number: row.rNumber,
    },
    session: {
      id: row.sId,
      title: row.sTitle,
      venueName: row.sVenueName,
      format: row.sFormat,
      status: row.sStatus,
      scheduledAt: row.sScheduledAt,
      hostName: row.hostName,
    },
    players,
  };
}
