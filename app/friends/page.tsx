import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { listFriendsForUser } from "@/lib/db/queries/friends";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { FriendRow } from "@/components/friends/FriendRow";

export const metadata = {
  title: "Friends",
};

export default async function FriendsPage() {
  const user = await requireUser();
  const friends = await listFriendsForUser(user.id);

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
        <h2 className="subscreen-title">Friends</h2>
        <div style={{ width: 40 }} />
      </header>

      <main className="app-content subscreen">
        <AddFriendForm />

        <section>
          <div className="section-head">
            <h3>Daftar Friends ({friends.length})</h3>
          </div>
          {friends.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">Belum ada friends</div>
              <div className="empty-state-text">
                Tambah teman padel kamu via nomor WhatsApp untuk easy invite ke
                session.
              </div>
            </div>
          ) : (
            <div className="player-list">
              {friends.map((f) => (
                <FriendRow
                  key={f.id}
                  friendId={f.id}
                  displayName={f.displayName}
                  city={f.city}
                  totalPoints={f.totalPoints}
                  totalMatches={f.totalMatches}
                  tierName={f.tierName}
                  avatarUrl={f.avatarUrl ?? null}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
