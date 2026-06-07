"use server";

/**
 * Tournament bracket actions (Sprint 31).
 *
 * - generateBracketAction: read participants → form teams → seed → create
 *   round 1 matchRoundSet + matches (skip bye slots) + tournament_brackets row
 *
 * Auto-advance handled by stats-sync via tryAdvanceBracket helper after
 * each match completed.
 *
 * Refs:
 * - DB: tournament_brackets + matches.bracket_round/slot + match_round_sets
 * - Pure: lib/match/bracket.ts
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 31
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  sessions,
  sessionParticipants,
  matchRoundSets,
  matches,
  tournamentBrackets,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";
import {
  computeBracketSize,
  computeTotalRounds,
  buildFirstRoundPairings,
  validateTeamCount,
  validateTeams,
  seedTeams,
  type Team,
} from "@/lib/match/bracket";
import { event } from "@/lib/log";

export type TournamentActionResult =
  | { error: string }
  | { ok: true; bracketSize: number; totalRounds: number; matchesCreated: number };

export async function generateBracketAction(
  sessionId: string,
  seedingMethod: "by_join_order" | "random" = "by_join_order"
): Promise<TournamentActionResult> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!(await isSessionStaff(sessionId, me.id))) {
    return { error: "Hanya host/co-host yang bisa generate bracket" };
  }

  const [session] = await db
    .select({ id: sessions.id, format: sessions.format })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session) return { error: "Session not found" };
  if (session.format !== "tournament") {
    return { error: "Session ini bukan tournament format" };
  }

  // Existing bracket?
  const [existing] = await db
    .select({ id: tournamentBrackets.id })
    .from(tournamentBrackets)
    .where(eq(tournamentBrackets.sessionId, sessionId))
    .limit(1);
  if (existing) return { error: "Bracket has already been generated" };

  // Read participants (host + members + guests), order by joinedAt
  const parts = await db
    .select({
      id: sessionParticipants.id,
      isPlaying: sessionParticipants.isPlaying,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId))
    .orderBy(asc(sessionParticipants.joinedAt));
  const playing = parts.filter((p) => p.isPlaying).map((p) => p.id);
  if (playing.length % 2 !== 0) {
    return { error: "Number of players must be even (pair-based teams)" };
  }
  const teams: Team[] = [];
  for (let i = 0; i < playing.length; i += 2) {
    teams.push([playing[i], playing[i + 1]]);
  }

  const teamErr = validateTeamCount(teams.length);
  if (teamErr) return { error: teamErr };
  const teamsErr = validateTeams(teams);
  if (teamsErr) return { error: teamsErr };

  const seeded = seedTeams(teams, seedingMethod);
  const bracketSize = computeBracketSize(seeded.length);
  const totalRounds = computeTotalRounds(seeded.length);
  const pairings = buildFirstRoundPairings(seeded, bracketSize);

  let matchesCreated = 0;
  try {
    await db.transaction(async (tx) => {
      // Insert bracket row
      await tx.insert(tournamentBrackets).values({
        sessionId,
        seedingMethod,
        totalRounds,
        currentRound: 1,
      });

      // Insert round 1 set
      const [round1] = await tx
        .insert(matchRoundSets)
        .values({
          sessionId,
          roundNumber: 1,
          generationMethod: "tournament",
          generatedBy: me.id,
          status: "pending",
        })
        .returning({ id: matchRoundSets.id });

      // Insert matches (skip byes)
      let position = 0;
      for (const p of pairings) {
        if (p.isBye || !p.team1 || !p.team2) continue;
        await tx.insert(matches).values({
          matchRoundSetId: round1.id,
          matchPosition: position++,
          courtNumber: 1,
          bracketRound: 1,
          bracketSlot: p.slot,
          team1P1Id: p.team1[0],
          team1P2Id: p.team1[1],
          team2P1Id: p.team2[0],
          team2P2Id: p.team2[1],
        });
        matchesCreated++;
      }
    });
  } catch (e) {
    console.error("[generateBracketAction]", e);
    return { error: "Failed to generate bracket" };
  }

  event("bracket_generated", {
    sessionId,
    seedingMethod,
    teamCount: teams.length,
    bracketSize,
    totalRounds,
    matchesCreated,
  });

  revalidatePath(`/sessions/${sessionId}`);
  return {
    ok: true,
    bracketSize,
    totalRounds,
    matchesCreated,
  };
}

// Suppress unused
void and;
void sql;
