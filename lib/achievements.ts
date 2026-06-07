/**
 * Achievement badges.
 *
 * Sprint 29: persisted via user_achievements table (earned_at + idempotent).
 * Catalog di sini = definitions only; runtime check stay pure.
 */

export type Achievement = {
  code: string;
  name: string;
  description: string;
  emoji: string;
  category: "milestone" | "tier" | "host" | "streak";
  threshold: number; // for sorting + progress
  check: (stats: UserStatsForAchievement) => boolean;
  progress?: (stats: UserStatsForAchievement) => {
    current: number;
    target: number;
  };
};

export type UserStatsForAchievement = {
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  hostedCount: number;
  tierOrder: number; // 1=Rookie, 6=Master
  // Sprint 29: streak + session-scoped (optional → defaults to 0 untuk callers
  // yang belum dapat data)
  bestWinStreak?: number;
  currentSessionMatches?: number;
  currentSessionWins?: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  // ============ Match milestones ============
  {
    code: "first_match",
    name: "First Match",
    description: "Complete your first match",
    emoji: "🎾",
    category: "milestone",
    threshold: 1,
    check: (s) => s.totalMatches >= 1,
    progress: (s) => ({ current: Math.min(s.totalMatches, 1), target: 1 }),
  },
  {
    code: "matches_10",
    name: "10 Matches",
    description: "Complete 10 matches",
    emoji: "⚡",
    category: "milestone",
    threshold: 10,
    check: (s) => s.totalMatches >= 10,
    progress: (s) => ({ current: Math.min(s.totalMatches, 10), target: 10 }),
  },
  {
    code: "matches_50",
    name: "50 Matches",
    description: "Complete 50 matches",
    emoji: "🎯",
    category: "milestone",
    threshold: 50,
    check: (s) => s.totalMatches >= 50,
    progress: (s) => ({ current: Math.min(s.totalMatches, 50), target: 50 }),
  },
  {
    code: "matches_100",
    name: "Centurion",
    description: "Complete 100 matches",
    emoji: "💯",
    category: "milestone",
    threshold: 100,
    check: (s) => s.totalMatches >= 100,
    progress: (s) => ({ current: Math.min(s.totalMatches, 100), target: 100 }),
  },

  // ============ Win milestones ============
  {
    code: "first_win",
    name: "First Win",
    description: "Win your first match",
    emoji: "🏆",
    category: "milestone",
    threshold: 1,
    check: (s) => s.totalWins >= 1,
    progress: (s) => ({ current: Math.min(s.totalWins, 1), target: 1 }),
  },
  {
    code: "wins_25",
    name: "25 Wins",
    description: "Win 25 matches",
    emoji: "🔥",
    category: "milestone",
    threshold: 25,
    check: (s) => s.totalWins >= 25,
    progress: (s) => ({ current: Math.min(s.totalWins, 25), target: 25 }),
  },
  {
    code: "wins_100",
    name: "Champion",
    description: "Win 100 matches",
    emoji: "🌟",
    category: "milestone",
    threshold: 100,
    check: (s) => s.totalWins >= 100,
    progress: (s) => ({ current: Math.min(s.totalWins, 100), target: 100 }),
  },

  // ============ Tier achievements ============
  {
    code: "tier_bronze",
    name: "Bronze Tier",
    description: "Reach Bronze tier",
    emoji: "🥉",
    category: "tier",
    threshold: 2,
    check: (s) => s.tierOrder >= 2,
  },
  {
    code: "tier_silver",
    name: "Silver Tier",
    description: "Reach Silver tier",
    emoji: "🥈",
    category: "tier",
    threshold: 3,
    check: (s) => s.tierOrder >= 3,
  },
  {
    code: "tier_gold",
    name: "Gold Tier",
    description: "Reach Gold tier",
    emoji: "🥇",
    category: "tier",
    threshold: 4,
    check: (s) => s.tierOrder >= 4,
  },
  {
    code: "tier_platinum",
    name: "Platinum Tier",
    description: "Reach Platinum tier",
    emoji: "💎",
    category: "tier",
    threshold: 5,
    check: (s) => s.tierOrder >= 5,
  },
  {
    code: "tier_master",
    name: "Master Tier",
    description: "Reach Master tier (the highest!)",
    emoji: "👑",
    category: "tier",
    threshold: 6,
    check: (s) => s.tierOrder >= 6,
  },

  // ============ Host achievements ============
  {
    code: "hosted_first",
    name: "First Host",
    description: "Create your first session",
    emoji: "🎪",
    category: "host",
    threshold: 1,
    check: (s) => s.hostedCount >= 1,
    progress: (s) => ({ current: Math.min(s.hostedCount, 1), target: 1 }),
  },
  {
    code: "hosted_5",
    name: "Active Host",
    description: "5 sessions hosted",
    emoji: "📅",
    category: "host",
    threshold: 5,
    check: (s) => s.hostedCount >= 5,
    progress: (s) => ({ current: Math.min(s.hostedCount, 5), target: 5 }),
  },
  {
    code: "hosted_25",
    name: "Top Host",
    description: "25 sessions hosted",
    emoji: "🎖️",
    category: "host",
    threshold: 25,
    check: (s) => s.hostedCount >= 25,
    progress: (s) => ({ current: Math.min(s.hostedCount, 25), target: 25 }),
  },

  // ============ Streak achievements (Sprint 29) ============
  {
    code: "win_streak_3",
    name: "Streak 3",
    description: "3 wins in a row",
    emoji: "🔥",
    category: "streak",
    threshold: 3,
    check: (s) => (s.bestWinStreak ?? 0) >= 3,
    progress: (s) => ({
      current: Math.min(s.bestWinStreak ?? 0, 3),
      target: 3,
    }),
  },
  {
    code: "win_streak_5",
    name: "Streak 5",
    description: "5 wins in a row",
    emoji: "🚀",
    category: "streak",
    threshold: 5,
    check: (s) => (s.bestWinStreak ?? 0) >= 5,
    progress: (s) => ({
      current: Math.min(s.bestWinStreak ?? 0, 5),
      target: 5,
    }),
  },
  {
    code: "win_streak_10",
    name: "Unstoppable",
    description: "10 wins in a row",
    emoji: "⚡",
    category: "streak",
    threshold: 10,
    check: (s) => (s.bestWinStreak ?? 0) >= 10,
    progress: (s) => ({
      current: Math.min(s.bestWinStreak ?? 0, 10),
      target: 10,
    }),
  },
  {
    code: "perfect_day",
    name: "Perfect Day",
    description: "Win all matches in 1 session (≥3 matches)",
    emoji: "🌟",
    category: "streak",
    threshold: 3,
    check: (s) => {
      const matches = s.currentSessionMatches ?? 0;
      const wins = s.currentSessionWins ?? 0;
      return matches >= 3 && wins === matches;
    },
  },
  {
    code: "hot_session",
    name: "Hot Session",
    description: "5 wins in one session",
    emoji: "🌶️",
    category: "streak",
    threshold: 5,
    check: (s) => (s.currentSessionWins ?? 0) >= 5,
    progress: (s) => ({
      current: Math.min(s.currentSessionWins ?? 0, 5),
      target: 5,
    }),
  },
];

export function getEarnedAchievements(
  stats: UserStatsForAchievement
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats));
}

export function getUnlockedCount(stats: UserStatsForAchievement): {
  unlocked: number;
  total: number;
} {
  return {
    unlocked: ACHIEVEMENTS.filter((a) => a.check(stats)).length,
    total: ACHIEVEMENTS.length,
  };
}

/**
 * Sprint 29 — Streak transition pure.
 *
 * - "win" outcome → currentStreak + 1
 * - "loss" / "draw" → reset 0
 *
 * bestStreak = max(current, prev best). Even draws break streak.
 */
export function nextStreak(
  prevCurrent: number,
  prevBest: number,
  outcome: "win" | "loss" | "draw"
): { current: number; best: number } {
  const current = outcome === "win" ? prevCurrent + 1 : 0;
  const best = Math.max(prevBest, current);
  return { current, best };
}

/**
 * Sprint 29 — Diff persisted earned codes vs current earned set.
 * Returns codes yang baru earned (need persist + notify).
 */
export function detectNewlyUnlocked(
  alreadyEarnedCodes: ReadonlySet<string>,
  stats: UserStatsForAchievement
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => a.check(stats) && !alreadyEarnedCodes.has(a.code)
  );
}
