import type { LogStats } from "@/lib/db/queries/logs";
import { LEVEL_COLORS } from "@/lib/log/format";

export function StatsBar({ stats }: { stats: LogStats }) {
  const items: Array<{ label: string; value: number; color: string }> = [
    { label: "Fatal", value: stats.totalFatal, color: LEVEL_COLORS.fatal },
    { label: "Error", value: stats.totalError, color: LEVEL_COLORS.error },
    { label: "Warn", value: stats.totalWarn, color: LEVEL_COLORS.warn },
    { label: "Info", value: stats.totalInfo, color: LEVEL_COLORS.info },
    {
      label: "Events",
      value: stats.totalEvents,
      color: "var(--primary)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 8,
        marginBottom: "var(--s-3)",
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            padding: "10px 8px",
            borderRadius: "var(--r-md)",
            background: "var(--bg)",
            border: "1px solid var(--border-light)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: it.color,
            }}
          >
            {it.value}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-500)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginTop: 2,
            }}
          >
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
