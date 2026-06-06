/**
 * Tests untuk lib/achievements.ts
 *
 * Refs:
 * - Flow: docs/PADEL_APP_KONSEP.md §8 (Tier system & gamification)
 * - GUI:  docs/CarselClubPrototype/achievements.html (3-state badges)
 * - DB:   N/A (computed from users.* stats)
 */

import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENTS,
  getEarnedAchievements,
  getUnlockedCount,
  type UserStatsForAchievement,
} from "@/lib/achievements";

function makeStats(
  overrides: Partial<UserStatsForAchievement> = {}
): UserStatsForAchievement {
  return {
    totalPoints: 0,
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    hostedCount: 0,
    tierOrder: 1,
    ...overrides,
  };
}

describe("ACHIEVEMENTS catalog", () => {
  it("memiliki achievements untuk semua kategori utama", () => {
    const categories = new Set(ACHIEVEMENTS.map((a) => a.category));
    expect(categories.has("milestone")).toBe(true);
    expect(categories.has("tier")).toBe(true);
    expect(categories.has("host")).toBe(true);
  });

  it("setiap achievement punya code unik", () => {
    const codes = ACHIEVEMENTS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("setiap achievement punya emoji + name + description", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.emoji).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.threshold).toBeGreaterThan(0);
    }
  });
});

describe("match milestones", () => {
  it("first_match unlocks pada 1 match", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "first_match")!;
    expect(a.check(makeStats({ totalMatches: 0 }))).toBe(false);
    expect(a.check(makeStats({ totalMatches: 1 }))).toBe(true);
  });

  it("first_match progress capped", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "first_match")!;
    expect(a.progress!(makeStats({ totalMatches: 0 }))).toEqual({
      current: 0,
      target: 1,
    });
    expect(a.progress!(makeStats({ totalMatches: 5 }))).toEqual({
      current: 1,
      target: 1,
    });
  });

  it("matches_10 unlocks pada 10 match", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "matches_10")!;
    expect(a.check(makeStats({ totalMatches: 9 }))).toBe(false);
    expect(a.check(makeStats({ totalMatches: 10 }))).toBe(true);
  });

  it("matches_10 progress capped", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "matches_10")!;
    expect(a.progress!(makeStats({ totalMatches: 5 }))).toEqual({
      current: 5,
      target: 10,
    });
    expect(a.progress!(makeStats({ totalMatches: 25 }))).toEqual({
      current: 10,
      target: 10,
    });
  });

  it("matches_50 unlocks pada 50", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "matches_50")!;
    expect(a.check(makeStats({ totalMatches: 49 }))).toBe(false);
    expect(a.check(makeStats({ totalMatches: 50 }))).toBe(true);
    expect(a.progress!(makeStats({ totalMatches: 100 }))).toEqual({
      current: 50,
      target: 50,
    });
  });

  it("matches_100 unlocks pada 100", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "matches_100")!;
    expect(a.check(makeStats({ totalMatches: 99 }))).toBe(false);
    expect(a.check(makeStats({ totalMatches: 100 }))).toBe(true);
    expect(a.progress!(makeStats({ totalMatches: 200 }))).toEqual({
      current: 100,
      target: 100,
    });
  });
});

describe("win milestones", () => {
  it("first_win unlocks pada 1 win", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "first_win")!;
    expect(a.check(makeStats({ totalWins: 0 }))).toBe(false);
    expect(a.check(makeStats({ totalWins: 1 }))).toBe(true);
    expect(a.progress!(makeStats({ totalWins: 0 }))).toEqual({
      current: 0,
      target: 1,
    });
    expect(a.progress!(makeStats({ totalWins: 99 }))).toEqual({
      current: 1,
      target: 1,
    });
  });

  it("wins_25 unlocks pada 25", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "wins_25")!;
    expect(a.check(makeStats({ totalWins: 24 }))).toBe(false);
    expect(a.check(makeStats({ totalWins: 25 }))).toBe(true);
    expect(a.progress!(makeStats({ totalWins: 10 }))).toEqual({
      current: 10,
      target: 25,
    });
    expect(a.progress!(makeStats({ totalWins: 100 }))).toEqual({
      current: 25,
      target: 25,
    });
  });

  it("wins_100 unlocks pada 100", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "wins_100")!;
    expect(a.check(makeStats({ totalWins: 99 }))).toBe(false);
    expect(a.check(makeStats({ totalWins: 100 }))).toBe(true);
    expect(a.progress!(makeStats({ totalWins: 500 }))).toEqual({
      current: 100,
      target: 100,
    });
  });
});

