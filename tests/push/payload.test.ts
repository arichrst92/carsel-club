import { describe, expect, it } from "vitest";
import { buildPushPayload } from "@/lib/push/payload";
import type { FormattedNotification } from "@/lib/notifications/format";

const fmt: FormattedNotification = {
  icon: "👋",
  title: "Friend request baru",
  body: "Budi ingin jadi friend",
  href: "/friends",
};

describe("buildPushPayload", () => {
  it("collapse type (friend_request) → tag without id, renotify on", () => {
    const p = buildPushPayload("friend_request", "n1", fmt);
    expect(p.tag).toBe("cc-friend_request");
    expect(p.renotify).toBe(true);
    expect(p.title).toBe("👋 Friend request baru");
    expect(p.url).toBe("/friends");
  });

  it("collapse type (join_requested) → tag without id, renotify on", () => {
    const p = buildPushPayload("join_requested", "n10", fmt);
    expect(p.tag).toBe("cc-join_requested");
    expect(p.renotify).toBe(true);
  });

  it("unique type (session_invite) → tag includes id, renotify off", () => {
    const p = buildPushPayload("session_invite", "n42", fmt);
    expect(p.tag).toBe("cc-session_invite-n42");
    expect(p.renotify).toBe(false);
  });

  it("session_reminder is unique (replace per-notification)", () => {
    const p = buildPushPayload("session_reminder", "n7", fmt);
    expect(p.tag).toBe("cc-session_reminder-n7");
    expect(p.renotify).toBe(false);
  });

  it("friend_accepted is unique (one-off event)", () => {
    const p = buildPushPayload("friend_accepted", "n5", fmt);
    expect(p.tag).toBe("cc-friend_accepted-n5");
    expect(p.renotify).toBe(false);
  });

  it("href null fallback ke /notifications", () => {
    const p = buildPushPayload("session_invite", "n11", { ...fmt, href: null });
    expect(p.url).toBe("/notifications");
  });

  it("icon + badge default", () => {
    const p = buildPushPayload("session_invite", "n1", fmt);
    expect(p.icon).toBe("/icon-192.png");
    expect(p.badge).toBe("/badge-72.png");
  });

  it("title combines icon + formatted title", () => {
    const p = buildPushPayload("session_cancelled", "n1", {
      ...fmt,
      icon: "🚫",
      title: "Session dibatalkan",
    });
    expect(p.title).toBe("🚫 Session dibatalkan");
  });

  it("body passes through", () => {
    const p = buildPushPayload("session_invite", "n1", fmt);
    expect(p.body).toBe(fmt.body);
  });
});
