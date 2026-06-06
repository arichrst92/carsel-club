/**
 * Achievement sync after match completion (Sprint 29).
 *
 * Called after applyMatchScoreChange transitions a match from non-completed
 * to completed (fresh completion). Updates streak + persists newly earned
 * achievements + fires celebration notifications.
 *
 * Refs:
 * - Pure: lib/achievements.ts (nextStreak, detectNewlyUnlocked)
 * - DB: user_achievements, users.current_win_streak/best_win_streak
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 29
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  sessionParticipants,
  userAchievements,
} from "@/lib/db/schema";
import {
  detectNewlyUnlocked,
  nextStreak,
  type UserStatsForAchievement,
} from "@/lib/achievements";
import { notifyAchievementUnlocked } from "@/lib/notifications/generate";

export type FreshOutcome = {
  userId: string;
  participantId: string;
  outcome: "win" | "loss" | "draw";
};

export type StatsForUser = {
  totalPoints: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  currentTierId: number | null;
  bestWinStreak: number;
};

/**
 * Single-player streak + achievement sync.
 * Idempotent — re-run safely (ON CONFLICT DO NOTHING).
 */
export async function syncAchievementsForPlayer(
  fo: FreshOutcome
): Promise<void> {
  // 1. Read current streak + counters
  const [u] = await db
    .select({
      currentWinStreak: users.currentWinStreak,
      bestWinStreak: users.bestWinStreak,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
      currentTierId: users.currentTierId,
    })
    .from(users)
    .where(eq(users.id, fo.userId))
    .limit(1);
  if (!u) return;

  // 2. Update streak in DB
  const { current, best } = nextStreak(
    u.currentWinStreak,
    u.bestWinStreak,
    fo.outcome
  );
  if (current !== u.currentWinStreak || best !== u.bestWinStreak) {
    await db
      .update(users)
      .set({ currentWinStreak: current, bestWinStreak: best })
      .where(eq(users.id, fo.userId));
  }

  // 3. Read updated session stats (post-delta)
  const [p] = await db
    .select({
      sessionMatches: sessionParticipants.sessionMatches,
      sessionWins: sessionParticipants.sessionWins,
    })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.id, fo.participantId))
    .limit(1);
  const currentSessionMatches = p?.sessionMatches ?? 0;
  const currentSessionWins = p?.sessionWins ?? 0;

  // 4. Build stats for achievement check
  const tierOrder = u.currentTierId ?? 1;
  const stats: UserStatsForAchievement = {
    totalPoints: u.totalPoints,
    totalMatches: u.totalMatches,
    totalWins: u.totalWins,
    totalLosses: u.totalLosses,
    totalDraws: u.totalDraws,
    hostedCount: 0, // host achievements detected pada session_created, bukan disini
    tierOrder,
    bestWinStreak: best,
    currentSessionMatches,
    currentSessionWins,
  };

  // 5. Read already-earned codes
  const earnedRows = await db
    .select({ code: userAchievements.code })
    .from(userAchievements)
    .where(eq(userAchievements.userId, fo.userId));
  const alreadyEarned = new Set(earnedRows.map((r) => r.code));

  // 6. Detect new unlocks
  const newAch = detectNewlyUnlocked(alreadyEarned, stats);
  if (newAch.length === 0) return;

  // 7. Persist (idempotent — ON CONFLICT DO NOTHING)
  const now = new Date();
  await db
    .insert(userAchievements)
    .values(
      newAch.map((a) => ({
        userId: fo.userId,
        code: a.code,
        earnedAt: now,
      }))
    )
    .onConflictDoNothing({
      target: [userAchievements.userId, userAchievements.code],
    });

  // 8. Fire celebration notifications
  for (const a of newAch) {
    notifyAchievementUnlocked(fo.userId, {
      code: a.code,
      name: a.name,
      emoji: a.emoji,
      description: a.description,
    });
  }
}

/**
 * Sync achievements untuk semua players yang baru completed di match ini.
 * Best-effort — errors logged but don't propagate (stats already persisted).
 */
export async function syncAchievementsAfterMatch(
  outcomes: FreshOutcome[]
): Promise<void> {
  for (const fo of outcomes) {
    try {
      await syncAchievementsForPlayer(fo);
    } catch (e) {
      console.error(`[achievements] sync failed for ${fo.userId}:`, e);
    }
  }
}

/**
 * Sync achievements untuk single user yang baru host session (Sprint 29).
 * Dipanggil dari createSessionAction.
 */
export async function syncHostAchievements(
  userId: string,
  hostedCount: number
): Promise<void> {
  try {
    const earnedRows = await db
      .select({ code: userAchievements.code })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    const alreadyEarned = new Set(earnedRows.map((r) => r.code));

    const stats: UserStatsForAchievement = {
      totalPoints: 0,
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      hostedCount,
      tierOrder: 1,
    };
    const newAch = detectNewlyUnlocked(alreadyEarned, stats).filter(
      (a) => a.category === "host"
    );
    if (newAch.length === 0) return;
    const now = new Date();
    await db
      .insert(userAchievements)
      .values(
        newAch.map((a) => ({ userId, code: a.code, earnedAt: now }))
      )
      .onConflictDoNothing({
        target: [userAchievements.userId, userAchievements.code],
      });
    for (const a of newAch) {
      notifyAchievementUnlocked(userId, {
        code: a.code,
        name: a.name,
        emoji: a.emoji,
        description: a.description,
      });
    }
  } catch (e) {
    console.error("[achievements] host sync failed:", e);
  }
}

// Suppress unused — these are kept for tests/future use
void and;
void inArray;
void sql;
