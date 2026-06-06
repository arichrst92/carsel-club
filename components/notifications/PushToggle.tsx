"use client";

/**
 * Push subscription toggle (Sprint 27).
 *
 * Flow:
 * 1. On mount: check Notification.permission + existing subscription
 * 2. Toggle on → request permission → register SW → subscribe → save to DB
 * 3. Toggle off → unsubscribe browser + delete row
 *
 * Browser support:
 * - Safari iOS: only works as installed PWA (Sprint 33). Show disabled msg here.
 * - All others: standard Notifications API + PushManager
 */

import { useEffect, useState, useTransition } from "react";
import {
  savePushSubscriptionAction,
  removePushSubscriptionAction,
} from "@/app/actions/push";

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "off"
  | "on"
  | "subscribing"
  | "unsubscribing";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (mounted) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (mounted) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          if (mounted) setStatus("off");
          return;
        }
        const sub = await reg.pushManager.getSubscription();
        if (mounted) setStatus(sub ? "on" : "off");
      } catch {
        if (mounted) setStatus("off");
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, []);

  async function enable() {
    setError(null);
    setStatus("subscribing");
    try {
      // 1. Permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      // 2. Register SW
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      // 3. Get VAPID public key
      const res = await fetch("/api/push/vapid-public-key");
      if (!res.ok) {
        setError("Push belum dikonfigurasi server. Hubungi admin.");
        setStatus("off");
        return;
      }
      const { publicKey } = (await res.json()) as { publicKey: string };
      // 4. Subscribe browser
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      // 5. Save to DB
      startTransition(async () => {
        const r = await savePushSubscriptionAction(sub.toJSON());
        if (r?.error) {
          setError(r.error);
          setStatus("off");
        } else {
          setStatus("on");
        }
      });
    } catch (e) {
      console.error("[push subscribe]", e);
      setError("Gagal subscribe. Coba lagi.");
      setStatus("off");
    }
  }

  async function disable() {
    setError(null);
    setStatus("unsubscribing");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      const endpoint = sub?.endpoint ?? null;
      if (sub) await sub.unsubscribe();
      if (endpoint) {
        startTransition(async () => {
          await removePushSubscriptionAction(endpoint);
          setStatus("off");
        });
      } else {
        setStatus("off");
      }
    } catch (e) {
      console.error("[push unsubscribe]", e);
      setError("Gagal unsubscribe");
      setStatus("on");
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--s-3)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 800,
              color: "var(--text-900)",
            }}
          >
            Browser push notification
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-500)",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            {statusDescription(status)}
          </div>
        </div>
        <StatusButton status={status} onEnable={enable} onDisable={disable} />
      </div>
      {error && (
        <div
          role="alert"
          style={{
            fontSize: 12,
            color: "var(--danger-700, #b91c1c)",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function StatusButton({
  status,
  onEnable,
  onDisable,
}: {
  status: Status;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const busy = status === "subscribing" || status === "unsubscribing";
  if (status === "loading") {
    return (
      <span style={{ fontSize: 12, color: "var(--text-500)" }}>...</span>
    );
  }
  if (status === "unsupported") {
    return (
      <span style={badgeStyle("muted")}>
        Tidak didukung
      </span>
    );
  }
  if (status === "denied") {
    return <span style={badgeStyle("muted")}>Permission diblokir</span>;
  }
  if (status === "on") {
    return (
      <button
        type="button"
        onClick={onDisable}
        disabled={busy}
        style={btnStyle("danger")}
      >
        {busy ? "..." : "Matikan"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onEnable}
      disabled={busy}
      style={btnStyle("primary")}
    >
      {busy ? "..." : "Aktifkan"}
    </button>
  );
}

function statusDescription(s: Status): string {
  switch (s) {
    case "loading":
      return "Cek status…";
    case "unsupported":
      return "Browser ini belum dukung Web Push (Safari iOS: install sebagai PWA)";
    case "denied":
      return "Permission diblokir di browser. Reset di address bar > Site settings.";
    case "on":
      return "Aktif — kamu akan dapat notifikasi browser";
    case "off":
      return "Mati — aktifkan untuk dapat ping real-time";
    case "subscribing":
      return "Mengaktifkan…";
    case "unsubscribing":
      return "Mematikan…";
  }
}

function btnStyle(variant: "primary" | "danger"): React.CSSProperties {
  return {
    background:
      variant === "primary" ? "var(--primary-600)" : "var(--danger-600, #dc2626)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--r-md)",
    padding: "var(--s-2) var(--s-3)",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}

function badgeStyle(kind: "muted"): React.CSSProperties {
  return {
    background: "var(--bg-soft)",
    color: "var(--text-500)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    padding: "var(--s-1) var(--s-2)",
    fontSize: 11,
    fontWeight: 700,
  };
}
