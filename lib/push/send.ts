/**
 * Server-only push delivery via web-push (Sprint 27).
 *
 * Strategy:
 * - Load VAPID keys lazy (env vars)
 * - sendToUser(userId, payload) → fan-out to all subscriptions
 * - Auto-cleanup subscriptions yang return 404/410 (expired)
 *
 * web-push docs: https://github.com/web-push-libs/web-push
 */

import "server-only";
import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import type { PushNotificationPayload } from "./types";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    console.warn(
      "[push] VAPID env vars missing (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT) — push disabled"
    );
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/**
 * Send push notification to all subscriptions belonging to user.
 * Fire-and-forget — errors logged but not thrown.
 *
 * Returns count of successful deliveries (0 if no subscriptions or VAPID off).
 */
export async function sendToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<number> {
  if (!ensureVapid()) return 0;

  const subs = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) return 0;

  const payloadStr = JSON.stringify(payload);
  let success = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payloadStr,
          { TTL: 60 * 60 * 24 } // 24h
        );
        success++;
      } catch (e) {
        const err = e as { statusCode?: number; body?: string };
        // 404/410 = subscription expired/invalid; delete it
        if (err.statusCode === 404 || err.statusCode === 410) {
          try {
            await db
              .delete(pushSubscriptions)
              .where(
                and(
                  eq(pushSubscriptions.id, s.id),
                  eq(pushSubscriptions.userId, userId)
                )
              );
          } catch (e2) {
            console.error("[push] cleanup failed:", e2);
          }
          return;
        }
        console.error(
          `[push] send failed (status=${err.statusCode}):`,
          err.body ?? e
        );
      }
    })
  );

  return success;
}
