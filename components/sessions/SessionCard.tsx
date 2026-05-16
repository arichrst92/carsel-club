import Link from "next/link";
import type { Session } from "@/lib/db/types";
import { formatDate, formatTimeRange } from "@/lib/utils";

const STATUS_STYLES: Record<
  Session["status"],
  { label: string; bg: string; text: string }
> = {
  upcoming: { label: "Upcoming", bg: "bg-sky-50", text: "text-sky" },
  live: { label: "Live", bg: "bg-accent-50", text: "text-accent-600" },
  completed: { label: "Selesai", bg: "bg-bg-soft", text: "text-text-500" },
  cancelled: { label: "Dibatalkan", bg: "bg-bg-soft", text: "text-text-400" },
};

export function SessionCard({ session }: { session: Session }) {
  const status = STATUS_STYLES[session.status];

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="block rounded-2xl bg-bg-card border border-border-light p-4 shadow-card hover:shadow-md hover:border-primary-200 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-base text-text-900 truncate">
            {session.title}
          </h3>
          {session.venueName && (
            <p className="text-xs text-text-500 truncate mt-0.5">
              📍 {session.venueName}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-700 font-semibold flex-wrap">
        <span>📅 {formatDate(session.scheduledAt)}</span>
        <span>⏰ {formatTimeRange(session.scheduledAt, session.scheduledEndAt)}</span>
        <span>
          🏟️ {session.numCourts} court{session.numCourts > 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
