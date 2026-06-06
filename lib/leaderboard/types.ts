/**
 * Leaderboard v2 types (Sprint 32).
 */

export type LeaderboardSort = "point" | "winrate" | "match";

export type LeaderboardScope = "global" | "regional";

export type LeaderboardPeriod = "all_time" | "monthly" | "weekly";

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  city: string | null;
  avatarUrl: string | null;
  tierName: string | null;
  tierColor: string | null;
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  winRate: number; // 0-100
};

export type RankedEntry = LeaderboardEntry & { rank: number };
