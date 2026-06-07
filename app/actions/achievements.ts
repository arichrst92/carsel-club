"use server";

/**
 * Achievement actions (Sprint 29).
 *
 * - dismissAchievementAction: marks user_achievements.dismissed_at = now
 *
 * Refs:
 * - DB: user_achievements
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userAchievements } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function dismissAchievementAction(
  achievementId: string
): Promise<{ error?: string } | null> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .update(userAchievements)
      .set({ dismissedAt: new Date() })
      .where(
        and(
          eq(userAchievements.id, achievementId),
          eq(userAchievements.userId, me.id),
          isNull(userAchievements.dismissedAt)
        )
      );
  } catch (e) {
    console.error("[dismissAchievementAction]", e);
    return { error: "Failed to dismiss" };
  }

  revalidatePath("/home");
  revalidatePath("/achievements");
  return null;
}

export async function dismissAllAchievementsAction(): Promise<
  { error?: string } | null
> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .update(userAchievements)
      .set({ dismissedAt: new Date() })
      .where(
        and(
          eq(userAchievements.userId, me.id),
          isNull(userAchievements.dismissedAt)
        )
      );
  } catch (e) {
    console.error("[dismissAllAchievementsAction]", e);
    return { error: "Failed to dismiss" };
  }

  revalidatePath("/home");
  revalidatePath("/achievements");
  return null;
}
