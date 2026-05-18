import Link from "next/link";
import type { Session } from "@/lib/db/types";
import { formatDate, formatTimeRange } from "@/lib/utils";

const STATUS_BADGES: Record<
  Session["status"],
  { label: string; color: string }
> = {
  upcoming: { label: "Upcoming", color: "var(--sky)" },
  live: { label: "Live", color: "var(--accent-600)" },
  completed: { label: "Selesai", color: "var(--text-500)" },
  cancelled: { label: "Dibatalkan", color: "var(--text-400)" },
};

export function SessionCard({ session }: { session: Session }) {
  const status = STATUS_BADGES[session.status];

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="session-card"
      style={{ display: "block", textDecoration: "none" }}
    >
      <div className="session-banner">
        <div className="session-banner-text">
          <div className="session-banner-tag">
            {status.label}
          </div>
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
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>
              {formatDate(session.scheduledAt)} ·{" "}
              {formatTimeRange(session.scheduledAt, session.scheduledEndAt)}
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span style={{ textTransform: "capitalize" }}>
              {session.format} · {session.numCourts} court
              {session.numCourts > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
