"use client";

/**
 * Privacy preferences form (Sprint 38).
 *
 * - Per-field display toggles (city, stats, achievements, matches)
 * - Friend request policy radio
 * - (Profile visibility radio remains on EditProfileForm — single source of truth)
 */

import { useActionState } from "react";
import {
  updatePrivacyPrefsAction,
  type PrivacyActionState,
} from "@/app/actions/privacy";
import {
  DEFAULT_DISPLAY_FLAGS,
  DISPLAY_FLAG_LABELS,
  type DisplayFlags,
} from "@/lib/privacy/display-flags";
import {
  FRIEND_REQUEST_POLICY_LABELS,
  type FriendRequestPolicy,
} from "@/lib/privacy/friend-request-policy";

export type PrivacyPrefsFormProps = {
  initialFlags: Required<DisplayFlags>;
  initialPolicy: FriendRequestPolicy;
};

export function PrivacyPrefsForm(props: PrivacyPrefsFormProps) {
  const [state, action, pending] = useActionState<
    PrivacyActionState,
    FormData
  >(updatePrivacyPrefsAction, null);

  return (
    <form
      action={action}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
      }}
    >
      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "var(--s-4)",
        }}
      >
        <h3 style={h3}>Public profile display</h3>
        <p style={pSub}>
          What other people see when they open your profile (unless visibility = Private).
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          {(
            Object.keys(DEFAULT_DISPLAY_FLAGS) as (keyof DisplayFlags)[]
          ).map((key) => (
            <ToggleRow
              key={key}
              name={`flag.${key}`}
              label={DISPLAY_FLAG_LABELS[key]}
              defaultChecked={props.initialFlags[key]}
            />
          ))}
        </div>
      </section>

      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "var(--s-4)",
        }}
      >
        <h3 style={h3}>Friend request</h3>
        <p style={pSub}>Who can send you a friend request.</p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          {(
            Object.keys(FRIEND_REQUEST_POLICY_LABELS) as FriendRequestPolicy[]
          ).map((p) => (
            <RadioRow
              key={p}
              name="friend_request_policy"
              value={p}
              label={FRIEND_REQUEST_POLICY_LABELS[p]}
              defaultChecked={props.initialPolicy === p}
            />
          ))}
        </div>
      </section>

      {state?.error && (
        <div role="alert" style={errMsg}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" style={okMsg}>
          {state.success}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving..." : "Save privacy"}
      </button>
    </form>
  );
}

function ToggleRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--s-3)",
        padding: "var(--s-2) 0",
        borderTop: "1px solid var(--border-light)",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-900)" }}>
        {label}
      </span>
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        style={{
          width: 18,
          height: 18,
          accentColor: "var(--primary-600)",
        }}
      />
    </label>
  );
}

function RadioRow({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-2) var(--s-3)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-900)",
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        style={{ accentColor: "var(--primary-600)" }}
      />
      {label}
    </label>
  );
}

const h3: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 14,
  fontWeight: 800,
  color: "var(--text-900)",
  margin: 0,
  marginBottom: 4,
};

const pSub: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-500)",
  fontWeight: 600,
  margin: 0,
  marginBottom: "var(--s-3)",
  lineHeight: 1.4,
};

const errMsg: React.CSSProperties = {
  color: "var(--danger-700, #b91c1c)",
  fontSize: 13,
  fontWeight: 600,
};

const okMsg: React.CSSProperties = {
  color: "var(--success-700, #15803d)",
  fontSize: 13,
  fontWeight: 600,
};
