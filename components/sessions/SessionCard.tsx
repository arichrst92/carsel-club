/**
 * SessionCard — banner-style card (untuk Home + Find tab).
 *
 * Sesuai prototype `docs/CarselClubPrototype/index.html` — banner gradient di
 * atas, body dgn 3 meta row (venue / format-court / host), footer dgn player
 * count + tombol View.
 *
 * CSS: .session-card / .session-banner / .session-body / .session-meta-row /
 *       .session-footer / .player-stack / .player-count di `app/shared.css`.
 */

import Link from "next/link";
import type { Session } from "@/lib/db/types";
import { formatDate, formatTime, formatTimeRange } from "@/lib/utils";

type Props = {
  session: Session;
  /** Display "X pemain" + player avatar stack di footer. */
  participantCount?: number;
  /** Untuk player stack initials. Kalau kosong → tidak render. */
  participantInitials?: string[];
  /** Sembunyikan tombol View (mis. ketika diklik di-wrap pakai Link). */
  hideViewButton?: boolean;
  /** Tampilkan host name "Host: X". */
  hostName?: string | null;
  /** Tag override untuk banner; default "DD MMM · HH:MM". */
  bannerTag?: string;
};

export function SessionCard({
  session,
  participantCount,
  participantInitials = [],
  hideViewButton = false,
  hostName,
  bannerTag,
}: Props) {
  const tag =
    bannerTag ??
    `${formatDate(session.scheduledAt)} · ${formatTime(session.scheduledAt)}`;

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="session-card"
      style={{ display: "block", textDecoration: "none" }}
    >
      <div className="session-banner">
        <div className="session-banner-text">
          <div className="session-banner-tag">{tag}</div>
          <div className="session-banner-title">{session.title}</div>
        </div>
      </div>
      <div className="session-body">
        <div className="session-meta">
          {session.venueName && (
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
              <span>{session.venueName}</span>
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
              {session.format} · {session.numCourts} court
              {session.numCourts > 1 ? "s" : ""}
            </span>
          </div>
          {hostName && (
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
                <path d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              <span>Host: {hostName}</span>
            </div>
          )}
        </div>

        {typeof participantCount === "number" && (
          <div className="session-footer">
            <div style={{ display: "flex", alignItems: "center" }}>
              {participantInitials.length > 0 && (
                <div className="player-stack">
                  {participantInitials.slice(0, 4).map((ini, i) => (
                    <div key={i} className={`player-avatar p${i + 1}`}>
                      {ini}
                    </div>
                  ))}
                  {participantInitials.length > 4 && (
                    <div className="player-avatar more">
                      +{participantInitials.length - 4}
                    </div>
                  )}
                </div>
              )}
              <div className="player-count">{participantCount} players</div>
            </div>
            {!hideViewButton && <span className="btn-outline">View</span>}
          </div>
        )}
      </div>
    </Link>
  );
}

// Suppress unused (formatTimeRange retained for prior callers compat)
void formatTimeRange;
