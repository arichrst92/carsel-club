"use client";

/**
 * Notification prefs form (Sprint 26).
 *
 * - Per-type checkbox per channel (in_app, push, wa)
 * - Quiet hours start/end (0-23 dropdown, "Tidak ada" for null)
 * - Push & WA delivery belum live (Sprint 27/28). Toggle disimpan saja.
 */

import { useActionState } from "react";
import {
  updateNotificationPrefsAction,
  type ActionState,
} from "@/app/actions/notifications";
import {
  resolveChannels,
  type NotificationSettings,
  type ChannelPrefs,
} from "@/lib/notifications/prefs";
import type { NotificationType } from "@/lib/notifications/types";

const TYPE_LABELS: Record<NotificationType, string> = {
  session_invite: "Diundang ke session",
  session_reminder: "Session reminder (H-1 hour)",
  session_cancelled: "Session cancelled",
  friend_request: "Friend request",
  friend_accepted: "Friend di-accept",
  join_requested: "Join request masuk (host)",
  join_approved: "Join request di-approve",
  join_rejected: "Join request di-reject",
};

const TYPES: NotificationType[] = Object.keys(TYPE_LABELS) as NotificationType[];

export type NotificationPrefsFormProps = {
  initialSettings: NotificationSettings;
  initialQuietStart: number | null;
  initialQuietEnd: number | null;
};

export function NotificationPrefsForm(props: NotificationPrefsFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateNotificationPrefsAction,
    null
  );

  return (
    <form
      action={formAction}
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
        <h3 style={prefHeader}>Channels per tipe</h3>
        <p style={prefDesc}>
          In-app selalu masuk. Push & WhatsApp belum aktif (Sprint 27/28) —
          preferensi disimpan untuk dipakai nanti.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: "var(--s-2) var(--s-3)",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <div />
          <div style={channelHead}>In-app</div>
          <div style={channelHead}>Push</div>
          <div style={channelHead}>WA</div>
          {TYPES.map((t) => {
            const effective = resolveChannels(props.initialSettings, t);
            return (
              <PrefRow
                key={t}
                type={t}
                label={TYPE_LABELS[t]}
                channels={effective}
              />
            );
          })}
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
        <h3 style={prefHeader}>Quiet hours</h3>
        <p style={prefDesc}>
          Push & WA tidak dikirim antara jam berikut (in-app tetap masuk).
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-3)",
          }}
        >
          <HourSelect
            name="quiet_start"
            label="Mulai"
            value={props.initialQuietStart}
          />
          <HourSelect
            name="quiet_end"
            label="Completed"
            value={props.initialQuietEnd}
          />
        </div>
      </section>

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
      {state?.success && (
        <div
          role="status"
          style={{
            color: "var(--success-700, #15803d)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
        style={{ marginTop: "var(--s-2)" }}
      >
        {pending ? "Menyimpan..." : "Simpan preferensi"}
      </button>
    </form>
  );
}

function PrefRow({
  type,
  label,
  channels,
}: {
  type: NotificationType;
  label: string;
  channels: ChannelPrefs;
}) {
  return (
    <>
      <div
        style={{
          fontWeight: 600,
          fontSize: 13,
          color: "var(--text-900)",
        }}
      >
        {label}
      </div>
      <ChannelCheck name={`pref.${type}.in_app`} defaultChecked={channels.in_app} />
      <ChannelCheck name={`pref.${type}.push`} defaultChecked={channels.push} />
      <ChannelCheck name={`pref.${type}.wa`} defaultChecked={channels.wa} />
    </>
  );
}

function ChannelCheck({
  name,
  defaultChecked,
}: {
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      style={{
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        style={{ width: 18, height: 18, accentColor: "var(--primary-600)" }}
      />
    </label>
  );
}

function HourSelect({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: number | null;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-1)",
        fontSize: 12,
        color: "var(--text-700)",
        fontWeight: 600,
      }}
    >
      {label}
      <select
        name={name}
        defaultValue={value === null ? "null" : String(value)}
        style={{
          padding: "var(--s-2) var(--s-3)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          fontSize: 14,
          background: "var(--bg-card)",
          color: "var(--text-900)",
        }}
      >
        <option value="null">None</option>
        {Array.from({ length: 24 }).map((_, h) => (
          <option key={h} value={String(h)}>
            {String(h).padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </label>
  );
}

const prefHeader: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 14,
  fontWeight: 800,
  color: "var(--text-900)",
  margin: 0,
  marginBottom: "var(--s-1)",
};

const prefDesc: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-500)",
  fontWeight: 600,
  margin: 0,
  marginBottom: "var(--s-3)",
  lineHeight: 1.4,
};

const channelHead: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-500)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  textAlign: "center",
};
