/**
 * Advanced stats — partner aggregates + head-to-head (Sprint 30).
 *
 * Pure: input = list of completed match outcomes from user's POV; output =
 * aggregated rankings.
 *
 * Refs:
 * - DB query: lib/db/queries/advanced-stats.ts
 * - Used by: components/profile/AdvancedStats.tsx
 */

export type MatchOutcome = "win" | "loss" | "draw";

/**
 * One match from a specific user's perspective.
 * - partnerUserId: other player on same team (null = guest partner, skip in aggregates)
 * - opponentUserIds: 2 opponents (filter out guests at aggregator level)
 */
export type UserMatchOutcome = {
  matchId: string;
  partnerUserId: string | null;
  opponent1UserId: string | null;
  opponent2UserId: string | null;
  outcome: MatchOutcome;
};

export type PartnerAggregate = {
  userId: string;
  played: number;
  won: number;
  lost: number;
  drew: number;
  winRate: number; // 0..1
};

function emptyAgg(userId: string): PartnerAggregate {
  return { userId, played: 0, won: 0, lost: 0, drew: 0, winRate: 0 };
}

function bump(agg: PartnerAggregate, outcome: MatchOutcome): void {
  agg.played++;
  if (outcome === "win") agg.won++;
  else if (outcome === "loss") agg.lost++;
  else agg.drew++;
}

function finalizeRate(agg: PartnerAggregate): PartnerAggregate {
  // played always ≥ 1 here — agg only created via bump() which increments played
  return {
    ...agg,
    winRate: agg.won / agg.played,
  };
}

/**
 * Aggregate by partner (same team). Guest partners (null userId) excluded.
 */
export function aggregatePartnerStats(
  outcomes: UserMatchOutcome[]
): PartnerAggregate[] {
  const map = new Map<string, PartnerAggregate>();
  for (const o of outcomes) {
    if (!o.partnerUserId) continue;
    const a = map.get(o.partnerUserId) ?? emptyAgg(o.partnerUserId);
    bump(a, o.outcome);
    map.set(o.partnerUserId, a);
  }
  return [...map.values()].map(finalizeRate);
}

/**
 * Aggregate per opponent (other team). Each match yields 0-2 opponent entries
 * (guests excluded).
 *
 * For "head-to-head" purposes: outcome is from user's perspective, so an opponent
 * record's `won` field = how many times user beat that opponent.
 */
export function aggregateOpponentStats(
  outcomes: UserMatchOutcome[]
): PartnerAggregate[] {
  const map = new Map<string, PartnerAggregate>();
  for (const o of outcomes) {
    for (const oppId of [o.opponent1UserId, o.opponent2UserId]) {
      if (!oppId) continue;
      const a = map.get(oppId) ?? emptyAgg(oppId);
      bump(a, o.outcome);
      map.set(oppId, a);
    }
  }
  return [...map.values()].map(finalizeRate);
}

/**
 * Top-K by composite score:
 * - Primary: winRate DESC
 * - Tiebreak: won DESC
 * - Final tiebreak: userId asc (stable)
 *
 * Filters out entries with < minPlayed (avoid noise — 1 lucky match).
 */
export function topPartners(
  list: PartnerAggregate[],
  k: number,
  minPlayed = 3
): PartnerAggregate[] {
  const floor = Math.max(1, minPlayed);
  return [...list]
    .filter((a) => a.played >= floor)
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.won !== a.won) return b.won - a.won;
      return a.userId.localeCompare(b.userId);
    })
    .slice(0, k);
}

/**
 * Nemesis = opponents user loses to most.
 * - Primary: lossRate DESC (lost/played)
 * - Tiebreak: lost DESC
 */
export function topNemesis(
  list: PartnerAggregate[],
  k: number,
  minPlayed = 3
): PartnerAggregate[] {
  // Enforce minPlayed ≥ 1 untuk avoid div-by-zero (caller can pass 0)
  const floor = Math.max(1, minPlayed);
  return [...list]
    .filter((a) => a.played >= floor)
    .sort((a, b) => {
      const lossRateB = b.lost / b.played;
      const lossRateA = a.lost / a.played;
      if (lossRateB !== lossRateA) return lossRateB - lossRateA;
      if (b.lost !== a.lost) return b.lost - a.lost;
      return a.userId.localeCompare(b.userId);
    })
    .slice(0, k);
}

/**
 * Quick lifetime summary derived from outcome list.
 * Mirrors users.totalMatches/Wins/Losses/Draws computed on the fly — useful
 * for sanity check or detached views.
 */
export function summarizeOutcomes(
  outcomes: UserMatchOutcome[]
): { played: number; won: number; lost: number; drew: number; winRate: number } {
  let won = 0;
  let lost = 0;
  let drew = 0;
  for (const o of outcomes) {
    if (o.outcome === "win") won++;
    else if (o.outcome === "loss") lost++;
    else drew++;
  }
  const played = outcomes.length;
  return {
    played,
    won,
    lost,
    drew,
    winRate: played === 0 ? 0 : won / played,
  };
}
