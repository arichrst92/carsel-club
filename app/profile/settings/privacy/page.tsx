/**
 * Privacy settings page (Sprint 38).
 *
 * - Per-field display toggles + friend request policy → PrivacyPrefsForm
 * - Data export link → /api/me/export (downloads JSON)
 * - Account delete → DeleteAccountForm (typed confirmation)
 *
 * Note: profile visibility (public/friends/private) tetap di /profile/edit
 * untuk menghindari duplikasi state.
 */

import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  resolveDisplayFlags,
} from "@/lib/privacy/display-flags";
import type { FriendRequestPolicy } from "@/lib/privacy/friend-request-policy";
import { PrivacyPrefsForm } from "@/components/profile/PrivacyPrefsForm";
import { DeleteAccountForm } from "@/components/profile/DeleteAccountForm";

export const metadata = {
  title: "Privacy",
};

export const dynamic = "force-dynamic";

export default async function PrivacySettingsPage() {
  const me = await requireUser();
  const [row] = await db
    .select({
      displayFlags: users.displayFlags,
      friendRequestPolicy: users.friendRequestPolicy,
    })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);

  const flags = resolveDisplayFlags(row?.displayFlags ?? {});
  const policy: FriendRequestPolicy = row?.friendRequestPolicy ?? "anyone";

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/profile" className="back-btn" aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="subscreen-title">Privacy</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{
          padding: "var(--s-3) var(--s-4) var(--s-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
        }}
      >
        <section
          style={{
            background: "var(--bg-soft)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "var(--s-3) var(--s-4)",
            fontSize: 12,
            color: "var(--text-700)",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          💡 Visibility level (Public/Friends/Private) ada di{" "}
          <Link
            href="/profile/edit"
            style={{ color: "var(--primary-700)", fontWeight: 700 }}
          >
            Edit Profile
          </Link>
          . Halaman ini untuk granular display + data control.
        </section>

        <PrivacyPrefsForm initialFlags={flags} initialPolicy={policy} />

        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "var(--s-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 800,
              color: "var(--text-900)",
              margin: 0,
            }}
          >
            📥 Data export
          </h3>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-500)",
              fontWeight: 600,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Download semua data kamu dalam format JSON: profile, session, match
            history, achievements.
          </p>
          <a
            href="/api/me/export"
            download
            className="btn-primary"
            style={{
              alignSelf: "flex-start",
              textDecoration: "none",
              padding: "var(--s-2) var(--s-3)",
              fontSize: 13,
            }}
          >
            Download JSON
          </a>
        </section>

        <DeleteAccountForm />
      </main>
    </div>
  );
}
