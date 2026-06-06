/**
 * Pure validation helpers untuk onboarding (Sprint 39).
 *
 * Refs:
 * - DB: users.display_name + city + bio + onboarding_step
 * - Used by: completeOnboardingAction + OnboardingForm step gating
 */

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;
export const CITY_MAX = 50;
export const BIO_MAX = 200;

export type OnboardingInput = {
  displayName: string;
  city: string | null;
  bio: string | null;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string; field: "displayName" | "city" | "bio" };

export function validateOnboardingInput(
  input: OnboardingInput
): ValidationResult {
  const name = input.displayName.trim();
  if (name.length < DISPLAY_NAME_MIN) {
    return {
      ok: false,
      error: `Nama minimal ${DISPLAY_NAME_MIN} karakter`,
      field: "displayName",
    };
  }
  if (name.length > DISPLAY_NAME_MAX) {
    return {
      ok: false,
      error: `Nama maksimal ${DISPLAY_NAME_MAX} karakter`,
      field: "displayName",
    };
  }
  if (input.city !== null) {
    const c = input.city.trim();
    if (c.length > CITY_MAX) {
      return {
        ok: false,
        error: `Nama kota maksimal ${CITY_MAX} karakter`,
        field: "city",
      };
    }
  }
  if (input.bio !== null) {
    const b = input.bio.trim();
    if (b.length > BIO_MAX) {
      return {
        ok: false,
        error: `Bio maksimal ${BIO_MAX} karakter`,
        field: "bio",
      };
    }
  }
  return { ok: true };
}

/**
 * Step gating logic — given current step + form values, decide if user can
 * advance to next step. Pure: no side-effects, no DB.
 *
 * Steps:
 * 1. Name + avatar (avatar optional)
 * 2. City + bio (both optional)
 * 3. Welcome / review (always advance to submit)
 */
export type StepGateInput = {
  step: 1 | 2 | 3;
  displayName: string;
  city: string;
  bio: string;
};

export function canAdvanceStep(input: StepGateInput): ValidationResult {
  if (input.step === 1) {
    const name = input.displayName.trim();
    if (name.length < DISPLAY_NAME_MIN) {
      return {
        ok: false,
        error: `Nama minimal ${DISPLAY_NAME_MIN} karakter`,
        field: "displayName",
      };
    }
    if (name.length > DISPLAY_NAME_MAX) {
      return {
        ok: false,
        error: `Nama maksimal ${DISPLAY_NAME_MAX} karakter`,
        field: "displayName",
      };
    }
    return { ok: true };
  }
  if (input.step === 2) {
    if (input.city.trim().length > CITY_MAX) {
      return {
        ok: false,
        error: `Nama kota maksimal ${CITY_MAX} karakter`,
        field: "city",
      };
    }
    if (input.bio.trim().length > BIO_MAX) {
      return {
        ok: false,
        error: `Bio maksimal ${BIO_MAX} karakter`,
        field: "bio",
      };
    }
    return { ok: true };
  }
  // step 3 — always advance (final submit)
  return { ok: true };
}
