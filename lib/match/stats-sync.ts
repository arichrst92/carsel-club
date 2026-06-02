/**
 * Match stats sync — applies score change + stats delta atomically.
 *
 * Handles all transitions:
 * - pending → live      : update score, set started_at (no stats sync)
 * - live → completed    : apply impact to stats (matches+1, points+W/D/L)
 * - completed → completed (edit) : delta = new_impact - old_impact
 * - completed → live (revert)    : reverse old_impact
 *
 * Algorithm dijelaskan lengkap di STATE_MACHINES.md.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { matches, matchRoundSets, sessionParticipants, users } from "@/lib/db/schema";
import {
  computeImpact,
  computeDelta,
  isZeroDelta,
  computeTierId,
} from "./stats-helpers";

/**
 * Main entry: change match score + status, sync stats atomically.
 */
export async function applyMatchScoreChange(
  matchId: string,
  newT1Score: number,
  newT2Score: number,
  newStatus: "pending" | "live" | "completed"
): Promise<void> {
  await db.transaction(async (tx) => {
    const [match] = await tx
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) throw new Error("Match tidak ditemukan");

    const oldCounted = match.status === "completed";
    const newCounted = newStatus === "completed";

    const oldImpact = oldCounted
      ? computeImpact(match.team1Score, match.team2Score)
      : null;
    const newImpact = newCounted ? computeImpact(newT1Score, newT2Score) : null;

    const t1Delta = computeDelta(oldImpact?.team1 ?? null, newImpact?.team1 ?? null);
    const t2Delta = computeDelta(oldImpact?.team2 ?? null, newImpact?.team2 ?? null);

    const team1Players = [match.team1P1Id, match.team1P2Id];
    const team2Players = [match.team2P1Id, match.team2P2Id];

    // Apply per-player deltas
    for (const [delta, players] of [
      [t1Delta, team1Players],
      [t2Delta, team2Players],
    ] as const) {
      if (isZeroDelta(delta)) continue;

      for (const participantId of players) {
        // Update session_participants (atomic SQL increment)
        await tx
          .update(sessionParticipants)
          .set({
            sessionPoints: sql`${sessionParticipants.sessionPoints} + ${delta.pointsDelta}`,
            sessionMatches: sql`${sessionParticipants.sessionMatches} + ${delta.matchesDelta}`,
            sessionWins: sql`${sessionParticipants.sessionWins} + ${delta.winsDelta}`,
            sessionLosses: sql`${sessionParticipants.sessionLosses} + ${delta.lossesDelta}`,
            sessionDraws: sql`${sessionParticipants.sessionDraws} + ${delta.drawsDelta}`,
          })
          .where(eq(sessionParticipants.id, participantId));

        // For members (user_id NOT NULL), also update lifetime stats + tier
        const [p] = await tx
          .select({ userId: sessionParticipants.userId })
          .from(sessionParticipants)
          .where(eq(sessionParticipants.id, participantId))
          .limit(1);

        if (p?.userId) {
          await tx
            .update(users)
            .set({
              totalPoints: sql`${users.totalPoints} + ${delta.pointsDelta}`,
              totalMatches: sql`${users.totalMatches} + ${delta.matchesDelta}`,
              totalWins: sql`${users.totalWins} + ${delta.winsDelta}`,
              totalLosses: sql`${users.totalLosses} + ${delta.lossesDelta}`,
              totalDraws: sql`${users.totalDraws} + ${delta.drawsDelta}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, p.userId));

          // Re-evaluate tier
          const [updatedUser] = await tx
            .select({
              totalPoints: users.totalPoints,
              totalMatches: users.totalMatches,
              currentTierId: users.currentTierId,
            })
            .from(users)
            .where(eq(users.id, p.userId))
            .limit(1);

          if (updatedUser) {
            const newTierId = computeTierId(
              updatedUser.totalPoints,
              updatedUser.totalMatches
            );
            if (newTierId !== updatedUser.currentTierId) {
              await tx
                .update(users)
                .set({ currentTierId: newTierId })
                .where(eq(users.id, p.userId));
            }
          }
        }
      }
    }

    // Update match row
    const matchUpdates: Record<string, unknown> = {
      team1Score: newT1Score,
      team2Score: newT2Score,
      status: newStatus,
    };
    if (newStatus === "live" && match.status === "pending") {
      matchUpdates.startedAt = new Date();
    }
    if (newStatus === "completed" && match.status !== "completed") {
      matchUpdates.endedAt = new Date();
    }
    if (newStatus !== "completed" && match.status === "completed") {
      matchUpdates.endedAt = null;
    }

    await tx.update(matches).set(matchUpdates).where(eq(matches.id, matchId));

    // Update match_round_set status based on aggregate match statuses
    // (match row already updated above, so query reflects latest)
    const roundMatches = await tx
      .select({ status: matches.status })
      .from(matches)
      .where(eq(matches.matchRoundSetId, match.matchRoundSetId));

    const allCompleted =
      roundMatches.length > 0 &&
      roundMatches.every((m) => m.status === "completed");
    const anyLive = roundMatches.some((m) => m.status === "live");

    const newRoundStatus = allCompleted
      ? ("completed" as const)
      : anyLive
        ? ("in_progress" as const)
        : ("pending" as const);

    await tx
      .update(matchRoundSets)
      .set({ status: newRoundStatus })
      .where(eq(matchRoundSets.id, match.matchRoundSetId));
  });
}
