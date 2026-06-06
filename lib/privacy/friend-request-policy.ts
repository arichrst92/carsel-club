/**
 * Pure helper untuk friend request policy enforcement (Sprint 38).
 *
 * Policy values:
 * - "anyone" — accept friend request from any user
 * - "friends_of_friends" — only if requester has ≥1 mutual friend
 * - "off" — no friend requests accepted
 *
 * Refs:
 * - DB: users.friend_request_policy enum
 * - Used by: app/actions/friend-requests.ts (sendFriendRequestAction)
 */

export type FriendRequestPolicy = "anyone" | "friends_of_friends" | "off";

export type PolicyCheck =
  | { allowed: true }
  | { allowed: false; reason: "off" | "no_mutual_friends" };

/**
 * Check whether requester is allowed to send friend request to target.
 *
 * - "anyone" → always allowed
 * - "off" → never allowed
 * - "friends_of_friends" → mutualFriendCount must be > 0
 */
export function checkFriendRequestPolicy(
  policy: FriendRequestPolicy,
  mutualFriendCount: number
): PolicyCheck {
  if (policy === "off") return { allowed: false, reason: "off" };
  if (policy === "anyone") return { allowed: true };
  // friends_of_friends
  if (mutualFriendCount > 0) return { allowed: true };
  return { allowed: false, reason: "no_mutual_friends" };
}

export const FRIEND_REQUEST_POLICY_LABELS: Record<
  FriendRequestPolicy,
  string
> = {
  anyone: "Siapa saja",
  friends_of_friends: "Hanya friend dari friend",
  off: "Mati",
};

export function denialMessage(reason: "off" | "no_mutual_friends"): string {
  if (reason === "off") return "User ini menonaktifkan friend request";
  return "Kamu perlu mutual friend untuk kirim request ke user ini";
}
