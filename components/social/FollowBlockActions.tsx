"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  followUserAction,
  unfollowUserAction,
  blockUserAction,
  unblockUserAction,
} from "@/app/actions/social";
import { Toast } from "@/components/ui/Toast";

type Props = {
  targetUserId: string;
  isFollowing: boolean;
  isBlocked: boolean;
};

export function FollowBlockActions({
  targetUserId,
  isFollowing: initialFollowing,
  isBlocked: initialBlocked,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFollow() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const action = following ? unfollowUserAction : followUserAction;
      const result = await action(targetUserId);
      if (result?.error) {
        setError(result.error);
      } else {
        setFollowing(!following);
        setSuccess(result?.success ?? "Selesai");
        router.refresh();
      }
    });
  }

  function handleBlock() {
    if (!blocked) {
      if (
        !confirm(
          "Block user ini? Kalian akan saling unfollow + pending friend request di-reject."
        )
      )
        return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const action = blocked ? unblockUserAction : blockUserAction;
      const result = await action(targetUserId);
      if (result?.error) {
        setError(result.error);
      } else {
        setBlocked(!blocked);
        if (!blocked) setFollowing(false);
        setSuccess(result?.success ?? "Selesai");
        router.refresh();
      }
    });
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      <div style={{ display: "flex", gap: 8 }}>
        {!blocked && (
          <button
            type="button"
            onClick={handleFollow}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: following ? "var(--bg)" : "var(--primary)",
              color: following ? "var(--text-900)" : "#fff",
              border: following
                ? "1px solid var(--border)"
                : "1px solid var(--primary)",
              borderRadius: "var(--r-full)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {following ? "✓ Following" : "+ Follow"}
          </button>
        )}
        <button
          type="button"
          onClick={handleBlock}
          disabled={isPending}
          style={{
            flex: blocked ? 1 : "0 0 auto",
            padding: "10px 14px",
            background: blocked ? "var(--accent)" : "transparent",
            color: blocked ? "#fff" : "var(--text-500)",
            border: blocked
              ? "1px solid var(--accent)"
              : "1px solid var(--border)",
            borderRadius: "var(--r-full)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {blocked ? "🚫 Unblock" : "🚫"}
        </button>
      </div>
    </>
  );
}
