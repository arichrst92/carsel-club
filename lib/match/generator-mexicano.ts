/**
 * Mexicano generator (Sprint 16) — pure.
 *
 * Per docs/PADEL_APP_KONSEP.md §3.4 (Mexicano Generation Logic):
 * - Round 1: generate random (delegated ke random generator)
 * - Round 2+: pairing per court berdasarkan ranking sessionPoints.
 *   Take next 4 ranked, court → P1+P4 vs P2+P3.
 *
 * Sit-out fairness sama dgn Americano: sort by sessionMatches ASC.
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §3.4
 * - Generator existing: lib/match/generator.ts (Americano random optimized)
 */

import {
  generateRound,
  shuffle,
  type GeneratedMatch,
  type GeneratorResult,
  type PairHistory,
} from "./generator";

export type MexicanoPlayer = {
  id: string;
  sessionMatches: number;
  sessionPoints: number;
};

/**
 * Generate satu round Mexicano.
 *
 * - isFirstRound=true → delegate ke random generator (Americano-style)
 * - isFirstRound=false → ranking-based pairing
 *
 * Throws kalau <4 pemain.
 */
export function generateMexicanoRound(
  activePlayers: MexicanoPlayer[],
  numCourts: number,
  pairHistory: PairHistory,
  isFirstRound: boolean
): GeneratorResult {
  if (activePlayers.length < 4) {
    throw new Error("Butuh minimal 4 pemain aktif untuk generate round");
  }

  if (isFirstRound) {
    // Round 1: random (no rankings yet)
    return generateRound(
      activePlayers.map((p) => ({
        id: p.id,
        sessionMatches: p.sessionMatches,
      })),
      numCourts,
      pairHistory
    );
  }

  // Sit-out fairness sort: sessionMatches ASC, tiebreak random
  const sortedByFairness = [...activePlayers].sort((a, b) => {
    const diff = a.sessionMatches - b.sessionMatches;
    if (diff !== 0) return diff;
    return Math.random() - 0.5;
  });

  // Determine playing pool
  const maxCourtsUsable = Math.floor(activePlayers.length / 4);
  const courtsThisRound = Math.min(numCourts, maxCourtsUsable);
  const playersPerRound = courtsThisRound * 4;
  const playing = sortedByFairness.slice(0, playersPerRound);
  const sitOuts = sortedByFairness.slice(playersPerRound).map((p) => p.id);

  // Rank by sessionPoints DESC. Tiebreak: random untuk avoid stuck patterns.
  const ranked = [...playing].sort((a, b) => {
    const diff = b.sessionPoints - a.sessionPoints;
    if (diff !== 0) return diff;
    return Math.random() - 0.5;
  });

  // Per court: take next 4 ranked → P1+P4 vs P2+P3
  const matches: GeneratedMatch[] = [];
  for (let i = 0; i < ranked.length; i += 4) {
    const four = ranked.slice(i, i + 4);
    matches.push({
      courtNumber: matches.length + 1,
      team1: [four[0].id, four[3].id], // rank 1 + rank 4
      team2: [four[1].id, four[2].id], // rank 2 + rank 3
    });
  }

  // Count violations (pemain pernah jadi partner sebelumnya)
  const violations = countViolations(matches, pairHistory);

  return {
    matches,
    sitOuts,
    violations,
  };
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

// Re-export shuffle untuk consistency
export { shuffle };
