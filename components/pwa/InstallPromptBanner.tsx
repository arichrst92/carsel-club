"use client";

/**
 * Smart install prompt banner (Sprint 33).
 *
 * Flow:
 * - Listens beforeinstallprompt event (Chrome/Edge/Android)
 * - On mount, checks engagement signals + previouslyDismissed flag
 * - If eligible AND prompt event captured → show floating banner
 * - Install → triggers prompt.prompt(); dismiss → set localStorage flag
 *
 * iOS Safari: no beforeinstallprompt — shows manual instruction banner with
 * Share→Add to Home Screen hint when installSupported=false but standalone
 * mode not detected.
 */

import { useEffect, useState } from "react";
import {
  shouldShowInstallPrompt,
  INSTALL_DISMISS_KEY,
} from "@/lib/pwa/install-prompt";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "android" | "ios";

/**
 * Sprint 50: drop engagement-gate signals. Always-on (kecuali dismissed
 * atau already installed). Bisa di-render di layout / multi page.
 */
export function InstallPromptBanner() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const dismissed =
      window.localStorage?.getItem(INSTALL_DISMISS_KEY) === "1";

    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    // iOS Safari → manual instruction path (no beforeinstallprompt event)
    if (isIos) {
      const decision = shouldShowInstallPrompt({
        alreadyInstalled: false,
        previouslyDismissed: dismissed,
        installSupported: true,
      });
      if (decision.show) setMode("ios");
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      const decision = shouldShowInstallPrompt({
        alreadyInstalled: false,
        previouslyDismissed: dismissed,
        installSupported: true,
      });
      if (decision.show) {
        setPromptEvent(evt);
        setMode("android");
      }
    }
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstall as EventListener
    );
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall as EventListener
      );
  }, []);

  function dismiss() {
    try {
      window.localStorage?.setItem(INSTALL_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setMode("hidden");
  }

  async function install() {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") {
        setMode("hidden");
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    }
  }

  if (mode === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-label="Install Carsel Club"
      style={{
        position: "fixed",
        bottom: "calc(var(--bottomnav-h, 60px) + var(--s-3))",
        left: "var(--s-3)",
        right: "var(--s-3)",
        zIndex: 50,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "var(--s-3) var(--s-4)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
      }}
    >
      <div style={{ fontSize: 32 }}>🎾</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 14,
            color: "var(--text-900)",
          }}
        >
          Pasang Carsel Club
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-500)",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {mode === "ios"
            ? "Tap ikon Bagikan → Tambahkan ke Layar Awal"
            : "Akses cepat dari layar utama, seperti app asli."}
        </div>
      </div>
      <div style={{ display: "flex", gap: "var(--s-1)" }}>
        {mode === "android" && (
          <button
            type="button"
            onClick={install}
            className="btn-primary"
            style={{
              padding: "var(--s-2) var(--s-3)",
              fontSize: 12,
            }}
          >
            Pasang
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-500)",
            fontSize: 18,
            cursor: "pointer",
            padding: "var(--s-1) var(--s-2)",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
