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
  TierUpPayload,
  MatchResultPayload,
  FriendRequestPayload,
  FriendAcceptedPayload,
  JoinRequestedPayload,
  JoinApprovedPayload,
  JoinRejectedPayload,
  AchievementUnlockedPayload,
} from "./types";
import { formatNotification } from "./format";
import { shouldDeliver } from "./prefs";
import { buildWaMessage } from "./wa-template";
import { getNotificationPrefs } from "@/lib/db/queries/notifications";
import { buildPushPayload } from "@/lib/push/payload";
import { sendToUser } from "@/lib/push/send";
import { sendWhatsApp } from "@/lib/fonnte/client";
import { db as dbClient } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  // Sprint 27-28: dispatch push + WA if user pref + outside quiet hours
  try {
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
  } catch (e) {
    console.error(`[notify:${type}] secondary dispatch failed:`, e);
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
    await sendWhatsApp({ target: u.phone, message });
  } catch (e) {
    console.error(`[notify:wa:${type}] send failed:`, e);
  }
}

function dispatch<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloadByType[T]
): void {
  void createNotification(userId, type, payload);
}

// ============================================================
// Typed generators — semua fire-and-forget (void return)
// ============================================================

export function notifySessionInvite(
  userId: string,
  payload: SessionInvitePayload
): void {
  dispatch(userId, "session_invite", payload);
}

export function notifySessionReminder(
  userId: string,
  payload: SessionReminderPayload
): void {
  dispatch(userId, "session_reminder", payload);
}

export function notifySessionCancelled(
  userId: string,
  payload: SessionCancelledPayload
): void {
  dispatch(userId, "session_cancelled", payload);
}

export function notifyTierUp(
  userId: string,
  payload: TierUpPayload
): void {
  dispatch(userId, "tier_up", payload);
}

export function notifyMatchResult(
  userId: string,
  payload: MatchResultPayload
): void {
  dispatch(userId, "match_result", payload);
}

export function notifyFriendRequest(
  userId: string,
  payload: FriendRequestPayload
): void {
  dispatch(userId, "friend_request", payload);
}

export function notifyFriendAccepted(
  userId: string,
  payload: FriendAcceptedPayload
): void {
  dispatch(userId, "friend_accepted", payload);
}

export function notifyJoinRequested(
  userId: string,
  payload: JoinRequestedPayload
): void {
  dispatch(userId, "join_requested", payload);
}

export function notifyJoinApproved(
  userId: string,
  payload: JoinApprovedPayload
): void {
  dispatch(userId, "join_approved", payload);
}

export function notifyJoinRejected(
  userId: string,
  payload: JoinRejectedPayload
): void {
  dispatch(userId, "join_rejected", payload);
}

export function notifyAchievementUnlocked(
  userId: string,
  payload: AchievementUnlockedPayload
): void {
  dispatch(userId, "achievement_unlocked", payload);
}
