"use client";

/**
 * Friend request button — used on public profile (/u/[userId]).
 *
 * Renders the right CTA based on current relationship state:
 * - none       → "+ Add Friend" (sends request)
 * - outgoing   → "Request Sent · Cancel" (cancels outgoing request)
 * - incoming   → "Accept Request" / "Reject" (handles incoming request)
 * - friends    → "✓ Friends" disabled
 * - self       → renders nothing
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  cancelOutgoingRequestAction,
} from "@/app/actions/friend-requests";
import { Toast } from "@/components/ui/Toast";

export type RelationshipState =
  | { kind: "none" }
  | { kind: "outgoing"; requestId: string }
  | { kind: "incoming"; requestId: string }
  | { kind: "friends" }
  | { kind: "self" };

type Props = {
  targetUserId: string;
  state: RelationshipState;
};

export function FriendRequestButton({ targetUserId, state }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (state.kind === "self") return null;

  async function sendRequest() {
    setError(null);
    startTransition(async () => {
      const result = await sendFriendRequestAction(targetUserId);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Request sent!");
        router.refresh();
      }
    });
  }

  async function accept() {
    if (state.kind !== "incoming") return;
    setError(null);
    startTransition(async () => {
      const result = await acceptFriendRequestAction(state.requestId);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Friends!");
        router.refresh();
      }
    });
  }

  async function reject() {
    if (state.kind !== "incoming") return;
    if (!confirm("Reject this friend request?")) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectFriendRequestAction(state.requestId);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Rejected");
        router.refresh();
      }
    });
  }

  async function cancel() {
    if (state.kind !== "outgoing") return;
    if (!confirm("Cancel your friend request?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelOutgoingRequestAction(state.requestId);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Cancelled");
        router.refresh();
      }
    });
  }

  const buttons = (() => {
    if (state.kind === "friends") {
      return (
        <button
          type="button"
          disabled
          className="btn-secondary-lg"
          style={{ width: "100%", opacity: 0.85 }}
        >
          <span>✓ Friends</span>
        </button>
      );
    }
    if (state.kind === "incoming") {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={accept}
            disabled={pending}
            className="btn-primary-lg"
            style={{ flex: 1 }}
          >
            <span>{pending ? "..." : "✓ Accept Request"}</span>
          </button>
          <button
            type="button"
            onClick={reject}
            disabled={pending}
            className="btn-secondary-lg"
            style={{ flex: 1 }}
          >
            <span>Reject</span>
          </button>
        </div>
      );
    }
    if (state.kind === "outgoing") {
      return (
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="btn-secondary-lg"
          style={{ width: "100%" }}
        >
          <span>{pending ? "..." : "Request Sent · Tap to Cancel"}</span>
        </button>
      );
    }
    // none
    return (
      <button
        type="button"
        onClick={sendRequest}
        disabled={pending}
        className="btn-primary-lg"
        style={{ width: "100%" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 11V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14l4-4h8a2 2 0 0 0 2-2v-2" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
        <span>{pending ? "Sending..." : "Add Friend"}</span>
      </button>
    );
  })();

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />
      {buttons}
    </>
  );
}
