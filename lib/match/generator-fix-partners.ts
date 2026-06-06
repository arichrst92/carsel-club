/**
 * Fix Partners (Round Robin) generator — Sprint 17.
 *
 * Per docs/PADEL_APP_KONSEP.md §2.2 (Fix Partners Toggle):
 * - Saat ON: pemain berpasangan tetap (pair), hanya rotasi lawan
 * - Round 1: form pairs (Americano: random, Mexicano: rank top+bottom)
 * - Round 2+: round robin schedule antar pair
 *
 * Algorithm: Circle method (Berger tables). N pair → N-1 round.
 *
 * Limitation Sprint 17: Round 1 active pool harus fit di numCourts*4.
 * Kalau ada sit-out pair di Round 1, info pasangan hilang (tidak persisted).
 * Sprint 18+ bisa improve dengan schema column.
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §2.2, §3
 */

import type {
  GeneratedMatch,
  GeneratorResult,
  PairHistory,
} from "./generator";

export type Pair = [string, string];

export type FixPartnersPlayer = {
  id: string;
  sessionMatches: number;
  sessionPoints: number;
};

/**
 * Form pairs untuk Round 1 (saat belum ada round sebelumnya).
 *
 * - Americano: shuffle players, pair adjacent
 * - Mexicano: sort by sessionPoints DESC, pair top+bottom (1+N, 2+N-1, ...)
 *
 * Drop pemain ganjil (terakhir setelah pair). Caller harus handle.
 */
export function formInitialPairs(
  players: FixPartnersPlayer[],
  format: "americano" | "mexicano" | "tournament"
): Pair[] {
  if (players.length < 2) return [];

  if (format === "mexicano") {
    // Rank by sessionPoints DESC. Pair top+bottom (1+N, 2+N-1).
    const ranked = [...players].sort((a, b) => {
      const diff = b.sessionPoints - a.sessionPoints;
      if (diff !== 0) return diff;
      return Math.random() - 0.5;
    });
    const pairs: Pair[] = [];
    const halfCount = Math.floor(ranked.length / 2);
    for (let i = 0; i < halfCount; i++) {
      pairs.push([ranked[i].id, ranked[ranked.length - 1 - i].id]);
    }
    return pairs;
  }

  // Americano / Tournament: shuffle + pair adjacent
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    pairs.push([shuffled[i].id, shuffled[i + 1].id]);
  }
  return pairs;
}

/**
 * Extract unique pairs dari matches existing.
 * Setiap match punya 2 pair (team1, team2).
 *
 * Catatan: pemain sit-out di Round 1 dengan fix partners → pair-nya hilang.
 */
export function extractPairs(
  pastMatches: Array<{
    team1P1Id: string;
    team1P2Id: string;
    team2P1Id: string;
    team2P2Id: string;
  }>
): Pair[] {
  const seen = new Set<string>();
  const pairs: Pair[] = [];

  function addPair(a: string, b: string) {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    const key = `${lo}|${hi}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push([a, b]);
  }

  for (const m of pastMatches) {
    addPair(m.team1P1Id, m.team1P2Id);
    addPair(m.team2P1Id, m.team2P2Id);
  }
  return pairs;
}

/**
 * Round robin schedule via circle method (Berger tables).
 * N pairs → N-1 rounds. Each round produces floor(N/2) matchups.
 *
 * Returns matchup pairs as indices into the input pairs array.
 *
 * @param numPairs jumlah pair (N)
 * @param roundIndex 0-indexed round number
 */
export function roundRobinMatchups(
  numPairs: number,
  roundIndex: number
): Array<[number, number]> {
  if (numPairs < 2) return [];

  const N = numPairs;
  const rotateCount = N - 1;
  // Index 0 fixed, others rotate
  // rotated[i] = ((i + roundIndex) % rotateCount) + 1
  const rotated: number[] = [];
  for (let i = 0; i < rotateCount; i++) {
    rotated.push(((i + roundIndex) % rotateCount) + 1);
  }

  const matchups: Array<[number, number]> = [];
  matchups.push([0, rotated[0]]);
  for (let i = 1; i < Math.floor(N / 2); i++) {
    matchups.push([rotated[i], rotated[rotateCount - i]]);
  }
  return matchups;
}

/**
 * Generate satu round Fix Partners.
 *
 * Input: pairs (sudah terbentuk), numCourts, pairHistory, roundIndex.
 *
 * Round 1 = roundIndex 0. Round N = roundIndex N-1.
 *
 * Throws kalau <2 pair.
 */
export function generateFixPartnersRound(
  pairs: Pair[],
  numCourts: number,
  pairHistory: PairHistory,
  roundIndex: number
): GeneratorResult {
  if (pairs.length < 2) {
    throw new Error(
      "Butuh minimal 2 pair (4 pemain) untuk fix partners round"
    );
  }

  const allMatchups = roundRobinMatchups(pairs.length, roundIndex);
  const maxMatches = Math.min(numCourts, allMatchups.length);
  const selected = allMatchups.slice(0, maxMatches);

  const matches: GeneratedMatch[] = selected.map((mu, idx) => ({
    courtNumber: idx + 1,
    team1: pairs[mu[0]],
    team2: pairs[mu[1]],
  }));

  // Sit-outs: pairs tidak dalam matchups terpilih
  const playingPairIdx = new Set<number>();
  for (const [a, b] of selected) {
    playingPairIdx.add(a);
    playingPairIdx.add(b);
  }
  const sitOuts: string[] = [];
  for (let i = 0; i < pairs.length; i++) {
    if (!playingPairIdx.has(i)) {
      sitOuts.push(...pairs[i]);
    }
  }

  const violations = countViolations(matches, pairHistory);
  return { matches, sitOuts, violations };
}

function countViolations(
  matches: GeneratedMatch[],
  history: PairHistory
): number {
  let count = 0;
  for (const m of matches) {
    if (history.get(m.team1[0])?.has(m.team1[1])) count++;
    if (history.get(m.team2[0])?.has(m.team2[1])) count++;
  }
  return count;
}
