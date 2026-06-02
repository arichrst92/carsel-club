/**
 * Format / color helpers untuk UI display & console output.
 *
 * Pure functions — no I/O.
 *
 * Refs: docs/SPRINT_BACKLOG.md Sprint 2
 */

import type { LogLevel, LogType } from "./types";

export const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "#38BDF8", // sky
  warn: "#FACC15", // yellow
  error: "#F43F5E", // rose
  fatal: "#9333EA", // purple
};

export const LEVEL_BG: Record<LogLevel, string> = {
  info: "#0EA5E91A",
  warn: "#FACC151A",
  error: "#F43F5E1A",
  fatal: "#9333EA1A",
};

export const LEVEL_LABEL: Record<LogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  fatal: "FATAL",
};

export const TYPE_LABEL: Record<LogType, string> = {
  log: "Log",
  event: "Event",
};

/**
 * Severity ordering — useful untuk filter "level >= warn" dll.
 */
export const LEVEL_SEVERITY: Record<LogLevel, number> = {
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Apakah level A lebih severe (>=) dari minimum?
 */
export function meetsSeverity(level: LogLevel, minimum: LogLevel): boolean {
  return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[minimum];
}

/**
 * Format timestamp untuk display: "18:42:13" (id-ID locale).
 * Tidak include date — kalau perlu, format ulang di caller.
 */
export function formatTimeOnly(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Relative time: "5 menit lalu", "2 jam lalu", "kemarin", "12 Jan".
 */
export function formatRelative(
  date: Date | string,
  now: Date = new Date()
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return "baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days === 1) return "kemarin";
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
