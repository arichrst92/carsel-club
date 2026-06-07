/**
 * Papan Peringkat Sesi page (Sprint 47).
 *
 * In-session ranking of participants — pakai stats per session
 * (sessionPoints/Wins/Matches), bukan lifetime.
 *
 * Refs:
 * - Prototype: docs/CarselClubPrototype/session-leaderboard.html
 * - DB: session_participants
 * - Pure sort: lib/leaderboard/sort.ts
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { canUserViewSession } from "@/lib/db/queries/sessions";
import {
  getSessionLeaderboardHero,
  listSessionLeaderboard,
  type SessionLeaderboardRow,
} from "@/lib/db/queries/session-leaderboard";
import {
  parseHistoryFilter, // unused, just suppress
} from "@/lib/match/history-filter";

export const metadata = {
  title: "Papan Peringkat Sesi",
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

type Sort = "point" | "winrate" | "match";

function parseSort(v: string | undefined): Sort {
  if (v === "winrate" || v === "match") return v;
  return "point";
}

function getSortValue(r: SessionLeaderboardRow, sort: Sort): number {
  switch (sort) {
    case "point":
      return r.sessionPoints;
    case "match":
      return r.sessionMatches;
    case "winrate":
      // Sprint 50 fix: no threshold di session leaderboard. Session
      // biasanya sedikit match (1-4 match per pemain), threshold ≥2
      // bikin semua dapat -1 → fall ke alfabetik → "0% di atas 100%"
      // tampak salah. Tie-break by sessionMatches DESC sudah handle
      // case "1W di atas 5W 1L" — 5W (5 matches) menang tie-break vs
      // 1W (1 match) saat sama-sama 100%.
      return r.winRate;
  }
}

/**
 * Sprint 50: tie-break smart — primary sama → kedua metric pendukung
 * jadi pemutus, terakhir alfabetik.
 *
 * - point: tie-break by sessionMatches DESC
 * - winrate: tie-break by sessionMatches DESC (lebih banyak match
 *   = sample size lebih meyakinkan)
 * - match: tie-break by sessionPoints DESC
 */
function getTieBreak(r: SessionLeaderboardRow, sort: Sort): number {
  if (sort === "match") return r.sessionPoints;
  return r.sessionMatches; // point + winrate
}

export default async function SessionLeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const allowed = await canUserViewSession(id, user.id);
  if (!allowed) notFound();

  const hero = await getSessionLeaderboardHero(id);
  if (!hero) notFound();

  const sp = await searchParams;
  const sort = parseSort(sp.sort);

  const rows = await listSessionLeaderboard(id);
  // Sort + rank — tampilkan semua peserta (termasuk yg sedang
  // benched / isPlaying=false). Yg !isPlaying ditandai badge "Benched"
  // di item, tapi tetap masuk ranking. Kalau di-filter saja, peserta
  // baru dgn 0 match sering hilang dari daftar (Sprint 49 fix).
  const ranked = [...rows]
    .sort((a, b) => {
      // Primary
      const diff = getSortValue(b, sort) - getSortValue(a, sort);
      if (diff !== 0) return diff;
      // Tie-break by complementary metric DESC
      const tieDiff = getTieBreak(b, sort) - getTieBreak(a, sort);
      if (tieDiff !== 0) return tieDiff;
      // Final: alfabetik (stable)
      return a.displayName.localeCompare(b.displayName);
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link
          href={`/sessions/${id}`}
          className="back-btn"
          aria-label="Back"
        >
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
        <h2 className="subscreen-title">Papan Peringkat Sesi</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        id="main-content"
        className="app-content"
        style={{ padding: "var(--s-4)" }}
      >
        {/* HERO */}
        <section
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)",
            color: "#fff",
            borderRadius: "var(--r-2xl)",
            padding: "var(--s-5)",
            marginBottom: "var(--s-3)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              marginBottom: 2,
            }}
          >
            {hero.sessionTitle}
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.85,
              fontWeight: 600,
              marginBottom: "var(--s-3)",
            }}
          >
            Peringkat pemain di sesi ini
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            <HeroStat label="Pemain" value={hero.playerCount} />
            <HeroStat label="Match Selesai" value={hero.completedMatches} />
            <HeroStat label="Total Pts" value={hero.totalPoints} />
          </div>
        </section>

        {/* SORT TABS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
            marginBottom: "var(--s-3)",
          }}
        >
          <SortTab
            sessionId={id}
            current={sort}
            target="point"
            emoji="🏆"
            label="Point"
            sub="Total poin"
          />
          <SortTab
            sessionId={id}
            current={sort}
            target="winrate"
            emoji="📈"
            label="Win Rate"
            sub="% menang"
          />
          <SortTab
            sessionId={id}
            current={sort}
            target="match"
            emoji="🎯"
            label="Match"
            sub="Total main"
          />
        </section>

        {/* LIST */}
        {ranked.length === 0 ? (
          <div
            style={{
              padding: "var(--s-6)",
              textAlign: "center",
              fontSize: 13,
              color: "var(--text-500)",
              fontWeight: 600,
            }}
          >
            Belum ada pemain aktif di sesi ini.
          </div>
        ) : (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
            }}
          >
            {ranked.map((row) => (
              <LbItem
                key={row.participantId}
                row={row}
                isMe={row.userId === user.id}
                sort={sort}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-2) var(--s-3)",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          opacity: 0.85,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SortTab({
  sessionId,
  current,
  target,
  emoji,
  label,
  sub,
}: {
  sessionId: string;
  current: Sort;
  target: Sort;
  emoji: string;
  label: string;
  sub: string;
}) {
  const active = current === target;
  return (
    <Link
      href={`/sessions/${sessionId}/leaderboard?sort=${target}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "10px 8px",
        background: active ? "var(--primary)" : "var(--bg)",
        color: active ? "#fff" : "var(--text-700)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border-light)"}`,
        borderRadius: "var(--r-md)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 12,
        textDecoration: "none",
        position: "relative",
      }}
    >
      <span>
        {emoji} {label}
      </span>
      <span style={{ fontSize: 10, opacity: 0.85 }}>{sub}</span>
    </Link>
  );
}

