/**
 * Notification center (Sprint 26).
 *
 * Refs:
 * - DB: notifications
 * - GUI: prototype/notifications.html
 * - Flow: Sprint 26 plan
 */

import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  countUnreadNotifications,
  listNotifications,
} from "@/lib/db/queries/notifications";
import { groupByDate } from "@/lib/notifications/group";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";

export const metadata = {
  title: "Notifikasi",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, unreadCount] = await Promise.all([
    listNotifications(user.id, { limit: 100 }),
    countUnreadNotifications(user.id),
  ]);
  const now = new Date();
  const groups = groupByDate(now, items);

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/home" className="back-btn" aria-label="Back">
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
        <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>
          <MarkAllReadButton disabled={unreadCount === 0} />
        </div>
      </header>

      <main
        className="app-content"
        style={{
          paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))",
          paddingTop: "var(--s-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 var(--s-4) var(--s-3)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--text-500)",
              fontWeight: 600,
            }}
          >
            {unreadCount > 0
              ? `${unreadCount} belum dibaca`
              : "Semua sudah dibaca"}
          </div>
          <Link
            href="/profile/settings/notifications"
            style={{
              fontSize: 12,
              color: "var(--primary-700)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Pengaturan ⚙
          </Link>
        </div>

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-4)",
              padding: "0 var(--s-4)",
            }}
          >
            {groups.map((g) => (
              <section
                key={g.bucket}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s-2)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--text-700)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    margin: 0,
                  }}
                >
                  {g.label}
                </h3>
                {g.items.map((it) => (
                  <NotificationItem
                    key={it.id}
                    id={it.id}
                    type={it.type}
                    payload={it.payload}
                    readAt={it.readAt}
                    createdAt={it.createdAt}
                    now={now}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "var(--s-8) var(--s-4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--s-3)",
      }}
    >
      <div
        style={{
          fontSize: 48,
          padding: "var(--s-4)",
          background: "var(--primary-50)",
          borderRadius: "var(--r-full)",
          width: 96,
          height: 96,
          display: "grid",
          placeItems: "center",
        }}
      >
        🔔
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          color: "var(--text-900)",
        }}
      >
        Belum ada notifikasi
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-500)",
          fontWeight: 600,
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        Notifikasi muncul saat kamu di-invite ke session, tier naik, atau match
        selesai.
      </div>
    </div>
  );
}
