import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { CreateSessionForm } from "@/components/sessions/CreateSessionForm";

export const metadata = {
  title: "Buat Session",
};

export default async function NewSessionPage() {
  await requireUser();

  return (
    <div className="app-shell">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-bg sticky top-0 z-10">
        <Link
          href="/sessions"
          className="text-sm font-bold text-text-700 hover:text-primary-600"
        >
          ← Batal
        </Link>
        <h1 className="font-display font-bold text-base">Session Baru</h1>
        <div className="w-12" /> {/* spacer for layout balance */}
      </header>

      <main className="flex-1 px-4 py-5">
        <CreateSessionForm />
      </main>
    </div>
  );
}
