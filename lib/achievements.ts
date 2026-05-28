/**
 * Achievement badges.
 * Computed from user stats — no separate user_achievements table for v1.
 * In future, could persist earned_at timestamps for "first unlocked" celebrations.
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
};

export const ACHIEVEMENTS: Achievement[] = [
  // ============ Match milestones ============
  {
    code: "first_match",
    name: "First Match",
    description: "Selesaikan match pertama",
    emoji: "🎾",
    category: "milestone",
    threshold: 1,
    check: (s) => s.totalMatches >= 1,
    progress: (s) => ({ current: Math.min(s.totalMatches, 1), target: 1 }),
  },
  {
    code: "matches_10",
    name: "10 Match",
    description: "Selesaikan 10 match",
    emoji: "⚡",
    category: "milestone",
    threshold: 10,
    check: (s) => s.totalMatches >= 10,
    progress: (s) => ({ current: Math.min(s.totalMatches, 10), target: 10 }),
  },
  {
    code: "matches_50",
    name: "50 Match",
    description: "Selesaikan 50 match",
    emoji: "🎯",
    category: "milestone",
    threshold: 50,
    check: (s) => s.totalMatches >= 50,
    progress: (s) => ({ current: Math.min(s.totalMatches, 50), target: 50 }),
  },
  {
    code: "matches_100",
    name: "Centurion",
    description: "100 match selesai",
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
    description: "Menang match pertama",
    emoji: "🏆",
    category: "milestone",
    threshold: 1,
    check: (s) => s.totalWins >= 1,
    progress: (s) => ({ current: Math.min(s.totalWins, 1), target: 1 }),
  },
  {
    code: "wins_25",
    name: "25 Wins",
    description: "Menang 25 match",
    emoji: "🔥",
    category: "milestone",
    threshold: 25,
    check: (s) => s.totalWins >= 25,
    progress: (s) => ({ current: Math.min(s.totalWins, 25), target: 25 }),
  },
  {
    code: "wins_100",
    name: "Champion",
    description: "Menang 100 match",
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
    description: "Naik ke tier Bronze",
    emoji: "🥉",
    category: "tier",
    threshold: 2,
    check: (s) => s.tierOrder >= 2,
  },
  {
    code: "tier_silver",
    name: "Silver Tier",
    description: "Naik ke tier Silver",
    emoji: "🥈",
    category: "tier",
    threshold: 3,
    check: (s) => s.tierOrder >= 3,
  },
  {
    code: "tier_gold",
    name: "Gold Tier",
    description: "Naik ke tier Gold",
    emoji: "🥇",
    category: "tier",
    threshold: 4,
    check: (s) => s.tierOrder >= 4,
  },
  {
    code: "tier_platinum",
    name: "Platinum Tier",
    description: "Naik ke tier Platinum",
    emoji: "💎",
    category: "tier",
    threshold: 5,
    check: (s) => s.tierOrder >= 5,
  },
  {
    code: "tier_master",
    name: "Master Tier",
    description: "Naik ke tier Master (tier tertinggi!)",
    emoji: "👑",
    category: "tier",
    threshold: 6,
    check: (s) => s.tierOrder >= 6,
  },

  // ============ Host achievements ============
  {
    code: "hosted_first",
    name: "Pertama Hosting",
    description: "Buat session pertama",
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
