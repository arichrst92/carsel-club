import Image from "next/image";
import { requireUser } from "@/lib/auth/get-current-user";
import { logoutAction } from "@/app/actions/auth";

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-bg sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-icon.png"
            alt="Carsel Club"
            width={1024}
            height={1024}
            className="w-8 h-auto"
          />
          <span className="font-display font-bold text-base">Carsel Club</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs font-bold text-text-500 hover:text-accent-600 transition"
          >
            Logout
          </button>
        </form>
      </header>

      <main className="flex-1 flex flex-col gap-5 px-4 py-5">
        <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-5 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">
            Halo
          </p>
          <h2 className="text-white font-display text-xl mt-0.5">
            {user.displayName}
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Points" value={user.totalPoints} />
            <Stat label="Match" value={user.totalMatches} />
            <Stat label="Win" value={user.totalWins} />
          </div>
        </div>

        {/* Sessions CTA */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/sessions/new"
            className="rounded-2xl bg-primary-500 text-white p-4 shadow-fab hover:bg-primary-600 active:scale-[0.98] transition flex flex-col gap-2"
          >
            <div className="text-2xl">➕</div>
            <div className="font-display font-bold text-sm leading-tight">
              Buat Session
            </div>
            <div className="text-[11px] opacity-90 font-semibold">
              Mulai event padel
            </div>
          </a>
          <a
            href="/sessions"
            className="rounded-2xl bg-bg-card border border-border-light p-4 hover:border-primary-200 hover:shadow-card active:scale-[0.98] transition flex flex-col gap-2"
          >
            <div className="text-2xl">🎾</div>
            <div className="font-display font-bold text-sm text-text-900 leading-tight">
              My Sessions
            </div>
            <div className="text-[11px] text-text-500 font-semibold">
              Lihat session aktif
            </div>
          </a>
        </div>

        <details className="rounded-xl bg-bg-soft border border-border-light p-4 text-xs">
          <summary className="font-bold text-text-700 cursor-pointer">
            Debug: User data
          </summary>
          <pre className="mt-2 text-text-500 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-80 font-bold">
        {label}
      </div>
    </div>
  );
}
