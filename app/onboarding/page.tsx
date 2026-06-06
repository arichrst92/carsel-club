import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export const metadata = {
  title: "Setup Profile",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  // Sprint 39: load bio + avatar fresh untuk prefill (e.g., user comes back
  // mid-onboarding via /onboarding URL)
  const [profile] = await db
    .select({
      bio: users.bio,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

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
        initialBio={profile?.bio ?? ""}
        initialAvatarUrl={profile?.avatarUrl ?? null}
      />
    </div>
  );
}
