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

// Insert types (rows yang di-create)
export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewSessionParticipant = InferInsertModel<typeof sessionParticipants>;
export type NewMatchRoundSet = InferInsertModel<typeof matchRoundSets>;
export type NewMatch = InferInsertModel<typeof matches>;
export type NewOtpVerification = InferInsertModel<typeof otpVerifications>;
export type NewReferral = InferInsertModel<typeof referrals>;
