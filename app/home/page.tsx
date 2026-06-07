import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getTierInfo,
  getNextSession,
  getRecentMatches,
} from "@/lib/db/queries/home";
import { getTierById } from "@/lib/db/queries/public-profile";
import { BottomNav } from "@/components/nav/BottomNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { TierUpModal } from "@/components/home/TierUpModal";
import { AchievementUnlockedModal } from "@/components/achievements/AchievementUnlockedModal";
import { getPendingCelebration } from "@/lib/db/queries/achievements";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { logoutAction } from "@/app/actions/auth";
import { formatDate, formatTime, formatTimeRange, winRate } from "@/lib/utils";
import { SessionCard } from "@/components/sessions/SessionCard";

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
  if (h < 11) return "Good morning";
  if (h < 15) return "Good afternoon";
  if (h < 18) return "Good evening";
  return "Good night";
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

  // Sprint 29: achievement celebration (priority below tier-up)
  const pendingCelebration = newTier
    ? null
    : await getPendingCelebration(user.id);
  const pendingDef = pendingCelebration
    ? ACHIEVEMENTS.find((a) => a.code === pendingCelebration.code) ?? null
    : null;

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

      {/* Sprint 29: achievement unlock celebration */}
      {pendingCelebration && pendingDef && (
        <AchievementUnlockedModal
          achievementId={pendingCelebration.id}
          emoji={pendingDef.emoji}
          name={pendingDef.name}
          description={pendingDef.description}
        />
      )}

      {/* Sprint 50: PWA install prompt — always-on (no engagement gate) */}
      <InstallPromptBanner />

      {/* HEADER */}
      <header className="app-header">
        <div className="logo">
          <Image
            src="/icon.png"
            alt="Carsel Club"
            width={36}
            height={36}
            priority
            style={{ display: "block" }}
          />
          <span className="logo-text">Carsel Club</span>
        </div>
        <div className="header-actions">
          <NotificationBell userId={user.id} />
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
              <div className="qa-sub">Start a new session</div>
            </Link>
            <Link href="/find" className="qa-btn">
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
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <div className="qa-title">Find Session</div>
              <div className="qa-sub">Public sessions in your city</div>
            </Link>
          </div>
        </section>

        {/* INCOMING SESSION */}
        {nextSession && (
          <section>
            <div className="section-head">
              <h3>Next Session</h3>
              <Link href="/sessions" className="section-link">
                See All
              </Link>
            </div>
            <SessionCard
              session={nextSession}
              participantCount={nextSession.participantCount}
              bannerTag={`${formatDate(nextSession.scheduledAt)} · ${formatTime(nextSession.scheduledAt)}`}
            />
          </section>
        )}

        {/* STATS GRID */}
        <section>
          <div className="section-head">
            <h3>Your Stats</h3>
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
              No matches yet. Create a session Belum ada match. Buat session & mulai main! start playing!
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
              {ptsToNext} pts going to {nextTierName}
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
