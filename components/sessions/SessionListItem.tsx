/**
 * SessionListItem — compact list row dgn date-block kiri.
 *
 * Sesuai prototype `docs/CarselClubPrototype/sessions.html` — date block
 * (SAT 16 MEI) di kiri + info (title, time, venue, tags, player mini) di
 * kanan. Status: upcoming / live / past mengubah warna date-block.
 *
 * CSS classes di `app/shared.css`: .session-list-item / .session-date-block /
 * .sd-day / .sd-num / .sd-month / .session-info / .session-info-title /
 * .session-info-row / .session-tags-row / .format-chip-sm /
 * .session-foot / .session-players-mini / .player-avatar.
 */

import Link from "next/link";
import type { MySessionRow } from "@/lib/db/queries/sessions";

type Props = {
  session: MySessionRow;
  /** Avatar initials untuk player stack mini (max 4). */
  participantInitials?: string[];
};

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  upcoming: { label: "Upcoming", cls: "upcoming" },
  live: { label: "🔴 LIVE", cls: "live" },
  completed: { label: "Completed", cls: "past" },
  cancelled: { label: "Cancelled", cls: "past" },
};

const MONTH_ID = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGU",
  "SEP",
  "OKT",
  "NOV",
  "DES",
];

const DAY_ID = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

function parseDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function relativeLabel(d: Date): string {
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays > 1 && diffDays <= 14) return `${diffDays} hari`;
  if (diffDays < 0 && diffDays >= -14) return `${-diffDays} hari lalu`;
  return "";
}

function fmtTimeRange(start: Date, end: Date | string | null): string {
  const fmt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const s = fmt.format(start);
  if (!end) return s;
  const e = fmt.format(parseDate(end));
  return `${s} – ${e}`;
}

export function SessionListItem({ session, participantInitials = [] }: Props) {
  const scheduled = parseDate(session.scheduledAt);
  const status = session.status ?? "upcoming";
  const pill = STATUS_PILL[status] ?? STATUS_PILL.upcoming;
  const itemCls =
    status === "live"
      ? "session-list-item live"
      : status === "completed" || status === "cancelled"
        ? "session-list-item past"
        : "session-list-item";

  const subPill =
    status === "upcoming" ? relativeLabel(scheduled) || pill.label : pill.label;

  return (
    <Link href={`/sessions/${session.id}`} className={itemCls}>
      <div className="session-date-block">
        <div className="sd-day">{DAY_ID[scheduled.getDay()]}</div>
        <div className="sd-num">{scheduled.getDate()}</div>
        <div className="sd-month">{MONTH_ID[scheduled.getMonth()]}</div>
      </div>
      <div className="session-info">
        <div className="session-info-head">
          <div className="session-info-title">{session.title}</div>
          <span className={`session-status-pill ${pill.cls}`}>{subPill}</span>
        </div>
        <div className="session-info-row">
          <svg
            width="11"
            height="11"
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
          <span>{fmtTimeRange(scheduled, session.scheduledEndAt)}</span>
        </div>
        {session.venueName && (
          <div className="session-info-row">
            <svg
              width="11"
              height="11"
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
        <div className="session-tags-row">
          <span
            className="format-chip-sm"
            style={{ textTransform: "capitalize" }}
          >
            {session.format}
          </span>
          <span className="format-chip-sm gray">
            {session.numCourts} court{session.numCourts > 1 ? "s" : ""}
          </span>
          {session.isHost && (
            <span className="format-chip-sm coral">HOST</span>
          )}
        </div>
        <div className="session-foot">
          <div className="session-players-mini">
            {participantInitials.slice(0, 3).map((ini, i) => (
              <div key={i} className={`player-avatar p${i + 1}`}>
                {ini}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-500)" }}>
            {session.participantCount} pemain
          </span>
        </div>
      </div>
    </Link>
  );
}
