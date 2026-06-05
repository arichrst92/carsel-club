"use server";

/**
 * Tier-up acknowledgment action (Sprint 12).
 *
 * User dismiss tier-up modal → set users.lastSeenTierId = currentTierId.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function dismissTierUpAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user!.currentTierId === null) return { ok: true };

  try {
    await db
      .update(users)
      .set({ lastSeenTierId: user!.currentTierId })
      .where(eq(users.id, user!.id));
  } catch {
    return { ok: false };
  }

  revalidatePath("/home");
  return { ok: true };
}