describe("tier achievements", () => {
  it("tier_bronze unlocks pada tierOrder ≥ 2", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "tier_bronze")!;
    expect(a.check(makeStats({ tierOrder: 1 }))).toBe(false);
    expect(a.check(makeStats({ tierOrder: 2 }))).toBe(true);
    expect(a.check(makeStats({ tierOrder: 6 }))).toBe(true);
  });

  it("tier_silver unlocks pada tierOrder ≥ 3", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "tier_silver")!;
    expect(a.check(makeStats({ tierOrder: 2 }))).toBe(false);
    expect(a.check(makeStats({ tierOrder: 3 }))).toBe(true);
  });

  it("tier_gold unlocks pada tierOrder ≥ 4", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "tier_gold")!;
    expect(a.check(makeStats({ tierOrder: 3 }))).toBe(false);
    expect(a.check(makeStats({ tierOrder: 4 }))).toBe(true);
  });

  it("tier_platinum unlocks pada tierOrder ≥ 5", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "tier_platinum")!;
    expect(a.check(makeStats({ tierOrder: 4 }))).toBe(false);
    expect(a.check(makeStats({ tierOrder: 5 }))).toBe(true);
  });

  it("tier_master unlocks pada tierOrder ≥ 6", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "tier_master")!;
    expect(a.check(makeStats({ tierOrder: 5 }))).toBe(false);
    expect(a.check(makeStats({ tierOrder: 6 }))).toBe(true);
  });
});

describe("host achievements", () => {
  it("hosted_first unlocks pada hostedCount 1", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "hosted_first")!;
    expect(a.check(makeStats({ hostedCount: 0 }))).toBe(false);
    expect(a.check(makeStats({ hostedCount: 1 }))).toBe(true);
    expect(a.progress!(makeStats({ hostedCount: 5 }))).toEqual({
      current: 1,
      target: 1,
    });
  });

  it("hosted_5 unlocks pada hostedCount 5", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "hosted_5")!;
    expect(a.check(makeStats({ hostedCount: 4 }))).toBe(false);
    expect(a.check(makeStats({ hostedCount: 5 }))).toBe(true);
    expect(a.progress!(makeStats({ hostedCount: 3 }))).toEqual({
      current: 3,
      target: 5,
    });
    expect(a.progress!(makeStats({ hostedCount: 100 }))).toEqual({
      current: 5,
      target: 5,
    });
  });

  it("hosted_25 unlocks pada hostedCount 25", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "hosted_25")!;
    expect(a.check(makeStats({ hostedCount: 24 }))).toBe(false);
    expect(a.check(makeStats({ hostedCount: 25 }))).toBe(true);
    expect(a.progress!(makeStats({ hostedCount: 50 }))).toEqual({
      current: 25,
      target: 25,
    });
  });
});

describe("getEarnedAchievements", () => {
  it("empty stats → no achievements", () => {
    expect(getEarnedAchievements(makeStats())).toEqual([]);
  });

  it("first_match + first_win pada 1 match menang", () => {
    const earned = getEarnedAchievements(
      makeStats({ totalMatches: 1, totalWins: 1 })
    );
    const codes = earned.map((a) => a.code);
    expect(codes).toContain("first_match");
    expect(codes).toContain("first_win");
  });

  it("power user dapat banyak achievements sekaligus", () => {
    const earned = getEarnedAchievements(
      makeStats({
        totalMatches: 150,
        totalWins: 110,
        hostedCount: 30,
        tierOrder: 5,
      })
    );
    const codes = earned.map((a) => a.code);
    expect(codes).toContain("first_match");
    expect(codes).toContain("matches_100");
    expect(codes).toContain("first_win");
    expect(codes).toContain("wins_100");
    expect(codes).toContain("hosted_25");
    expect(codes).toContain("tier_platinum");
  });
});

describe("getUnlockedCount", () => {
  it("empty stats → 0 unlocked, total = ACHIEVEMENTS.length", () => {
    const r = getUnlockedCount(makeStats());
    expect(r.unlocked).toBe(0);
    expect(r.total).toBe(ACHIEVEMENTS.length);
  });

  it("full power user unlocks semua", () => {
    const r = getUnlockedCount(
      makeStats({
        totalMatches: 1000,
        totalWins: 1000,
        hostedCount: 100,
        tierOrder: 6,
        // Sprint 29: streak + per-session inputs untuk catalog v2
        bestWinStreak: 100,
        currentSessionMatches: 10,
        currentSessionWins: 10,
      })
    );
    expect(r.unlocked).toBe(ACHIEVEMENTS.length);
  });

  it("partial progress count consistent", () => {
    const r = getUnlockedCount(
      makeStats({ totalMatches: 10, totalWins: 5, tierOrder: 1 })
    );
    expect(r.unlocked).toBeGreaterThan(0);
    expect(r.unlocked).toBeLessThan(r.total);
  });
});
