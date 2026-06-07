"use client";

import { useActionState } from "react";
import {
  deleteAccountAction,
  type PrivacyActionState,
} from "@/app/actions/privacy";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<
    PrivacyActionState,
    FormData
  >(deleteAccountAction, null);

  return (
    <form
      action={action}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--danger-200, #fecaca)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          fontWeight: 800,
          color: "var(--danger-700, #b91c1c)",
          margin: 0,
        }}
      >
        ⚠ Delete account
      </h3>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-700)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Your account will be permanently anonymized: name becomes "[Account deleted]",
        avatar removed, friend requests disabled. Historical stats are kept
        to preserve data integrity for sessions you've joined.
      </p>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-1)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-700)",
        }}
      >
        Type <strong>DELETE</strong> to confirm
        <input
          name="confirmation"
          type="text"
          autoComplete="off"
          required
          placeholder="DELETE"
          style={{
            padding: "var(--s-2) var(--s-3)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            fontSize: 14,
            background: "var(--bg-card)",
          }}
        />
      </label>
      {state?.error && (
        <div
          role="alert"
          style={{
            color: "var(--danger-700, #b91c1c)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{
          background: "var(--danger-600, #dc2626)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--r-md)",
          padding: "var(--s-2) var(--s-3)",
          fontWeight: 800,
          fontSize: 13,
          cursor: pending ? "default" : "pointer",
        }}
      >
        {pending ? "Deleting..." : "Permanently delete account"}
      </button>
    </form>
  );
}
