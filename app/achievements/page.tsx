import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { getProfileData } from "@/lib/db/queries/profile";
import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import {
  ACHIEVEMENTS,
  getUnlockedCount,
  type UserStatsForAchievement,
} from "@/lib/achievements";
import { listEarnedAchievements } from "@/lib/db/queries/achievements";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Achievements",
};

export default async function AchievementsPage() {
  const user = await requireUser();
  const profile = await getProfileData(user.id);

  if (!profile) return null;

  // Sprint 29: get bestWinStreak from users row + earnedAt map from user_achievements
  const [streak] = await db
    .select({ bestWinStreak: users.bestWinStreak })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const earned = await listEarnedAchievements(user.id);
  const earnedAtByCode = new Map(earned.map((e) => [e.code, e.earnedAt]));

  const stats: UserStatsForAchievement = {
    totalPoints: profile.totalPoints,
    totalMatches: profile.totalMatches,
    totalWins: profile.totalWins,
    totalLosses: profile.totalLosses,
    totalDraws: profile.totalDraws,
    hostedCount: profile.hostedCount,
    tierOrder: profile.tierOrder ?? 1,
    bestWinStreak: streak?.bestWinStreak ?? 0,
    // currentSession metrics not relevant on achievements page (cross-session view)
  };

  const { unlocked: liveUnlocked, total } = getUnlockedCount(stats);
  // Use persisted count as ground truth (catches perfect_day/hot_session
  // earned in past but not currently true)
  const unlocked = Math.max(liveUnlocked, earnedAtByCode.size);
  const progressPct = Math.round((unlocked / total) * 100);

  const grouped: Record<string, typeof ACHIEVEMENTS> = {
    milestone: [],
    tier: [],
    host: [],
    streak: [],
  };
  ACHIEVEMENTS.forEach((a) => grouped[a.category].push(a));

  const CATEGORY_LABELS: Record<string, string> = {
    milestone: "🎯 Match Milestones",
    tier: "🏆 Tier Achievements",
    host: "🎪 Host Achievements",
    streak: "🔥 Streak Achievements",
  };

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
        <h2 className="subscreen-title">Achievements</h2>
        <div style={{ width: 40 }} />
      </header>

      <main className="app-content subscreen">
        {/* Summary */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            color: "#fff",
            borderRadius: "var(--r-2xl)",
            padding: "var(--s-5)",
            textAlign: "center",
            boxShadow: "var(--shadow-md)",
            marginBottom: "var(--s-2)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            {unlocked} / {total}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>
            Achievements Unlocked · {progressPct}%
          </div>
          <div
            style={{
              marginTop: "var(--s-3)",
              height: 8,
              background: "rgba(255,255,255,0.25)",
              borderRadius: "var(--r-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #FACC15, #FB7185)",
                borderRadius: "var(--r-full)",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </section>

        {/* Per category */}
        {Object.entries(grouped).map(([cat, list]) => {
          if (list.length === 0) return null;
          return (
            <section key={cat}>
              <div className="section-head">
                <h3>{CATEGORY_LABELS[cat]}</h3>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-500)",
                    fontWeight: 700,
                  }}
                >
                  {list.filter((a) => a.check(stats)).length} / {list.length}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--s-3)",
                }}
              >
                {list.map((a) => {
                  const persisted = earnedAtByCode.get(a.code);
                  const liveEarned = a.check(stats);
                  const earned = !!persisted || liveEarned;
                  const earnedAt = persisted ?? null;
                  const prog = a.progress?.(stats);
                  return (
                    <div
                      key={a.code}
                      style={{
                        background: earned ? "var(--bg)" : "var(--bg-soft)",
                        border: `1px solid ${earned ? "var(--primary-200)" : "var(--border-light)"}`,
                        borderRadius: "var(--r-xl)",
                        padding: "var(--s-3)",
                        textAlign: "center",
                        opacity: earned ? 1 : 0.55,
                        boxShadow: earned ? "var(--shadow-card)" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 40,
                          marginBottom: 6,
                          filter: earned ? "none" : "grayscale(40%)",
                        }}
                      >
                        {earned ? a.emoji : "🔒"}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          fontSize: 13,
                          color: "var(--text-900)",
                          lineHeight: 1.2,
                        }}
                      >
                        {a.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-500)",
                          fontWeight: 600,
                          marginTop: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        {a.description}
                      </div>
                      {prog && !earned && (
                        <div
                          style={{
                            marginTop: 6,
                            height: 4,
                            background: "var(--border-light)",
                            borderRadius: "var(--r-full)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, (prog.current / prog.target) * 100)}%`,
                              background: "var(--primary)",
                            }}
                          />
                        </div>
                      )}
                      {prog && !earned && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-500)",
                            fontWeight: 700,
                            marginTop: 4,
                          }}
                        >
                          {prog.current} / {prog.target}
                        </div>
                      )}
                      {earned && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 10,
                            color: "var(--primary-700)",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          ✓ Unlocked
                          {earnedAt && (
                            <span
                              style={{
                                display: "block",
                                color: "var(--text-500)",
                                marginTop: 2,
                                fontWeight: 600,
                                textTransform: "none",
                                letterSpacing: 0,
                                fontSize: 10,
                              }}
                            >
                              {formatDate(earnedAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
