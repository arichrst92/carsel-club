import { describe, expect, it } from "vitest";
import {
  validateOnboardingInput,
  canAdvanceStep,
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_MAX,
  CITY_MAX,
  BIO_MAX,
} from "@/lib/auth/onboarding";

describe("validateOnboardingInput", () => {
  it("valid minimal input", () => {
    expect(
      validateOnboardingInput({
        displayName: "Ari",
        city: null,
        bio: null,
      })
    ).toEqual({ ok: true });
  });

  it("name too short", () => {
    const r = validateOnboardingInput({
      displayName: "A",
      city: null,
      bio: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("displayName");
  });

  it("name too long", () => {
    const r = validateOnboardingInput({
      displayName: "A".repeat(DISPLAY_NAME_MAX + 1),
      city: null,
      bio: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("displayName");
  });

  it("name at exact min/max boundaries ok", () => {
    expect(
      validateOnboardingInput({
        displayName: "A".repeat(DISPLAY_NAME_MIN),
        city: null,
        bio: null,
      })
    ).toEqual({ ok: true });
    expect(
      validateOnboardingInput({
        displayName: "A".repeat(DISPLAY_NAME_MAX),
        city: null,
        bio: null,
      })
    ).toEqual({ ok: true });
  });

  it("name trimmed before length check", () => {
    const r = validateOnboardingInput({
      displayName: "   A   ",
      city: null,
      bio: null,
    });
    expect(r.ok).toBe(false);
  });

  it("city too long", () => {
    const r = validateOnboardingInput({
      displayName: "Ari",
      city: "A".repeat(CITY_MAX + 1),
      bio: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("city");
  });

  it("city null ok", () => {
    expect(
      validateOnboardingInput({
        displayName: "Ari",
        city: null,
        bio: null,
      })
    ).toEqual({ ok: true });
  });

  it("bio too long", () => {
    const r = validateOnboardingInput({
      displayName: "Ari",
      city: null,
      bio: "A".repeat(BIO_MAX + 1),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("bio");
  });

  it("bio at max ok", () => {
    expect(
      validateOnboardingInput({
        displayName: "Ari",
        city: null,
        bio: "A".repeat(BIO_MAX),
      })
    ).toEqual({ ok: true });
  });

  it("all fields populated valid", () => {
    expect(
      validateOnboardingInput({
        displayName: "Ari Christian",
        city: "Bandung",
        bio: "Padel addict. Weekend warrior.",
      })
    ).toEqual({ ok: true });
  });
});

describe("canAdvanceStep", () => {
  it("step 1 requires valid name", () => {
    expect(
      canAdvanceStep({
        step: 1,
        displayName: "Ari",
        city: "",
        bio: "",
      })
    ).toEqual({ ok: true });
    const tooShort = canAdvanceStep({
      step: 1,
      displayName: "A",
      city: "",
      bio: "",
    });
    expect(tooShort.ok).toBe(false);
    if (!tooShort.ok) expect(tooShort.field).toBe("displayName");
  });

  it("step 1 name too long rejected", () => {
    const r = canAdvanceStep({
      step: 1,
      displayName: "A".repeat(DISPLAY_NAME_MAX + 1),
      city: "",
      bio: "",
    });
    expect(r.ok).toBe(false);
  });

  it("step 2 city + bio optional", () => {
    expect(
      canAdvanceStep({
        step: 2,
        displayName: "Ari",
        city: "",
        bio: "",
      })
    ).toEqual({ ok: true });
  });

  it("step 2 city overflow rejected", () => {
    const r = canAdvanceStep({
      step: 2,
      displayName: "Ari",
      city: "A".repeat(CITY_MAX + 1),
      bio: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("city");
  });

  it("step 2 bio overflow rejected", () => {
    const r = canAdvanceStep({
      step: 2,
      displayName: "Ari",
      city: "",
      bio: "A".repeat(BIO_MAX + 1),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.field).toBe("bio");
  });

  it("step 3 always advances", () => {
    expect(
      canAdvanceStep({
        step: 3,
        displayName: "",
        city: "",
        bio: "",
      })
    ).toEqual({ ok: true });
  });
});
