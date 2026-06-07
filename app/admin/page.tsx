/**
 * Admin dashboard index (Sprint 35).
 */

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminCounts } from "@/lib/db/queries/admin";
import { getLatestBackupAt } from "@/lib/db/queries/backup";
import {
  evaluateBackupHealth,
  formatBackupAge,
  statusColor,
  statusLabel,
} from "@/lib/backup/health";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminIndex() {
  await requireAdmin();
  const [counts, lastBackupAt] = await Promise.all([
    getAdminCounts(),
    getLatestBackupAt(),
  ]);
  const health = evaluateBackupHealth(new Date(), lastBackupAt);

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
        <h2 className="subscreen-title">Admin Dashboard</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{ padding: "var(--s-4)" }}
      >
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-3)",
          }}
        >
          <StatCard label="Users" value={counts.totalUsers} emoji="👥" />
          <StatCard
            label="Sessions"
            value={counts.totalSessions}
            sub={`${counts.liveSessions} live`}
            emoji="📅"
          />
          <StatCard
            label="Matches"
            value={counts.totalMatches}
            sub="completed"
            emoji="🎾"
          />
        </section>

        {/* Sprint 36: backup health */}
        <section
          style={{
            marginTop: "var(--s-3)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "var(--s-3) var(--s-4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 13,
                color: "var(--text-900)",
              }}
            >
              💾 Backup
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-500)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              Last:{" "}
              {health.lastBackupAt
                ? `${health.lastBackupAt.toISOString().slice(0, 16).replace("T", " ")} (${formatBackupAge(health.hoursSince)} lalu)`
                : "—"}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: statusColor(health.status),
              textTransform: "uppercase",
              letterSpacing: 0.5,
              padding: "var(--s-1) var(--s-2)",
              borderRadius: "var(--r-md)",
              background: "var(--bg-soft)",
              border: `1px solid ${statusColor(health.status)}`,
            }}
          >
            {statusLabel(health.status)}
          </div>
        </section>

        <nav
          style={{
            marginTop: "var(--s-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          <AdminLink
            href="/admin/users"
            emoji="🔍"
            title="Cari user"
            sub="Cari berdasar nama, nomor, kota"
          />
          <AdminLink
            href="/admin/sessions"
            emoji="📅"
            title="Cari session"
            sub="Cari berdasar judul, venue"
          />
          <AdminLink
            href="/monitor"
            emoji="📊"
            title="Event log monitor"
            sub="Lihat app logs + events"
          />
        </nav>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  emoji,
}: {
  label: string;
  value: number;
  sub?: string;
  emoji: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-1)",
      }}
    >
      <div style={{ fontSize: 22 }} aria-hidden>
        {emoji}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--text-900)",
        }}
      >
        {value.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-500)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-500)", fontWeight: 600 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function AdminLink({
  href,
  emoji,
  title,
  sub,
}: {
  href: string;
  emoji: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 22 }} aria-hidden>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 14,
            color: "var(--text-900)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
      <span style={{ color: "var(--text-500)", fontSize: 18 }}>›</span>
    </Link>
  );
}
