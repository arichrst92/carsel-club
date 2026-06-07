/**
 * Leaderboard v2 (Sprint 32) — global/regional + period filter + share.
 *
 * Refs:
 * - DB: lib/db/queries/leaderboard-v2.ts
 * - Pure: lib/leaderboard/sort.ts + period.ts
 * - GUI: docs/CarselClubPrototype/leaderboard.html
 */

import { AppLogoMark } from "@/components/ui/AppLogoMark";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { BottomNav } from "@/components/nav/BottomNav";
import { getLeaderboardV2 } from "@/lib/db/queries/leaderboard-v2";
import { distinctCities, findEntry } from "@/lib/leaderboard/sort";
import { periodLabel } from "@/lib/leaderboard/period";
import { LeaderboardFilterBar } from "@/components/leaderboard/LeaderboardFilterBar";
import { LeaderboardShareButton } from "@/components/leaderboard/LeaderboardShareButton";
import type {
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardSort,
  RankedEntry,
} from "@/lib/leaderboard/types";

export const metadata = {
  title: "Leaderboard",
};

export const dynamic = "force-dynamic";

const TIER_EMOJI: Record<string, string> = {
  Rookie: "🥚",
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Master: "👑",
};

const AVATAR_CLASSES = [
  "host",
  "cohost",
  "member-1",
  "member-2",
  "member-3",
] as const;

function avatarClass(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return AVATAR_CLASSES[Math.abs(h) % AVATAR_CLASSES.length];
}

type PageProps = {
  searchParams: Promise<{
    sort?: string;
    scope?: string;
    period?: string;
    city?: string;
  }>;
};

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const me = await requireUser();
  const params = await searchParams;
  const sort: LeaderboardSort =
    params.sort === "winrate" || params.sort === "match"
      ? params.sort
      : "point";
  const scope: LeaderboardScope =
    params.scope === "regional" ? "regional" : "global";
  const period: LeaderboardPeriod =
    params.period === "weekly" || params.period === "monthly"
      ? params.period
      : "all_time";
  const cityParam = params.city ?? null;
  const city = scope === "regional" ? cityParam ?? me.city : null;

  // Pull all entries to derive city list + main rows.
  // For regional, we still pull global once for city options.
  const [rows, globalForCities] = await Promise.all([
    getLeaderboardV2({ sort, period, city }),
    scope === "regional"
      ? getLeaderboardV2({ sort: "point", period: "all_time", city: null })
      : Promise.resolve([] as RankedEntry[]),
  ]);
  const cities =
    scope === "regional" ? distinctCities(globalForCities) : [];

  const myEntry = findEntry(rows, me.id);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 100);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <AppLogoMark />
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
            {scope === "regional"
              ? `${city ?? "Regional"} Leaderboard`
              : "Global Leaderboard"}
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.85,
              fontWeight: 600,
              marginBottom: "var(--s-3)",
            }}
          >
            {periodLabel(period)} · {rows.length} players
          </div>

          <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <LeaderboardShareButton
              scope={scope}
              period={period}
              city={city}
              appUrl={appUrl}
            />
          </div>

          {myEntry && (
            <div
              style={{
                marginTop: "var(--s-3)",
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
                  Your Position
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

        {/* FILTER BAR */}
        <LeaderboardFilterBar
          scope={scope}
          period={period}
          city={city}
          cities={cities}
          myCity={me.city ?? null}
        />

        {/* SORT TABS */}
        <section className="leaderboard-tabs">
          <SortTab
            current={sort}
            target="point"
            scope={scope}
            period={period}
            city={city}
            emoji="🏆"
            label="Point"
            sub="Total points"
          />
          <SortTab
            current={sort}
            target="winrate"
            scope={scope}
            period={period}
            city={city}
            emoji="📈"
            label="Win Rate"
            sub="% wins"
          />
          <SortTab
            current={sort}
            target="match"
            scope={scope}
            period={period}
            city={city}
            emoji="🎯"
            label="Match"
            sub="Played"
          />
        </section>

        {/* Podium only renders if there are at least 3 players. If fewer,
            everyone goes into the list section below. */}
        {top3.length === 3 && (
          <section>
            <div className="section-head">
              <h3>Top 3</h3>
            </div>
            <Podium top3={top3} sort={sort} />
          </section>
        )}

        {/* When podium hidden (< 3 players), render all rows here. Otherwise
            render only ranks 4+. */}
        {rows.length > 0 && (
          <section>
            <div className="section-head">
              <h3>
                {top3.length === 3
                  ? `Rank 4 – ${rest[rest.length - 1]?.rank ?? 4}`
                  : "Rankings"}
              </h3>
            </div>
            <div className="leaderboard-list">
              {(top3.length === 3 ? rest : rows).map((row) => (
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
            <div className="empty-state-title">Leaderboard is empty</div>
            <div className="empty-state-text">
              {period !== "all_time"
                ? "No completed matches in this period."
                : "Play your first session to get on the leaderboard."}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function buildHref(
  sort: LeaderboardSort,
  scope: LeaderboardScope,
  period: LeaderboardPeriod,
  city: string | null
): string {
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  if (scope === "regional") sp.set("scope", "regional");
  if (period !== "all_time") sp.set("period", period);
  if (city) sp.set("city", city);
  return `/leaderboard?${sp.toString()}`;
}

function SortTab(props: {
  current: LeaderboardSort;
  target: LeaderboardSort;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  city: string | null;
  emoji: string;
  label: string;
  sub: string;
}) {
  const active = props.current === props.target;
  return (
    <Link
      href={buildHref(props.target, props.scope, props.period, props.city)}
      className={`lb-tab ${active ? "active" : ""}`}
      style={{ textDecoration: "none" }}
    >
      <span>
        {props.emoji} {props.label}
      </span>
      <span className="lb-tab-sub">{props.sub}</span>
    </Link>
  );
}

function Podium({
  top3,
  sort,
}: {
  top3: RankedEntry[];
  sort: LeaderboardSort;
}) {
  const [first, second, third] = top3;
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
  player: RankedEntry;
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
    <Link
      href={`/u/${player.id}`}
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
        textDecoration: "none",
        color: "inherit",
        display: "block",
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
          ...(player.avatarUrl
            ? {
                background: `url(${player.avatarUrl}) center/cover no-repeat`,
                color: "transparent",
              }
            : {}),
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
    </Link>
  );
}

function LbItem({
  row,
  isMe,
  sort,
}: {
  row: RankedEntry;
  isMe: boolean;
  sort: LeaderboardSort;
}) {
  return (
    <Link
      href={`/u/${row.id}`}
      className={`lb-item ${isMe ? "is-me" : ""}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="lb-rank">#{row.rank}</div>
      <div
        className={`lb-avatar ${avatarClass(row.id)}`}
        style={
          row.avatarUrl
            ? {
                background: `url(${row.avatarUrl}) center/cover no-repeat`,
                color: "transparent",
              }
            : undefined
        }
      >
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
    </Link>
  );
}

