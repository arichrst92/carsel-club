/**
 * Notification generators (Sprint 25) — server-only.
 *
 * Fire-and-forget pattern — caller TIDAK await. Gagal write tidak crash
 * flow utama. Pattern sama dgn lib/log.
 *
 * Refs:
 * - DB: notifications table
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 25
 */

import "server-only";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import type {
  NotificationType,
  NotificationPayloadByType,
  SessionInvitePayload,
  SessionReminderPayload,
  SessionCancelledPayload,
  FriendRequestPayload,
  FriendAcceptedPayload,
  JoinRequestedPayload,
  JoinApprovedPayload,
  JoinRejectedPayload,
} from "./types";
import { formatNotification } from "./format";
import { shouldDeliver } from "./prefs";
import { buildWaMessage } from "./wa-template";
import { getNotificationPrefs } from "@/lib/db/queries/notifications";
import { buildPushPayload } from "@/lib/push/payload";
import { sendToUser } from "@/lib/push/send";
import { sendWhatsApp } from "@/lib/whatsapp/dispatch";
import { db as dbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Persist the in-app notification row, then fire off best-effort secondary
 * deliveries (push + WA). Returns once the DB insert is durable so callers
 * can `await` it — important for Server Actions where the response is sent
 * to the client immediately after the action returns; unawaited promises
 * may be cancelled before the row lands in Postgres.
 */
async function createNotification<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloadByType[T]
): Promise<void> {
  let notificationId: string | null = null;
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        payload: payload as unknown as Record<string, unknown>,
      })
      .returning({ id: notifications.id });
    notificationId = row?.id ?? null;
  } catch (e) {
    console.error(`[notify:${type}] insert failed:`, e);
    return;
  }
  if (!notificationId) return;

  // Fire-and-forget secondary delivery (push + WA). These can be slow (WA
  // gateway timeout up to 8s) and shouldn't block the action response.
  void dispatchSecondaryDelivery(userId, type, payload, notificationId).catch(
    (e) => {
      console.error(`[notify:${type}] secondary dispatch failed:`, e);
    }
  );
}

async function dispatchSecondaryDelivery<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloadByType[T],
  notificationId: string
): Promise<void> {
  const prefs = await getNotificationPrefs(userId);
  const currentHour = new Date().getHours();
  const pushAllowed = shouldDeliver(
    prefs.settings,
    type,
    "push",
    currentHour,
    prefs.quietStartHour,
    prefs.quietEndHour
  );
  const waAllowed = shouldDeliver(
    prefs.settings,
    type,
    "wa",
    currentHour,
    prefs.quietStartHour,
    prefs.quietEndHour
  );
  if (pushAllowed) {
    const fmt = formatNotification(
      type,
      payload as unknown as Record<string, unknown>
    );
    const pushPayload = buildPushPayload(type, notificationId, fmt);
    await sendToUser(userId, pushPayload);
  }
  if (waAllowed) {
    await dispatchWa(userId, type, payload);
  }
}

async function dispatchWa<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloadByType[T]
): Promise<void> {
  // Skip if Fonnte not configured (e.g., dev w/o credentials)
  if (!process.env.FONNTE_TOKEN) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.warn("[notify:wa] NEXT_PUBLIC_APP_URL missing — WA skipped");
    return;
  }
  const [u] = await dbClient
    .select({ phone: users.whatsappNumber })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || !u.phone) return;
  try {
    const message = buildWaMessage(type, payload, { appUrl });
    // Sprint 42: dispatcher tries Wablas → Fonnte; returns ok flag (no throw)
    const r = await sendWhatsApp({ target: u.phone, message });
    if (!r.ok) {
      console.error(
        `[notify:wa:${type}] all providers failed:`,
        r.error
      );
    }
  } catch (e) {
    console.error(`[notify:wa:${type}] send failed:`, e);
  }
}

function dispatch<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloadByType[T]
): Promise<void> {
  return createNotification(userId, type, payload);
}

// ============================================================
// Typed generators — return Promise<void> so callers can await
// the DB insert. Secondary delivery (push/WA) still fires-and-forgets
// internally.
// ============================================================

export function notifySessionInvite(
  userId: string,
  payload: SessionInvitePayload
): Promise<void> {
  return dispatch(userId, "session_invite", payload);
}

export function notifySessionReminder(
  userId: string,
  payload: SessionReminderPayload
): Promise<void> {
  return dispatch(userId, "session_reminder", payload);
}

export function notifySessionCancelled(
  userId: string,
  payload: SessionCancelledPayload
): Promise<void> {
  return dispatch(userId, "session_cancelled", payload);
}

export function notifyFriendRequest(
  userId: string,
  payload: FriendRequestPayload
): Promise<void> {
  return dispatch(userId, "friend_request", payload);
}

export function notifyFriendAccepted(
  userId: string,
  payload: FriendAcceptedPayload
): Promise<void> {
  return dispatch(userId, "friend_accepted", payload);
}

export function notifyJoinRequested(
  userId: string,
  payload: JoinRequestedPayload
): Promise<void> {
  return dispatch(userId, "join_requested", payload);
}

export function notifyJoinApproved(
  userId: string,
  payload: JoinApprovedPayload
): Promise<void> {
  return dispatch(userId, "join_approved", payload);
}

export function notifyJoinRejected(
  userId: string,
  payload: JoinRejectedPayload
): Promise<void> {
  return dispatch(userId, "join_rejected", payload);
}
