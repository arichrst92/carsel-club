import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { BottomNav } from "@/components/nav/BottomNav";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  await requireUser();

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/home" className="back-btn" aria-label="Back">
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
        <h2 className="subscreen-title">Notifications</h2>
        <div style={{ width: 40 }} />
      </header>

      <main
        className="app-content"
        style={{ paddingBottom: "calc(var(--bottomnav-h) + var(--s-6))" }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "var(--s-8) var(--s-4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--s-3)",
          }}
        >
          <div
            style={{
              fontSize: 48,
              padding: "var(--s-4)",
              background: "var(--primary-50)",
              borderRadius: "var(--r-full)",
              width: 96,
              height: 96,
              display: "grid",
              placeItems: "center",
            }}
          >
            🔔
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-900)",
            }}
          >
            Notifications belum aktif
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-500)",
              fontWeight: 600,
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            Push notification + activity feed segera datang di v1.5. Untuk
            sekarang, semua notifikasi via WhatsApp invite link.
          </div>

          <div
            style={{
              marginTop: "var(--s-5)",
              padding: "var(--s-4)",
              background: "var(--bg-soft)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--r-lg)",
              fontSize: 12,
              color: "var(--text-700)",
              fontWeight: 600,
              maxWidth: 320,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: 8,
                color: "var(--primary-700)",
              }}
            >
              📌 Coming soon:
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <li>🎾 Invite session baru</li>
              <li>🏆 Tier up achievement</li>
              <li>⏰ Reminder 1 jam sebelum session</li>
              <li>📊 Match result update</li>
            </ul>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
