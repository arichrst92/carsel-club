/**
 * Notification types (Sprint 25).
 *
 * Each NotificationType punya payload shape sendiri — type-safe lookup
 * via NotificationPayloadByType.
 */

export type NotificationType =
  | "session_invite"
  | "session_reminder"
  | "session_cancelled"
  | "tier_up"
  | "match_result"
  | "friend_request"
  | "friend_accepted"
  | "join_requested"
  | "join_approved"
  | "join_rejected"
  | "achievement_unlocked";

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

export type TierUpPayload = {
  fromTierId: number;
  toTierId: number;
  tierName: string;
};

export type MatchResultPayload = {
  matchId: string;
  sessionId: string;
  sessionTitle: string;
  outcome: "win" | "loss" | "draw";
  pointsEarned: number;
  team1Score: number;
  team2Score: number;
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

export type AchievementUnlockedPayload = {
  code: string;
  name: string;
  emoji: string;
  description: string;
};

export type NotificationPayloadByType = {
  session_invite: SessionInvitePayload;
  session_reminder: SessionReminderPayload;
  session_cancelled: SessionCancelledPayload;
  tier_up: TierUpPayload;
  match_result: MatchResultPayload;
  friend_request: FriendRequestPayload;
  friend_accepted: FriendAcceptedPayload;
  join_requested: JoinRequestedPayload;
  join_approved: JoinApprovedPayload;
  join_rejected: JoinRejectedPayload;
  achievement_unlocked: AchievementUnlockedPayload;
};
