"use server";

/**
 * Match-related Server Actions.
 * - generateRoundAction: create new MatchRoundSet + Matches via algorithm
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matches,
  matchRoundSets,
  sessions,
  sessionParticipants,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import {
  buildPairHistoryForSession,
  getNextRoundNumber,
} from "@/lib/db/queries/matches";
import { generateRound } from "@/lib/match/generator";

export async function generateRoundAction(
  sessionId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa generate round" };
  }

  // Load session
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return { error: "Session tidak ditemukan" };
  if (session.status === "cancelled" || session.status === "completed") {
    return { error: "Session sudah selesai/dibatalkan" };
  }

  // Get active participants
  const activeParticipants = await db
    .select({
      id: sessionParticipants.id,
      sessionMatches: sessionParticipants.sessionMatches,
    })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.isPlaying, true)
      )
    );

  if (activeParticipants.length < 4) {
    return {
      error: `Butuh minimal 4 pemain aktif (sekarang ${activeParticipants.length}). Tambah pemain atau toggle 'ikut main'.`,
    };
  }

  // Build pair history
  const pairHistory = await buildPairHistoryForSession(sessionId);

  // Generate
  let result;
  try {
    result = generateRound(
      activeParticipants,
      session.numCourts,
      pairHistory
    );
  } catch (e) {
    console.error("[generateRoundAction] algo error:", e);
    return { error: "Gagal generate pairing. Coba lagi." };
  }

  // Get next round number
  const nextRoundNumber = await getNextRoundNumber(sessionId);

  // Atomic insert: round_set + matches + maybe transition session to 'live'
  try {
    await db.transaction(async (tx) => {
      const [round] = await tx
        .insert(matchRoundSets)
        .values({
          sessionId,
          roundNumber: nextRoundNumber,
          generationMethod: "auto_random",
          generatedBy: me.id,
          status: "pending",
        })
        .returning({ id: matchRoundSets.id });

      if (result.matches.length > 0) {
        await tx.insert(matches).values(
          result.matches.map((m) => ({
            matchRoundSetId: round.id,
            courtNumber: m.courtNumber,
            matchPosition: m.courtNumber,
            team1P1Id: m.team1[0],
            team1P2Id: m.team1[1],
            team2P1Id: m.team2[0],
            team2P2Id: m.team2[1],
            status: "pending" as const,
          }))
        );
      }

      // Auto-transition session to 'live' on first round
      if (nextRoundNumber === 1 && session.status === "upcoming") {
        await tx
          .update(sessions)
          .set({ status: "live", updatedAt: new Date() })
          .where(eq(sessions.id, sessionId));
      }
    });
  } catch (e) {
    console.error("[generateRoundAction] insert error:", e);
    return { error: "Gagal save round. Coba lagi." };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return null;
}
