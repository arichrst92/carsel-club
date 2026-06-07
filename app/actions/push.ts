"use server";

/**
 * Push subscription actions (Sprint 27).
 *
 * - savePushSubscriptionAction: idempotent upsert by endpoint
 * - removePushSubscriptionAction: delete by endpoint (on unsubscribe)
 *
 * Refs:
 * - DB: push_subscriptions
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 27
 */

import { redirect } from "next/navigation";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  parsePushSubscription,
  sanitizeUserAgent,
} from "@/lib/push/subscriptions";

export type PushActionResult = { error?: string; success?: string } | null;

export async function savePushSubscriptionAction(
  rawSubscription: unknown
): Promise<PushActionResult> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const sub = parsePushSubscription(rawSubscription);
  if (!sub) return { error: "Subscription tidak valid" };

  const h = await headers();
  const ua = sanitizeUserAgent(h.get("user-agent"));

  try {
    await db
      .insert(pushSubscriptions)
      .values({
        userId: me.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: ua,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: me.id,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          userAgent: ua,
          lastSeenAt: sql`now()`,
        },
      });
  } catch (e) {
    console.error("[savePushSubscriptionAction]", e);
    return { error: "Gagal simpan subscription" };
  }
  return { success: "Push enabled" };
}

export async function removePushSubscriptionAction(
  endpoint: string
): Promise<PushActionResult> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  try {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, me.id)
        )
      );
  } catch (e) {
    console.error("[removePushSubscriptionAction]", e);
    return { error: "Gagal hapus subscription" };
  }
  return { success: "Push disabled" };
}
