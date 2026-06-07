"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinPublicSessionAction } from "@/app/actions/find-sessions";
import { requestJoinAction } from "@/app/actions/join-requests";
import { Toast } from "@/components/ui/Toast";

type Props = {
  sessionId: string;
  joinPolicy?: "auto_join" | "need_approval";
  existingRequestStatus?: "pending" | "accepted" | "rejected" | null;
  navigateAfter?: string;
};

export function JoinPublicSessionButton({
  sessionId,
  joinPolicy = "auto_join",
  existingRequestStatus = null,
  navigateAfter,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showMessageField, setShowMessageField] = useState(false);

  const needsApproval = joinPolicy === "need_approval";

  function handleAutoJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinPublicSessionAction(sessionId);
      if (result?.error) {
        setError(result.error);
      } else if (navigateAfter) {
        router.push(navigateAfter);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  function handleRequest() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await requestJoinAction(
        sessionId,
        message.trim() || undefined
      );
      if (result?.error) setError(result.error);
      else {
        setSuccess(result?.success ?? "Request terkirim");
        router.refresh();
      }
    });
  }

  if (existingRequestStatus === "pending") {
    return (
      <div
        style={{
          padding: "12px 18px",
          background: "var(--yellow-50, #FEF9C3)",
          border: "1px solid #FACC15",
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 12,
          color: "var(--text-900)",
          textAlign: "center",
        }}
      >
        ⏳ Request kamu sedang menunggu approval host
      </div>
    );
  }

  if (existingRequestStatus === "rejected") {
    return (
      <div
        style={{
          padding: "12px 18px",
          background: "var(--accent-50)",
          border: "1px solid var(--accent-100)",
          borderRadius: "var(--r-md)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 12,
          color: "var(--accent-600)",
          textAlign: "center",
        }}
      >
        ✕ Request kamu di-reject host
      </div>
    );
  }

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <Toast
        message={success}
        kind="success"
        onDismiss={() => setSuccess(null)}
      />

      {needsApproval && showMessageField && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Pesan untuk host (opsional)"
          maxLength={200}
          rows={2}
          className="form-input"
          style={{ marginBottom: 8 }}
        />
      )}

      {needsApproval && !showMessageField && (
        <button
          type="button"
          onClick={() => setShowMessageField(true)}
          style={{
            display: "block",
            margin: "0 0 8px",
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--primary-700)",
            cursor: "pointer",
          }}
        >
          + Add a message for the host
        </button>
      )}

      <button
        type="button"
        onClick={needsApproval ? handleRequest : handleAutoJoin}
        disabled={isPending}
        className={`btn-primary-lg ${isPending ? "loading" : ""}`}
        style={{ width: "100%" }}
      >
        <span>
          {isPending
            ? needsApproval
              ? "Mengirim..."
              : "Joining..."
            : needsApproval
              ? "📩 Request to Join"
              : "🎾 Join Session"}
        </span>
        {!isPending && (
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </>
  );
}
