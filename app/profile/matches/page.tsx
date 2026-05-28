import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { getRecentMatches } from "@/lib/db/queries/home";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata = {
  title: "Match History",
};

export default async function MatchHistoryPage() {
  const user = await requireUser();
  const matches = await getRecentMatches(user.id, 100);

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

      <main className="app-content subscreen">
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
          <Summary value={matches.length} label="Total Match" color="var(--text-900)" />
          <Summary value={wins} label="Menang" color="var(--primary-700)" />
          <Summary value={draws} label="Seri" color="var(--text-500)" />
          <Summary value={losses} label="Kalah" color="var(--accent-600)" />
        </section>

        {/* List */}
        <section>
          <div className="section-head">
            <h3>Semua Match ({matches.length})</h3>
          </div>

          {matches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎾</div>
              <div className="empty-state-title">Belum ada match selesai</div>
              <div className="empty-state-text">
                Match yang sudah completed akan muncul di sini setelah host end
                match.
              </div>
            </div>
          ) : (
            <div className="activity-list">
              {matches.map((m) => (
                <Link
                  key={m.matchId}
                  href={`/sessions/${m.sessionId}`}
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
