import { describe, expect, it } from "vitest";
import {
  formatNotification,
  formatRelativeTime,
} from "@/lib/notifications/format";

describe("formatNotification", () => {
  it("session_invite", () => {
    const r = formatNotification("session_invite", {
      sessionId: "s1",
      sessionTitle: "Sunday Padel",
      inviterName: "Budi",
    });
    expect(r.icon).toBe("📅");
    expect(r.title).toContain("Diundang");
    expect(r.body).toContain("Budi");
    expect(r.body).toContain("Sunday Padel");
    expect(r.href).toBe("/sessions/s1");
  });

  it("session_reminder — minutes only", () => {
    const r = formatNotification("session_reminder", {
      sessionId: "s2",
      sessionTitle: "Sat Padel",
      venueName: "Court A",
      scheduledAt: "2026-06-06T10:00:00Z",
      inMinutes: 30,
    });
    expect(r.body).toContain("30 menit");
    expect(r.body).toContain("Court A");
    expect(r.href).toBe("/sessions/s2");
  });

  it("session_reminder — hours, no venue", () => {
    const r = formatNotification("session_reminder", {
      sessionId: "s3",
      sessionTitle: "Eve Padel",
      venueName: null,
      scheduledAt: "2026-06-06T18:00:00Z",
      inMinutes: 120,
    });
    expect(r.body).toContain("2 jam");
    expect(r.body).not.toContain("di ");
  });

  it("session_cancelled", () => {
    const r = formatNotification("session_cancelled", {
      sessionId: "s4",
      sessionTitle: "Cancel Padel",
    });
    expect(r.icon).toBe("🚫");
    expect(r.title).toContain("dibatalkan");
    expect(r.body).toContain("Cancel Padel");
  });

  it("friend_request — with message", () => {
    const r = formatNotification("friend_request", {
      fromUserId: "u1",
      fromDisplayName: "Ari",
      message: "Mau main bareng",
    });
    expect(r.icon).toBe("👋");
    expect(r.body).toContain("Mau main bareng");
    expect(r.href).toBe("/friends");
  });

  it("friend_request — without message", () => {
    const r = formatNotification("friend_request", {
      fromUserId: "u2",
      fromDisplayName: "Citra",
      message: null,
    });
    expect(r.body).toContain("Citra");
    expect(r.body).toContain("ingin");
  });

  it("friend_accepted", () => {
    const r = formatNotification("friend_accepted", {
      byUserId: "u3",
      byDisplayName: "Dani",
    });
    expect(r.icon).toBe("🤝");
    expect(r.body).toContain("Dani");
    expect(r.href).toBe("/u/u3");
  });

  it("join_requested", () => {
    const r = formatNotification("join_requested", {
      sessionId: "s8",
      sessionTitle: "Pub",
      requesterUserId: "u4",
      requesterDisplayName: "Eka",
    });
    expect(r.icon).toBe("✋");
    expect(r.body).toContain("Eka");
    expect(r.href).toBe("/sessions/s8/participants");
  });

  it("join_approved", () => {
    const r = formatNotification("join_approved", {
      sessionId: "s9",
      sessionTitle: "Yes",
    });
    expect(r.icon).toBe("✅");
    expect(r.body).toContain("Yes");
    expect(r.href).toBe("/sessions/s9");
  });

  it("join_rejected", () => {
    const r = formatNotification("join_rejected", {
      sessionId: "s10",
      sessionTitle: "Nope",
    });
    expect(r.icon).toBe("❌");
    expect(r.body).toContain("Nope");
    expect(r.href).toBe("/sessions/s10");
  });

});

describe("formatRelativeTime", () => {
  const now = new Date("2026-06-06T12:00:00Z");

  it("future time → baru", () => {
    expect(
      formatRelativeTime(now, new Date("2026-06-06T13:00:00Z"))
    ).toBe("baru");
  });

  it("under 1 minute → baru", () => {
    expect(
      formatRelativeTime(now, new Date("2026-06-06T11:59:30Z"))
    ).toBe("baru");
  });

  it("minutes", () => {
    expect(
      formatRelativeTime(now, new Date("2026-06-06T11:55:00Z"))
    ).toBe("5m");
  });

  it("hours", () => {
    expect(
      formatRelativeTime(now, new Date("2026-06-06T09:00:00Z"))
    ).toBe("3j");
  });

  it("days", () => {
    expect(
      formatRelativeTime(now, new Date("2026-06-04T12:00:00Z"))
    ).toBe("2h");
  });

  it("weeks", () => {
    expect(
      formatRelativeTime(now, new Date("2026-05-23T12:00:00Z"))
    ).toBe("2mg");
  });

  it("months", () => {
    expect(
      formatRelativeTime(now, new Date("2026-03-06T12:00:00Z"))
    ).toBe("3bl");
  });

  it("years", () => {
    expect(
      formatRelativeTime(now, new Date("2024-06-06T12:00:00Z"))
    ).toBe("2th");
  });
});
