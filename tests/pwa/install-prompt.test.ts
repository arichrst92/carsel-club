import { describe, expect, it } from "vitest";
import {
  shouldShowInstallPrompt,
  INSTALL_DISMISS_KEY,
} from "@/lib/pwa/install-prompt";

const base = {
  hostedCount: 0,
  totalMatches: 0,
  alreadyInstalled: false,
  previouslyDismissed: false,
  installSupported: true,
};

describe("shouldShowInstallPrompt", () => {
  it("not engaged → false", () => {
    expect(shouldShowInstallPrompt(base)).toEqual({
      show: false,
      reason: "not_engaged",
    });
  });

  it("engaged via hostedCount >= 2", () => {
    expect(
      shouldShowInstallPrompt({ ...base, hostedCount: 2 })
    ).toEqual({ show: true, reason: "engaged" });
  });

  it("engaged via totalMatches >= 3", () => {
    expect(
      shouldShowInstallPrompt({ ...base, totalMatches: 3 })
    ).toEqual({ show: true, reason: "engaged" });
  });

  it("just below thresholds → false", () => {
    expect(
      shouldShowInstallPrompt({ ...base, hostedCount: 1, totalMatches: 2 })
    ).toEqual({ show: false, reason: "not_engaged" });
  });

  it("already installed always false", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        hostedCount: 100,
        totalMatches: 100,
        alreadyInstalled: true,
      })
    ).toEqual({ show: false, reason: "installed" });
  });

  it("dismissed always false", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        hostedCount: 5,
        previouslyDismissed: true,
      })
    ).toEqual({ show: false, reason: "dismissed" });
  });

  it("unsupported browser → false", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        hostedCount: 5,
        installSupported: false,
      })
    ).toEqual({ show: false, reason: "unsupported" });
  });

  it("dismiss wins over engaged", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        hostedCount: 10,
        previouslyDismissed: true,
      })
    ).toEqual({ show: false, reason: "dismissed" });
  });

  it("installed wins over dismissed", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        hostedCount: 10,
        previouslyDismissed: true,
        alreadyInstalled: true,
      })
    ).toEqual({ show: false, reason: "installed" });
  });

  it("INSTALL_DISMISS_KEY stable", () => {
    expect(INSTALL_DISMISS_KEY).toBe("cc.installPrompt.dismissed");
  });
});
