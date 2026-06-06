import { describe, expect, it } from "vitest";
import {
  resolveChannels,
  isChannelEnabled,
  isQuietHours,
  shouldDeliver,
  DEFAULT_CHANNELS,
} from "@/lib/notifications/prefs";

describe("resolveChannels", () => {
  it("empty settings → default channels for generic type", () => {
    expect(resolveChannels({}, "session_invite")).toEqual(DEFAULT_CHANNELS);
  });

  it("session_reminder defaults wa=true", () => {
    const r = resolveChannels({}, "session_reminder");
    expect(r.wa).toBe(true);
  });

  it("user override partial — wa off", () => {
    const r = resolveChannels(
      { session_reminder: { wa: false } },
      "session_reminder"
    );
    expect(r.wa).toBe(false);
    expect(r.in_app).toBe(true);
  });

  it("user override push off", () => {
    const r = resolveChannels(
      { friend_request: { push: false } },
      "friend_request"
    );
    expect(r.push).toBe(false);
    expect(r.in_app).toBe(true);
  });
});

describe("isChannelEnabled", () => {
  it("default in_app for any type", () => {
    expect(isChannelEnabled({}, "session_invite", "in_app")).toBe(true);
  });

  it("disabled push", () => {
    expect(
      isChannelEnabled(
        { friend_request: { push: false } },
        "friend_request",
        "push"
      )
    ).toBe(false);
  });

  it("disabled in_app respected", () => {
    expect(
      isChannelEnabled(
        { friend_accepted: { in_app: false } },
        "friend_accepted",
        "in_app"
      )
    ).toBe(false);
  });
});

describe("isQuietHours", () => {
  it("null start → false", () => {
    expect(isQuietHours(3, null, 7)).toBe(false);
  });

  it("null end → false", () => {
    expect(isQuietHours(3, 22, null)).toBe(false);
  });

  it("invalid hour → false", () => {
    expect(isQuietHours(25, 22, 7)).toBe(false);
    expect(isQuietHours(-1, 22, 7)).toBe(false);
    expect(isQuietHours(3.5, 22, 7)).toBe(false);
  });

  it("simple range start<end — inside", () => {
    expect(isQuietHours(14, 13, 15)).toBe(true);
  });

  it("simple range — at start", () => {
    expect(isQuietHours(13, 13, 15)).toBe(true);
  });

  it("simple range — at end is excluded", () => {
    expect(isQuietHours(15, 13, 15)).toBe(false);
  });

  it("simple range — before", () => {
    expect(isQuietHours(12, 13, 15)).toBe(false);
  });

  it("wraps midnight — late night inside", () => {
    expect(isQuietHours(23, 22, 7)).toBe(true);
  });

  it("wraps midnight — early morning inside", () => {
    expect(isQuietHours(3, 22, 7)).toBe(true);
  });

  it("wraps midnight — daytime outside", () => {
    expect(isQuietHours(12, 22, 7)).toBe(false);
  });

  it("wraps midnight — at end is excluded", () => {
    expect(isQuietHours(7, 22, 7)).toBe(false);
  });

  it("start === end → entire day", () => {
    expect(isQuietHours(5, 12, 12)).toBe(true);
    expect(isQuietHours(12, 12, 12)).toBe(true);
  });
});

describe("shouldDeliver", () => {
  it("in_app always delivers regardless of quiet hours", () => {
    expect(
      shouldDeliver({}, "session_invite", "in_app", 3, 22, 7)
    ).toBe(true);
  });

  it("push disabled by pref", () => {
    expect(
      shouldDeliver(
        { session_invite: { push: false } },
        "session_invite",
        "push",
        12,
        null,
        null
      )
    ).toBe(false);
  });

  it("push gated by quiet hours", () => {
    expect(
      shouldDeliver({}, "session_invite", "push", 3, 22, 7)
    ).toBe(false);
  });

  it("push delivers outside quiet hours", () => {
    expect(
      shouldDeliver({}, "session_invite", "push", 12, 22, 7)
    ).toBe(true);
  });

  it("wa requires opt-in for session_invite (default off)", () => {
    expect(
      shouldDeliver({}, "session_invite", "wa", 12, null, null)
    ).toBe(false);
  });

  it("wa delivers for session_reminder by default", () => {
    expect(
      shouldDeliver({}, "session_reminder", "wa", 12, null, null)
    ).toBe(true);
  });
});
