/**
 * Drizzle schema — mirror schema.sql.
 * Source of truth untuk type generation + migrations.
 *
 * Generate migration: npx drizzle-kit generate
 * Apply migration:    npx drizzle-kit migrate
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================

export const sessionFormatEnum = pgEnum("session_format", [
  "americano",
  "mexicano",
  "tournament",
]);
export const sessionPlayTypeEnum = pgEnum("session_play_type", [
  "freeplay",
  "tournament",
]);
export const sessionVisibilityEnum = pgEnum("session_visibility", [
  "public",
  "private",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "upcoming",
  "live",
  "completed",
  "cancelled",
]);
export const participantRoleEnum = pgEnum("participant_role", [
  "host",
  "co_host",
  "player",
  "guest",
]);
export const roundStatusEnum = pgEnum("round_status", [
  "pending",
  "in_progress",
  "completed",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "live",
  "completed",
]);
export const generationMethodEnum = pgEnum("generation_method", [
  "auto_random",
  "auto_mexicano",
  "manual_drag",
  "tournament", // Sprint 31: bracket-generated round
]);

export const joinPolicyEnum = pgEnum("join_policy", [
  "auto_join",
  "need_approval",
]);

export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const friendRequestStatusEnum = pgEnum("friend_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public",
  "friends",
  "private",
]);

export const tournamentSeedingEnum = pgEnum("tournament_seeding", [
  "by_join_order",
  "random",
]);

export const friendRequestPolicyEnum = pgEnum("friend_request_policy", [
  "anyone",
  "friends_of_friends",
  "off",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "session_invite",
  "session_reminder",
  "session_cancelled",
  "tier_up",
  "match_result",
  "friend_request",
  "friend_accepted",
  "join_requested",
  "join_approved",
  "join_rejected",
  "achievement_unlocked", // Sprint 29
]);

export const logTypeEnum = pgEnum("log_type", ["log", "event"]);
export const logLevelEnum = pgEnum("log_level", [
  "info",
  "warn",
  "error",
  "fatal",
]);

// ============================================================
// TIER DEFINITIONS
// ============================================================

export const tierDefinitions = pgTable("tier_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  minPoints: integer("min_points").notNull().default(0),
  minMatches: integer("min_matches").notNull().default(0),
  icon: text("icon"),
  color: text("color"),
  displayOrder: integer("display_order").notNull().unique(),
});

// ============================================================
// USERS
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    whatsappNumber: text("whatsapp_number").notNull().unique(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    city: text("city"),
    totalPoints: integer("total_points").notNull().default(0),
    totalMatches: integer("total_matches").notNull().default(0),
    totalWins: integer("total_wins").notNull().default(0),
    totalLosses: integer("total_losses").notNull().default(0),
    totalDraws: integer("total_draws").notNull().default(0),
    currentTierId: integer("current_tier_id").references(
      () => tierDefinitions.id
    ).default(1),
    // Sprint 12: track tier yang sudah di-acknowledge user (untuk tier-up
    // modal celebration). Null = belum pernah login post-creation.
    lastSeenTierId: integer("last_seen_tier_id").references(
      () => tierDefinitions.id
    ).default(1),
    isAdmin: boolean("is_admin").notNull().default(false),
    // Sprint 39: short bio + onboarding step tracking
    bio: text("bio"),
    onboardingStep: integer("onboarding_step").notNull().default(0),
    // Sprint 24: privacy untuk public profile view
    profileVisibility: profileVisibilityEnum("profile_visibility")
      .notNull()
      .default("public"),
    // Sprint 29: streak tracking
    currentWinStreak: integer("current_win_streak").notNull().default(0),
    bestWinStreak: integer("best_win_streak").notNull().default(0),
    // Sprint 38: granular privacy controls
    displayFlags: jsonb("display_flags")
      .notNull()
      .default(sql`'{}'::jsonb`),
    friendRequestPolicy: friendRequestPolicyEnum("friend_request_policy")
      .notNull()
      .default("anyone"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_users_whatsapp").on(t.whatsappNumber),
    index("idx_users_lb_points").on(t.totalPoints.desc()),
    index("idx_users_lb_matches").on(t.totalMatches.desc()),
    check(
      "total_stats_consistent",
      sql`${t.totalWins} + ${t.totalLosses} + ${t.totalDraws} = ${t.totalMatches}`
    ),
  ]
);

// ============================================================
// OTP VERIFICATIONS
// ============================================================

export const otpVerifications = pgTable(
  "otp_verifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    whatsappNumber: text("whatsapp_number").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_otp_phone_created").on(t.whatsappNumber, t.createdAt)]
);

// ============================================================
// REFERRALS
// ============================================================

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    code: text("code").notNull().unique(),
    referrerUserId: uuid("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referredUserId: uuid("referred_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_referrals_code").on(t.code),
    index("idx_referrals_referrer").on(t.referrerUserId),
  ]
);

// ============================================================
// SESSIONS
// ============================================================

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    venueName: text("venue_name"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
    format: sessionFormatEnum("format").notNull().default("americano"),
    playType: sessionPlayTypeEnum("play_type").notNull().default("freeplay"),
    visibility: sessionVisibilityEnum("visibility").notNull().default("private"),
    joinPolicy: joinPolicyEnum("join_policy").notNull().default("auto_join"),
    numCourts: integer("num_courts").notNull().default(1),
    status: sessionStatusEnum("status").notNull().default("upcoming"),
    fixPartners: boolean("fix_partners").notNull().default(false),
    coverPhotoUrl: text("cover_photo_url"),
    mapsUrl: text("maps_url"),
    maxRounds: integer("max_rounds"),
    description: text("description"),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    // Sprint 28: marker for H-1 reminder cron idempotency
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_sessions_host").on(t.hostId),
    index("idx_sessions_scheduled").on(t.scheduledAt.desc()),
    check("num_courts_positive", sql`${t.numCourts} > 0 AND ${t.numCourts} <= 20`),
    check(
      "scheduled_end_after_start",
      sql`${t.scheduledEndAt} IS NULL OR ${t.scheduledEndAt} > ${t.scheduledAt}`
    ),
  ]
);

// ============================================================
// SESSION PARTICIPANTS
// ============================================================

export const sessionParticipants = pgTable(
  "session_participants",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    guestName: text("guest_name"),
    role: participantRoleEnum("role").notNull().default("player"),
    isPlaying: boolean("is_playing").notNull().default(true),
    /**
     * Fix Partners (Sprint 52): participants sharing the same pairKey are
     * a fixed team for the entire session. Null = unpaired. Host assigns
     * pairKey via the /pairs setup UI when session.fixPartners=true and
     * no rounds have been generated yet.
     */
    pairKey: uuid("pair_key"),
    sessionPoints: integer("session_points").notNull().default(0),
    sessionMatches: integer("session_matches").notNull().default(0),
    sessionWins: integer("session_wins").notNull().default(0),
    sessionLosses: integer("session_losses").notNull().default(0),
    sessionDraws: integer("session_draws").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_sp_session").on(t.sessionId),
    index("idx_sp_user").on(t.userId),
    index("idx_sp_pair_key").on(t.sessionId, t.pairKey),
    unique("uq_session_member").on(t.sessionId, t.userId),
    check(
      "cohost_non_guest",
      sql`
        (${t.role} IN ('host', 'co_host', 'player') AND ${t.userId} IS NOT NULL AND ${t.guestName} IS NULL)
        OR
        (${t.role} = 'guest' AND ${t.userId} IS NULL AND ${t.guestName} IS NOT NULL)
      `
    ),
    check(
      "session_stats_consistent",
      sql`${t.sessionWins} + ${t.sessionLosses} + ${t.sessionDraws} = ${t.sessionMatches}`
    ),
  ]
);

