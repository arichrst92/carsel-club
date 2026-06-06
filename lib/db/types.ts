/**
 * DB types — inferred dari Drizzle schema.
 * Source of truth = lib/db/schema.ts.
 *
 * Convention: camelCase di TypeScript, snake_case di Postgres
 * (Drizzle auto-handle conversion).
 */

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  tierDefinitions,
  sessions,
  sessionParticipants,
  matchRoundSets,
  matches,
  otpVerifications,
  referrals,
  appLogs,
  sessionGroupPhotos,
  sessionJoinRequests,
  friendRequests,
  userBlocks,
  follows,
  notifications,
  userNotificationPrefs,
  pushSubscriptions,
  userAchievements,
  tournamentBrackets,
} from "./schema";

// Select types (rows yang di-fetch dari DB)
export type User = InferSelectModel<typeof users>;
export type TierDefinition = InferSelectModel<typeof tierDefinitions>;
export type Session = InferSelectModel<typeof sessions>;
export type SessionParticipant = InferSelectModel<typeof sessionParticipants>;
export type MatchRoundSet = InferSelectModel<typeof matchRoundSets>;
export type Match = InferSelectModel<typeof matches>;
export type OtpVerification = InferSelectModel<typeof otpVerifications>;
export type Referral = InferSelectModel<typeof referrals>;
export type AppLog = InferSelectModel<typeof appLogs>;
export type SessionGroupPhoto = InferSelectModel<typeof sessionGroupPhotos>;
export type SessionJoinRequest = InferSelectModel<typeof sessionJoinRequests>;
export type FriendRequest = InferSelectModel<typeof friendRequests>;
export type UserBlock = InferSelectModel<typeof userBlocks>;
export type Follow = InferSelectModel<typeof follows>;
export type Notification = InferSelectModel<typeof notifications>;
export type UserNotificationPrefs = InferSelectModel<typeof userNotificationPrefs>;
export type PushSubscription = InferSelectModel<typeof pushSubscriptions>;
export type UserAchievement = InferSelectModel<typeof userAchievements>;
export type TournamentBracket = InferSelectModel<typeof tournamentBrackets>;

// Insert types (rows yang di-create)
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewSessionParticipant = InferInsertModel<typeof sessionParticipants>;
export type NewMatchRoundSet = InferInsertModel<typeof matchRoundSets>;
export type NewMatch = InferInsertModel<typeof matches>;
export type NewOtpVerification = InferInsertModel<typeof otpVerifications>;
export type NewReferral = InferInsertModel<typeof referrals>;
export type NewAppLog = InferInsertModel<typeof appLogs>;
export type NewSessionGroupPhoto = InferInsertModel<typeof sessionGroupPhotos>;
export type NewSessionJoinRequest = InferInsertModel<typeof sessionJoinRequests>;
export type NewFriendRequest = InferInsertModel<typeof friendRequests>;
export type NewUserBlock = InferInsertModel<typeof userBlocks>;
export type NewFollow = InferInsertModel<typeof follows>;
export type NewNotification = InferInsertModel<typeof notifications>;
export type NewUserNotificationPrefs = InferInsertModel<typeof userNotificationPrefs>;
export type NewPushSubscription = InferInsertModel<typeof pushSubscriptions>;
export type NewUserAchievement = InferInsertModel<typeof userAchievements>;
export type NewTournamentBracket = InferInsertModel<typeof tournamentBrackets>;
