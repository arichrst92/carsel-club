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
import {
  transitionForMatchStart,
  transitionForMatchRevert,
  canAdjustScore,
} from "@/lib/match/lifecycle";

export type GenerateRoundOptions = {
  /**
   * Sprint 13: per-round override participant IDs yang ikut main.
   * Kalau undefined → fallback ke isPlaying flag (default behavior).
   * Kalau provided → cuma ID ini yang dipakai, regardless of isPlaying.
   */
  playingParticipantIds?: string[];
};

export async function generateRoundAction(
  sessionId: string,
  options: GenerateRoundOptions = {}
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

  // Get active participants — apply per-round override kalau ada
  const overrideSet = options.playingParticipantIds
    ? new Set(options.playingParticipantIds)
    : null;

  const allParticipants = await db
    .select({
      id: sessionParticipants.id,
      sessionMatches: sessionParticipants.sessionMatches,
      isPlaying: sessionParticipants.isPlaying,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));

  const activeParticipants = overrideSet
    ? allParticipants
        .filter((p) => overrideSet.has(p.id))
        .map((p) => ({ id: p.id, sessionMatches: p.sessionMatches }))
    : allParticipants
        .filter((p) => p.isPlaying)
        .map((p) => ({ id: p.id, sessionMatches: p.sessionMatches }));

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
    hasOverride: !!overrideSet,
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

  // Strict: pending matches harus di-Start dulu (Sprint 4 enforcement).
  if (!canAdjustScore(loaded.status)) {
    return { error: "Mulai match dulu (klik Start Game)." };
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
// Start Match — pending → live + started_at
// ============================================================

export async function startMatchAction(
  matchId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const loaded = await loadMatchForMutation(matchId);
  if (!("ok" in loaded)) return loaded;

  if (!(await isSessionStaff(loaded.sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa start match" };
  }

  try {
    transitionForMatchStart(loaded.status);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tidak bisa start" };
  }

  // Transition pending → live, scores stay 0 (no stats applied).
  try {
    await applyMatchScoreChange(matchId, 0, 0, "live");
  } catch (e) {
    console.error("[startMatchAction]", e);
    return { error: "Gagal start match." };
  }

  event("match_started", { matchId, sessionId: loaded.sessionId });
  revalidatePath(`/sessions/${loaded.sessionId}`);
  revalidatePath(`/sessions/${loaded.sessionId}/matches`);
  return null;
}

// ============================================================
// Revert Match — completed → live (preserve scores, reverse stats)
// ============================================================

export async function revertMatchAction(
  matchId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const loaded = await loadMatchForMutation(matchId);
  if (!("ok" in loaded)) return loaded;

  if (!(await isSessionStaff(loaded.sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa revert" };
  }

  try {
    transitionForMatchRevert(loaded.status);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tidak bisa revert" };
  }

  // Load current scores untuk dipertahankan
  const [row] = await db
    .select({ t1: matches.team1Score, t2: matches.team2Score })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!row) return { error: "Match tidak ditemukan" };

  // applyMatchScoreChange dari completed → live akan reverse stats
  // (delta dari completed-impact ke null-impact = negate).
  try {
    await applyMatchScoreChange(matchId, row.t1, row.t2, "live");
  } catch (e) {
    console.error("[revertMatchAction]", e);
    return { error: "Gagal revert match." };
  }

  event("match_reverted", {
    matchId,
    sessionId: loaded.sessionId,
    preservedScores: { team1: row.t1, team2: row.t2 },
  });
  revalidatePath(`/sessions/${loaded.sessionId}`);
  revalidatePath(`/sessions/${loaded.sessionId}/matches`);
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
