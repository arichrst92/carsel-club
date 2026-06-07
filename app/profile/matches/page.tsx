/**
 * Riwayat Pertandingan page (Sprint 49 alignment).
 *
 * Sesuai prototype `docs/CarselClubPrototype/match-history.html` —
 * `history-item` style dgn result-badge (W/L + points), score di hi-head,
 * teams + duration tag, di-group by date bucket (Hari Ini / Kemarin /
 * Minggu Ini / Bulan Ini / Lebih Lama).
 *
 * CSS classes: .match-history-list / .history-item / .result-badge /
 * .hi-info / .hi-head / .hi-score / .hi-meta-row / .hi-teams /
 * .hi-team-row / .hi-foot / .hi-tag — di `app/shared.css`.
 */

import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { getRecentMatches } from "@/lib/db/queries/home";
import { formatTime } from "@/lib/utils";
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

type MatchRow = Awaited<ReturnType<typeof getRecentMatches>>[number];

const POINTS_BY_OUTCOME: Record<"win" | "draw" | "loss", number> = {
  win: 3,
  draw: 2,
  loss: 1,
};

function dateBucket(d: Date | string | null): {
  key: string;
  label: string;
  order: number;
} {
  if (!d) return { key: "older", label: "📜 Lebih Lama", order: 5 };
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const diffDays = Math.floor(
    (startOfToday.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return { key: "today", label: "🟢 Hari Ini", order: 0 };
  if (diffDays === 1) return { key: "yesterday", label: "📅 Kemarin", order: 1 };
  if (diffDays <= 7) return { key: "week", label: "🗓 Minggu Ini", order: 2 };
  if (diffDays <= 30) return { key: "month", label: "📆 Bulan Ini", order: 3 };
  return { key: "older", label: "📜 Lebih Lama", order: 4 };
}

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

  // 30 day window untuk insight win rate
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = matches.filter(
    (m) => m.endedAt && new Date(m.endedAt).getTime() >= cutoff30
  );
  const last30Wins = last30.filter((m) => m.outcome === "win").length;
  const winRate30 = last30.length
    ? Math.round((last30Wins / last30.length) * 100)
    : 0;

  // Group filtered by date bucket
  const grouped = new Map<
    string,
    { label: string; order: number; matches: MatchRow[] }
  >();
  for (const m of filtered) {
    const b = dateBucket(m.endedAt);
    if (!grouped.has(b.key)) {
      grouped.set(b.key, { label: b.label, order: b.order, matches: [] });
    }
    grouped.get(b.key)!.matches.push(m);
  }
  const groups = Array.from(grouped.values()).sort(
    (a, b) => a.order - b.order
  );

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
        {/* INSIGHTS — featured 30-day win rate */}
        <section>
          <div className="section-head">
            <h3>Insights</h3>
            <span
              style={{
                color: "var(--text-500)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              30 hari terakhir
            </span>
          </div>
          <div className="history-insights">
            <div className="insight-card featured">
              <div className="insight-icon">📈</div>
              <div className="insight-label">Tingkat Menang</div>
              <div className="insight-value">{winRate30}%</div>
              <div className="insight-value-sub">
                {last30Wins} menang dari {last30.length} match
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">🏆</div>
              <div className="insight-label">Total Menang</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "var(--primary-700)",
                  marginTop: 4,
                }}
              >
                {wins}W
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-500)",
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                Lifetime
              </div>
            </div>
            <div className="insight-card">
              <div className="insight-icon">⚡</div>
              <div className="insight-label">Total Pertandingan</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "var(--text-900)",
                  marginTop: 4,
                }}
              >
                {matches.length}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-500)",
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {wins}W · {draws}D · {losses}L
              </div>
            </div>
          </div>
        </section>

        {/* FILTER TABS — list-tabs style */}
        <section className="list-tabs">
          {VALID_HISTORY_FILTERS.map((f) => {
            const count =
              f === "all"
                ? matches.length
                : f === "win"
                  ? wins
                  : f === "loss"
                    ? losses
                    : draws;
            const active = filter === f;
            const href =
              f === "all"
                ? "/profile/matches"
                : `/profile/matches?filter=${f}`;
            return (
              <Link
                key={f}
                href={href}
                className={`list-tab ${active ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <span>{filterEmoji(f) + HISTORY_FILTER_LABELS[f]}</span>
                <span className="tab-count">{count}</span>
              </Link>
            );
          })}
        </section>

        {/* GROUPED LIST */}
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: "var(--s-3)" }}>
            <div className="empty-state-icon">🎾</div>
            <div className="empty-state-title">
              {filter === "all"
                ? "No completed matches"
                : `No ${HISTORY_FILTER_LABELS[filter].toLowerCase()} matches`}
            </div>
            <div className="empty-state-text">
              {filter === "all"
                ? "Match yang sudah completed akan muncul di sini setelah host end match."
                : "Ganti filter atau cek lagi nanti."}
            </div>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.label} style={{ marginTop: "var(--s-3)" }}>
              <div
                className="section-head"
                style={{ marginBottom: "var(--s-2)" }}
              >
                <h3>{g.label}</h3>
                <span
                  style={{
                    color: "var(--text-500)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {g.matches.length} match
                </span>
              </div>
              <div className="match-history-list">
                {g.matches.map((m) => (
                  <HistoryItem key={m.matchId} m={m} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

function filterEmoji(f: HistoryFilter): string {
  if (f === "win") return "🏆 ";
  if (f === "loss") return "⚡ ";
  if (f === "draw") return "🤝 ";
  return "";
}

function HistoryItem({ m }: { m: MatchRow }) {
  const points = POINTS_BY_OUTCOME[m.outcome];
  const resultLetter =
    m.outcome === "win" ? "W" : m.outcome === "loss" ? "L" : "D";
  return (
    <Link
      href={`/sessions/${m.sessionId}/matches/${m.matchId}`}
      className="history-item"
      style={{ textDecoration: "none" }}
    >
      <div className={`result-badge ${m.outcome}`}>
        <div className="rb-result">{resultLetter}</div>
        <div className="rb-points">+{points}</div>
      </div>
      <div className="hi-info">
        <div className="hi-head">
          <div
            className="hi-session"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 13,
              color: "var(--text-900)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {m.sessionTitle}
          </div>
          <div className="hi-score">
            {m.myScore} – {m.oppScore}
          </div>
        </div>
        <div className="hi-meta-row">
          {m.endedAt && <span>{formatTime(m.endedAt)}</span>}
          {m.endedAt && <span>·</span>}
          <span>
            Round {m.roundNumber} · Court {m.courtNumber}
          </span>
        </div>
        <div className="hi-teams">
          <div className="hi-team-row you">
            <span className="hi-team-emoji">🎾</span>
            <span>
              You{m.partnerName ? ` · ${m.partnerName}` : ""}
            </span>
          </div>
          <div className="hi-team-row vs">
            <span className="hi-team-emoji">vs</span>
            <span>
              {m.opponentNames.length > 0
                ? m.opponentNames.join(" · ")
                : "Lawan"}
            </span>
          </div>
        </div>
        <div className="hi-foot">
          <div className="hi-foot-tags">
            {m.durationMin !== null && (
              <span className="hi-tag">{m.durationMin} min</span>
            )}
          </div>
          <span style={{ color: "var(--text-400)" }}>→</span>
        </div>
      </div>
    </Link>
  );
}
