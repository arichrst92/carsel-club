import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getLeaderboard,
  findMyEntry,
  type LeaderboardSort,
} from "@/lib/db/queries/leaderboard";
import { BottomNav } from "@/components/nav/BottomNav";

export const metadata = {
  title: "Leaderboard",
};

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

const AVATAR_CLASSES = ["host", "cohost", "member-1", "member-2", "member-3"] as const;

function avatarClass(id: string): string {
  // Stable hash → consistent color per user
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return AVATAR_CLASSES[Math.abs(h) % AVATAR_CLASSES.length];
}

type PageProps = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const me = await requireUser();
  const params = await searchParams;
  const sort: LeaderboardSort =
    params.sort === "winrate" || params.sort === "match"
      ? params.sort
      : "point";

  const rows = await getLeaderboard(sort);
  const myEntry = findMyEntry(rows, me.id);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 100);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <div className="logo-mark">CC</div>
          <span className="logo-text">Leaderboard</span>
        </div>
      </header>

      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        {/* HERO */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            borderRadius: "var(--r-2xl)",
            padding: "var(--s-5)",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 2,
            }}
          >
            Global Leaderboard
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.85,
              fontWeight: 600,
              marginBottom: "var(--s-4)",
            }}
          >
            Pemain padel Indonesia · {rows.length} pemain aktif
          </div>

          {myEntry && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-3)",
                padding: "var(--s-3)",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                borderRadius: "var(--r-lg)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 24,
                  minWidth: 50,
                }}
              >
                #{myEntry.rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.85,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Posisi Kamu
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {myEntry.displayName} ·{" "}
                  {TIER_EMOJI[myEntry.tierName ?? "Rookie"]}{" "}
                  {myEntry.tierName ?? "Rookie"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.9,
                    marginTop: 2,
                  }}
                >
                  {myEntry.totalPoints} pts · {myEntry.totalMatches} match ·{" "}
                  {Math.round(myEntry.winRate)}% WR
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SORT TABS */}
        <section className="leaderboard-tabs">
          <SortTab
            current={sort}
            target="point"
            emoji="🏆"
            label="Point"
            sub="Total poin"
          />
          <SortTab
            current={sort}
            target="winrate"
            emoji="📈"
            label="Win Rate"
            sub="% menang"
          />
          <SortTab
            current={sort}
            target="match"
            emoji="🎯"
            label="Match"
            sub="Total main"
          />
        </section>

        {/* TOP 3 PODIUM */}
        {top3.length === 3 && (
          <section>
            <div className="section-head">
              <h3>Top 3</h3>
            </div>
            <Podium top3={top3} sort={sort} />
          </section>
        )}

        {/* RANK 4+ */}
        {rest.length > 0 && (
          <section>
            <div className="section-head">
              <h3>Rank 4 – {rest[rest.length - 1].rank}</h3>
            </div>
            <div className="leaderboard-list">
              {rest.map((row) => (
                <LbItem
                  key={row.id}
                  row={row}
                  isMe={row.id === me.id}
                  sort={sort}
                />
              ))}
            </div>
          </section>
        )}

        {rows.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎾</div>
            <div className="empty-state-title">Leaderboard masih kosong</div>
            <div className="empty-state-text">
              Mulai main session pertama kamu untuk masuk leaderboard.
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function SortTab({
  current,
  target,
  emoji,
  label,
  sub,
}: {
  current: LeaderboardSort;
  target: LeaderboardSort;
  emoji: string;
  label: string;
  sub: string;
}) {
  const active = current === target;
  return (
    <Link
      href={`/leaderboard?sort=${target}`}
      className={`lb-tab ${active ? "active" : ""}`}
      style={{ textDecoration: "none" }}
    >
      <span>
        {emoji} {label}
      </span>
      <span className="lb-tab-sub">{sub}</span>
    </Link>
  );
}

function Podium({
  top3,
  sort,
}: {
  top3: ReturnType<typeof Object.assign>[] & { length: 3 };
  sort: LeaderboardSort;
}) {
  // Order: 2 (left), 1 (center, raised), 3 (right)
  const [first, second, third] = top3 as any;
  const SLOTS = [
    { player: second, medal: "🥈", rank: 2 },
    { player: first, medal: "🥇", rank: 1 },
    { player: third, medal: "🥉", rank: 3 },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "var(--s-3)",
        alignItems: "end",
      }}
    >
      {SLOTS.map(({ player, medal, rank }) => (
        <PodiumSlot
          key={rank}
          player={player}
          medal={medal}
          rank={rank}
          sort={sort}
        />
      ))}
    </div>
  );
}

