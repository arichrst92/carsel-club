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
} from "./types";

async function createNotification<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloadByType[T]
): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      payload: payload as unknown as Record<string, unknown>,
    });
  } catch (e) {
    console.error(`[notify:${type}] failed:`, e);
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
