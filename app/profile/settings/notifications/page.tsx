/**
 * Notification preferences page (Sprint 26).
 *
 * Refs:
 * - DB: user_notification_prefs
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 26
 */

import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { getNotificationPrefs } from "@/lib/db/queries/notifications";
import { NotificationPrefsForm } from "@/components/notifications/NotificationPrefsForm";
import { PushToggle } from "@/components/notifications/PushToggle";

export const metadata = {
  title: "Notification preferences",
};

export const dynamic = "force-dynamic";

export default async function NotificationPrefsPage() {
  const me = await requireUser();
  const prefs = await getNotificationPrefs(me.id);

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
        <h2 className="subscreen-title">Notifications</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        className="app-content"
        style={{
          padding: "var(--s-3) var(--s-4) var(--s-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
        }}
      >
        <PushToggle />
        <NotificationPrefsForm
          initialSettings={prefs.settings}
          initialQuietStart={prefs.quietStartHour}
          initialQuietEnd={prefs.quietEndHour}
        />
      </main>
    </div>
  );
}
