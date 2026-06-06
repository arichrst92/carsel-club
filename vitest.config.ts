/**
 * Vitest config — unit tests for pure logic.
 *
 * Coverage policy: 100% on files that are explicitly tested.
 * Add new files ke `coverage.include` setiap sprint yang touch logic.
 * UI components, server actions DB-heavy, dan route handlers di-test via
 * integration nanti (sprint terkait), bukan disini.
 */

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Include = files yang WAJIB 100% covered.
      // Cumulative — setiap sprint nambah file, tidak pernah turun.
      include: [
        "lib/match/generator.ts",
        "lib/match/stats-helpers.ts",
        "lib/auth/otp.ts",
        "lib/achievements.ts",
        "lib/utils.ts",
        // Sprint 1 — storage foundation
        "lib/storage/image.ts",
        "lib/storage/local.ts",
        "lib/storage/rate-limit.ts",
        // Sprint 2 — log foundation
        "lib/log/sanitize.ts",
        "lib/log/format.ts",
        "lib/log/filter.ts",
        // Sprint 3 — session lifecycle
        "lib/sessions/lifecycle.ts",
        // Sprint 4 — match lifecycle + timer
        "lib/match/lifecycle.ts",
        "lib/match/timer.ts",
        // Sprint 5 — match detail helpers
        "lib/match/detail-helpers.ts",
        // Sprint 14 — round count smart default
        "lib/match/round-count.ts",
        // Sprint 15 — swap helpers
        "lib/match/swap.ts",
        // Sprint 16 — Mexicano generator
        "lib/match/generator-mexicano.ts",
        // Sprint 17 — Fix Partners (Round Robin)
        "lib/match/generator-fix-partners.ts",
        // Sprint 25 — notification formatter
        "lib/notifications/format.ts",
        // Sprint 26 — prefs + grouping
        "lib/notifications/prefs.ts",
        "lib/notifications/group.ts",
        // Sprint 27 — push helpers
        "lib/push/subscriptions.ts",
        "lib/push/payload.ts",
        // Sprint 28 — WA template + reminder window
        "lib/notifications/wa-template.ts",
        "lib/notifications/reminder-window.ts",
        // Sprint 30 — advanced stats
        "lib/stats/advanced.ts",
        // Sprint 31 — tournament bracket
        "lib/match/bracket.ts",
        // Sprint 32 — leaderboard v2
        "lib/leaderboard/sort.ts",
        "lib/leaderboard/period.ts",
        // Sprint 33 — PWA
        "lib/pwa/install-prompt.ts",
        // Sprint 34 — error parsing
        "lib/errors/friendly.ts",
        // Sprint 35 — stats recompute
        "lib/stats/recompute.ts",
        // Sprint 36 — backup health
        "lib/backup/health.ts",
        // Sprint 37 — OTP attempt enforcement
        "lib/auth/otp-attempts.ts",
        // Sprint 38 — privacy display flags + friend request policy
        "lib/privacy/display-flags.ts",
        "lib/privacy/friend-request-policy.ts",
      ],
      // Exclude: files yang belum sprint-nya untuk di-test.
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "node_modules/**",
        ".next/**",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
