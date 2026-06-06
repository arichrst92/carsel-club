import { describe, expect, it } from "vitest";
import {
  shouldShowInstallPrompt,
  INSTALL_DISMISS_KEY,
} from "@/lib/pwa/install-prompt";

const base = {
  alreadyInstalled: false,
  previouslyDismissed: false,
  installSupported: true,
};

describe("shouldShowInstallPrompt (Sprint 50: always-on, no engagement gate)", () => {
  it("eligible default → true", () => {
    expect(shouldShowInstallPrompt(base)).toEqual({
      show: true,
      reason: "eligible",
    });
  });

  it("already installed → false", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        alreadyInstalled: true,
      })
    ).toEqual({ show: false, reason: "installed" });
  });

  it("previously dismissed → false", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        previouslyDismissed: true,
      })
    ).toEqual({ show: false, reason: "dismissed" });
  });

  it("unsupported browser → false", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        installSupported: false,
      })
    ).toEqual({ show: false, reason: "unsupported" });
  });

  it("installed wins over dismissed", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        previouslyDismissed: true,
        alreadyInstalled: true,
      })
    ).toEqual({ show: false, reason: "installed" });
  });

  it("dismissed wins over unsupported (priority order)", () => {
    expect(
      shouldShowInstallPrompt({
        ...base,
        previouslyDismissed: true,
        installSupported: false,
      })
    ).toEqual({ show: false, reason: "dismissed" });
  });

  it("INSTALL_DISMISS_KEY stable", () => {
    expect(INSTALL_DISMISS_KEY).toBe("cc.installPrompt.dismissed");
  });
});
