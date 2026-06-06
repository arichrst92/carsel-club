import Link from "next/link";
import { requireUser } from "@/lib/auth/get-current-user";
import { listFriendsForUser } from "@/lib/db/queries/friends";
import {
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
} from "@/lib/db/queries/friend-requests";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { FriendRow } from "@/components/friends/FriendRow";
import { FriendRequestRowItem } from "@/components/friends/FriendRequestRow";

export const metadata = { title: "Friends" };

type SearchParams = { tab?: string };
type FriendTab = "friends" | "incoming" | "outgoing";

function parseTab(v: string | undefined): FriendTab {
  if (v === "incoming" || v === "outgoing") return v;
  return "friends";
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const [friends, incoming, outgoing] = await Promise.all([
    listFriendsForUser(user.id),
    listIncomingFriendRequests(user.id),
    listOutgoingFriendRequests(user.id),
  ]);
  const params = await searchParams;
  const tab = parseTab(params.tab);

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

        {/* Tab bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            marginBottom: "var(--s-3)",
          }}
        >
          <TabLink
            href="/friends?tab=friends"
            label="Friends"
            count={friends.length}
            active={tab === "friends"}
          />
          <TabLink
            href="/friends?tab=incoming"
            label="Incoming"
            count={incoming.length}
            active={tab === "incoming"}
            highlight={incoming.length > 0}
          />
          <TabLink
            href="/friends?tab=outgoing"
            label="Outgoing"
            count={outgoing.length}
            active={tab === "outgoing"}
          />
        </div>

        {tab === "friends" && (
          <section>
            <div className="section-head">
              <h3>Daftar Friends ({friends.length})</h3>
            </div>
            {friends.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">Belum ada friends</div>
                <div className="empty-state-text">
                  Search & kirim request via nomor WhatsApp di atas.
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
        )}

        {tab === "incoming" && (
          <section>
            <div className="section-head">
              <h3>Incoming Requests ({incoming.length})</h3>
            </div>
            {incoming.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">
                  Tidak ada incoming request
                </div>
                <div className="empty-state-text">
                  Request masuk akan muncul di sini.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {incoming.map((r) => (
                  <FriendRequestRowItem
                    key={r.id}
                    row={r}
                    direction="incoming"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "outgoing" && (
          <section>
            <div className="section-head">
              <h3>Outgoing Requests ({outgoing.length})</h3>
            </div>
            {outgoing.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📤</div>
                <div className="empty-state-title">
                  Tidak ada outgoing request
                </div>
                <div className="empty-state-text">
                  Request yang kamu kirim akan muncul di sini.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {outgoing.map((r) => (
                  <FriendRequestRowItem
                    key={r.id}
                    row={r}
                    direction="outgoing"
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function TabLink({
  href,
  label,
  count,
  active,
  highlight,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "10px 8px",
        background: active ? "var(--primary)" : "var(--bg)",
        color: active ? "#fff" : "var(--text-700)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border-light)"}`,
        borderRadius: "var(--r-md)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 12,
        textDecoration: "none",
        position: "relative",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 10, opacity: 0.85 }}>{count}</span>
      {highlight && !active && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
          }}
        />
      )}
    </Link>
  );
}