function PodiumSlot({
  player,
  medal,
  rank,
  sort,
}: {
  player: any;
  medal: string;
  rank: number;
  sort: LeaderboardSort;
}) {
  const isFirst = rank === 1;
  const primaryValue =
    sort === "point"
      ? `${player.totalPoints.toLocaleString()} pts`
      : sort === "winrate"
        ? `${Math.round(player.winRate)}% WR`
        : `${player.totalMatches} match`;

  return (
    <div
      style={{
        background: isFirst
          ? "linear-gradient(135deg, #FEF3C7, #FED7AA)"
          : "var(--bg-card)",
        border: `1px solid ${isFirst ? "#FCD34D" : "var(--border-light)"}`,
        borderRadius: "var(--r-xl)",
        padding: "var(--s-3)",
        textAlign: "center",
        boxShadow: isFirst ? "var(--shadow-md)" : "var(--shadow-card)",
        transform: isFirst ? "translateY(-12px)" : "none",
      }}
    >
      <div style={{ fontSize: isFirst ? 28 : 22, marginBottom: 4 }}>
        {medal}
      </div>
      <div
        className={`lb-avatar ${avatarClass(player.id)}`}
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 8px",
          fontSize: 18,
        }}
      >
        {(player.displayName.trim()[0] ?? "?").toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          color: "var(--text-900)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {player.displayName}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text-500)",
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {TIER_EMOJI[player.tierName ?? "Rookie"]}{" "}
        {player.tierName ?? "Rookie"}
        {player.city && ` · ${player.city}`}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          color: isFirst ? "#B45309" : "var(--primary-700)",
          marginTop: 6,
        }}
      >
        {primaryValue}
      </div>
    </div>
  );
}

function LbItem({
  row,
  isMe,
  sort,
}: {
  row: any;
  isMe: boolean;
  sort: LeaderboardSort;
}) {
  return (
    <div className={`lb-item ${isMe ? "is-me" : ""}`}>
      <div className="lb-rank">#{row.rank}</div>
      <div className={`lb-avatar ${avatarClass(row.id)}`}>
        {(row.displayName.trim()[0] ?? "?").toUpperCase()}
      </div>
      <div className="lb-info">
        <div className="lb-name">
          <span>{row.displayName}</span>
        </div>
        <div className="lb-meta">
          <span>
            {TIER_EMOJI[row.tierName ?? "Rookie"]}{" "}
            {row.tierName ?? "Rookie"}
          </span>
          {row.city && (
            <span className="lb-city">
              <svg
                width="9"
                height="9"
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
              {row.city}
            </span>
          )}
        </div>
      </div>
      <div className="lb-stats">
        <div className={`lb-stat ${sort === "point" ? "primary" : ""}`}>
          <div className="lb-stat-value">
            {row.totalPoints.toLocaleString()}
          </div>
          <div className="lb-stat-label">Pts</div>
        </div>
        <div className={`lb-stat ${sort === "winrate" ? "primary" : ""}`}>
          <div className="lb-stat-value">{Math.round(row.winRate)}%</div>
          <div className="lb-stat-label">WR</div>
        </div>
        <div className={`lb-stat ${sort === "match" ? "primary" : ""}`}>
          <div className="lb-stat-value">{row.totalMatches}</div>
          <div className="lb-stat-label">Match</div>
        </div>
      </div>
    </div>
  );
}
