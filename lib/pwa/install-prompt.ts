/**
 * Smart timing heuristic untuk "install as PWA" prompt (Sprint 33).
 *
 * Decision: surface install prompt setelah user menunjukkan engagement —
 * 2+ sessions di-host ATAU 3+ matches completed. Avoid annoying brand new
 * users dengan modal di sign-in pertama.
 *
 * Once dismissed atau installed, never show again (localStorage flag in client).
 *
 * Pure — testable inputs only.
 */

export type InstallPromptSignals = {
  hostedCount: number;
  totalMatches: number;
  alreadyInstalled: boolean;
  /** Has user dismissed di session lain? (passed in from localStorage by client) */
  previouslyDismissed: boolean;
  /** Browser supports beforeinstallprompt? */
  installSupported: boolean;
};

export type InstallPromptDecision =
  | { show: true; reason: "engaged" }
  | { show: false; reason: "installed" | "dismissed" | "unsupported" | "not_engaged" };

export function shouldShowInstallPrompt(
  signals: InstallPromptSignals
): InstallPromptDecision {
  if (signals.alreadyInstalled) return { show: false, reason: "installed" };
  if (signals.previouslyDismissed) return { show: false, reason: "dismissed" };
  if (!signals.installSupported)
    return { show: false, reason: "unsupported" };
  const engaged = signals.hostedCount >= 2 || signals.totalMatches >= 3;
  if (!engaged) return { show: false, reason: "not_engaged" };
  return { show: true, reason: "engaged" };
}

/** localStorage key untuk dismissal flag */
export const INSTALL_DISMISS_KEY = "cc.installPrompt.dismissed";
