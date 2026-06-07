/**
 * Admin user detail + recompute action (Sprint 35).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminUserDetail } from "@/lib/db/queries/admin";
import { RecomputeButton } from "./RecomputeButton";

export const metadata = {
  title: "Admin · User",
};

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const u = await getAdminUserDetail(userId);
  if (!u) notFound();

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/admin/users" className="back-btn" aria-label="Back">
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
        <h2 className="subscreen-title">{u.displayName}</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{
          padding: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
        }}
      >
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
          <Field label="WhatsApp" value={u.whatsappNumber} />
          <Field label="City" value={u.city ?? "—"} />
          <Field
            label="Created"
            value={u.createdAt.toISOString().slice(0, 10)}
          />
          <Field label="Admin?" value={u.isAdmin ? "Yes" : "No"} />
        </section>

        <section
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "var(--s-4)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-3)",
          }}
        >
          <Stat label="Points" value={u.totalPoints} />
          <Stat label="Matches" value={u.totalMatches} />
          <Stat label="Wins" value={u.totalWins} />
          <Stat label="Losses" value={u.totalLosses} />
          <Stat label="Draws" value={u.totalDraws} />
          <Stat label="Tier ID" value={u.currentTierId ?? 1} />
          <Stat label="Streak" value={u.currentWinStreak} />
          <Stat label="Best Streak" value={u.bestWinStreak} />
        </section>

        <RecomputeButton userId={u.id} />

        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Recompute rebuilds totals + streak + tier dari match history. Achievements
          akan di-re-check untuk catch yang baru unlock.
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--text-500)", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "var(--text-900)", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "var(--bg-soft)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
        padding: "var(--s-2) var(--s-3)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text-500)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          color: "var(--text-900)",
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
