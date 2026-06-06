/**
 * Smart timing heuristic untuk "install as PWA" prompt.
 *
 * Sprint 50: drop engagement gate — user yg buka app pertama kali
 * langsung diberi tawaran install. Rasionalnya: install PWA punya
 * value dari hari pertama (offline, home-screen icon, full-screen
 * mode). Engagement gate Sprint 33 terlalu konservatif.
 *
 * Once dismissed atau installed, never show again (localStorage flag).
 *
 * Pure — testable inputs only.
 */

export type InstallPromptSignals = {
  /** Sudah ter-install sebagai PWA / standalone? */
  alreadyInstalled: boolean;
  /** Has user dismissed di session lain? (passed in from localStorage) */
  previouslyDismissed: boolean;
  /** Browser supports beforeinstallprompt? (Android Chrome / Edge) */
  installSupported: boolean;
};

export type InstallPromptDecision =
  | { show: true; reason: "eligible" }
  | { show: false; reason: "installed" | "dismissed" | "unsupported" };

export function shouldShowInstallPrompt(
  signals: InstallPromptSignals
): InstallPromptDecision {
  if (signals.alreadyInstalled) return { show: false, reason: "installed" };
  if (signals.previouslyDismissed) return { show: false, reason: "dismissed" };
  if (!signals.installSupported)
    return { show: false, reason: "unsupported" };
  return { show: true, reason: "eligible" };
}

/** localStorage key untuk dismissal flag */
export const INSTALL_DISMISS_KEY = "cc.installPrompt.dismissed";
