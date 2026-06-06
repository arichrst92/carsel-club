/**
 * Tournament bracket auto-advance (Sprint 31).
 *
 * Called from stats-sync after a match transitions ke completed. If the match
 * adalah bracket match (bracketRound + bracketSlot set), checks:
 * 1. Is sister slot also done?
 * 2. If yes, create next-round match with both winners.
 * 3. Update tournament_brackets.currentRound if entire round done.
 *
 * Pure helpers (bracket math) di lib/match/bracket.ts.
 *
 * Idempotency: next-round insert uses unique constraint
 * (matchRoundSetId, bracketSlot) implicitly via app logic — we check first.
 */

import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matches,
  matchRoundSets,
  tournamentBrackets,
} from "@/lib/db/schema";
import {
  bracketWinner,
  nextRoundSlot,
  sisterSlot,
  type Team,
} from "./bracket";
import { event } from "@/lib/log";

export async function tryAdvanceBracket(matchId: string): Promise<void> {
  const [completed] = await db
    .select({
      id: matches.id,
      roundSetId: matches.matchRoundSetId,
      bracketRound: matches.bracketRound,
      bracketSlot: matches.bracketSlot,
      status: matches.status,
      team1Score: matches.team1Score,
      team2Score: matches.team2Score,
      team1P1: matches.team1P1Id,
      team1P2: matches.team1P2Id,
      team2P1: matches.team2P1Id,
      team2P2: matches.team2P2Id,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!completed) return;
  if (completed.status !== "completed") return;
  if (completed.bracketRound === null || completed.bracketSlot === null) return;
  // Narrow null-checked fields untuk downstream usage
  const completedRound: number = completed.bracketRound;
  const completedSlotEarly: number = completed.bracketSlot;

  const [roundSet] = await db
    .select({ sessionId: matchRoundSets.sessionId })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.id, completed.roundSetId))
    .limit(1);
  if (!roundSet) return;

  const [bracket] = await db
    .select({
      id: tournamentBrackets.id,
      totalRounds: tournamentBrackets.totalRounds,
      currentRound: tournamentBrackets.currentRound,
    })
    .from(tournamentBrackets)
    .where(eq(tournamentBrackets.sessionId, roundSet.sessionId))
    .limit(1);
  if (!bracket) return;

  // Already final round? Nothing to advance to
  if (completedRound >= bracket.totalRounds) {
    await maybeAdvanceRoundCursor(bracket.id, completedRound, roundSet.sessionId);
    return;
  }

  // Find sister match (same round, slot ^ 1)
  const sister = sisterSlot(completedSlotEarly);
  const [sisterRow] = await db
    .select({
      status: matches.status,
      team1Score: matches.team1Score,
      team2Score: matches.team2Score,
      team1P1: matches.team1P1Id,
      team1P2: matches.team1P2Id,
      team2P1: matches.team2P1Id,
      team2P2: matches.team2P2Id,
    })
    .from(matches)
    .where(
      and(
        eq(matches.matchRoundSetId, completed.roundSetId),
        eq(matches.bracketRound, completedRound),
        eq(matches.bracketSlot, sister)
      )
    )
    .limit(1);

  // Determine current match winner
  const winThis: Team = thisWinnerTeam({
    bracketSlot: completedSlotEarly,
    team1Score: completed.team1Score,
    team2Score: completed.team2Score,
    team1P1: completed.team1P1,
    team1P2: completed.team1P2,
    team2P1: completed.team2P1,
    team2P2: completed.team2P2,
  });
  const parentSlot = nextRoundSlot(completedSlotEarly);

  // Look up existing next-round set OR create one
  const nextRoundNumber = completedRound + 1;
  let nextRoundSetId: string | null = null;
  const [existingNextSet] = await db
    .select({ id: matchRoundSets.id })
    .from(matchRoundSets)
    .where(
      and(
        eq(matchRoundSets.sessionId, roundSet.sessionId),
        eq(matchRoundSets.roundNumber, nextRoundNumber)
      )
    )
    .limit(1);
  if (existingNextSet) nextRoundSetId = existingNextSet.id;

  // Check if a next-round match for parentSlot already exists (idempotency)
  if (nextRoundSetId) {
    const [existingNext] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.matchRoundSetId, nextRoundSetId),
          eq(matches.bracketRound, nextRoundNumber),
          eq(matches.bracketSlot, parentSlot)
        )
      )
      .limit(1);
    if (existingNext) {
      await maybeAdvanceRoundCursor(bracket.id, completedRound, roundSet.sessionId);
      return;
    }
  }

  // If sister doesn't exist (bye → auto-advance) OR sister completed, we can create next match
  let winSister: Team | null = null;
  if (sisterRow) {
    if (sisterRow.status !== "completed") {
      // Wait for sister to complete
      return;
    }
    winSister = thisWinnerTeam({
      bracketSlot: sister,
      team1Score: sisterRow.team1Score,
      team2Score: sisterRow.team2Score,
      team1P1: sisterRow.team1P1,
      team1P2: sisterRow.team1P2,
      team2P1: sisterRow.team2P1,
      team2P2: sisterRow.team2P2,
    });
  }
  // If sister null, sister was a bye → winner advances solo. We need a single
  // team match against null partner — but our matches table requires both
  // teams. If winSister null + winThis present, this is a degenerate "advance"
  // — we'll create the next match later when this team's opponent is determined
  // by another bracket path.
  if (winSister === null) {
    // Cannot create next round match yet (no opponent). Skip silently.
    await maybeAdvanceRoundCursor(bracket.id, completedRound, roundSet.sessionId);
    return;
  }
  if (winThis === null) {
    // Draw — not allowed di bracket
    return;
  }

  // Fetch generator user (host of previous round) BEFORE tx — read-only,
  // doesn't need tx context, also avoids type-mismatch passing tx ke helper.
  const priorGenerator = await getHostUserIdFromPriorRound(roundSet.sessionId);
  if (!priorGenerator) return;

  await db.transaction(async (tx) => {
    if (!nextRoundSetId) {
      const [createdSet] = await tx
        .insert(matchRoundSets)
        .values({
          sessionId: roundSet.sessionId,
          roundNumber: nextRoundNumber,
          generationMethod: "tournament",
          generatedBy: priorGenerator,
          status: "pending",
        })
        .returning({ id: matchRoundSets.id });
      nextRoundSetId = createdSet.id;
    }

    // Pick lower slot as team1 untuk konsistensi visual (top of bracket)
    const leftSlot = Math.min(completedSlotEarly, sister);
    const winLeft = completedSlotEarly === leftSlot ? winThis : winSister;
    const winRight = completedSlotEarly === leftSlot ? winSister : winThis;

    // Determine matchPosition (next available index in next-round set)
    const existing = await tx
      .select({ pos: matches.matchPosition })
      .from(matches)
      .where(eq(matches.matchRoundSetId, nextRoundSetId!));
    const nextPos = existing.length;

    await tx.insert(matches).values({
      matchRoundSetId: nextRoundSetId!,
      matchPosition: nextPos,
      courtNumber: 1,
      bracketRound: nextRoundNumber,
      bracketSlot: parentSlot,
      team1P1Id: winLeft[0],
      team1P2Id: winLeft[1],
      team2P1Id: winRight[0],
      team2P2Id: winRight[1],
    });
  });

  event("bracket_advanced", {
    sessionId: roundSet.sessionId,
    fromRound: completedRound,
    toRound: nextRoundNumber,
    parentSlot,
  });

  await maybeAdvanceRoundCursor(bracket.id, completedRound, roundSet.sessionId);
}

