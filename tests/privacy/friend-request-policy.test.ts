import { describe, expect, it } from "vitest";
import {
  checkFriendRequestPolicy,
  denialMessage,
  FRIEND_REQUEST_POLICY_LABELS,
} from "@/lib/privacy/friend-request-policy";

describe("checkFriendRequestPolicy", () => {
  it("anyone → always allowed (even 0 mutuals)", () => {
    expect(checkFriendRequestPolicy("anyone", 0)).toEqual({ allowed: true });
    expect(checkFriendRequestPolicy("anyone", 5)).toEqual({ allowed: true });
  });

  it("off → always denied", () => {
    expect(checkFriendRequestPolicy("off", 0)).toEqual({
      allowed: false,
      reason: "off",
    });
    expect(checkFriendRequestPolicy("off", 100)).toEqual({
      allowed: false,
      reason: "off",
    });
  });

  it("friends_of_friends → 0 mutuals denied", () => {
    expect(checkFriendRequestPolicy("friends_of_friends", 0)).toEqual({
      allowed: false,
      reason: "no_mutual_friends",
    });
  });

  it("friends_of_friends → 1+ mutuals allowed", () => {
    expect(checkFriendRequestPolicy("friends_of_friends", 1)).toEqual({
      allowed: true,
    });
    expect(checkFriendRequestPolicy("friends_of_friends", 5)).toEqual({
      allowed: true,
    });
  });
});

describe("denialMessage", () => {
  it("off", () => {
    expect(denialMessage("off")).toContain("menonaktifkan");
  });

  it("no_mutual_friends", () => {
    expect(denialMessage("no_mutual_friends")).toContain("mutual friend");
  });
});

describe("FRIEND_REQUEST_POLICY_LABELS", () => {
  it("has all 3 keys with Indonesian labels", () => {
    expect(FRIEND_REQUEST_POLICY_LABELS.anyone).toBe("Siapa saja");
    expect(FRIEND_REQUEST_POLICY_LABELS.friends_of_friends).toContain(
      "friend"
    );
    expect(FRIEND_REQUEST_POLICY_LABELS.off).toBe("Mati");
  });
});
