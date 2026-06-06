/**
 * Notification types (Sprint 25).
 *
 * Each NotificationType punya payload shape sendiri — type-safe lookup
 * via NotificationPayloadByType.
 */

/**
 * Active notification types.
 *
 * Sprint 43 deprecated (kept di DB enum untuk historical rows, tidak
 * dihasilkan lagi): tier_up, match_result, achievement_unlocked.
 * Celebration logic-nya pakai schema langsung (users.lastSeenTierId +
 * user_achievements.dismissedAt) — bukan via notification.
 */
export type NotificationType =
  | "session_invite"
  | "session_reminder"
  | "session_cancelled"
  | "friend_request"
  | "friend_accepted"
  | "join_requested"
  | "join_approved"
  | "join_rejected";

export type SessionInvitePayload = {
  sessionId: string;
  sessionTitle: string;
  inviterName: string;
};

export type SessionReminderPayload = {
  sessionId: string;
  sessionTitle: string;
  venueName: string | null;
  scheduledAt: string; // ISO
  inMinutes: number;
};

export type SessionCancelledPayload = {
  sessionId: string;
  sessionTitle: string;
};

export type FriendRequestPayload = {
  fromUserId: string;
  fromDisplayName: string;
  message: string | null;
};

export type FriendAcceptedPayload = {
  byUserId: string;
  byDisplayName: string;
};

export type JoinRequestedPayload = {
  sessionId: string;
  sessionTitle: string;
  requesterUserId: string;
  requesterDisplayName: string;
};

export type JoinApprovedPayload = {
  sessionId: string;
  sessionTitle: string;
};

export type JoinRejectedPayload = {
  sessionId: string;
  sessionTitle: string;
};

export type NotificationPayloadByType = {
  session_invite: SessionInvitePayload;
  session_reminder: SessionReminderPayload;
  session_cancelled: SessionCancelledPayload;
  friend_request: FriendRequestPayload;
  friend_accepted: FriendAcceptedPayload;
  join_requested: JoinRequestedPayload;
  join_approved: JoinApprovedPayload;
  join_rejected: JoinRejectedPayload;
};
