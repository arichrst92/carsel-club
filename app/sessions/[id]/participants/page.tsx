import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getSessionWithParticipants,
  isSessionStaff,
} from "@/lib/db/queries/sessions";
import { AddMemberSearch } from "@/components/sessions/AddMemberSearch";
import { AddGuestForm } from "@/components/sessions/AddGuestForm";

export const metadata = {
  title: "Tambah Pemain",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AddParticipantsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  const result = await getSessionWithParticipants(id);
  if (!result) notFound();

  if (!(await isSessionStaff(id, user.id))) {
    redirect(`/sessions/${id}`);
  }

  const { session, participants } = result;

  return (
    <div className="app-shell">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-bg sticky top-0 z-10">
        <Link
          href={`/sessions/${id}`}
          className="text-sm font-bold text-text-700 hover:text-primary-600"
        >
          ← Detail
        </Link>
        <h1 className="font-display font-bold text-base">Tambah Pemain</h1>
        <div className="w-12" />
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        <div className="rounded-xl bg-bg-soft border border-border-light p-3">
          <p className="text-xs text-text-500 font-semibold uppercase tracking-wide">
            Session
          </p>
          <p className="text-sm font-display font-bold text-text-900 mt-0.5">
            {session.title}
          </p>
          <p className="text-xs text-text-600 mt-0.5">
            {participants.length} pemain sudah join
          </p>
        </div>

        <Section
          title="Cari Member"
          subtitle="Member sudah punya akun Carsel Club (terdaftar via WA)"
        >
          <AddMemberSearch sessionId={id} />
        </Section>

        <Section
          title="Tambah Guest"
          subtitle="Pemain yang gak/belum punya akun. Cuma nama, gak tercatat lifetime stats."
        >
          <AddGuestForm sessionId={id} />
        </Section>

        <div className="pt-2">
          <Link
            href={`/sessions/${id}`}
            className="block w-full text-center py-3 rounded-xl bg-bg-card border border-border-light text-text-700 font-display font-bold text-sm hover:border-primary-200 transition"
          >
            Selesai — Kembali ke Detail
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-display font-bold text-text-900 mb-1">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-text-500 mb-3 leading-relaxed">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