// ============================================================
// MATCH ROUND SETS
// ============================================================

export const matchRoundSets = pgTable(
  "match_round_sets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    generationMethod: generationMethodEnum("generation_method")
      .notNull()
      .default("auto_random"),
    generatedBy: uuid("generated_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: roundStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_mrs_session").on(t.sessionId, t.roundNumber),
    unique("uq_mrs_session_round").on(t.sessionId, t.roundNumber),
    check("round_number_positive", sql`${t.roundNumber} > 0`),
  ]
);

// ============================================================
// USER ACHIEVEMENTS — Sprint 29
// ============================================================

/**
 * Persisted achievement unlocks. UNIQUE(userId, code) ensures idempotent
 * inserts (use ON CONFLICT DO NOTHING).
 *
 * dismissedAt = user telah lihat celebration modal (null = belum).
 */
export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  },
  (t) => [
    unique("user_achievements_user_code_unique").on(t.userId, t.code),
    index("idx_user_achievements_user").on(t.userId),
  ]
);

// ============================================================
// NOTIFICATIONS — Sprint 25-26
// ============================================================

/**
 * Per-user notification preferences (Sprint 26).
 *
 * One row per user. `settings` JSONB has per-type channel toggles:
 *   { session_invite: { in_app: true, push: false, wa: true }, ... }
 * Missing keys default to all channels enabled.
 *
 * Quiet hours stored as 0-23 hour ints. null = no quiet hours.
 * Range can wrap midnight (e.g., 22 → 7).
 */
