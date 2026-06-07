import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

export const metadata = {
  title: "Edit Profile",
};

export default async function EditProfilePage() {
  const user = await requireUser();
  const initial = (user.displayName.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/profile" className="back-btn" aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="subscreen-title">Ubah Profil</h2>
        <div style={{ width: 40 }} />
      </header>

      <AvatarUploader
        currentAvatarUrl={user.avatarUrl ?? null}
        initial={initial}
      />

      <EditProfileForm
        initialDisplayName={user.displayName}
        initialCity={user.city ?? ""}
        initialVisibility={user.profileVisibility}
      />
    </div>
  );
}
