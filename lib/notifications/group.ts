/**
 * Date grouping for notification list rendering (Sprint 26).
 *
 * Buckets: Hari ini / Kemarin / Minggu ini / Lebih lama.
 *
 * Pure: depends only on `now` (passed in) untuk testability.
 *
 * Refs:
 * - Used by: app/notifications/page.tsx
 */

export type DateBucket = "today" | "yesterday" | "this_week" | "older";

export const BUCKET_LABELS: Record<DateBucket, string> = {
  today: "Hari ini",
  yesterday: "Kemarin",
  this_week: "Minggu ini",
  older: "Lebih lama",
};

/**
 * Classify date relative to `now`.
 * - today: same calendar day
 * - yesterday: previous calendar day
 * - this_week: within last 7 calendar days (excluding today/yesterday)
 * - older: > 7 days back
 */
export function bucketForDate(now: Date, then: Date): DateBucket {
  if (then.getTime() > now.getTime()) return "today";
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - 7);

  if (then >= startOfToday) return "today";
  if (then >= startOfYesterday) return "yesterday";
  if (then >= startOfThisWeek) return "this_week";
  return "older";
}

/**
 * Group list of items by date bucket. Preserves order within bucket.
 * Returns ordered buckets — empty ones are skipped.
 */
export function groupByDate<T extends { createdAt: Date }>(
  now: Date,
  items: T[]
): Array<{ bucket: DateBucket; label: string; items: T[] }> {
  const buckets: Record<DateBucket, T[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    older: [],
  };
  for (const it of items) {
    buckets[bucketForDate(now, it.createdAt)].push(it);
  }
  const order: DateBucket[] = ["today", "yesterday", "this_week", "older"];
  return order
    .filter((b) => buckets[b].length > 0)
    .map((b) => ({
      bucket: b,
      label: BUCKET_LABELS[b],
      items: buckets[b],
    }));
}
