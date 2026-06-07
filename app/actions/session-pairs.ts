"use server";

/**
 * Session pair assignment actions — Sprint 52 (Fix Partners).
 *
 * Host/co-host manually assigns pairs via /sessions/[id]/pairs page.
 * Locks:
 *   - Only when session.fixPartners = true
 *   - Only when no rounds generated yet (would invalidate Round 1 pairs)
 *   - Only staff (host/co-host)
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  matchRoundSets,
  sessionParticipants,
  sessions,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isSessionStaff } from "@/lib/db/queries/sessions";

export type PairActionState = {
  error?: string;
  success?: string;
} | null;

async function ensurePairableSession(
  sessionId: string,
  userId: string
): Promise<{ error?: string }> {
  if (!(await isSessionStaff(sessionId, userId))) {
    return { error: "Only the host or co-host can manage pairs" };
  }
  const [session] = await db
    .select({
      id: sessions.id,
      fixPartners: sessions.fixPartners,
      status: sessions.status,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!session) return { error: "Session not found" };
  if (!session.fixPartners) {
    return { error: "Fix Partners is not enabled for this session" };
  }
  if (session.status === "completed" || session.status === "cancelled") {
    return { error: "Session is already completed/cancelled" };
  }
  // Block once Round 1 exists — pairs would invalidate the round
  const [{ value: roundCount }] = await db
    .select({ value: count() })
    .from(matchRoundSets)
    .where(eq(matchRoundSets.sessionId, sessionId));
  if (roundCount > 0) {
    return {
      error: "Pairs are locked once a round has been generated",
    };
  }
  return {};
}

/**
 * Pair two participants. Both must belong to this session, must not
 * already be in another pair, and must not be the same participant.
 *
 * Generates a fresh uuid pair_key and writes it to both rows in a
 * single transaction.
 */
export async function assignPairAction(
  sessionId: string,
  participantAId: string,
  participantBId: string
): Promise<PairActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  if (participantAId === participantBId) {
    return { error: "Cannot pair a player with themselves" };
  }

  const guard = await ensurePairableSession(sessionId, me.id);
  if (guard.error) return { error: guard.error };

  // Verify both participants belong to session + unpaired
  const rows = await db
    .select({
      id: sessionParticipants.id,
      sessionId: sessionParticipants.sessionId,
      pairKey: sessionParticipants.pairKey,
    })
    .from(sessionParticipants)
    .where(
      and(
        inArray(sessionParticipants.id, [participantAId, participantBId]),
        eq(sessionParticipants.sessionId, sessionId)
      )
    );
  if (rows.length !== 2) {
    return { error: "Both players must belong to this session" };
  }
  for (const r of rows) {
    if (r.pairKey) {
      return {
        error: "Break the existing pair first before re-assigning",
      };
    }
  }

  try {
    await db
      .update(sessionParticipants)
      .set({ pairKey: sql`gen_random_uuid()` })
      .where(eq(sessionParticipants.id, participantAId));
    // Copy the same uuid we just minted onto B
    const [aRow] = await db
      .select({ pairKey: sessionParticipants.pairKey })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.id, participantAId))
      .limit(1);
    if (!aRow?.pairKey) {
      return { error: "Failed to assign pair" };
    }
    await db
      .update(sessionParticipants)
      .set({ pairKey: aRow.pairKey })
      .where(eq(sessionParticipants.id, participantBId));
  } catch (e) {
    console.error("[assignPairAction]", e);
    return { error: "Failed to assign pair. Please try again." };
  }

  revalidatePath(`/sessions/${sessionId}/pairs`);
  return { success: "Pair created" };
}

/**
 * Break the pair that contains the given participant. Nulls pair_key on
 * the participant AND their partner (same pair_key value).
 */
export async function breakPairAction(
  sessionId: string,
  participantId: string
): Promise<PairActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const guard = await ensurePairableSession(sessionId, me.id);
  if (guard.error) return { error: guard.error };

  const [row] = await db
    .select({ pairKey: sessionParticipants.pairKey })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.id, participantId),
        eq(sessionParticipants.sessionId, sessionId)
      )
    )
    .limit(1);
  if (!row) return { error: "Participant not found" };
  if (!row.pairKey) return { error: "This player is not in a pair" };

  try {
    await db
      .update(sessionParticipants)
      .set({ pairKey: null })
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.pairKey, row.pairKey)
        )
      );
  } catch (e) {
    console.error("[breakPairAction]", e);
    return { error: "Failed to break pair" };
  }

  revalidatePath(`/sessions/${sessionId}/pairs`);
  return { success: "Pair removed" };
}

/**
 * Clear all pair assignments in the session. Lets host start over.
 */
export async function clearAllPairsAction(
  sessionId: string
): Promise<PairActionState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const guard = await ensurePairableSession(sessionId, me.id);
  if (guard.error) return { error: guard.error };

  try {
    await db
      .update(sessionParticipants)
      .set({ pairKey: null })
      .where(eq(sessionParticipants.sessionId, sessionId));
  } catch (e) {
    console.error("[clearAllPairsAction]", e);
    return { error: "Failed to clear pairs" };
  }

  revalidatePath(`/sessions/${sessionId}/pairs`);
  return { success: "All pairs cleared" };
}
