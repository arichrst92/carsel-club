import { describe, expect, it } from "vitest";
import { buildPushPayload } from "@/lib/push/payload";
import type { FormattedNotification } from "@/lib/notifications/format";

const fmt: FormattedNotification = {
  icon: "🎉",
  title: "Menang 21-10",
  body: "Sunday Padel • +30 poin",
  href: "/matches/m1",
};

describe("buildPushPayload", () => {
  it("collapse type → tag without id, renotify on", () => {
    const p = buildPushPayload("match_result", "n1", fmt);
    expect(p.tag).toBe("cc-match_result");
    expect(p.renotify).toBe(true);
    expect(p.title).toBe("🎉 Menang 21-10");
    expect(p.url).toBe("/matches/m1");
  });

  it("unique type → tag includes id, renotify off", () => {
    const p = buildPushPayload("tier_up", "n42", fmt);
    expect(p.tag).toBe("cc-tier_up-n42");
    expect(p.renotify).toBe(false);
  });

  it("session_reminder is unique (replace per-notification)", () => {
    const p = buildPushPayload("session_reminder", "n7", fmt);
    expect(p.tag).toBe("cc-session_reminder-n7");
  });

  it("friend_request collapses", () => {
    const p = buildPushPayload("friend_request", "n9", fmt);
    expect(p.tag).toBe("cc-friend_request");
    expect(p.renotify).toBe(true);
  });

  it("join_requested collapses", () => {
    const p = buildPushPayload("join_requested", "n10", fmt);
    expect(p.tag).toBe("cc-join_requested");
  });

  it("href null fallback ke /notifications", () => {
    const p = buildPushPayload("session_invite", "n11", { ...fmt, href: null });
    expect(p.url).toBe("/notifications");
  });

  it("icon + badge default", () => {
    const p = buildPushPayload("tier_up", "n1", fmt);
    expect(p.icon).toBe("/icon-192.png");
    expect(p.badge).toBe("/badge-72.png");
  });

  it("title combines icon + formatted title", () => {
    const p = buildPushPayload("tier_up", "n1", {
      ...fmt,
      icon: "🏆",
      title: "Tier naik!",
    });
    expect(p.title).toBe("🏆 Tier naik!");
  });

  it("body passes through", () => {
    const p = buildPushPayload("tier_up", "n1", fmt);
    expect(p.body).toBe(fmt.body);
  });
});
