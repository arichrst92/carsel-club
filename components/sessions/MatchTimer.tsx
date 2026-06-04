"use client";

import { useEffect, useState } from "react";
import { computeElapsedMs, formatElapsed } from "@/lib/match/timer";

type Props = {
  startedAt: Date | string | null;
  endedAt?: Date | string | null;
  /** Live tick frequency in ms (default 1000). Set 0 to disable tick. */
  tickMs?: number;
};

/**
 * Live-ticking timer untuk match yang sedang berjalan.
 * Saat ended_at di-set, frozen ke duration final.
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-scoring.html (status strip timer)
 */
export function MatchTimer({ startedAt, endedAt, tickMs = 1000 }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (endedAt || !startedAt || tickMs <= 0) return;
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [startedAt, endedAt, tickMs]);

  const elapsedMs = computeElapsedMs(startedAt, endedAt ?? null, now);
  if (elapsedMs === null) return null;

  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 11,
        color: endedAt ? "var(--text-500)" : "var(--accent-600)",
      }}
    >
      {formatElapsed(elapsedMs)}
    </span>
  );
}
