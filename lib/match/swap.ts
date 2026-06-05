/**
 * Sprint 15 — pure swap helpers.
 *
 * Manual edit hasil generate: tukar 2 pemain antar slot (atau dalam match
 * yang sama). Bahaya utama yang divalidasi: duplikat player di slot setelah
 * swap (akan violate DB CHECK distinct_players).
 *
 * Refs:
 * - DB: matches CHECK distinct_players (semua 4 slot unik)
 * - GUI: docs/CarselClubPrototype/match-list.html (tap pemain untuk swap)
 */

export type MatchSlotKey =
  | "team1P1Id"
  | "team1P2Id"
  | "team2P1Id"
  | "team2P2Id";

export type MatchSlots = {
  team1P1Id: string;
  team1P2Id: string;
  team2P1Id: string;
  team2P2Id: string;
};

export const ALL_SLOTS: MatchSlotKey[] = [
  "team1P1Id",
  "team1P2Id",
  "team2P1Id",
  "team2P2Id",
];

export function hasDistinctPlayers(m: MatchSlots): boolean {
  const ids = [m.team1P1Id, m.team1P2Id, m.team2P1Id, m.team2P2Id];
  return new Set(ids).size === 4;
}

/**
 * Apply swap. Returns new MatchSlots untuk A dan B.
 * Kalau swap dalam match yang sama (A === B), newA dan newB akan identik
 * (caller cuma butuh 1).
 */
export function applySwap(
  matchA: MatchSlots,
  slotA: MatchSlotKey,
  matchB: MatchSlots,
  slotB: MatchSlotKey,
  isSameMatch: boolean
): { newA: MatchSlots; newB: MatchSlots } {
  if (isSameMatch) {
    const out: MatchSlots = { ...matchA };
    const tmp = out[slotA];
    out[slotA] = out[slotB];
    out[slotB] = tmp;
    return { newA: out, newB: out };
  }
  const idA = matchA[slotA];
  const idB = matchB[slotB];
  return {
    newA: { ...matchA, [slotA]: idB },
    newB: { ...matchB, [slotB]: idA },
  };
}

export type SwapValidation =
  | { ok: true }
  | { ok: false; error: string };

export function validateSwap(
  matchA: MatchSlots,
  slotA: MatchSlotKey,
  matchB: MatchSlots,
  slotB: MatchSlotKey,
  isSameMatch: boolean
): SwapValidation {
  // Self-swap (slot sama di match sama)
  if (isSameMatch && slotA === slotB) {
    return { ok: false, error: "Pilih slot lain untuk swap" };
  }

  // Identitas pemain sama (impossible kalau distinct constraint exists,
  // tapi defensive)
  if (matchA[slotA] === matchB[slotB]) {
    return { ok: false, error: "Pemain yang sama tidak perlu di-swap" };
  }

  const { newA, newB } = applySwap(matchA, slotA, matchB, slotB, isSameMatch);

  if (!hasDistinctPlayers(newA)) {
    return {
      ok: false,
      error: "Hasil swap menghasilkan pemain duplikat di match A",
    };
  }
  if (!isSameMatch && !hasDistinctPlayers(newB)) {
    return {
      ok: false,
      error: "Hasil swap menghasilkan pemain duplikat di match B",
    };
  }
  return { ok: true };
}

/**
 * Format slot key untuk display.
 */
export function slotLabel(slot: MatchSlotKey): string {
  switch (slot) {
    case "team1P1Id":
      return "Tim 1 · P1";
    case "team1P2Id":
      return "Tim 1 · P2";
    case "team2P1Id":
      return "Tim 2 · P1";
    case "team2P2Id":
      return "Tim 2 · P2";
  }
}
