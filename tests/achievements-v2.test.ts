import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  nextStreak,
  detectNewlyUnlocked,
  getEarnedAchievements,
  type UserStatsForAchievement,
} from "@/lib/achievements";

const baseStats: UserStatsForAchievement = {
  totalPoints: 0,
  totalMatches: 0,
  totalWins: 0,
  totalLosses: 0,
  totalDraws: 0,
  hostedCount: 0,
  tierOrder: 1,
  bestWinStreak: 0,
};

describe("nextStreak (pure)", () => {
  it("win continues streak", () => {
    expect(nextStreak(2, 4, "win")).toEqual({ current: 3, best: 4 });
  });

  it("win exceeding prev best updates best", () => {
    expect(nextStreak(4, 4, "win")).toEqual({ current: 5, best: 5 });
  });

  it("loss resets current, preserves best", () => {
    expect(nextStreak(3, 7, "loss")).toEqual({ current: 0, best: 7 });
  });

  it("draw resets current", () => {
    expect(nextStreak(3, 5, "draw")).toEqual({ current: 0, best: 5 });
  });

  it("first match win from zero", () => {
    expect(nextStreak(0, 0, "win")).toEqual({ current: 1, best: 1 });
  });
});

describe("Streak achievements", () => {
  it("win_streak_3 fires at bestWinStreak=3", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_3")!;
    expect(a.check({ ...baseStats, bestWinStreak: 2 })).toBe(false);
    expect(a.check({ ...baseStats, bestWinStreak: 3 })).toBe(true);
    expect(a.check({ ...baseStats, bestWinStreak: 100 })).toBe(true);
  });

  it("win_streak_5", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_5")!;
    expect(a.check({ ...baseStats, bestWinStreak: 4 })).toBe(false);
    expect(a.check({ ...baseStats, bestWinStreak: 5 })).toBe(true);
  });

  it("win_streak_10", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_10")!;
    expect(a.check({ ...baseStats, bestWinStreak: 9 })).toBe(false);
    expect(a.check({ ...baseStats, bestWinStreak: 10 })).toBe(true);
  });

  it("missing bestWinStreak field defaults 0", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_3")!;
    const stats = { ...baseStats };
    delete (stats as { bestWinStreak?: number }).bestWinStreak;
    expect(a.check(stats)).toBe(false);
  });

  it("perfect_day requires ≥3 matches all wins", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "perfect_day")!;
    expect(
      a.check({
        ...baseStats,
        currentSessionMatches: 3,
        currentSessionWins: 3,
      })
    ).toBe(true);
    expect(
      a.check({
        ...baseStats,
        currentSessionMatches: 2,
        currentSessionWins: 2,
      })
    ).toBe(false);
    expect(
      a.check({
        ...baseStats,
        currentSessionMatches: 3,
        currentSessionWins: 2,
      })
    ).toBe(false);
  });

  it("perfect_day missing fields → false", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "perfect_day")!;
    expect(a.check(baseStats)).toBe(false);
  });

  it("hot_session fires at 5 wins in session", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "hot_session")!;
    expect(a.check({ ...baseStats, currentSessionWins: 4 })).toBe(false);
    expect(a.check({ ...baseStats, currentSessionWins: 5 })).toBe(true);
  });

  it("hot_session missing field → false", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "hot_session")!;
    expect(a.check(baseStats)).toBe(false);
  });

  it("hot_session progress works", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "hot_session")!;
    expect(a.progress!({ ...baseStats, currentSessionWins: 3 })).toEqual({
      current: 3,
      target: 5,
    });
    expect(a.progress!(baseStats)).toEqual({ current: 0, target: 5 });
  });

  it("win_streak progress respects defaults", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_5")!;
    expect(a.progress!({ ...baseStats, bestWinStreak: 2 })).toEqual({
      current: 2,
      target: 5,
    });
    expect(a.progress!(baseStats)).toEqual({ current: 0, target: 5 });
  });

  it("win_streak_10 progress at full streak", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_10")!;
    expect(a.progress!({ ...baseStats, bestWinStreak: 15 })).toEqual({
      current: 10,
      target: 10,
    });
  });

  it("win_streak_3 progress at exact threshold", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_3")!;
    expect(a.progress!({ ...baseStats, bestWinStreak: 3 })).toEqual({
      current: 3,
      target: 3,
    });
  });

  it("win_streak_3 progress missing field → 0", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_3")!;
    const stats = { ...baseStats };
    delete (stats as { bestWinStreak?: number }).bestWinStreak;
    expect(a.progress!(stats)).toEqual({ current: 0, target: 3 });
  });

  it("win_streak_5 progress missing field → 0", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_5")!;
    const stats = { ...baseStats };
    delete (stats as { bestWinStreak?: number }).bestWinStreak;
    expect(a.progress!(stats)).toEqual({ current: 0, target: 5 });
  });

  it("win_streak_10 progress missing field → 0", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "win_streak_10")!;
    const stats = { ...baseStats };
    delete (stats as { bestWinStreak?: number }).bestWinStreak;
    expect(a.progress!(stats)).toEqual({ current: 0, target: 10 });
  });

  it("perfect_day with currentSessionMatches set but currentSessionWins missing → false", () => {
    const a = ACHIEVEMENTS.find((x) => x.code === "perfect_day")!;
    const stats = { ...baseStats, currentSessionMatches: 3 };
    delete (stats as { currentSessionWins?: number }).currentSessionWins;
    expect(a.check(stats)).toBe(false);
  });
});

describe("detectNewlyUnlocked", () => {
  it("returns empty when no progress", () => {
    expect(detectNewlyUnlocked(new Set(), baseStats)).toEqual([]);
  });

  it("returns codes earned but not yet persisted", () => {
    const earned = getEarnedAchievements({
      ...baseStats,
      totalMatches: 1,
      totalWins: 1,
    });
    const codes = earned.map((a) => a.code);
    expect(codes).toContain("first_match");
    expect(codes).toContain("first_win");
    const newOnes = detectNewlyUnlocked(
      new Set(["first_match"]),
      { ...baseStats, totalMatches: 1, totalWins: 1 }
    );
    expect(newOnes.map((a) => a.code)).toContain("first_win");
    expect(newOnes.map((a) => a.code)).not.toContain("first_match");
  });

  it("returns empty when all earned already persisted", () => {
    const stats = { ...baseStats, totalMatches: 1 };
    const earned = getEarnedAchievements(stats);
    const codes = new Set(earned.map((a) => a.code));
    expect(detectNewlyUnlocked(codes, stats)).toEqual([]);
  });

  it("includes streak achievement when new", () => {
    const stats = { ...baseStats, bestWinStreak: 5 };
    const newOnes = detectNewlyUnlocked(new Set(), stats);
    const codes = newOnes.map((a) => a.code);
    expect(codes).toContain("win_streak_3");
    expect(codes).toContain("win_streak_5");
    expect(codes).not.toContain("win_streak_10");
  });
});
