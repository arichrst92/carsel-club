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
