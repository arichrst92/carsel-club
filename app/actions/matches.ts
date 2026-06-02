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
import { applyMatchScoreChange } from "@/lib/match/stats-sync";
import { event } from "@/lib/log";

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

  event("round_generated", {
    sessionId,
    roundNumber: nextRoundNumber,
    courts: result.matches.length,
    players: activeParticipants.length,
    sitOuts: result.sitOuts.length,
    violations: result.violations,
  });

  revalidatePath(`/sessions/${sessionId}`);
  return null;
}

// ============================================================
// Score validation + authorization helper
// ============================================================

async function loadMatchForMutation(matchId: string): Promise<
  | { ok: true; sessionId: string; status: "pending" | "live" | "completed" }
  | { error: string }
> {
  const [row] = await db
    .select({
      status: matches.status,
      sessionId: matchRoundSets.sessionId,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matches.matchRoundSetId, matchRoundSets.id))
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!row) return { error: "Match tidak ditemukan" };
  return { ok: true, sessionId: row.sessionId, status: row.status };
}

function validateScore(t1: number, t2: number): string | null {
  if (!Number.isInteger(t1) || !Number.isInteger(t2)) {
    return "Score harus angka bulat";
  }
  if (t1 < 0 || t2 < 0) return "Score tidak boleh negatif";
  if (t1 > 99 || t2 > 99) return "Score maksimum 99";
  return null;
}

// ============================================================
// Update score (pending → live OR live → live)
// ============================================================

export async function updateMatchScoreAction(
  matchId: string,
  team1Score: number,
  team2Score: number
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const scoreErr = validateScore(team1Score, team2Score);
  if (scoreErr) return { error: scoreErr };

  const loaded = await loadMatchForMutation(matchId);
  if (!("ok" in loaded)) return loaded;

  if (!(await isSessionStaff(loaded.sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa update score" };
  }

  if (loaded.status === "completed") {
    return {
      error: "Match sudah completed. Pakai Edit Score untuk koreksi.",
    };
  }

  try {
    await applyMatchScoreChange(matchId, team1Score, team2Score, "live");
  } catch (e) {
    console.error("[updateMatchScoreAction]", e);
    return { error: "Gagal update score." };
  }

  revalidatePath(`/sessions/${loaded.sessionId}`);
  return null;
}

// ============================================================
// End match (→ completed + apply stats)
// ============================================================

export async function endMatchAction(
  matchId: string,
  team1Score: number,
  team2Score: number
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const scoreErr = validateScore(team1Score, team2Score);
  if (scoreErr) return { error: scoreErr };

  const loaded = await loadMatchForMutation(matchId);
  if (!("ok" in loaded)) return loaded;

  if (!(await isSessionStaff(loaded.sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa end match" };
  }

  if (loaded.status === "completed") {
    return { error: "Match sudah completed. Pakai Edit Score." };
  }

  try {
    await applyMatchScoreChange(matchId, team1Score, team2Score, "completed");
  } catch (e) {
    console.error("[endMatchAction]", e);
    return { error: "Gagal end match." };
  }

  event("match_completed", {
    matchId,
    sessionId: loaded.sessionId,
    team1Score,
    team2Score,
    outcome:
      team1Score > team2Score
        ? "team1_win"
        : team2Score > team1Score
          ? "team2_win"
          : "draw",
  });

  revalidatePath(`/sessions/${loaded.sessionId}`);
  return null;
}

// ============================================================
// Edit completed match score (apply delta)
// ============================================================

export async function editCompletedMatchScoreAction(
  matchId: string,
  team1Score: number,
  team2Score: number
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const scoreErr = validateScore(team1Score, team2Score);
  if (scoreErr) return { error: scoreErr };

  const loaded = await loadMatchForMutation(matchId);
  if (!("ok" in loaded)) return loaded;

  if (!(await isSessionStaff(loaded.sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa edit score" };
  }

  if (loaded.status !== "completed") {
    return {
      error: "Match belum completed. Pakai +/− buttons saat live atau End Match.",
    };
  }

  try {
    await applyMatchScoreChange(matchId, team1Score, team2Score, "completed");
  } catch (e) {
    console.error("[editCompletedMatchScoreAction]", e);
    return { error: "Gagal edit score." };
  }

  revalidatePath(`/sessions/${loaded.sessionId}`);
  return null;
}
