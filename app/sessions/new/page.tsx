import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { CreateSessionForm } from "@/components/sessions/CreateSessionForm";

export const metadata = {
  title: "Create Session",
};

export default async function NewSessionPage() {
  await requireUser();

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link
          href="/sessions"
          className="back-btn"
          aria-label="Back"
        >
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
        <h2 className="subscreen-title">Create Session</h2>
      </header>

      <CreateSessionForm />
    </div>
  );
}