export const userNotificationPrefs = pgTable("user_notification_prefs", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings")
    .notNull()
    .default(sql`'{}'::jsonb`),
  quietStartHour: integer("quiet_start_hour"),
  quietEndHour: integer("quiet_end_hour"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_notif_user_created").on(t.userId, t.createdAt.desc()),
    index("idx_notif_user_unread").on(t.userId, t.readAt),
  ]
);

// ============================================================
// PUSH SUBSCRIPTIONS — Sprint 27
// ============================================================

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("push_sub_endpoint_unique").on(t.endpoint),
    index("idx_push_sub_user").on(t.userId),
  ]
);

// ============================================================
// USER BLOCKS + FOLLOWS — Sprint 23
// ============================================================

export const userBlocks = pgTable(
  "user_blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("uq_user_blocks").on(t.blockerId, t.blockedId),
    index("idx_user_blocks_blocked").on(t.blockedId),
    check("no_self_block", sql`${t.blockerId} <> ${t.blockedId}`),
  ]
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("uq_follows").on(t.followerId, t.followingId),
    index("idx_follows_following").on(t.followingId),
    check("no_self_follow", sql`${t.followerId} <> ${t.followingId}`),
  ]
);

// ============================================================
// FRIEND REQUESTS — Sprint 22
// ============================================================

export const friendRequests = pgTable(
  "friend_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendRequestStatusEnum("status").notNull().default("pending"),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_friend_req_to_status").on(t.toUserId, t.status),
    index("idx_friend_req_from_status").on(t.fromUserId, t.status),
    unique("uq_friend_req_pair").on(t.fromUserId, t.toUserId),
    check("friend_req_no_self", sql`${t.fromUserId} <> ${t.toUserId}`),
  ]
);

// ============================================================
// FRIENDSHIPS (mutual, canonical pair lo < hi)
// ============================================================

export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userIdLo: uuid("user_id_lo")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userIdHi: uuid("user_id_hi")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("uq_friendship_pair").on(t.userIdLo, t.userIdHi),
    index("idx_friendship_lo").on(t.userIdLo),
    index("idx_friendship_hi").on(t.userIdHi),
    check("canonical_pair_order", sql`${t.userIdLo} < ${t.userIdHi}`),
  ]
);

