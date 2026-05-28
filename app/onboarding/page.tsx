import { requireUser } from "@/lib/auth/get-current-user";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export const metadata = {
  title: "Setup Profile",
};

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <div style={{ width: 40 }} />
        <h2 className="subscreen-title">Setup Profile</h2>
        <div style={{ width: 40 }} />
      </header>

      <OnboardingForm
        initialDisplayName={
          user.displayName?.startsWith("User ") ? "" : user.displayName
        }
        initialCity={user.city ?? ""}
      />
    </div>
  );
}
