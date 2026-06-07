/**
 * Session pair queries — Sprint 52 (Fix Partners).
 *
 * `pair_key` groups participants who form a fixed team. Used only when
 * sessions.fix_partners = true. New flow vs old auto-form flow:
 *   - Old (pre-Sprint 52): auto shuffle/rank at Round 1 generate
 *   - New: host manually assigns pairs via /pairs page BEFORE Round 1
 *
 * Backward-compat:
 *   `sessionHasAssignedPairs()` returns true iff at least one participant
 *   has pair_key set. Caller uses this to decide between new (DB pairs)
 *   and old (auto-form via formInitialPairs) flow.
 */

import { and, count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessionParticipants, users } from "@/lib/db/schema";

export type PairedParticipant = {
  id: string;
  userId: string | null;
  displayName: string;
  guestName: string | null;
  isPlaying: boolean;
  sessionPoints: number;
  sessionMatches: number;
  avatarUrl: string | null;
};

export type SessionPair = {
  pairKey: string;
  players: PairedParticipant[];
};

/**
 * Group active participants by pair_key. Skips null pair_key.
 * Returns pairs sorted by combined sessionPoints DESC (handy for Mexicano
 * pair-vs-pair matchmaking).
 */
export async function getSessionPairs(sessionId: string): Promise<SessionPair[]> {
  const rows = await db
    .select({
      id: sessionParticipants.id,
      userId: sessionParticipants.userId,
      userDisplayName: users.displayName,
      guestName: sessionParticipants.guestName,
      isPlaying: sessionParticipants.isPlaying,
      sessionPoints: sessionParticipants.sessionPoints,
      sessionMatches: sessionParticipants.sessionMatches,
      avatarUrl: users.avatarUrl,
      pairKey: sessionParticipants.pairKey,
    })
    .from(sessionParticipants)
    .leftJoin(users, eq(users.id, sessionParticipants.userId))
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        isNotNull(sessionParticipants.pairKey)
      )
    );

  const groups = new Map<string, PairedParticipant[]>();
  for (const r of rows) {
    if (!r.pairKey) continue;
    const player: PairedParticipant = {
      id: r.id,
      userId: r.userId,
      displayName: r.userDisplayName ?? r.guestName ?? "Player",
      guestName: r.guestName,
      isPlaying: r.isPlaying,
      sessionPoints: r.sessionPoints,
      sessionMatches: r.sessionMatches,
      avatarUrl: r.avatarUrl,
    };
    const arr = groups.get(r.pairKey);
    if (arr) arr.push(player);
    else groups.set(r.pairKey, [player]);
  }

  const pairs: SessionPair[] = Array.from(groups.entries()).map(
    ([pairKey, players]) => ({ pairKey, players })
  );

  // Sort by combined points DESC (for pair ranking)
  pairs.sort((a, b) => {
    const aPts = a.players.reduce((s, p) => s + p.sessionPoints, 0);
    const bPts = b.players.reduce((s, p) => s + p.sessionPoints, 0);
    return bPts - aPts;
  });
  return pairs;
}

/**
 * Backward-compat detection: returns true if at least one participant in
 * this session has pair_key set. New-flow sessions return true; legacy
 * sessions (Sprint 17 auto-form) return false → caller falls back to old
 * extract-from-matches logic.
 */
export async function sessionHasAssignedPairs(
  sessionId: string
): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        isNotNull(sessionParticipants.pairKey)
      )
    );
  return (row?.value ?? 0) > 0;
}

/**
 * Validation helper: every active (`isPlaying`) participant must have a
 * pair_key before Round 1 can be generated under Fix Partners flow.
 * Returns the list of unpaired active participant IDs.
 */
export async function listUnpairedActiveParticipants(
  sessionId: string
): Promise<string[]> {
  const rows = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.isPlaying, true)
      )
    );
  const all = rows.map((r) => r.id);
  if (all.length === 0) return [];

  const paired = await db
    .select({ id: sessionParticipants.id })
    .from(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, sessionId),
        eq(sessionParticipants.isPlaying, true),
        isNotNull(sessionParticipants.pairKey)
      )
    );
  const pairedSet = new Set(paired.map((p) => p.id));
  return all.filter((id) => !pairedSet.has(id));
}
