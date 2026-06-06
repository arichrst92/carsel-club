"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/app/actions/join-requests";
import type { PendingJoinRequest } from "@/lib/db/queries/join-requests";
import { Toast } from "@/components/ui/Toast";

type Props = {
  requests: PendingJoinRequest[];
};

export function JoinRequestInbox({ requests }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) return null;

  function handleApprove(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await approveJoinRequestAction(id);
      setBusyId(null);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Di-approve");
        router.refresh();
      }
    });
  }

  function handleReject(id: string) {
    if (!confirm("Reject request ini?")) return;
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await rejectJoinRequestAction(id);
      setBusyId(null);
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Di-reject");
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

      <section>
        <div className="section-head">
          <h3>
            Join Requests{" "}
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--accent-600)",
                background: "var(--accent-50)",
                padding: "2px 8px",
                borderRadius: "var(--r-full)",
                marginLeft: 4,
              }}
            >
              {requests.length} pending
            </span>
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requests.map((r) => {
            const initial = (r.displayName.trim()[0] ?? "?").toUpperCase();
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "var(--s-3)",
                  background: "var(--bg)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--r-md)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: r.avatarUrl
                      ? `url(${r.avatarUrl}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${r.tierColor ?? "var(--primary)"}, ${r.tierColor ?? "var(--primary-700)"})`,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {!r.avatarUrl && initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--text-900)",
                    }}
                  >
                    {r.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-500)",
                      fontWeight: 600,
                    }}
                  >
                    {r.tierName ?? "—"} · {r.totalPoints} pts ·{" "}
                    {r.totalMatches} match
                    {r.city && ` · 📍 ${r.city}`}
                  </div>
                  {r.message && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-700)",
                        fontWeight: 600,
                        marginTop: 4,
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{r.message}&rdquo;
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(r.id)}
                    disabled={isPending && busyId === r.id}
                    style={{
                      padding: "6px 12px",
                      background: "var(--primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--r-full)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity: isPending && busyId === r.id ? 0.6 : 1,
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r.id)}
                    disabled={isPending && busyId === r.id}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      color: "var(--accent-600)",
                      border: "1px solid var(--accent-100)",
                      borderRadius: "var(--r-full)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity: isPending && busyId === r.id ? 0.6 : 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
