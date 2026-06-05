/**
 * Generic utility helpers.
 */

/**
 * Tailwind-aware className merger.
 * Combines clsx (conditional classes) with tailwind-merge (dedup conflicting utilities).
 *
 * Example:
 *   cn("p-4", "p-6")              → "p-6"  (later wins)
 *   cn("text-red-500", isPrimary && "text-primary") → conditional class
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with thousands separator (Indonesian locale).
 *   1234567 → "1.234.567"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

/**
 * Format date to Indonesian locale (short).
 *   new Date() → "11 Mei 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format time only (HH:mm).
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Format time range "HH:mm - HH:mm".
 * Returns just start time if end is null.
 */
export function formatTimeRange(
  start: Date | string,
  end: Date | string | null
): string {
  const startStr = formatTime(start);
  if (!end) return startStr;
  return `${startStr} - ${formatTime(end)}`;
}

/**
 * Format duration in minutes → "1 jam", "1,5 jam", "30 menit", etc.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} jam`;
  return `${hours.toString().replace(".", ",")} jam`;
}

/**
 * Compute win rate as percentage (0-100).
 * Returns 0 when matches is 0 to avoid divide-by-zero.
 */
export function winRate(wins: number, matches: number): number {
  if (matches === 0) return 0;
  return Math.round((wins / matches) * 100);
}

/**
 * Sleep for ms milliseconds. Useful for testing & debounce.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert relative path → absolute URL.
 *
 * Used untuk OG image server-side rendering yang butuh full URLs untuk
 * <img> tags. Returns path apa adanya kalau already absolute.
 *
 * @param path     Path like "/uploads/avatars/x.webp" or full URL
 * @param baseUrl  Optional fallback base. Default: NEXT_PUBLIC_APP_URL or localhost:3000
 */
export function toAbsoluteUrl(
  path: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripped = base.replace(/\/+$/, "");
  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return `${stripped}${prefixed}`;
}