function LbItem({
  row,
  isMe,
  sort,
}: {
  row: SessionLeaderboardRow & { rank: number };
  isMe: boolean;
  sort: Sort;
}) {
  const initial = (row.displayName.trim()[0] ?? "?").toUpperCase();
  const tierName = row.tierName ?? "Rookie";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        background: isMe ? "var(--primary-50)" : "var(--bg-card)",
        border: `1px solid ${isMe ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "var(--r-lg)",
      }}
    >
      <div
        style={{
          width: 36,
          textAlign: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: row.rank <= 3 ? 22 : 16,
          color:
            row.rank === 1
              ? "#F59E0B"
              : row.rank === 2
                ? "#94A3B8"
                : row.rank === 3
                  ? "#B45309"
                  : "var(--text-700)",
        }}
      >
        {row.rank === 1
          ? "🥇"
          : row.rank === 2
            ? "🥈"
            : row.rank === 3
              ? "🥉"
              : `#${row.rank}`}
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: row.avatarUrl
            ? `url(${row.avatarUrl}) center/cover no-repeat`
            : "var(--primary-100)",
          color: "var(--primary-700)",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {!row.avatarUrl && initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
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
          {row.displayName}
          {row.userId === null && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9,
                fontWeight: 700,
                color: "var(--text-500)",
                background: "var(--bg-soft)",
                padding: "1px 5px",
                borderRadius: 999,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              GUEST
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {row.userId
            ? `${TIER_EMOJI[tierName]} ${tierName}`
            : row.role === "guest"
              ? "Guest"
              : tierName}
          {row.role === "host" && " · Host"}
          {row.role === "co_host" && " · Co-host"}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "var(--s-3)",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <StatCell
          value={row.sessionPoints}
          label="Pts"
          primary={sort === "point"}
        />
        <StatCell
          value={`${Math.round(row.winRate)}%`}
          label="WR"
          primary={sort === "winrate"}
        />
        <StatCell
          value={row.sessionMatches}
          label="Match"
          primary={sort === "match"}
        />
      </div>
    </div>
  );
}

function StatCell({
  value,
  label,
  primary,
}: {
  value: number | string;
  label: string;
  primary: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: primary ? 16 : 13,
          color: primary ? "var(--primary-700)" : "var(--text-900)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "var(--text-500)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Suppress unused import (kept for potential future filter)
void parseHistoryFilter;
