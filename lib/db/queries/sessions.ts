/**
 * Session-related DB query helpers.
 * Use from Server Components / Server Actions.
 */

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessions,
  sessionParticipants,
  users,
} from "@/lib/db/schema";

export type MySessionRow = typeof sessions.$inferSelect & {
  participantCount: number;
  isHost: boolean;
};

/**
 * List sessions where the user is host or participant.
 * Ordered by scheduled_at descending (newest/upcoming first).
 *
 * Sprint 49: include participantCount + isHost flag untuk SessionListItem.
 */
export async function listMySessions(userId: string): Promise<MySessionRow[]> {
  // Get session IDs where user participates
  const myParticipations = await db
    .select({ sessionId: sessionParticipants.sessionId })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.userId, userId));

  const sessionIds = myParticipations.map((p) => p.sessionId);

  // Combine: hosted OR participating, dengan COUNT(participants) subquery
  const rows = await db
    .select({
      session: sessions,
      participantCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${sessionParticipants}
        WHERE ${sessionParticipants.sessionId} = ${sessions.id}
      )`,
    })
    .from(sessions)
    .where(
      or(
        eq(sessions.hostId, userId),
        sessionIds.length > 0
          ? inArray(sessions.id, sessionIds)
          : undefined
      )
    )
    .orderBy(desc(sessions.scheduledAt));

  return rows.map((r) => ({
    ...r.session,
    participantCount: r.participantCount,
    isHost: r.session.hostId === userId,
  }));
}

/**
 * Get session by ID with participants joined.
 * Returns null if not found.
 */
export async function getSessionWithParticipants(sessionId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;

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
      joinedAt: sessionParticipants.joinedAt,
      // Joined user fields (null for guests)
      userDisplayName: users.displayName,
      userAvatarUrl: users.avatarUrl,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(users.id, sessionParticipants.userId))
    .where(eq(sessionParticipants.sessionId, sessionId))
    .orderBy(sessionParticipants.joinedAt);

  return { session, participants };
}

/**
 * Check whether a user can view a session.
 * Rules: host, co_host, or player. Plus anyone for public sessions.
 */
export async function canUserViewSession(
  sessionId: string,
  userId: string | null
): Promise<boolean> {
  const [session] = await db
    .select({
      id: sessions.id,
      visibility: sessions.visibility,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return false;
  if (session.visibility === "public") return true;
  if (!userId) return false;

  const [participant] = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    )
    .limit(1);

  return !!participant;
}

/**
 * Check whether a user is host or co_host of a session.
 * Required for mutations (edit, cancel, add participants, score, etc.).
 */
export async function isSessionStaff(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const [participant] = await db
    .select({ role: sessionParticipants.role })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.userId, userId)
      )
    )
    .limit(1);

  return participant?.role === "host" || participant?.role === "co_host";
}
