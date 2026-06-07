/**
 * Single-elimination tournament bracket — pure helpers (Sprint 31).
 *
 * Decision (D4): single-elim only untuk v1; group stage + double-elim
 * deferred ke future sprint.
 *
 * Concepts:
 * - "Team" = pair of participant IDs [p1, p2] (padel always 2v2)
 * - Bracket size = next power-of-2 ≥ teamCount; missing slots filled with byes
 * - Round 1 has bracketSize/2 matches, indexed bracketSlot=0..N/2-1
 * - Match (round R, slot S) advances winner to (round R+1, slot floor(S/2))
 * - Bye = team paired with null → auto-advances (no match created)
 *
 * Refs:
 * - DB: tournament_brackets + matches.bracket_round/bracket_slot
 * - Used by: app/actions/tournament.ts + stats-sync auto-advance hook
 */

export type Team = [participantId1: string, participantId2: string];

export type BracketPairing = {
  slot: number;
  team1: Team | null;
  team2: Team | null;
  /**
   * True kalau salah satu side null (the other auto-advances).
   * isBye implies no match should be created for this slot.
   */
  isBye: boolean;
};

/**
 * Next power of 2 ≥ n. Min 2.
 */
export function computeBracketSize(teamCount: number): number {
  if (teamCount <= 1) return 2;
  if (teamCount <= 2) return 2;
  let size = 2;
  while (size < teamCount) size *= 2;
  return size;
}

/**
 * Total elimination rounds needed.
 * - 2 teams = 1 round (final)
 * - 4 teams = 2 (semi + final)
 * - 8 teams = 3, etc.
 */
export function computeTotalRounds(teamCount: number): number {
  if (teamCount <= 1) return 1;
  const size = computeBracketSize(teamCount);
  return Math.log2(size);
}

/**
 * Number of matches di round R (1-indexed).
 * - Round 1: bracketSize/2
 * - Round R: bracketSize/(2^R)
 */
export function matchesInRound(
  bracketSize: number,
  roundNumber: number
): number {
  if (roundNumber < 1) return 0;
  return Math.max(0, Math.floor(bracketSize / 2 ** roundNumber));
}

/**
 * Compute parent slot (next round) untuk winner dari given slot.
 * - Slot 0 & 1 both feed slot 0 di next round
 * - Slot 2 & 3 → slot 1, etc.
 */
export function nextRoundSlot(slot: number): number {
  return Math.floor(slot / 2);
}

/**
 * Sister slot: pair dari current slot dalam round yang sama.
 * Slot 0 ↔ 1, slot 2 ↔ 3, etc.
 */
export function sisterSlot(slot: number): number {
  return slot ^ 1;
}

/**
 * Round 1 pairings — sequential pairing (team[2i] vs team[2i+1]).
 * Byes diisi di akhir list — higher indices get bye-pair first untuk
 * meminimkan disruption pattern (top seeds bottom of list).
 *
 * Note: caller responsible untuk seeding order (by_join_order vs random).
 */
export function buildFirstRoundPairings(
  teams: Team[],
  bracketSize: number
): BracketPairing[] {
  const padded: (Team | null)[] = [...teams];
  while (padded.length < bracketSize) padded.push(null);
  const halves = bracketSize / 2;
  const out: BracketPairing[] = [];
  for (let s = 0; s < halves; s++) {
    const t1 = padded[s * 2];
    const t2 = padded[s * 2 + 1];
    const isBye = t1 === null || t2 === null;
    out.push({ slot: s, team1: t1, team2: t2, isBye });
  }
  return out;
}

/**
 * Determine winner team dari outcome scores.
 * Returns null kalau draw (callers harus reject draws di tournament context).
 */
export function bracketWinner(
  team1: Team,
  team2: Team,
  team1Score: number,
  team2Score: number
): Team | null {
  if (team1Score > team2Score) return team1;
  if (team2Score > team1Score) return team2;
  return null;
}

/**
 * Given winners dari sister slots (2k, 2k+1), build next-round pairing.
 * If one of them is null (bye that already auto-advanced), the other
 * propagates langsung.
 */
export function buildNextRoundPairing(
  parentSlot: number,
  winnerLeft: Team | null,
  winnerRight: Team | null
): BracketPairing {
  const isBye = winnerLeft === null || winnerRight === null;
  return {
    slot: parentSlot,
    team1: winnerLeft,
    team2: winnerRight,
    isBye,
  };
}

/**
 * Validation helper: minimum teams untuk bracket.
 * - Min 2 (one final)
 * - Realistically need ≥ 4 untuk meaningful tournament
 */
export function validateTeamCount(teamCount: number): string | null {
  if (teamCount < 2) return "Minimal 2 team untuk tournament";
  if (teamCount > 64) return "Maksimum 64 team";
  return null;
}

/**
 * Validate Teams shape: must have exactly 2 distinct participant IDs each,
 * and no participant appearing across teams.
 */
export function validateTeams(teams: Team[]): string | null {
  const seen = new Set<string>();
  for (const t of teams) {
    if (t[0] === t[1]) return "Team cannot have duplicate players";
    if (seen.has(t[0])) return "Player cannot appear in more than 1 team";
    if (seen.has(t[1])) return "Player cannot appear in more than 1 team";
    seen.add(t[0]);
    seen.add(t[1]);
  }
  return null;
}

/**
 * Seeding: by join order = identity; random = Fisher-Yates dengan injected rand.
 */
export function seedTeams(
  teams: Team[],
  method: "by_join_order" | "random",
  rand: () => number = Math.random
): Team[] {
  if (method === "by_join_order") return [...teams];
  const out = [...teams];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
