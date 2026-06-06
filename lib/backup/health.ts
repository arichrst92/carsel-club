/**
 * Backup health pure helpers (Sprint 36).
 *
 * Strategy:
 * - "ok" if last backup within OK_HOURS (default 26h — daily + grace)
 * - "stale" if within STALE_HOURS (default 50h — missed one day)
 * - "critical" if older
 * - "never" if no record at all
 *
 * Pure: testable via injected `now`.
 *
 * Refs:
 * - Logged via app_logs event="backup_completed"
 * - Used by: /api/cron/backup-ping + /admin dashboard
 */

export type BackupStatus = "ok" | "stale" | "critical" | "never";

export const OK_HOURS_DEFAULT = 26;
export const STALE_HOURS_DEFAULT = 50;

export type BackupHealth = {
  status: BackupStatus;
  hoursSince: number | null;
  lastBackupAt: Date | null;
};

export type BackupThresholds = {
  okHours?: number;
  staleHours?: number;
};

export function evaluateBackupHealth(
  now: Date,
  lastBackupAt: Date | null,
  thresholds: BackupThresholds = {}
): BackupHealth {
  const okHours = thresholds.okHours ?? OK_HOURS_DEFAULT;
  const staleHours = thresholds.staleHours ?? STALE_HOURS_DEFAULT;
  if (lastBackupAt === null) {
    return { status: "never", hoursSince: null, lastBackupAt: null };
  }
  const ms = now.getTime() - lastBackupAt.getTime();
  const hoursSince = Math.max(0, ms / 3_600_000);
  let status: BackupStatus;
  if (hoursSince <= okHours) status = "ok";
  else if (hoursSince <= staleHours) status = "stale";
  else status = "critical";
  return { status, hoursSince, lastBackupAt };
}

export function statusLabel(status: BackupStatus): string {
  switch (status) {
    case "ok":
      return "Sehat";
    case "stale":
      return "Terlambat";
    case "critical":
      return "Kritis";
    case "never":
      return "Belum pernah";
  }
}

export function statusColor(status: BackupStatus): string {
  switch (status) {
    case "ok":
      return "var(--success-700, #15803d)";
    case "stale":
      return "#B45309"; // amber-700
    case "critical":
      return "var(--danger-700, #b91c1c)";
    case "never":
      return "var(--text-500)";
  }
}

/**
 * Format human-readable "X hours ago" for the dashboard.
 */
export function formatBackupAge(hoursSince: number | null): string {
  if (hoursSince === null) return "—";
  if (hoursSince < 1) return "<1 jam";
  if (hoursSince < 24) return `${Math.round(hoursSince)} jam`;
  const days = Math.floor(hoursSince / 24);
  return `${days} hari`;
}
