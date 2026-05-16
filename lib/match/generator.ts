/**
 * Match Generator — random pairing dengan:
 * - Avoid repeat partners (score-based retry)
 * - Sit-out fairness (sort by session_matches ASC)
 *
 * v1 algorithm: "random optimized" (not perfect, but good enough untuk closed beta).
 * v1.5 nanti bisa upgrade ke Mexicano ranking-based pairing.
 */

export type GeneratorPlayer = {
  id: string;
  sessionMatches: number;
};

export type PairHistory = Map<string, Set<string>>;

export type GeneratedMatch = {
  courtNumber: number;
  team1: [string, string]; // session_participant IDs
  team2: [string, string];
};

export type GeneratorResult = {
  matches: GeneratedMatch[];
  sitOuts: string[]; // session_participant IDs not playing this round
  violations: number; // total repeat-partner pairs in result (lower = better)
};

const MAX_ATTEMPTS = 50;

/**
 * Generate matches for one round.
 * Throws if fewer than 4 active players.
 */
export function generateRound(
  activePlayers: GeneratorPlayer[],
  numCourts: number,
  pairHistory: PairHistory
): GeneratorResult {
  if (activePlayers.length < 4) {
    throw new Error("Butuh minimal 4 pemain aktif untuk generate round");
  }

  // How many courts can actually be filled this round?
  const maxCourtsUsable = Math.floor(activePlayers.length / 4);
  const courtsThisRound = Math.min(numCourts, maxCourtsUsable);
  const playersPerRound = courtsThisRound * 4;

  // Sit-out fairness: sort by sessionMatches ASC (tiebreak: random)
  const sortedByFairness = [...activePlayers].sort((a, b) => {
    const diff = a.sessionMatches - b.sessionMatches;
    if (diff !== 0) return diff;
    return Math.random() - 0.5;
  });

  // Take first N to play, rest sit out
  const playing = sortedByFairness.slice(0, playersPerRound);
  const sitOuts = sortedByFairness.slice(playersPerRound).map((p) => p.id);

  // Try multiple shufflings, keep best (fewest repeat-partner violations)
  let bestResult: GeneratedMatch[] | null = null;
  let bestScore = Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffled = shuffle([...playing]);
    const candidate: GeneratedMatch[] = [];

    for (let i = 0; i < playersPerRound; i += 4) {
      const four = shuffle(shuffled.slice(i, i + 4));
      candidate.push({
        courtNumber: candidate.length + 1,
        team1: [four[0].id, four[1].id],
        team2: [four[2].id, four[3].id],
      });
    }

    const score = countViolations(candidate, pairHistory);

    if (score < bestScore) {
      bestScore = score;
      bestResult = candidate;
      if (score === 0) break; // perfect
    }
  }

  return {
    matches: bestResult!,
    sitOuts,
    violations: bestScore,
  };
}

/**
 * Count how many pairs in the candidate already played together (per history).
 */
function countViolations(
  candidate: GeneratedMatch[],
  history: PairHistory
): number {
  let count = 0;
  for (const m of candidate) {
    if (history.get(m.team1[0])?.has(m.team1[1])) count++;
    if (history.get(m.team2[0])?.has(m.team2[1])) count++;
  }
  return count;
}

/**
 * Fisher-Yates shuffle (immutable, returns new array).
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Add a pair to history (mutates).
 */
export function recordPair(
  history: PairHistory,
  a: string,
  b: string
): void {
  if (!history.has(a)) history.set(a, new Set());
  history.get(a)!.add(b);
  if (!history.has(b)) history.set(b, new Set());
  history.get(b)!.add(a);
}
