import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { getRecentMatches } from "@/lib/db/queries/home";
import { formatDate, formatTime } from "@/lib/utils";
import {
  applyHistoryFilter,
  HISTORY_FILTER_LABELS,
  parseHistoryFilter,
  VALID_HISTORY_FILTERS,
  type HistoryFilter,
} from "@/lib/match/history-filter";

export const metadata = {
  title: "Match History",
};

export const dynamic = "force-dynamic";

export default async function MatchHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filter = parseHistoryFilter(params.filter);
  const matches = await getRecentMatches(user.id, 200);
  const filtered = applyHistoryFilter(matches, filter);

  const wins = matches.filter((m) => m.outcome === "win").length;
  const draws = matches.filter((m) => m.outcome === "draw").length;
  const losses = matches.filter((m) => m.outcome === "loss").length;

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
        <h2 className="subscreen-title">Match History</h2>
        <div style={{ width: 40 }} />
      </header>

      <main id="main-content" className="app-content subscreen">
        {/* Stats summary */}
        <section
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--r-xl)",
            padding: "var(--s-4)",
            boxShadow: "var(--shadow-card)",
            marginBottom: "var(--s-2)",
            display: "flex",
            gap: "var(--s-3)",
          }}
        >
          <Summary
            value={matches.length}
            label="Total"
            color="var(--text-900)"
          />
          <Summary value={wins} label="Menang" color="var(--primary-700)" />
          <Summary value={draws} label="Seri" color="var(--text-500)" />
          <Summary value={losses} label="Kalah" color="var(--accent-600)" />
        </section>

        {/* Filter chips */}
        <section
          aria-label="Filter berdasarkan hasil"
          style={{
            display: "flex",
            gap: "var(--s-2)",
            margin: "var(--s-3) 0 var(--s-2)",
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {VALID_HISTORY_FILTERS.map((f) => (
            <FilterChip
              key={f}
              filter={f}
              active={filter === f}
              count={
                f === "all"
                  ? matches.length
                  : f === "win"
                    ? wins
                    : f === "loss"
                      ? losses
                      : draws
              }
            />
          ))}
        </section>

        {/* List */}
        <section>
          <div className="section-head">
            <h3>
              {HISTORY_FILTER_LABELS[filter]} ({filtered.length})
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎾</div>
              <div className="empty-state-title">
                {filter === "all"
                  ? "Belum ada match selesai"
                  : `Tidak ada match ${HISTORY_FILTER_LABELS[filter].toLowerCase()}`}
              </div>
              <div className="empty-state-text">
                {filter === "all"
                  ? "Match yang sudah completed akan muncul di sini setelah host end match."
                  : "Ganti filter atau cek lagi nanti."}
              </div>
            </div>
          ) : (
            <div className="activity-list">
              {filtered.map((m) => (
                <Link
                  key={m.matchId}
                  href={`/sessions/${m.sessionId}/matches/${m.matchId}`}
                  className="activity-item"
                  style={{ textDecoration: "none" }}
                >
                  <div className={`activity-icon ${m.outcome}`}>
                    {m.outcome === "win"
                      ? "🏆"
                      : m.outcome === "draw"
                        ? "🤝"
                        : "⚡"}
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{m.sessionTitle}</div>
                    <div className="activity-meta">
                      {m.outcome === "win"
                        ? "Menang"
                        : m.outcome === "draw"
                          ? "Seri"
                          : "Kalah"}{" "}
                      {m.myScore}-{m.oppScore}
                      {m.endedAt && (
                        <>
                          {" · "}
                          {formatDate(m.endedAt)} {formatTime(m.endedAt)}
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`activity-points ${m.outcome}`}>
                    {m.outcome === "win"
                      ? "+3"
                      : m.outcome === "draw"
                        ? "+2"
                        : "+1"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FilterChip({
  filter,
  active,
  count,
}: {
  filter: HistoryFilter;
  active: boolean;
  count: number;
}) {
  const href =
    filter === "all"
      ? "/profile/matches"
      : `/profile/matches?filter=${filter}`;
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "var(--s-2) var(--s-3)",
        background: active ? "var(--primary)" : "var(--bg-soft)",
        color: active ? "#fff" : "var(--text-900)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "var(--r-full)",
        fontSize: 12,
        fontWeight: 700,
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span>{HISTORY_FILTER_LABELS[filter]}</span>
      <span
        style={{
          background: active
            ? "rgba(255,255,255,0.25)"
            : "var(--bg-card)",
          padding: "1px 6px",
          borderRadius: "var(--r-full)",
          fontSize: 10,
        }}
      >
        {count}
      </span>
    </Link>
  );
}

function Summary({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text-500)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
