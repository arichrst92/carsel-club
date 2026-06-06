import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { listMySessions } from "@/lib/db/queries/sessions";
import { SessionCard } from "@/components/sessions/SessionCard";
import { BottomNav } from "@/components/nav/BottomNav";
import {
  SessionsFilterBar,
  type SessionTab,
  type FormatFilter,
} from "@/components/sessions/SessionsFilterBar";

export const metadata = {
  title: "My Sessions",
};

type SearchParams = {
  tab?: string;
  q?: string;
  format?: string;
  sort?: string;
};

function parseTab(v: string | undefined): SessionTab {
  if (v === "live" || v === "past") return v;
  return "upcoming";
}

function parseFormat(v: string | undefined): FormatFilter {
  if (v === "americano" || v === "mexicano" || v === "tournament") return v;
  return "all";
}

function parseSort(v: string | undefined): "asc" | "desc" {
  return v === "asc" ? "asc" : "desc";
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const allSessions = await listMySessions(user.id);
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const formatFilter = parseFormat(params.format);
  const sort = parseSort(params.sort);
  const query = (params.q ?? "").trim().toLowerCase();

  // Tab counts
  const counts = {
    upcoming: allSessions.filter((s) => s.status === "upcoming").length,
    live: allSessions.filter((s) => s.status === "live").length,
    past: allSessions.filter(
      (s) => s.status === "completed" || s.status === "cancelled"
    ).length,
  };

  // Apply filters
  let filtered = allSessions;

  // Tab filter
  filtered = filtered.filter((s) => {
    if (tab === "upcoming") return s.status === "upcoming";
    if (tab === "live") return s.status === "live";
    return s.status === "completed" || s.status === "cancelled";
  });

  // Format filter
  if (formatFilter !== "all") {
    filtered = filtered.filter((s) => s.format === formatFilter);
  }

  // Search (title + venue)
  if (query) {
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        (s.venueName?.toLowerCase().includes(query) ?? false)
    );
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    const aTime = a.scheduledAt.getTime();
    const bTime = b.scheduledAt.getTime();
    return sort === "asc" ? aTime - bTime : bTime - aTime;
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">My Sessions</span>
        </div>
        <div className="header-actions">
          <Link
            href="/sessions/new"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-full)",
              background: "var(--primary)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: "var(--shadow-fab)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            + Baru
          </Link>
        </div>
      </header>

      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        <SessionsFilterBar
          counts={counts}
          currentTab={tab}
          currentFormat={formatFilter}
          currentQuery={query}
          currentSort={sort}
        />

        {allSessions.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <FilteredEmpty
            tab={tab}
            hasFilter={formatFilter !== "all" || query.length > 0}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
            }}
          >
            {filtered.map((s) => (
              <SessionCard key={s.id} session={s} />
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
    <div className="empty-state">
      <div className="empty-state-icon">🎾</div>
      <div className="empty-state-title">Belum ada session</div>
      <div className="empty-state-text">
        Buat session pertama kamu dan undang teman padel.
      </div>
      <Link
        href="/sessions/new"
        style={{
          marginTop: "var(--s-3)",
          display: "inline-block",
          padding: "10px 20px",
          borderRadius: "var(--r-full)",
          background: "var(--primary)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          textDecoration: "none",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        + Create Session
      </Link>
    </div>
  );
}

function FilteredEmpty({
  tab,
  hasFilter,
}: {
  tab: SessionTab;
  hasFilter: boolean;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🔍</div>
      <div className="empty-state-title">
        {hasFilter
          ? "Tidak ada session yang cocok"
          : tab === "upcoming"
            ? "Belum ada upcoming session"
            : tab === "live"
              ? "Tidak ada live session sekarang"
              : "Belum ada past session"}
      </div>
      <div className="empty-state-text">
        {hasFilter
          ? "Coba ubah filter atau search query."
          : tab === "upcoming"
            ? "Buat session baru untuk muncul di sini."
            : tab === "live"
              ? "Session yang sedang live akan muncul di sini."
              : "Session selesai/cancelled akan tampil di sini."}
      </div>
    </div>
  );
}
