/**
 * Home dashboard query helpers.
 */

import { and, asc, desc, eq, gt, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessions,
  sessionParticipants,
  tierDefinitions,
  users,
  matches,
  matchRoundSets,
} from "@/lib/db/schema";

/**
 * Get user's current tier + next tier info (for progress bar).
 */
export async function getTierInfo(userId: string) {
  const [user] = await db
    .select({
      totalPoints: users.totalPoints,
      currentTierId: users.currentTierId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const currentTier = user.currentTierId
    ? (
        await db
          .select()
          .from(tierDefinitions)
          .where(eq(tierDefinitions.id, user.currentTierId))
          .limit(1)
      )[0]
    : null;

  // Next tier (display_order > current)
  const [nextTier] = await db
    .select()
    .from(tierDefinitions)
    .where(
      currentTier
        ? gt(tierDefinitions.displayOrder, currentTier.displayOrder)
        : undefined
    )
    .orderBy(asc(tierDefinitions.displayOrder))
    .limit(1);

  return {
    currentTier,
    nextTier: nextTier ?? null,
    totalPoints: user.totalPoints,
  };
}

/**
 * Get user's next upcoming session (where user is participant).
 */
export async function getNextSession(userId: string) {
  // Sessions hosted by user OR where user participates
  const myParticipations = await db
    .select({ sessionId: sessionParticipants.sessionId })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.userId, userId));

  const sessionIds = myParticipations.map((p) => p.sessionId);

  const [next] = await db
    .select()
    .from(sessions)
    .where(
      and(
        or(
          eq(sessions.hostId, userId),
          sessionIds.length > 0
            ? inArray(sessions.id, sessionIds)
            : undefined
        ),
        or(eq(sessions.status, "upcoming"), eq(sessions.status, "live"))
      )
    )
    .orderBy(asc(sessions.scheduledAt))
    .limit(1);

  if (!next) return null;

  // Count participants
  const partRows = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, next.id));

  return { ...next, participantCount: partRows.length };
}

/**
 * Get user's most recent completed match (for "Recent" section).
 * Returns null if no matches.
 */
export async function getRecentMatches(userId: string, limit = 3) {
  // Find session_participant rows for this user
  const myParts = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.userId, userId));

  if (myParts.length === 0) return [];
  const myPartIds = myParts.map((p) => p.id);

  // Query completed matches where user was one of the 4 players
  // Using OR on 4 player slots
  const rows = await db
    .select({
      matchId: matches.id,
      sessionTitle: sessions.title,
      sessionId: sessions.id,
      team1Score: matches.team1Score,
      team2Score: matches.team2Score,
      team1P1Id: matches.team1P1Id,
      team1P2Id: matches.team1P2Id,
      team2P1Id: matches.team2P1Id,
      team2P2Id: matches.team2P2Id,
      startedAt: matches.startedAt,
      endedAt: matches.endedAt,
      roundNumber: matchRoundSets.roundNumber,
      courtNumber: matches.courtNumber,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matchRoundSets.id, matches.matchRoundSetId))
    .innerJoin(sessions, eq(sessions.id, matchRoundSets.sessionId))
    .where(
      and(
        eq(matches.status, "completed"),
        or(
          inArray(matches.team1P1Id, myPartIds),
          inArray(matches.team1P2Id, myPartIds),
          inArray(matches.team2P1Id, myPartIds),
          inArray(matches.team2P2Id, myPartIds)
        )
      )
    )
    .orderBy(desc(matches.endedAt))
    .limit(limit);

  // Resolve display names untuk all participantIds → User name or guest name
  const allPartIds = Array.from(
    new Set(
      rows.flatMap((r) => [r.team1P1Id, r.team1P2Id, r.team2P1Id, r.team2P2Id])
    )
  );
  const partRows = allPartIds.length
    ? await db
        .select({
          id: sessionParticipants.id,
          guestName: sessionParticipants.guestName,
          userDisplayName: users.displayName,
        })
        .from(sessionParticipants)
        .leftJoin(users, eq(users.id, sessionParticipants.userId))
        .where(inArray(sessionParticipants.id, allPartIds))
    : [];
  const nameMap = new Map(
    partRows.map((p) => [p.id, p.userDisplayName ?? p.guestName ?? "Player"])
  );

  return rows.map((m) => {
    const wasTeam1 =
      myPartIds.includes(m.team1P1Id) || myPartIds.includes(m.team1P2Id);
    const myScore = wasTeam1 ? m.team1Score : m.team2Score;
    const oppScore = wasTeam1 ? m.team2Score : m.team1Score;
    const outcome: "win" | "loss" | "draw" =
      myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "draw";

    // Cari partner (sisi yg sama dengan user, tapi bukan user itu sendiri)
    const myTeamIds = wasTeam1
      ? [m.team1P1Id, m.team1P2Id]
      : [m.team2P1Id, m.team2P2Id];
    const oppTeamIds = wasTeam1
      ? [m.team2P1Id, m.team2P2Id]
      : [m.team1P1Id, m.team1P2Id];
    const partnerId = myTeamIds.find((id) => !myPartIds.includes(id));
    const partnerName = partnerId ? nameMap.get(partnerId) ?? null : null;
    const oppNames = oppTeamIds
      .map((id) => nameMap.get(id))
      .filter((n): n is string => Boolean(n));

    // Durasi menit kalau startedAt + endedAt tersedia
    let durationMin: number | null = null;
    if (m.startedAt && m.endedAt) {
      const ms =
        new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime();
      if (ms > 0) durationMin = Math.round(ms / 60000);
    }

    return {
      matchId: m.matchId,
      sessionId: m.sessionId,
      sessionTitle: m.sessionTitle,
      myScore,
      oppScore,
      outcome,
      endedAt: m.endedAt,
      roundNumber: m.roundNumber,
      courtNumber: m.courtNumber,
      partnerName,
      opponentNames: oppNames,
      durationMin,
    };
  });
}
