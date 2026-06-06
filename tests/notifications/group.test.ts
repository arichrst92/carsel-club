import { describe, expect, it } from "vitest";
import { bucketForDate, groupByDate, BUCKET_LABELS } from "@/lib/notifications/group";

const now = new Date("2026-06-06T15:00:00Z");

describe("bucketForDate", () => {
  it("future → today (clock skew tolerance)", () => {
    expect(bucketForDate(now, new Date("2026-06-06T16:00:00Z"))).toBe(
      "today"
    );
  });

  it("same day → today", () => {
    expect(bucketForDate(now, new Date("2026-06-06T08:00:00Z"))).toBe(
      "today"
    );
  });

  it("midnight today edge", () => {
    expect(bucketForDate(now, new Date(2026, 5, 6, 0, 0, 0))).toBe("today");
  });

  it("yesterday", () => {
    expect(bucketForDate(now, new Date(2026, 5, 5, 14, 0, 0))).toBe(
      "yesterday"
    );
  });

  it("yesterday midnight edge", () => {
    expect(bucketForDate(now, new Date(2026, 5, 5, 0, 0, 0))).toBe(
      "yesterday"
    );
  });

  it("3 days ago → this_week", () => {
    expect(bucketForDate(now, new Date(2026, 5, 3, 10, 0, 0))).toBe(
      "this_week"
    );
  });

  it("7-day boundary → this_week", () => {
    // exactly 7 days back (start of that day)
    expect(bucketForDate(now, new Date(2026, 4, 30, 12, 0, 0))).toBe(
      "this_week"
    );
  });

  it("8 days ago → older", () => {
    expect(bucketForDate(now, new Date(2026, 4, 29, 10, 0, 0))).toBe(
      "older"
    );
  });

  it("years ago → older", () => {
    expect(bucketForDate(now, new Date("2024-01-01T00:00:00Z"))).toBe(
      "older"
    );
  });
});

describe("groupByDate", () => {
  it("empty list", () => {
    expect(groupByDate(now, [])).toEqual([]);
  });

  it("groups + orders + skips empty", () => {
    const items = [
      { id: "1", createdAt: new Date(2026, 5, 6, 10, 0, 0) }, // today
      { id: "2", createdAt: new Date(2026, 5, 5, 18, 0, 0) }, // yesterday
      { id: "3", createdAt: new Date(2026, 5, 3, 12, 0, 0) }, // this_week
      { id: "4", createdAt: new Date(2026, 4, 1, 12, 0, 0) }, // older
      { id: "5", createdAt: new Date(2026, 5, 6, 14, 0, 0) }, // today
    ];
    const groups = groupByDate(now, items);
    expect(groups.map((g) => g.bucket)).toEqual([
      "today",
      "yesterday",
      "this_week",
      "older",
    ]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["1", "5"]);
    expect(groups[0].label).toBe("Hari ini");
  });

  it("skip empty buckets", () => {
    const items = [
      { id: "1", createdAt: new Date(2026, 5, 6, 10, 0, 0) },
      { id: "2", createdAt: new Date(2026, 4, 1, 12, 0, 0) },
    ];
    const groups = groupByDate(now, items);
    expect(groups.map((g) => g.bucket)).toEqual(["today", "older"]);
  });

  it("BUCKET_LABELS sanity", () => {
    expect(BUCKET_LABELS.today).toBe("Hari ini");
    expect(BUCKET_LABELS.yesterday).toBe("Kemarin");
    expect(BUCKET_LABELS.this_week).toBe("Minggu ini");
    expect(BUCKET_LABELS.older).toBe("Lebih lama");
  });
});
