import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { listLogs, getLogStats } from "@/lib/db/queries/logs";
import {
  normalizeLogFilter,
  parseRangeString,
  FILTER_DEFAULTS,
  type LogFilter,
} from "@/lib/log/filter";
import type { LogLevel, LogType } from "@/lib/log/types";
import { LogFilter as LogFilterUI } from "@/components/monitor/LogFilter";
import { LogTable } from "@/components/monitor/LogTable";
import { StatsBar } from "@/components/monitor/StatsBar";

export const metadata = { title: "Monitor" };
export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  level?: string;
  q?: string;
  range?: string;
  user?: string;
  page?: string;
};

const VALID_TYPES: LogType[] = ["log", "event"];
const VALID_LEVELS: LogLevel[] = ["info", "warn", "error", "fatal"];
const PAGE_SIZE = 50;

function isLogType(v: string | undefined): v is LogType {
  return v !== undefined && (VALID_TYPES as string[]).includes(v);
}

function isLogLevel(v: string | undefined): v is LogLevel {
  return v !== undefined && (VALID_LEVELS as string[]).includes(v);
}

export default async function MonitorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const rangeMs = parseRangeString(params.range) ?? FILTER_DEFAULTS.rangeMs;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const filter: LogFilter = {
    type: isLogType(params.type) ? params.type : null,
    level: isLogLevel(params.level) ? params.level : null,
    searchQuery: params.q ?? null,
    userId: params.user ?? null,
    rangeMs,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const normalized = normalizeLogFilter(filter);
  const [rows, stats] = await Promise.all([
    listLogs(normalized),
    getLogStats(normalized.sinceMs),
  ]);

  const totalShown =
    stats.totalFatal +
    stats.totalError +
    stats.totalWarn +
    stats.totalInfo +
    stats.totalEvents;

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/home" className="back-btn" aria-label="Back">
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
        <h2 className="subscreen-title">Monitor</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        className="app-content subscreen"
        style={{ paddingBottom: "var(--s-6)" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "var(--s-3)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14,
              color: "var(--text-900)",
            }}
          >
            {totalShown.toLocaleString("id-ID")} entry
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-500)",
            }}
          >
            Page {page} · {rows.length} / page
          </div>
        </div>

        <StatsBar stats={stats} />
        <LogFilterUI />
        <LogTable rows={rows} />

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "var(--s-4)",
            gap: 8,
          }}
        >
          <PageLink
            page={page - 1}
            disabled={page <= 1}
            label="← Prev"
            currentParams={params}
          />
          <PageLink
            page={page + 1}
            disabled={rows.length < PAGE_SIZE}
            label="Next →"
            currentParams={params}
          />
        </div>
      </main>
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
  currentParams,
}: {
  page: number;
  disabled: boolean;
  label: string;
  currentParams: SearchParams;
}) {
  if (disabled) {
    return (
      <span
        style={{
          padding: "10px 16px",
          borderRadius: "var(--r-md)",
          background: "var(--bg-soft)",
          color: "var(--text-400)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {label}
      </span>
    );
  }
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(currentParams)) {
    if (v) sp.set(k, v);
  }
  sp.set("page", String(page));
  return (
    <Link
      href={`/monitor?${sp.toString()}`}
      style={{
        padding: "10px 16px",
        borderRadius: "var(--r-md)",
        background: "var(--bg)",
        color: "var(--text-900)",
        border: "1px solid var(--border)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 12,
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}
