import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { listMySessions } from "@/lib/db/queries/sessions";
import { SessionCard } from "@/components/sessions/SessionCard";

export const metadata = {
  title: "My Sessions",
};

export default async function SessionsPage() {
  const user = await requireUser();
  const allSessions = await listMySessions(user.id);

  // Split: active (upcoming, live) vs done (completed, cancelled)
  const active = allSessions.filter(
    (s) => s.status === "upcoming" || s.status === "live"
  );
  const done = allSessions.filter(
    (s) => s.status === "completed" || s.status === "cancelled"
  );

  return (
    <div className="app-shell">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-bg sticky top-0 z-10">
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/logo-icon.png"
            alt="Carsel Club"
            width={1024}
            height={1024}
            className="w-8 h-auto"
          />
          <span className="font-display font-bold text-base">Sessions</span>
        </Link>
        <Link
          href="/sessions/new"
          className="px-3 py-1.5 rounded-full bg-primary-500 text-white text-xs font-bold shadow-fab hover:bg-primary-600 transition"
        >
          + Baru
        </Link>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {allSessions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {active.length > 0 && (
              <Section title="Aktif">
                <div className="space-y-3">
                  {active.map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </div>
              </Section>
            )}

            {done.length > 0 && (
              <Section title="Selesai">
                <div className="space-y-3">
                  {done.map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-display font-bold text-text-900 mb-3 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="text-5xl">🎾</div>
      <div>
        <h3 className="font-display font-bold text-lg">Belum ada session</h3>
        <p className="text-sm text-text-500 mt-1 max-w-xs mx-auto">
          Buat session pertama kamu dan undang teman lewat WhatsApp.
        </p>
      </div>
      <Link
        href="/sessions/new"
        className="inline-block px-5 py-2.5 rounded-full bg-primary-500 text-white font-display font-bold text-sm shadow-fab hover:bg-primary-600 transition"
      >
        Buat Session Pertama
      </Link>
    </div>
  );
}
