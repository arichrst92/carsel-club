/**
 * Match timer — pure formatter.
 *
 * Display elapsed time dari started_at sampai now (atau ended_at).
 * Format Indonesia-style: "5m 30s", "1j 2m", "just now".
 *
 * Refs:
 * - GUI: docs/CarselClubPrototype/match-scoring.html (timer di status strip)
 * - Plan: docs/SPRINT_BACKLOG.md Sprint 4
 */

/**
 * Format elapsed milliseconds → human string.
 *
 * - < 10s   → "just now"
 * - < 1 m   → "Ns"
 * - < 1 h   → "Nm Ss" (drop seconds kalau >= 10m)
 * - >= 1 h  → "Hj Mm"
 *
 * @param ms elapsed milliseconds. Negative atau 0 → "just now".
 */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 10_000) return "just now";

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  }
  if (totalMinutes >= 10) {
    return `${totalMinutes}m`;
  }
  if (totalMinutes >= 1) {
    return `${totalMinutes}m ${seconds}s`;
  }
  return `${totalSeconds}s`;
}

/**
 * Compute elapsed ms dari startedAt sampai endedAt (atau now).
 * Returns null kalau startedAt null/invalid.
 */
export function computeElapsedMs(
  startedAt: Date | string | null,
  endedAt: Date | string | null = null,
  now: Date = new Date()
): number | null {
  if (!startedAt) return null;
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  if (Number.isNaN(start.getTime())) return null;

  const end = endedAt
    ? typeof endedAt === "string"
      ? new Date(endedAt)
      : endedAt
    : now;
  const diff = end.getTime() - start.getTime();
  return diff >= 0 ? diff : 0;
}
