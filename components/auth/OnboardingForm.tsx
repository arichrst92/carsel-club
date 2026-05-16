"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeOnboardingAction,
  type AuthActionState,
} from "@/app/actions/auth";

type Props = {
  initialDisplayName?: string;
  initialCity?: string;
};

export function OnboardingForm({
  initialDisplayName = "",
  initialCity = "",
}: Props) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    completeOnboardingAction,
    null
  );

  return (
    <form action={formAction} className="w-full max-w-xs space-y-4">
      <div>
        <label
          htmlFor="display_name"
          className="block text-xs font-bold text-text-700 mb-2 uppercase tracking-wide"
        >
          Nama Tampil
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          autoFocus
          minLength={2}
          maxLength={30}
          defaultValue={initialDisplayName}
          placeholder="Misal: Ari Christian"
          className="w-full px-4 py-3 rounded-xl border border-border text-base bg-bg-card outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
        />
        <p className="mt-1.5 text-xs text-text-500">
          2-30 karakter. Bisa diubah nanti di Profile.
        </p>
      </div>

      <div>
        <label
          htmlFor="city"
          className="block text-xs font-bold text-text-700 mb-2 uppercase tracking-wide"
        >
          Kota <span className="text-text-400 lowercase">(opsional)</span>
        </label>
        <input
          id="city"
          name="city"
          type="text"
          maxLength={50}
          defaultValue={initialCity}
          placeholder="Jakarta"
          className="w-full px-4 py-3 rounded-xl border border-border text-base bg-bg-card outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
        />
        <p className="mt-1.5 text-xs text-text-500">
          Untuk regional leaderboard nanti.
        </p>
      </div>

      {state?.error && (
        <div className="px-3 py-2 rounded-lg bg-accent-50 border border-accent-100">
          <p className="text-xs text-accent-600 font-semibold">{state.error}</p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl bg-primary-500 text-white font-display font-bold text-base shadow-fab disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary-600 active:scale-[0.98] transition"
    >
      {pending ? "Menyimpan..." : "Mulai Main"}
    </button>
  );
}
