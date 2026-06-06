"use client";

/**
 * Auto-register service worker on mount (Sprint 33).
 *
 * Sprint 27's PushToggle registers on-demand for push subscription.
 * This component ensures SW is registered for all visitors so offline
 * fallback + shell cache works out-of-the-box.
 */

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.warn("[sw register]", e);
    });
  }, []);
  return null;
}