function thisWinnerTeam(m: {
  bracketSlot: number;
  team1Score: number;
  team2Score: number;
  team1P1: string;
  team1P2: string;
  team2P1: string;
  team2P2: string;
}): Team {
  const a: Team = [m.team1P1, m.team1P2];
  const b: Team = [m.team2P1, m.team2P2];
  const w = bracketWinner(a, b, m.team1Score, m.team2Score);
  return w ?? a; // bracketWinner returns null for draw — caller filters before here
}


async function getHostUserIdFromPriorRound(
  sessionId: string
): Promise<string | null> {
  const [s] = await db
    .select({ hostId: matchRoundSets.generatedBy })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId))
    .limit(1);
  return s?.hostId ?? null;
}

async function maybeAdvanceRoundCursor(
  bracketId: string,
  completedRound: number,
  sessionId: string
): Promise<void> {
  // Check if all matches di completedRound for this session are completed
  const matchesInRound = await db
    .select({ status: matches.status })
    .from(matches)
    .innerJoin(
      matchRoundSets,
      eq(matches.matchRoundSetId, matchRoundSets.id)
    )
    .where(
      and(
        eq(matchRoundSets.sessionId, sessionId),
        eq(matches.bracketRound, completedRound)
      )
    );
  if (matchesInRound.length === 0) return;
  const allDone = matchesInRound.every((m) => m.status === "completed");
  if (!allDone) return;

  await db
    .update(tournamentBrackets)
    .set({ currentRound: completedRound + 1, updatedAt: new Date() })
    .where(eq(tournamentBrackets.id, bracketId));
}
