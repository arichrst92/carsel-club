import { describe, expect, it } from "vitest";
import {
  parsePushSubscription,
  sanitizeUserAgent,
} from "@/lib/push/subscriptions";

const validSub = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: {
    p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    auth: "tBHItJI5svbpez7KI4CCXg",
  },
};

describe("parsePushSubscription", () => {
  it("valid subscription", () => {
    expect(parsePushSubscription(validSub)).toEqual(validSub);
  });

  it("null/undefined/non-object", () => {
    expect(parsePushSubscription(null)).toBeNull();
    expect(parsePushSubscription(undefined)).toBeNull();
    expect(parsePushSubscription("string")).toBeNull();
    expect(parsePushSubscription(123)).toBeNull();
  });

  it("missing endpoint", () => {
    expect(
      parsePushSubscription({ keys: validSub.keys })
    ).toBeNull();
  });

  it("empty endpoint", () => {
    expect(
      parsePushSubscription({ endpoint: "", keys: validSub.keys })
    ).toBeNull();
  });

  it("non-https endpoint rejected", () => {
    expect(
      parsePushSubscription({
        endpoint: "http://fcm.googleapis.com/fcm/send/x",
        keys: validSub.keys,
      })
    ).toBeNull();
  });

  it("oversized endpoint", () => {
    expect(
      parsePushSubscription({
        endpoint: "https://" + "x".repeat(1100),
        keys: validSub.keys,
      })
    ).toBeNull();
  });

  it("missing keys object", () => {
    expect(
      parsePushSubscription({ endpoint: validSub.endpoint })
    ).toBeNull();
  });

  it("keys non-object", () => {
    expect(
      parsePushSubscription({ endpoint: validSub.endpoint, keys: "x" })
    ).toBeNull();
  });

  it("missing p256dh", () => {
    expect(
      parsePushSubscription({
        endpoint: validSub.endpoint,
        keys: { auth: validSub.keys.auth },
      })
    ).toBeNull();
  });

  it("empty p256dh", () => {
    expect(
      parsePushSubscription({
        endpoint: validSub.endpoint,
        keys: { p256dh: "", auth: validSub.keys.auth },
      })
    ).toBeNull();
  });

  it("missing auth", () => {
    expect(
      parsePushSubscription({
        endpoint: validSub.endpoint,
        keys: { p256dh: validSub.keys.p256dh },
      })
    ).toBeNull();
  });

  it("empty auth", () => {
    expect(
      parsePushSubscription({
        endpoint: validSub.endpoint,
        keys: { p256dh: validSub.keys.p256dh, auth: "" },
      })
    ).toBeNull();
  });

  it("oversized p256dh", () => {
    expect(
      parsePushSubscription({
        endpoint: validSub.endpoint,
        keys: { p256dh: "x".repeat(300), auth: validSub.keys.auth },
      })
    ).toBeNull();
  });

  it("oversized auth", () => {
    expect(
      parsePushSubscription({
        endpoint: validSub.endpoint,
        keys: { p256dh: validSub.keys.p256dh, auth: "x".repeat(200) },
      })
    ).toBeNull();
  });
});

describe("sanitizeUserAgent", () => {
  it("non-string", () => {
    expect(sanitizeUserAgent(null)).toBeNull();
    expect(sanitizeUserAgent(undefined)).toBeNull();
    expect(sanitizeUserAgent(123)).toBeNull();
  });

  it("empty", () => {
    expect(sanitizeUserAgent("")).toBeNull();
    expect(sanitizeUserAgent("   ")).toBeNull();
  });

  it("normal string passes through trimmed", () => {
    expect(sanitizeUserAgent("  Mozilla/5.0  ")).toBe("Mozilla/5.0");
  });

  it("truncates beyond maxLen", () => {
    const long = "a".repeat(600);
    expect(sanitizeUserAgent(long)).toHaveLength(500);
  });

  it("custom maxLen", () => {
    expect(sanitizeUserAgent("abcdef", 3)).toBe("abc");
  });
});
