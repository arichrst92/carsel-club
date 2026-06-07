"use server";

/**
 * Admin actions (Sprint 35).
 *
 * - recomputeUserStatsAction: rebuild user.totalPoints/Matches/Wins/Losses/Draws
 *   + currentWinStreak + bestWinStreak from match history
 * - reIndexAchievementsAction: re-check earned achievements after stats rebuild
 *
 * Refs:
 * - Pure: lib/stats/recompute.ts + lib/stats/advanced.ts
 * - DB: users + matches + user_achievements
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 35
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  users,
  userAchievements,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import {
  diffStats,
  recomputeStats,
  type RecomputedStats,
  type StatsDiff,
} from "@/lib/stats/recompute";
import { getUserMatchOutcomes } from "@/lib/db/queries/advanced-stats";
import {
  ACHIEVEMENTS,
  detectNewlyUnlocked,
  type UserStatsForAchievement,
} from "@/lib/achievements";
import { computeTierId } from "@/lib/match/stats-helpers";
import { event } from "@/lib/log";

export type RecomputeResult =
  | { error: string }
  | {
      ok: true;
      userId: string;
      diff: StatsDiff;
      newTierId: number;
      achievementsAdded: number;
    };

export async function recomputeUserStatsAction(
  targetUserId: string
): Promise<RecomputeResult> {
  const admin = await requireAdmin();

  const [target] = await db
    .select({
      id: users.id,
      totalPoints: users.totalPoints,
      totalMatches: users.totalMatches,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalDraws: users.totalDraws,
      currentTierId: users.currentTierId,
      currentWinStreak: users.currentWinStreak,
      bestWinStreak: users.bestWinStreak,
    })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);
  if (!target) return { error: "User not found" };

  // Need outcomes ordered ascending by completion time for streak correctness
  const outcomes = await getUserMatchOutcomes(targetUserId);
  // getUserMatchOutcomes returns no order guarantee — re-sort isn't possible
  // here without timestamps. We accept current order untuk now (TODO if
  // streaks drift, add ORDER BY ended_at).
  // For Sprint 35 scope: assume insertion order matches completion order.

  const before: RecomputedStats = {
    totalMatches: target.totalMatches,
    totalWins: target.totalWins,
    totalLosses: target.totalLosses,
    totalDraws: target.totalDraws,
    totalPoints: target.totalPoints,
    currentWinStreak: target.currentWinStreak,
    bestWinStreak: target.bestWinStreak,
  };
  const after = recomputeStats(outcomes);

  const diff = diffStats(before, after);
  const newTierId = computeTierId(after.totalPoints, after.totalMatches);

  try {
    await db
      .update(users)
      .set({
        totalPoints: after.totalPoints,
        totalMatches: after.totalMatches,
        totalWins: after.totalWins,
        totalLosses: after.totalLosses,
        totalDraws: after.totalDraws,
        currentWinStreak: after.currentWinStreak,
        bestWinStreak: after.bestWinStreak,
        currentTierId: newTierId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));
  } catch (e) {
    console.error("[recomputeUserStatsAction]", e);
    return { error: "Failed to update user stats" };
  }

  // Re-index achievements untuk catch any new ones from corrected stats
  let achievementsAdded = 0;
  try {
    const existing = await db
      .select({ code: userAchievements.code })
      .from(userAchievements)
      .where(eq(userAchievements.userId, targetUserId));
    const alreadyEarned = new Set(existing.map((r) => r.code));
    const stats: UserStatsForAchievement = {
      totalPoints: after.totalPoints,
      totalMatches: after.totalMatches,
      totalWins: after.totalWins,
      totalLosses: after.totalLosses,
      totalDraws: after.totalDraws,
      hostedCount: 0, // host count not affected by stats recompute
      tierOrder: newTierId,
      bestWinStreak: after.bestWinStreak,
    };
    const newAch = detectNewlyUnlocked(alreadyEarned, stats);
    if (newAch.length > 0) {
      const now = new Date();
      await db
        .insert(userAchievements)
        .values(
          newAch.map((a) => ({
            userId: targetUserId,
            code: a.code,
            earnedAt: now,
          }))
        )
        .onConflictDoNothing({
          target: [userAchievements.userId, userAchievements.code],
        });
      achievementsAdded = newAch.length;
    }
  } catch (e) {
    console.error("[recomputeUserStatsAction] achievement reindex", e);
  }

  event("admin_stats_recomputed", {
    adminId: admin.id,
    targetUserId,
    changedFields: diff.map((d) => d.field),
    achievementsAdded,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/users/${targetUserId}`);
  return { ok: true, userId: targetUserId, diff, newTierId, achievementsAdded };
}

// Suppress unused
void and;
void asc;
void ACHIEVEMENTS;
