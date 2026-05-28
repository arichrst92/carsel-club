import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { getProfileData } from "@/lib/db/queries/profile";
import { getRecentMatches } from "@/lib/db/queries/home";
import { BottomNav } from "@/components/nav/BottomNav";
import { logoutAction } from "@/app/actions/auth";
import { winRate } from "@/lib/utils";
import { ReferralShare } from "@/components/profile/ReferralShare";
import {
  ACHIEVEMENTS,
  getUnlockedCount,
  type UserStatsForAchievement,
} from "@/lib/achievements";

export const metadata = {
  title: "Profile",
};

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

const TIER_SHORT: Record<string, string> = {
  Rookie: "Rookie",
  Bronze: "Bronze",
  Silver: "Silver",
  Gold: "Gold",
  Platinum: "Platinum",
  Master: "Master",
};

function formatJoinDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `Joined ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, recent] = await Promise.all([
    getProfileData(user.id),
    getRecentMatches(user.id, 5),
  ]);

  if (!profile) {
    return null;
  }

  const wr = winRate(profile.totalWins, profile.totalMatches);
  const initial = (profile.displayName.trim()[0] ?? "U").toUpperCase();
  const tierName = profile.tierName ?? "Rookie";

  // Next tier
  const nextTier = profile.allTiers.find(
    (t) => t.displayOrder > (profile.tierOrder ?? 0)
  );
  const ptsToNext = nextTier
    ? Math.max(0, nextTier.minPoints - profile.totalPoints)
    : 0;
  const matchesToNext = nextTier
    ? Math.max(0, nextTier.minMatches - profile.totalMatches)
    : 0;
  const progressPct =
    nextTier && nextTier.minPoints > 0
      ? Math.min(100, Math.round((profile.totalPoints / nextTier.minPoints) * 100))
      : 100;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Profile</span>
        </div>
        <div className="header-actions">
          <form action={logoutAction}>
            <button
              type="submit"
              className="icon-btn"
              aria-label="Logout"
              title="Logout"
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* HERO */}
        <section
          style={{
            textAlign: "center",
            padding: "var(--s-5) var(--s-4)",
            background: "linear-gradient(180deg, var(--primary-50) 0%, transparent 100%)",
            borderRadius: "var(--r-2xl)",
            marginBottom: "var(--s-1)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 96,
              height: 96,
              margin: "0 auto var(--s-3)",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FB7185, #F43F5E)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 36,
                boxShadow: "var(--shadow-md)",
                border: "4px solid var(--bg)",
              }}
            >
              {initial}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "4px 10px",
                background: "var(--bg)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--r-full)",
                fontSize: 11,
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: "var(--text-900)",
                whiteSpace: "nowrap",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {TIER_EMOJI[tierName]} {TIER_SHORT[tierName]}
            </div>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 24,
              color: "var(--text-900)",
              marginBottom: 4,
            }}
          >
            {profile.displayName}
          </h1>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-500)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {profile.city && (
              <>
                <span>📍 {profile.city}</span>
                <span>·</span>
              </>
            )}
            <span>{formatJoinDate(profile.createdAt)}</span>
          </div>

          {/* Quick stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "var(--s-3)",
              marginTop: "var(--s-4)",
              padding: "var(--s-3)",
              background: "var(--bg)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
            }}
          >
            <QuickStat value={profile.totalPoints.toLocaleString()} label="Points" />
            <QuickStat value={`${wr}%`} label="Win Rate" />
            <QuickStat value={profile.totalMatches.toString()} label="Match" />
          </div>
        </section>

        {/* TIER JOURNEY */}
        <section>
          <div className="section-head">
            <h3>Tier Journey</h3>
          </div>
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--r-xl)",
              padding: "var(--s-4)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--s-3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 32 }}>{TIER_EMOJI[tierName]}</span>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 16,
                      color: "var(--text-900)",
                    }}
                  >
                    {tierName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-500)",
                      fontWeight: 600,
                    }}
                  >
                    {profile.totalPoints} pts · {profile.totalMatches} match
                  </div>
                </div>
              </div>
              {nextTier ? (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    color: "var(--text-500)",
                    fontWeight: 700,
                  }}
                >
                  <div>
                    Next: {TIER_EMOJI[nextTier.name]} {nextTier.name}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    {ptsToNext > 0 && `${ptsToNext} pts`}
                    {ptsToNext > 0 && matchesToNext > 0 && " · "}
                    {matchesToNext > 0 && `${matchesToNext} match`}
                    {ptsToNext === 0 && matchesToNext === 0 && "Ready!"}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--primary-700)",
                    fontWeight: 800,
                  }}
                >
                  👑 Top Tier
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 8,
                background: "var(--bg-soft)",
                borderRadius: "var(--r-full)",
                overflow: "hidden",
                marginBottom: "var(--s-3)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background:
                    "linear-gradient(90deg, var(--primary), var(--primary-700))",
                  borderRadius: "var(--r-full)",
                  transition: "width 0.6s ease",
                }}
              />
            </div>

            {/* Tier checkpoints */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${profile.allTiers.length}, 1fr)`,
                gap: 4,
              }}
            >
              {profile.allTiers.map((t) => {
                const isCurrent = t.id === profile.currentTierId;
                const isDone =
                  (profile.tierOrder ?? 0) > t.displayOrder;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      opacity: isDone || isCurrent ? 1 : 0.4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: isCurrent
                          ? "var(--primary)"
                          : isDone
                            ? "var(--primary-100)"
                            : "var(--bg-soft)",
                        color: isCurrent ? "#fff" : "var(--text-700)",
                        border: isCurrent
                          ? "2px solid var(--primary-700)"
                          : "1px solid var(--border-light)",
                      }}
                    >
                      {isDone ? "✓" : TIER_EMOJI[t.name]}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "var(--text-500)",
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                      }}
                    >
                      {t.name.slice(0, 4)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* STATS GRID */}
        <section>
          <div className="section-head">
            <h3>Stats Lengkap</h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--s-3)",
            }}
          >
            <StatCard
              variant="teal"
              value={profile.totalMatches}
              label="Match Played"
              icon="🎯"
            />
            <StatCard
              variant="coral"
              value={`${wr}%`}
              label="Win Rate"
              icon="📈"
            />
            <StatCard
              variant="yellow"
              value={profile.totalWins}
              label="Total Wins"
              icon="🏆"
            />
            <StatCard
              variant="teal"
              value={profile.hostedCount}
              label="Sessions Hosted"
              icon="👑"
            />
          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <ProfileAchievements
          stats={{
            totalPoints: profile.totalPoints,
            totalMatches: profile.totalMatches,
            totalWins: profile.totalWins,
            totalLosses: profile.totalLosses,
            totalDraws: profile.totalDraws,
            hostedCount: profile.hostedCount,
            tierOrder: profile.tierOrder ?? 1,
          }}
        />

        {/* ACHIEVEMENTS PREVIEW */}
        <ProfileAchievements
          stats={{
            totalPoints: profile.totalPoints,
            totalMatches: profile.totalMatches,
            totalWins: profile.totalWins,
            totalLosses: profile.totalLosses,
            totalDraws: profile.totalDraws,
            tierOrder: profile.tierOrder ?? 1,
            hostedCount: profile.hostedCount,
          }}
        />

        {/* RECENT MATCHES */}
        <section>
          <div className="section-head">
            <h3>Recent Matches</h3>
            <Link href="/profile/matches" className="section-link">
              View All
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎾</div>
              <div className="empty-state-title">Belum ada match selesai</div>
              <div className="empty-state-text">
                Match yang sudah completed akan muncul di sini.
              </div>
            </div>
          ) : (
            <div className="activity-list">
              {recent.map((m) => (
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

        {/* REFERRAL SHARE */}
        <ReferralShare userId={profile.id} displayName={profile.displayName} />

        {/* SETTINGS */}
        <section>
          <div className="section-head">
            <h3>Settings</h3>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              background: "var(--bg)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--r-xl)",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Link href="/profile/edit" style={{ textDecoration: "none" }}>
              <SettingsRow
                icon="✏️"
                title="Edit Profile"
                sub="Nama, kota"
              />
            </Link>
            <Link href="/friends" style={{ textDecoration: "none" }}>
              <SettingsRow
                icon="👥"
                title="Friends"
                sub="Following + followers"
              />
            </Link>
            <Link href="/friends" style={{ textDecoration: "none" }}>
              <SettingsRow
                icon="👥"
                title="Friends"
                sub="Teman padel kamu"
              />
            </Link>
            <Link href="/achievements" style={{ textDecoration: "none" }}>
              <SettingsRow
                icon="🏆"
                title="Achievements"
                sub="Badge & milestones"
              />
            </Link>
            <SettingsRow
              icon="🔔"
              title="Notifikasi"
              sub="Soon — atur notifikasi"
              disabled
            />
            <SettingsRow
              icon="🌐"
              title="Bahasa"
              sub="Indonesia"
              disabled
            />
            <form action={logoutAction}>
              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-3)",
                  padding: "var(--s-3) var(--s-4)",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid var(--border-light)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--accent-600)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "var(--r-md)",
                    background: "var(--accent-50)",
                    fontSize: 16,
                  }}
                >
                  🚪
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--accent-600)",
                    }}
                  >
                    Logout
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-500)",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    Keluar dari Carsel Club
                  </div>
                </div>
              </button>
            </form>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function ProfileAchievements({
  stats,
}: {
  stats: UserStatsForAchievement;
}) {
  const { unlocked, total } = getUnlockedCount(stats);
  const earned = ACHIEVEMENTS.filter((a) => a.check(stats)).slice(0, 6);

  return (
    <section>
      <div className="section-head">
        <h3>
          Achievements{" "}
          <span
            style={{
              color: "var(--text-500)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {unlocked} / {total}
          </span>
        </h3>
        <Link href="/achievements" className="section-link">
          View All
        </Link>
      </div>
      {earned.length === 0 ? (
        <div
          style={{
            padding: "var(--s-4)",
            background: "var(--bg-soft)",
            borderRadius: "var(--r-lg)",
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
          }}
        >
          🔒 Belum ada achievement. Mulai main untuk unlock!
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {earned.map((a) => (
            <div
              key={a.code}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--primary-200)",
                borderRadius: "var(--r-md)",
                padding: "var(--s-3)",
                textAlign: "center",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{a.emoji}</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 10,
                  color: "var(--text-900)",
                  lineHeight: 1.2,
                }}
              >
                {a.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          color: "var(--text-900)",
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

function StatCard({
  value,
  label,
  icon,
  variant,
}: {
  value: number | string;
  label: string;
  icon: string;
  variant: "teal" | "coral" | "yellow";
}) {
  const colors = {
    teal: { bg: "var(--primary-50)", text: "var(--primary-700)" },
    coral: { bg: "var(--accent-50)", text: "var(--accent-600)" },
    yellow: { bg: "var(--yellow-50)", text: "#B45309" },
  };
  const c = colors[variant];

  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-xl)",
        padding: "var(--s-4)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--r-md)",
          background: c.bg,
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 24,
          color: c.text,
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

function SettingsRow({
  icon,
  title,
  sub,
  disabled,
}: {
  icon: string;
  title: string;
  sub: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        width: "100%",
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          borderRadius: "var(--r-md)",
          background: "var(--primary-50)",
          fontSize: 14,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text-900)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      </div>
      {!disabled && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-400)" }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}
