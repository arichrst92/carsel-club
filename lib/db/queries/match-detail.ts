/**
 * Query: match detail dengan 4 pemain + round + session info.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-detail.html
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 5
 */

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matches,
  matchRoundSets,
  sessions,
  sessionParticipants,
  users,
  tierDefinitions,
} from "@/lib/db/schema";

export type MatchDetailPlayer = {
  participantId: string;
  side: "team1" | "team2";
  slot: 1 | 2; // p1 atau p2 di team
  name: string;
  isMember: boolean;
  userId: string | null;
  avatarUrl: string | null;
  tierName: string | null;
  tierColor: string | null;
};

export type MatchDetail = {
  match: {
    id: string;
    status: "pending" | "live" | "completed";
    courtNumber: number;
    matchPosition: number;
    team1Score: number;
    team2Score: number;
    startedAt: Date | null;
    endedAt: Date | null;
    createdAt: Date;
  };
  round: {
    id: string;
    roundNumber: number;
  };
  session: {
    id: string;
    title: string;
    format: "americano" | "mexicano" | "tournament";
    numCourts: number;
    visibility: "private" | "public";
  };
  players: MatchDetailPlayer[];
};

export async function getMatchDetail(
  matchId: string
): Promise<MatchDetail | null> {
  // Match + round + session via joins
  const [row] = await db
    .select({
      mId: matches.id,
      mStatus: matches.status,
      mCourtNumber: matches.courtNumber,
      mMatchPosition: matches.matchPosition,
      mT1Score: matches.team1Score,
      mT2Score: matches.team2Score,
      mStartedAt: matches.startedAt,
      mEndedAt: matches.endedAt,
      mCreatedAt: matches.createdAt,
      mT1P1: matches.team1P1Id,
      mT1P2: matches.team1P2Id,
      mT2P1: matches.team2P1Id,
      mT2P2: matches.team2P2Id,
      rId: matchRoundSets.id,
      rNumber: matchRoundSets.roundNumber,
      sId: sessions.id,
      sTitle: sessions.title,
      sFormat: sessions.format,
      sNumCourts: sessions.numCourts,
      sVisibility: sessions.visibility,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matchRoundSets.id, matches.matchRoundSetId))
    .innerJoin(sessions, eq(sessions.id, matchRoundSets.sessionId))
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!row) return null;

  // Fetch 4 players in one query
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
  ): MatchDetailPlayer {
    const p = byId.get(pid);
    return {
      participantId: pid,
      side,
      slot,
      name: p?.pGuestName ?? p?.uDisplayName ?? "?",
      isMember: !!p?.pUserId,
      userId: p?.pUserId ?? null,
      avatarUrl: p?.uAvatarUrl ?? null,
      tierName: p?.tName ?? null,
      tierColor: p?.tColor ?? null,
    };
  }

  const players: MatchDetailPlayer[] = [
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
      matchPosition: row.mMatchPosition,
      team1Score: row.mT1Score,
      team2Score: row.mT2Score,
      startedAt: row.mStartedAt,
      endedAt: row.mEndedAt,
      createdAt: row.mCreatedAt,
    },
    round: {
      id: row.rId,
      roundNumber: row.rNumber,
    },
    session: {
      id: row.sId,
      title: row.sTitle,
      format: row.sFormat,
      numCourts: row.sNumCourts,
      visibility: row.sVisibility,
    },
    players,
  };
}
