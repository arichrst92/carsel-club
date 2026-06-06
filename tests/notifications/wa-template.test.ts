import { describe, expect, it } from "vitest";
import { buildWaMessage } from "@/lib/notifications/wa-template";

const ctx = { appUrl: "https://carsel.club" };

describe("buildWaMessage", () => {
  it("session_invite contains brand + inviter + session + link", () => {
    const m = buildWaMessage(
      "session_invite",
      { sessionId: "s1", sessionTitle: "Sunday Padel", inviterName: "Budi" },
      ctx
    );
    expect(m).toContain("Carsel Club");
    expect(m).toContain("Budi");
    expect(m).toContain("Sunday Padel");
    expect(m).toContain("https://carsel.club/sessions/s1");
  });

  it("session_reminder minutes formatting", () => {
    const m = buildWaMessage(
      "session_reminder",
      {
        sessionId: "s2",
        sessionTitle: "Eve",
        venueName: "Court A",
        scheduledAt: "2026-06-06T18:00:00Z",
        inMinutes: 30,
      },
      ctx
    );
    expect(m).toContain("30 menit lagi");
    expect(m).toContain("Court A");
  });

  it("session_reminder hours formatting + no venue", () => {
    const m = buildWaMessage(
      "session_reminder",
      {
        sessionId: "s3",
        sessionTitle: "Late",
        venueName: null,
        scheduledAt: "2026-06-06T20:00:00Z",
        inMinutes: 120,
      },
      ctx
    );
    expect(m).toContain("2 jam lagi");
    expect(m).not.toContain("📍");
  });

  it("session_cancelled", () => {
    const m = buildWaMessage(
      "session_cancelled",
      { sessionId: "s4", sessionTitle: "X" },
      ctx
    );
    expect(m).toContain("dibatalkan");
    expect(m).toContain("/sessions/s4");
  });

  it("friend_request with message", () => {
    const m = buildWaMessage(
      "friend_request",
      { fromUserId: "u1", fromDisplayName: "Ari", message: "Mau gabung" },
      ctx
    );
    expect(m).toContain("Ari");
    expect(m).toContain("Mau gabung");
    expect(m).toContain("/friends");
  });

  it("friend_request without message", () => {
    const m = buildWaMessage(
      "friend_request",
      { fromUserId: "u1", fromDisplayName: "Ari", message: null },
      ctx
    );
    expect(m).toContain("Ari");
    expect(m).not.toMatch(/"[^"]+"/); // no quoted block
  });

  it("friend_accepted contains profile link", () => {
    const m = buildWaMessage(
      "friend_accepted",
      { byUserId: "u9", byDisplayName: "Citra" },
      ctx
    );
    expect(m).toContain("Citra");
    expect(m).toContain("/u/u9");
  });

  it("join_requested contains participants link", () => {
    const m = buildWaMessage(
      "join_requested",
      {
        sessionId: "s8",
        sessionTitle: "Pub",
        requesterUserId: "u4",
        requesterDisplayName: "Eka",
      },
      ctx
    );
    expect(m).toContain("Eka");
    expect(m).toContain("/sessions/s8/participants");
  });

  it("join_approved", () => {
    const m = buildWaMessage(
      "join_approved",
      { sessionId: "s9", sessionTitle: "Yes" },
      ctx
    );
    expect(m).toContain("approve");
    expect(m).toContain("/sessions/s9");
  });

  it("join_rejected", () => {
    const m = buildWaMessage(
      "join_rejected",
      { sessionId: "s10", sessionTitle: "Nope" },
      ctx
    );
    expect(m).toContain("reject");
    expect(m).toContain("/sessions/s10");
  });

  it("strips trailing slash in appUrl", () => {
    const m = buildWaMessage(
      "session_invite",
      { sessionId: "s1", sessionTitle: "X", inviterName: "Y" },
      { appUrl: "https://carsel.club/" }
    );
    expect(m).toContain("https://carsel.club/sessions/s1");
    expect(m).not.toContain("//sessions");
  });

  it("strips multiple trailing slashes in appUrl", () => {
    const m = buildWaMessage(
      "session_invite",
      { sessionId: "s1", sessionTitle: "X", inviterName: "Y" },
      { appUrl: "https://carsel.club///" }
    );
    expect(m).toContain("https://carsel.club/sessions/s1");
    expect(m).not.toContain("//sessions");
  });
});
