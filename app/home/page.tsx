import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getTierInfo,
  getNextSession,
  getRecentMatches,
} from "@/lib/db/queries/home";
import { getTierById } from "@/lib/db/queries/public-profile";
import { BottomNav } from "@/components/nav/BottomNav";
import { TierUpModal } from "@/components/home/TierUpModal";
import { logoutAction } from "@/app/actions/auth";
import { formatDate, formatTime, formatTimeRange, winRate } from "@/lib/utils";

export const metadata = {
  title: "Home",
};

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

function greet(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function HomePage() {
  const user = await requireUser();
  const [tierInfo, nextSession, recent] = await Promise.all([
    getTierInfo(user.id),
    getNextSession(user.id),
    getRecentMatches(user.id, 3),
  ]);

  const wr = winRate(user.totalWins, user.totalMatches);
  const initial = (user.displayName.trim()[0] ?? "U").toUpperCase();

  // Sprint 12: tier-up modal kalau ada unseen tier-up
  const currentTierId = user.currentTierId ?? 1;
  const lastSeenTierId = user.lastSeenTierId ?? 1;
  const hasUnseenTierUp = currentTierId > lastSeenTierId;
  const newTier = hasUnseenTierUp ? await getTierById(currentTierId) : null;

  return (
    <div className="app-shell">
      {/* Tier-up celebration modal */}
      {newTier && (
        <TierUpModal
          userId={user.id}
          displayName={user.displayName}
          newTierId={newTier.id}
          newTierName={newTier.name}
          newTierColor={newTier.color}
          totalPoints={user.totalPoints}
          totalMatches={user.totalMatches}
        />
      )}

      {/* HEADER */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Carsel Club</span>
        </div>
        <div className="header-actions">
          <Link
            href="/notifications"
            className="icon-btn"
            aria-label="Notifications"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </Link>
          <Link
            href="/profile"
            className="avatar"
            aria-label="Profile"
            style={
              user.avatarUrl
                ? {
                    background: `url(${user.avatarUrl}) center/cover no-repeat`,
                    color: "transparent",
                  }
                : undefined
            }
          >
            {!user.avatarUrl && initial}
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="app-content">
        {/* TIER CARD */}
        <TierCard
          greet={greet()}
          name={user.displayName}
          tierName={tierInfo?.currentTier?.name ?? "Rookie"}
          tierEmoji={TIER_EMOJI[tierInfo?.currentTier?.name ?? "Rookie"] ?? "🎾"}
          totalPoints={user.totalPoints}
          nextTierName={tierInfo?.nextTier?.name ?? null}
          nextTierMinPoints={tierInfo?.nextTier?.minPoints ?? null}
        />

        {/* QUICK ACTIONS */}
        <section>
          <div className="section-head">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <Link href="/sessions/new" className="qa-btn primary">
              <div className="qa-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="qa-title">Create Session</div>
              <div className="qa-sub">Mulai session baru</div>
            </Link>
            <Link href="/sessions" className="qa-btn">
              <div className="qa-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="qa-title">My Sessions</div>
              <div className="qa-sub">Lihat session</div>
            </Link>
          </div>
        </section>

        {/* INCOMING SESSION */}
        {nextSession && (
          <section>
            <div className="section-head">
              <h3>Session Berikutnya</h3>
              <Link href="/sessions" className="section-link">
                Lihat Semua
              </Link>
            </div>
            <Link
              href={`/sessions/${nextSession.id}`}
              className="session-card"
              style={{ display: "block" }}
            >
              <div className="session-banner">
                <div className="session-banner-text">
                  <div className="session-banner-tag">
                    {formatDate(nextSession.scheduledAt)} ·{" "}
                    {formatTime(nextSession.scheduledAt)}
                  </div>
                  <div className="session-banner-title">{nextSession.title}</div>
                </div>
              </div>
              <div className="session-body">
                <div className="session-meta">
                  {nextSession.venueName && (
                    <div className="session-meta-row">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{nextSession.venueName}</span>
                    </div>
                  )}
                  <div className="session-meta-row">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span style={{ textTransform: "capitalize" }}>
                      {nextSession.format} · {nextSession.numCourts} court
                      {nextSession.numCourts > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="session-meta-row">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span>{nextSession.participantCount} pemain</span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* STATS GRID */}
        <section>
          <div className="section-head">
            <h3>Stats Kamu</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-card teal">
              <div className="stat-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="stat-value">{user.totalMatches}</div>
              <div className="stat-label">Match</div>
            </div>
            <div className="stat-card coral">
              <div className="stat-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 6l-9.5 9.5-5-5L1 18" />
                  <path d="M17 6h6v6" />
                </svg>
              </div>
              <div className="stat-value">{wr}%</div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="stat-value">{user.totalWins}</div>
              <div className="stat-label">Wins</div>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section>
          <div className="section-head">
            <h3>Recent Matches</h3>
          </div>
          {recent.length === 0 ? (
            <div
              className="empty-state"
              style={{
                padding: "var(--s-5)",
                background: "var(--bg-soft)",
                borderRadius: "var(--r-lg)",
                textAlign: "center",
                color: "var(--text-500)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Belum ada match. Buat session & mulai main!
            </div>
          ) : (
            <div className="activity-list">
              {recent.map((m) => (
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

      <BottomNav />
    </div>
  );
}

// ============================================================
// Tier Card
// ============================================================

function TierCard({
  greet,
  name,
  tierName,
  tierEmoji,
  totalPoints,
  nextTierName,
  nextTierMinPoints,
}: {
  greet: string;
  name: string;
  tierName: string;
  tierEmoji: string;
  totalPoints: number;
  nextTierName: string | null;
  nextTierMinPoints: number | null;
}) {
  const progressPct =
    nextTierMinPoints && nextTierMinPoints > 0
      ? Math.min(100, Math.round((totalPoints / nextTierMinPoints) * 100))
      : 100;
  const ptsToNext = nextTierMinPoints
    ? Math.max(0, nextTierMinPoints - totalPoints)
    : 0;

  return (
    <section className="tier-card">
      <div className="tier-card-top">
        <div>
          <div className="tier-greet">{greet},</div>
          <div className="tier-greet-name">{name}!</div>
        </div>
        <div className="tier-emoji">🎾</div>
      </div>
      <div className="tier-badge-row">
        <div className="tier-icon">{tierEmoji}</div>
        <div className="tier-info">
          <div className="tier-label">Tier Saat Ini</div>
          <div className="tier-name">{tierName}</div>
        </div>
        <div>
          <div className="tier-points">{totalPoints}</div>
          <div className="tier-points-label">Points</div>
        </div>
      </div>
      {nextTierName && nextTierMinPoints ? (
        <div className="tier-progress">
          <div className="tier-progress-meta">
            <span>
              {ptsToNext} pts lagi ke {nextTierName}
            </span>
            <span>
              {totalPoints} / {nextTierMinPoints}
            </span>
          </div>
          <div className="tier-progress-bar">
            <div
              className="tier-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          className="tier-progress-meta"
          style={{ marginTop: "var(--s-3)" }}
        >
          <span>👑 Tier tertinggi!</span>
        </div>
      )}
    </section>
  );
}
