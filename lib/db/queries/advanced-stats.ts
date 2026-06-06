/**
 * Match outcome query untuk advanced stats (Sprint 30).
 *
 * Returns completed matches dimana user appears, mapped ke perspective
 * (partner + opponents + outcome). Pure aggregation di lib/stats/advanced.ts.
 *
 * Refs:
 * - DB: matches join session_participants (4 joins untuk resolve user IDs)
 * - Used by: components/profile/AdvancedStats.tsx
 */

import { and, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db/client";
import { matches, sessionParticipants } from "@/lib/db/schema";
import type {
  MatchOutcome,
  UserMatchOutcome,
} from "@/lib/stats/advanced";

export async function getUserMatchOutcomes(
  userId: string
): Promise<UserMatchOutcome[]> {
  const t1p1 = alias(sessionParticipants, "t1p1");
  const t1p2 = alias(sessionParticipants, "t1p2");
  const t2p1 = alias(sessionParticipants, "t2p1");
  const t2p2 = alias(sessionParticipants, "t2p2");

  const rows = await db
    .select({
      matchId: matches.id,
      t1Score: matches.team1Score,
      t2Score: matches.team2Score,
      t1p1UserId: t1p1.userId,
      t1p2UserId: t1p2.userId,
      t2p1UserId: t2p1.userId,
      t2p2UserId: t2p2.userId,
    })
    .from(matches)
    .innerJoin(t1p1, eq(t1p1.id, matches.team1P1Id))
    .innerJoin(t1p2, eq(t1p2.id, matches.team1P2Id))
    .innerJoin(t2p1, eq(t2p1.id, matches.team2P1Id))
    .innerJoin(t2p2, eq(t2p2.id, matches.team2P2Id))
    .where(
      and(
        eq(matches.status, "completed"),
        or(
          eq(t1p1.userId, userId),
          eq(t1p2.userId, userId),
          eq(t2p1.userId, userId),
          eq(t2p2.userId, userId)
        )
      )
    );

  const out: UserMatchOutcome[] = [];
  for (const r of rows) {
    const inTeam1 =
      r.t1p1UserId === userId || r.t1p2UserId === userId;
    let outcome: MatchOutcome;
    if (r.t1Score === r.t2Score) outcome = "draw";
    else if (inTeam1 ? r.t1Score > r.t2Score : r.t2Score > r.t1Score)
      outcome = "win";
    else outcome = "loss";

    const partnerUserId = inTeam1
      ? r.t1p1UserId === userId
        ? r.t1p2UserId
        : r.t1p1UserId
      : r.t2p1UserId === userId
        ? r.t2p2UserId
        : r.t2p1UserId;
    const opponent1UserId = inTeam1 ? r.t2p1UserId : r.t1p1UserId;
    const opponent2UserId = inTeam1 ? r.t2p2UserId : r.t1p2UserId;

    out.push({
      matchId: r.matchId,
      partnerUserId,
      opponent1UserId,
      opponent2UserId,
      outcome,
    });
  }
  return out;
}

/**
 * Resolve userIds → minimal display rows (id, displayName, avatarUrl).
 */
export async function getUsersById(
  ids: string[]
): Promise<Map<string, { id: string; displayName: string; avatarUrl: string | null }>> {
  if (ids.length === 0) return new Map();
  const dedup = [...new Set(ids)];
  const rows = await db.execute<{
    id: string;
    display_name: string;
    avatar_url: string | null;
  }>(sql`
    SELECT id, display_name, avatar_url
    FROM users
    WHERE id = ANY(${dedup})
  `);
  const map = new Map<
    string,
    { id: string; displayName: string; avatarUrl: string | null }
  >();
  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
    });
  }
  return map;
}