// ============================================================
// MATCHES
// ============================================================

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    matchRoundSetId: uuid("match_round_set_id")
      .notNull()
      .references(() => matchRoundSets.id, { onDelete: "cascade" }),
    courtNumber: integer("court_number").notNull(),
    matchPosition: integer("match_position").notNull(),
    team1P1Id: uuid("team1_p1_id")
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: "restrict" }),
    team1P2Id: uuid("team1_p2_id")
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: "restrict" }),
    team2P1Id: uuid("team2_p1_id")
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: "restrict" }),
    team2P2Id: uuid("team2_p2_id")
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: "restrict" }),
    team1Score: integer("team1_score").notNull().default(0),
    team2Score: integer("team2_score").notNull().default(0),
    status: matchStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    // Sprint 31: bracket position (only set untuk tournament matches)
    bracketRound: integer("bracket_round"),
    bracketSlot: integer("bracket_slot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_matches_round").on(t.matchRoundSetId, t.matchPosition),
    index("idx_matches_bracket").on(
      t.matchRoundSetId,
      t.bracketRound,
      t.bracketSlot
    ),
    // Sprint 41: per-player FK indexes for stats recompute + avoid-repeat-
    // partners lookup at scale. Pre-existing queries scanned matches table.
    index("idx_matches_t1p1").on(t.team1P1Id),
    index("idx_matches_t1p2").on(t.team1P2Id),
    index("idx_matches_t2p1").on(t.team2P1Id),
    index("idx_matches_t2p2").on(t.team2P2Id),
    check(
      "distinct_players",
      sql`
        ${t.team1P1Id} != ${t.team1P2Id} AND
        ${t.team1P1Id} != ${t.team2P1Id} AND
        ${t.team1P1Id} != ${t.team2P2Id} AND
        ${t.team1P2Id} != ${t.team2P1Id} AND
        ${t.team1P2Id} != ${t.team2P2Id} AND
        ${t.team2P1Id} != ${t.team2P2Id}
      `
    ),
    check(
      "scores_non_negative",
      sql`${t.team1Score} >= 0 AND ${t.team2Score} >= 0`
    ),
  ]
);

// ============================================================
// TOURNAMENT BRACKETS — Sprint 31
// ============================================================

/**
 * One row per tournament-format session. Drives bracket layout + sponsor
 * branding. Round 1 matches inserted upfront; subsequent rounds inserted
 * lazily on prior-round completion (auto-advance).
 */
export const tournamentBrackets = pgTable("tournament_brackets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  seedingMethod: tournamentSeedingEnum("seeding_method")
    .notNull()
    .default("by_join_order"),
  totalRounds: integer("total_rounds").notNull(),
  currentRound: integer("current_round").notNull().default(1),
  sponsorName: text("sponsor_name"),
  sponsorLogoUrl: text("sponsor_logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// SESSION JOIN REQUESTS — Sprint 20 (approval flow untuk public session)
// ============================================================

export const sessionJoinRequests = pgTable(
  "session_join_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: joinRequestStatusEnum("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    message: text("message"), // optional note dari requester
  },
  (t) => [
    index("idx_join_req_session_status").on(t.sessionId, t.status),
    index("idx_join_req_user").on(t.userId),
    unique("uq_join_req_session_user_pending").on(t.sessionId, t.userId),
  ]
);

// ============================================================
// SESSION GROUP PHOTOS — Sprint 10
// ============================================================
// Max 5 photos per session (enforced di action layer, bukan DB).
// Host/co-host bisa upload + delete. Visible ke semua yang bisa view session.

export const sessionGroupPhotos = pgTable(
  "session_group_photos",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_session_group_photos_session").on(
      t.sessionId,
      t.createdAt.desc()
    ),
  ]
);

// ============================================================
// APP LOGS — observability (Sprint 2)
// ============================================================
// Single table dengan discriminator `type`:
//   - type='log'   → message + level (info/warn/error/fatal)
//   - type='event' → analytics event (level NULL)
// User-scoped (nullable, anonymous events allowed). Cleanup oleh
// /api/cron/clean-logs setelah LOG_RETENTION_DAYS (default 30).

export const appLogs = pgTable(
  "app_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    type: logTypeEnum("type").notNull(),
    level: logLevelEnum("level"), // NULL untuk events
    name: text("name").notNull(), // message (untuk log) atau event name
    context: jsonb("context").notNull().default(sql`'{}'::jsonb`),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    route: text("route"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_app_logs_created").on(t.createdAt.desc()),
    index("idx_app_logs_type_level_created").on(
      t.type,
      t.level,
      t.createdAt.desc()
    ),
    index("idx_app_logs_user_created").on(t.userId, t.createdAt.desc()),
    check(
      "log_level_required_for_logs",
      sql`(${t.type} = 'event') OR (${t.type} = 'log' AND ${t.level} IS NOT NULL)`
    ),
  ]
);
