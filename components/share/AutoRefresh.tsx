"use client";

/**
 * Auto-refresh component for live pages.
 * Calls router.refresh() every N ms to re-fetch Server Component data.
 * Lighter than full page reload (preserves scroll, doesn't re-execute JS).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({
  intervalMs = 5000,
  enabled = true,
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, enabled, router]);

  return null;
}
