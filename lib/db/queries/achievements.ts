/**
 * User achievements queries (Sprint 29).
 *
 * Refs:
 * - DB: user_achievements
 * - Used by: app/achievements/page.tsx + celebration modal
 */

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userAchievements } from "@/lib/db/schema";
import { ACHIEVEMENTS } from "@/lib/achievements";

export type EarnedAchievement = {
  id: string;
  code: string;
  earnedAt: Date;
  dismissedAt: Date | null;
};

export async function listEarnedAchievements(
  userId: string
): Promise<EarnedAchievement[]> {
  const rows = await db
    .select({
      id: userAchievements.id,
      code: userAchievements.code,
      earnedAt: userAchievements.earnedAt,
      dismissedAt: userAchievements.dismissedAt,
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  return rows;
}

/**
 * First un-dismissed achievement → triggers celebration modal.
 */
export async function getPendingCelebration(
  userId: string
): Promise<EarnedAchievement | null> {
  const [row] = await db
    .select({
      id: userAchievements.id,
      code: userAchievements.code,
      earnedAt: userAchievements.earnedAt,
      dismissedAt: userAchievements.dismissedAt,
    })
    .from(userAchievements)
    .where(
      and(
        eq(userAchievements.userId, userId),
        isNull(userAchievements.dismissedAt)
      )
    )
    .orderBy(userAchievements.earnedAt)
    .limit(1);
  if (!row) return null;
  // Make sure code exists in catalog (defensive)
  const known = ACHIEVEMENTS.some((a) => a.code === row.code);
  if (!known) return null;
  return row;
}
