/**
 * Data export endpoint (Sprint 38).
 *
 * Returns JSON dump of the current user's data:
 * - profile core fields (id, displayName, whatsappNumber, city, tier, stats)
 * - sessions hosted
 * - session participations (with stats per session)
 * - completed match outcomes (date, score, partner, opponents — IDs only)
 * - achievements earned
 *
 * Auth: requireUser (cookie session). No CSRF concern (GET, scoped to self).
 */

import { NextResponse } from "next/server";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matches,
  matchRoundSets,
  sessionParticipants,
  sessions,
  userAchievements,
  users,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await requireUser();

  const [profile] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      whatsappNumber: users.whatsappNumber,
      city: users.city,
      currentTierId: users.currentTierId,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
      bestWinStreak: users.bestWinStreak,
      createdAt: users.createdAt,
      profileVisibility: users.profileVisibility,
      displayFlags: users.displayFlags,
      friendRequestPolicy: users.friendRequestPolicy,
    })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);

  const hostedSessions = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      scheduledAt: sessions.scheduledAt,
      venueName: sessions.venueName,
      format: sessions.format,
      status: sessions.status,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(eq(sessions.hostId, me.id));

  const participations = await db
    .select({
      sessionId: sessionParticipants.sessionId,
      role: sessionParticipants.role,
      sessionPoints: sessionParticipants.sessionPoints,
      sessionMatches: sessionParticipants.sessionMatches,
      sessionWins: sessionParticipants.sessionWins,
      sessionLosses: sessionParticipants.sessionLosses,
      sessionDraws: sessionParticipants.sessionDraws,
      joinedAt: sessionParticipants.joinedAt,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.userId, me.id));

  // Match outcomes — pull match rows where user appears, anonymize partner IDs
  const myParticipantRows = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.userId, me.id));
  const partIds = myParticipantRows.map((r) => r.id);
  let matchExport: Array<{
    matchId: string;
    sessionId: string;
    team1Score: number;
    team2Score: number;
    role: "team1_p1" | "team1_p2" | "team2_p1" | "team2_p2";
    endedAt: Date | null;
  }> = [];
  if (partIds.length > 0) {
    const rows = await db
      .select({
        matchId: matches.id,
        sessionId: matchRoundSets.sessionId,
        team1Score: matches.team1Score,
        team2Score: matches.team2Score,
        endedAt: matches.endedAt,
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
          eq(matches.status, "completed"),
          isNotNull(matches.endedAt),
          sql`(${matches.team1P1Id} = ANY(${partIds}) OR ${matches.team1P2Id} = ANY(${partIds}) OR ${matches.team2P1Id} = ANY(${partIds}) OR ${matches.team2P2Id} = ANY(${partIds}))`
        )
      )
      .orderBy(asc(matches.endedAt));
    const partSet = new Set(partIds);
    matchExport = rows.map((r) => {
      const role: "team1_p1" | "team1_p2" | "team2_p1" | "team2_p2" =
        partSet.has(r.t1p1Id)
          ? "team1_p1"
          : partSet.has(r.t1p2Id)
            ? "team1_p2"
            : partSet.has(r.t2p1Id)
              ? "team2_p1"
              : "team2_p2";
      return {
        matchId: r.matchId,
        sessionId: r.sessionId,
        team1Score: r.team1Score,
        team2Score: r.team2Score,
        role,
        endedAt: r.endedAt,
      };
    });
  }

  const achievements = await db
    .select({
      code: userAchievements.code,
      earnedAt: userAchievements.earnedAt,
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, me.id));

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    profile,
    hostedSessions,
    participations,
    matches: matchExport,
    achievements,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="carsel-club-export-${me.id}.json"`,
    },
  });
}
