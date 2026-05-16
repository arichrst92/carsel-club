import Image from "next/image";
import { requireUser } from "@/lib/auth/get-current-user";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export const metadata = {
  title: "Lengkapi Profil",
};

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <main className="flex flex-1 flex-col items-center justify-start gap-6 px-6 py-10">
        <Image
          src="/logo-icon.png"
          alt="Carsel Club"
          width={1024}
          height={1024}
          priority
          className="w-16 h-auto select-none drop-shadow-sm"
        />

        <div className="text-center space-y-1">
          <h1 className="text-2xl">Halo, padel player! 🎾</h1>
          <p className="text-text-600 text-sm font-semibold">
            Sebentar — lengkapi profil dulu
          </p>
        </div>

        <OnboardingForm
          initialDisplayName={
            user.displayName?.startsWith("User ") ? "" : user.displayName
          }
          initialCity={user.city ?? ""}
        />
      </main>
    </div>
  );
}
