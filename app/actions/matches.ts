"use server";

/**
 * Match-related Server Actions.
 * - generateRoundAction: create new MatchRoundSet + Matches via algorithm
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
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
import { generateMexicanoRound } from "@/lib/match/generator-mexicano";
import {
  formInitialPairs,
  extractPairs,
  generateFixPartnersRound,
} from "@/lib/match/generator-fix-partners";
import { applyMatchScoreChange } from "@/lib/match/stats-sync";
import { event } from "@/lib/log";
import {
  transitionForMatchStart,
  transitionForMatchRevert,
  canAdjustScore,
} from "@/lib/match/lifecycle";
import { validateSwap, type MatchSlotKey } from "@/lib/match/swap";

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

  if (!session) return { error: "Session not found" };
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
      sessionPoints: sessionParticipants.sessionPoints,
      isPlaying: sessionParticipants.isPlaying,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));

  const activeParticipants = overrideSet
    ? allParticipants.filter((p) => overrideSet.has(p.id))
    : allParticipants.filter((p) => p.isPlaying);

  if (activeParticipants.length < 4) {
    return {
      error: `Need at least 4 active players (currently ${activeParticipants.length}). Add players or toggle 'I will play'.`,
    };
  }

  // Build pair history
  const pairHistory = await buildPairHistoryForSession(sessionId);

  // Get next round number (untuk Mexicano: round 1 fallback ke random)
  const nextRoundNumber = await getNextRoundNumber(sessionId);

  // Sprint 16 + 17: dispatch by format + fixPartners
  const isMexicano = session.format === "mexicano";
  const useFixPartners = session.fixPartners;
  const generationMethod = isMexicano ? "auto_mexicano" : "auto_random";

  let result;
  try {
    if (useFixPartners) {
      // Sprint 17: Round Robin dengan pair tetap
      // Round 1 → form pairs. Round 2+ → extract dari round sebelumnya.
      let pairs;
      if (nextRoundNumber === 1) {
        pairs = formInitialPairs(
          activeParticipants.map((p) => ({
            id: p.id,
            sessionMatches: p.sessionMatches,
            sessionPoints: p.sessionPoints,
          })),
          session.format
        );
      } else {
        // Extract dari semua match round sebelumnya
        const allPriorMatches = await db
          .select({
            team1P1Id: matches.team1P1Id,
            team1P2Id: matches.team1P2Id,
            team2P1Id: matches.team2P1Id,
            team2P2Id: matches.team2P2Id,
          })
          .from(matches)
          .innerJoin(
            matchRoundSets,
            eq(matches.matchRoundSetId, matchRoundSets.id)
          )
          .where(eq(matchRoundSets.sessionId, sessionId));
        pairs = extractPairs(allPriorMatches);
      }

      if (pairs.length < 2) {
        return {
          error:
            "Need at least 4 active players and valid pairs for a Fix Partners round",
        };
      }

      result = generateFixPartnersRound(
        pairs,
        session.numCourts,
        pairHistory,
        nextRoundNumber - 1 // 0-indexed untuk round robin
      );
    } else if (isMexicano) {
      result = generateMexicanoRound(
        activeParticipants.map((p) => ({
          id: p.id,
          sessionMatches: p.sessionMatches,
          sessionPoints: p.sessionPoints,
        })),
        session.numCourts,
        pairHistory,
        nextRoundNumber === 1
      );
    } else {
      result = generateRound(
        activeParticipants.map((p) => ({
          id: p.id,
          sessionMatches: p.sessionMatches,
        })),
        session.numCourts,
        pairHistory
      );
    }
  } catch (e) {
    console.error("[generateRoundAction] algo error:", e);
    return { error: "Gagal generate pairing. Coba lagi." };
  }

  // Atomic insert: round_set + matches + maybe transition session to 'live'
  try {
    await db.transaction(async (tx) => {
      const [round] = await tx
        .insert(matchRoundSets)
        .values({
          sessionId,
          roundNumber: nextRoundNumber,
          generationMethod,
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
    format: session.format,
    method: generationMethod,
  });

  revalidatePath(`/sessions/${sessionId}`);
  return null;
}

// ============================================================
// Regenerate Round — hapus pending matches + re-run generator
// ============================================================

export async function regenerateRoundAction(
  roundSetId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  // Load round set + matches
  const [round] = await db
    .select()
    .from(matchRoundSets)
    .where(eq(matchRoundSets.id, roundSetId))
    .limit(1);

  if (!round) return { error: "Round tidak ditemukan" };

  if (!(await isSessionStaff(round.sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa regenerate" };
  }

  if (round.status !== "pending") {
    return {
      error: "Hanya round status 'pending' yang bisa di-regenerate",
    };
  }

  // Check semua matches pending
  const existingMatches = await db
    .select({
      id: matches.id,
      status: matches.status,
      team1P1Id: matches.team1P1Id,
      team1P2Id: matches.team1P2Id,
      team2P1Id: matches.team2P1Id,
      team2P2Id: matches.team2P2Id,
    })
    .from(matches)
    .where(eq(matches.matchRoundSetId, roundSetId));

  const allPending = existingMatches.every((m) => m.status === "pending");
  if (!allPending) {
    return {
      error:
        "Ada match yang sudah live/completed. Hanya round dengan semua match pending yang bisa di-regenerate.",
    };
  }

  // Derive participant pool dari matches existing (yg dipilih saat generate awal)
  const originalParticipantIds = new Set<string>();
  for (const m of existingMatches) {
    originalParticipantIds.add(m.team1P1Id);
    originalParticipantIds.add(m.team1P2Id);
    originalParticipantIds.add(m.team2P1Id);
    originalParticipantIds.add(m.team2P2Id);
  }

  // Load fresh sessionMatches stats untuk participants (untuk sit-out fairness)
  const participants = await db
    .select({
      id: sessionParticipants.id,
      sessionMatches: sessionParticipants.sessionMatches,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, round.sessionId));

  const activePool = participants.filter((p) =>
    originalParticipantIds.has(p.id)
  );

  if (activePool.length < 4) {
    return { error: "Need at least 4 players to regenerate" };
  }

  // Load session untuk numCourts
  const [session] = await db
    .select({ numCourts: sessions.numCourts })
    .from(sessions)
    .where(eq(sessions.id, round.sessionId))
    .limit(1);
  if (!session) return { error: "Session not found" };

  // Pair history dari rounds LAIN (exclude current round yang sedang
  // di-regenerate, supaya pasangan di round ini tidak jadi self-reference).
  const pastMatchesExcludingCurrent = await db
    .select({
      team1P1Id: matches.team1P1Id,
      team1P2Id: matches.team1P2Id,
      team2P1Id: matches.team2P1Id,
      team2P2Id: matches.team2P2Id,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matches.matchRoundSetId, matchRoundSets.id))
    .where(
      and(
        eq(matchRoundSets.sessionId, round.sessionId),
        ne(matches.matchRoundSetId, roundSetId)
      )
    );

  const pairHistory = new Map<string, Set<string>>();
  function record(a: string, b: string) {
    if (!pairHistory.has(a)) pairHistory.set(a, new Set());
    pairHistory.get(a)!.add(b);
    if (!pairHistory.has(b)) pairHistory.set(b, new Set());
    pairHistory.get(b)!.add(a);
  }
  for (const m of pastMatchesExcludingCurrent) {
    record(m.team1P1Id, m.team1P2Id);
    record(m.team2P1Id, m.team2P2Id);
  }

  // Regenerate
  let result;
  try {
    result = generateRound(activePool, session.numCourts, pairHistory);
  } catch (e) {
    console.error("[regenerateRoundAction] algo error:", e);
    return { error: "Gagal generate pairing. Coba lagi." };
  }

  // Transaction: delete existing matches + insert new
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(matches)
        .where(eq(matches.matchRoundSetId, roundSetId));

      if (result.matches.length > 0) {
        await tx.insert(matches).values(
          result.matches.map((m) => ({
            matchRoundSetId: roundSetId,
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

      // Update generated_by (track who regenerated last)
      await tx
        .update(matchRoundSets)
        .set({ generatedBy: me.id })
        .where(eq(matchRoundSets.id, roundSetId));
    });
  } catch (e) {
    console.error("[regenerateRoundAction] tx error:", e);
    return { error: "Gagal save round. Coba lagi." };
  }

  event("round_regenerated", {
    sessionId: round.sessionId,
    roundSetId,
    roundNumber: round.roundNumber,
    courts: result.matches.length,
    players: activePool.length,
    violations: result.violations,
  });

  revalidatePath(`/sessions/${round.sessionId}`);
  revalidatePath(`/sessions/${round.sessionId}/matches`);
  return null;
}

// ============================================================
// Swap 2 pemain (Sprint 15)
// ============================================================

export async function swapPlayersAction(
  matchAId: string,
  slotA: MatchSlotKey,
  matchBId: string,
  slotB: MatchSlotKey
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const isSameMatch = matchAId === matchBId;

  // Load match A (dgn round info untuk staff check)
  const [rowA] = await db
    .select({
      id: matches.id,
      status: matches.status,
      matchRoundSetId: matches.matchRoundSetId,
      sessionId: matchRoundSets.sessionId,
      team1P1Id: matches.team1P1Id,
      team1P2Id: matches.team1P2Id,
      team2P1Id: matches.team2P1Id,
      team2P2Id: matches.team2P2Id,
    })
    .from(matches)
    .innerJoin(matchRoundSets, eq(matches.matchRoundSetId, matchRoundSets.id))
    .where(eq(matches.id, matchAId))
    .limit(1);

  if (!rowA) return { error: "Match A tidak ditemukan" };

  if (!(await isSessionStaff(rowA.sessionId, me.id))) {
    return { error: "Only the host/co-host can swap players" };
  }

  // Status check: hanya pending
  if (rowA.status !== "pending") {
    return {
      error: "Only matches with status 'pending' can have players swapped",
    };
  }

  let rowB = rowA;
  if (!isSameMatch) {
    const [matchB] = await db
      .select({
        id: matches.id,
        status: matches.status,
        matchRoundSetId: matches.matchRoundSetId,
        team1P1Id: matches.team1P1Id,
        team1P2Id: matches.team1P2Id,
        team2P1Id: matches.team2P1Id,
        team2P2Id: matches.team2P2Id,
      })
      .from(matches)
      .where(eq(matches.id, matchBId))
      .limit(1);
    if (!matchB) return { error: "Match B tidak ditemukan" };

    if (matchB.matchRoundSetId !== rowA.matchRoundSetId) {
      return { error: "Swap hanya boleh dalam round yang sama" };
    }
    if (matchB.status !== "pending") {
      return {
        error: "Match B sudah live/completed, tidak bisa di-swap",
      };
    }
    rowB = { ...matchB, sessionId: rowA.sessionId };
  }

  // Pure validate
  const validation = validateSwap(
    {
      team1P1Id: rowA.team1P1Id,
      team1P2Id: rowA.team1P2Id,
      team2P1Id: rowA.team2P1Id,
      team2P2Id: rowA.team2P2Id,
    },
    slotA,
    {
      team1P1Id: rowB.team1P1Id,
      team1P2Id: rowB.team1P2Id,
      team2P1Id: rowB.team2P1Id,
      team2P2Id: rowB.team2P2Id,
    },
    slotB,
    isSameMatch
  );
  if (!validation.ok) return { error: validation.error };

  // Apply via transaction
  try {
    await db.transaction(async (tx) => {
      if (isSameMatch) {
        // Tukar di satu match
        const out = {
          team1P1Id: rowA.team1P1Id,
          team1P2Id: rowA.team1P2Id,
          team2P1Id: rowA.team2P1Id,
          team2P2Id: rowA.team2P2Id,
        };
        const tmp = out[slotA];
        out[slotA] = out[slotB];
        out[slotB] = tmp;
        await tx.update(matches).set(out).where(eq(matches.id, matchAId));
      } else {
        const idA = rowA[slotA];
        const idB = rowB[slotB];
        await tx
          .update(matches)
          .set({ [slotA]: idB })
          .where(eq(matches.id, matchAId));
        await tx
          .update(matches)
          .set({ [slotB]: idA })
          .where(eq(matches.id, matchBId));
      }
    });
  } catch (e) {
    console.error("[swapPlayersAction] tx error:", e);
    return { error: "Gagal swap. Coba lagi." };
  }

  event("match_swap", {
    sessionId: rowA.sessionId,
    matchAId,
    slotA,
    matchBId,
    slotB,
    sameMatch: isSameMatch,
  });

  revalidatePath(`/sessions/${rowA.sessionId}`);
  revalidatePath(`/sessions/${rowA.sessionId}/matches`);
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
    return { error: "Start the match first (tap Start Game)." };
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

  // Sprint 43: match_result notification dihapus — match detail page
  // tetap accessible via session detail, history page punya filter W/L.

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
