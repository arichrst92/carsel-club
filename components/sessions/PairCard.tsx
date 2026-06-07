/**
 * PairCard — Sprint 52 — render a Fixed Partner pair in session detail.
 *
 * Used when session.fixPartners=true AND pair_key has been assigned to
 * participants. Each card shows the two paired players side-by-side with
 * a partner-link visual, plus shared session stats (W/L from matches).
 *
 * Editable: when canManage=true, the whole card is a link to /pairs to
 * reassign. Individual players inside still link to their public profile.
 */

import Link from "next/link";

type PairedPlayer = {
  id: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: "host" | "co_host" | "player" | "guest";
  isPlaying: boolean;
  sessionWins: number;
  sessionLosses: number;
  sessionDraws: number;
  sessionPoints: number;
};

type Props = {
  pairLabel: string; // "Pair 1", "Pair 2", …
  players: PairedPlayer[];
  sessionId: string;
  canManage: boolean;
  /** If true (no rounds yet), card is fully editable — link to /pairs. */
  editable: boolean;
};

function initial(name: string): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

function Avatar({
  url,
  name,
  size = 36,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: url
          ? `url(${url}) center/cover no-repeat`
          : "linear-gradient(135deg, var(--primary-300), var(--primary-600))",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {!url && initial(name)}
    </div>
  );
}

function PlayerSide({ p }: { p: PairedPlayer }) {
  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        flex: 1,
      }}
    >
      <Avatar url={p.avatarUrl} name={p.displayName} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--text-900)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.displayName}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-500)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {p.role === "host"
            ? "Host"
            : p.role === "co_host"
              ? "Co-host"
              : p.role === "guest"
                ? "Guest"
                : "Player"}
        </div>
      </div>
    </div>
  );
  if (p.userId) {
    return (
      <Link
        href={`/u/${p.userId}`}
        style={{
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          minWidth: 0,
        }}
      >
        {content}
      </Link>
    );
  }
  return content;
}

export function PairCard({
  pairLabel,
  players,
  sessionId,
  canManage,
  editable,
}: Props) {
  // Aggregate stats across the two players (each match is counted once per
  // player, so sum then divide; but for fix-partner the pair plays as a unit
  // so we just take player[0]'s record — they share matches).
  const lead = players[0];
  const partner = players[1];
  const wins = lead?.sessionWins ?? 0;
  const losses = lead?.sessionLosses ?? 0;
  const draws = lead?.sessionDraws ?? 0;
  const points = lead?.sessionPoints ?? 0;

  const cardInner = (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "var(--shadow-sm)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            background: "var(--primary-50)",
            color: "var(--primary-700)",
            borderRadius: "var(--r-full)",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {pairLabel}
        </div>
        {canManage && editable && (
          <span
            style={{
              fontSize: 11,
              color: "var(--primary-700)",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            Edit
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        )}
      </div>

      {/* Pair body — two players + center connector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 8,
        }}
      >
        {lead && <PlayerSide p={lead} />}
        <div
          style={{
            display: "grid",
            placeItems: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--primary-100)",
            color: "var(--primary-700)",
            fontWeight: 900,
            fontSize: 10,
            fontFamily: "var(--font-display)",
          }}
          aria-hidden
        >
          +
        </div>
        {partner ? (
          <PlayerSide p={partner} />
        ) : (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-500)",
              fontWeight: 700,
              fontStyle: "italic",
            }}
          >
            (waiting partner)
          </div>
        )}
      </div>

      {/* Pair stats — show only if there are matches played */}
      {(wins > 0 || losses > 0 || draws > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px dashed var(--border-light)",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-600)",
            flexWrap: "wrap",
          }}
        >
          <span>
            <span style={{ color: "var(--primary-700)" }}>{wins}W</span>
            {" / "}
            <span style={{ color: "var(--accent-600)" }}>{losses}L</span>
            {draws > 0 && (
              <>
                {" / "}
                <span>{draws}D</span>
              </>
            )}
          </span>
          <span style={{ marginLeft: "auto", color: "var(--text-700)" }}>
            {points} pts
          </span>
        </div>
      )}
    </div>
  );

  if (canManage && editable) {
    return (
      <Link
        href={`/sessions/${sessionId}/pairs`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {cardInner}
      </Link>
    );
  }

  return cardInner;
}
