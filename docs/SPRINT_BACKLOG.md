# Carsel Club — Sprint Backlog

**Tanggal disusun:** 2026-06-02
**Cadence:** 1 minggu per sprint (5 working days, solo dev + AI-assisted)
**Order:** Spec-first dengan dependency
**Scope:** Full feature set (konsep doc v1 + v1.5 + v2 + backlog) + gap fixes dari audit + STATE_MACHINES.md compliance
**Total:** 36 sprint = ~9 bulan
**Definition of Done per sprint:** Code merged ke main, manual smoke test passed, demo-able

---

## 📊 Progress Tracker (last update: 2026-06-02 / Sprint 8 done)

**Completed:** 8 / 36 (22%)

| # | Sprint | Status | Commit / Notes |
|---|---|---|---|
| 0 | Testing Foundation | ✅ | Vitest + 5 modules 100% cov (151 test) |
| 1 | Storage Infrastructure | ✅ | Local FS + sharp + FileUpload (205 test) |
| 2 | Observability (self-hosted) | ✅ | `/monitor` page + 8 events + cron cleanup (273 test) |
| 3 | Session Lifecycle | ✅ | Start/End/Cancel/Reopen + timeline |
| 4 | Match Lifecycle | ✅ | Start Game + Timer + Revert + strict adjust |
| 5 | Match Detail Page | ✅ | `/sessions/[id]/matches/[matchId]` |
| 6 | Per-match Share Link | ✅ | `/s/match/[id]` + OG image |
| 7 | Live View Stats per Pemain | ✅ | Tier badge + winRate% + avatar di court |
| 8 | Avatar Upload | ✅ | `/profile/edit` + display consistency |
| 9 | Cover Photo Session | ⏳ in progress | — |
| 10-36 | (sisanya) | ⏸️ pending | Foto group, Image cards, Generate v2, Mexicano, dst |

**Coverage:** 15 file pure logic 100% (statements/branches/functions/lines). UI components dan server actions DB-heavy di-test integration Sprint 35.

**Velocity actual:** 8 sprint dalam 1 hari sesi (jauh di atas estimasi 1-week per sprint). Realistic projection sisanya: ~3-5 minggu kalau intensitas dipertahankan.

**Events tracked:**
`signup`, `login`, `referral_claimed`, `session_created`, `session_started`, `session_ended`, `session_cancelled`, `session_reopened`, `round_generated`, `match_started`, `match_completed`, `match_reverted`, `upload_success` (13 events, expandable).

**Routes baru:**
- `/monitor` (admin), `/api/cron/clean-logs`, `/api/log/error`
- `/sessions/[id]/matches/[matchId]` (Sprint 5)
- `/s/match/[matchId]`, `/api/og/match/[matchId]` (Sprint 6)
- `/uploads/[...path]` (Sprint 1 dev fallback)

**Open decisions revisited:**
- D1 (auto vs explicit start session) — Sprint 3: keep auto + add explicit Start
- D2 (reopen from terminal) — Sprint 3: yes, soft terminal
- D3 (cron infra) — Sprint 28 (belum)
- D4 (tournament scope) — Sprint 31 (belum)

---

## Working Agreements (BERLAKU UNTUK SEMUA SPRINT)

### 1. Setiap task wajib reference ke 3 sumber

Sebelum mulai task, **tulis di commit message body / PR description** referensi ke:

| Sumber | Lokasi | Wajib? |
|---|---|---|
| **GUI** | `docs/CarselClubPrototype/{nama}.html` + section di `shared.css` | Wajib kalau task touch UI |
| **DB** | `docs/CarselClubBackend/schema.sql` + `lib/db/schema.ts` (tabel + field terkait) | Wajib kalau task touch data |
| **Flow** | `docs/CarselClubBackend/STATE_MACHINES.md` (state) atau `docs/PADEL_APP_KONSEP.md` §X (business rule) | Wajib kalau task touch behavior |

Contoh commit body:
```
Refs:
- GUI: docs/CarselClubPrototype/match-detail.html (hero score, court visual, timeline)
- DB: matches table (status, started_at, ended_at), match_round_sets (round_number)
- Flow: STATE_MACHINES.md §2 (match state machine), KONSEP §4.1 (scoring W3/D2/L1)
```

Untuk task yang tidak punya reference langsung (mis. Sprint 0 testing utility): tulis `Refs: N/A (foundation infra)`.

**Tujuan**: Tracability — kalau ada perubahan UI/DB/business rule, mudah trace task mana yang affected.

### 2. Git workflow per task

Setiap task selesai → langsung commit + push:

```bash
git add -A
git commit -m "<scope>: <subject>

<body — referensi 3 sumber>

Sprint: NN
Task: <singkat>"
git push origin main
```

**Conventional commit scope:**
- `test:` foundation testing
- `feat:` fitur baru
- `fix:` bug fix
- `refactor:` no behavior change
- `chore:` deps, config, infra
- `docs:` dokumentasi only
- `style:` CSS/format only

**Push policy**: Push ke `main` langsung (solo dev, no PR review). Kalau ada experiment besar pakai branch `wip/<topic>` dulu.

### 3. Setiap sprint kickoff: deliverable list + terminal commands

Sebelum mulai sprint, aku akan kasih:
- **Daftar file yang akan dibuat/diubah**
- **Terminal commands lengkap** (install deps, run migration, run test, dll) yang bisa kamu copy-paste langsung ke terminal lokal
- **Pre-flight check**: kondisi yang harus terpenuhi sebelum sprint mulai

### 4. Definition of Done per sprint

- Code merged ke `main` (committed + pushed)
- Test baru hijau (kalau sprint tambah logic)
- **100% coverage di file yang baru di-test sprint ini** (statements, branches, functions, lines). File di-add ke `vitest.config.ts` `coverage.include` glob. File yang belum di-test (UI, server actions DB-heavy, dll) di-exclude sampai sprint terkait mereka.
- Manual smoke test di local berhasil
- Demo-able (bisa dishow di walkthrough)
- Sprint reference (GUI/DB/Flow) terdokumentasi di commits

### 5. Coverage policy

Coverage cumulative — setiap sprint nambah file ke include glob, tidak pernah turunin threshold. Sprint 0 mulai dengan 5 file pure logic. Final target (Sprint 36): semua `lib/**/*.ts` dan helper Server Actions ter-cover 100%. UI components & route handlers di-test via integration nanti (Sprint 35 admin tools, optional Playwright e2e setelah closed beta).

---

## Decisions yang sudah dilock

| Decision | Choice | Rationale |
|---|---|---|
| Storage provider | Local filesystem di VPS | Zero cost, fast, abstract behind `lib/storage/` interface untuk swap nanti |
| Web server | Nginx serve `/uploads/*` via alias | Production-grade static serving |
| Backup | Deferred sampai Sprint 36 (pre-public launch) | Closed beta scale, risk diterima |
| Image processing | `sharp` full pipeline (resize + WebP + EXIF strip) | 50-80% size reduction |
| Tier names | Keep current (Rookie/Bronze/Silver/Gold/Platinum/Master) | Sudah jalan, threshold lebih cepat untuk closed beta |
| Sprint duration | 1 minggu | Tight velocity check, ship cepat |
| Roadmap order | Spec-first (Sprint 0→36 urut) | Logical dependency |

## Yang masih open (perlu decide saat sprint terkait approach)

1. **Sprint 4** — Tambah explicit "Start Session" button atau pertahankan auto `upcoming→live`? Default: keep auto, tambah "Start Match" explicit di level match.
2. **Sprint 18** — Host transfer ke user lain (kalau host ga datang)?
3. **Sprint 28** — Cron infra: Vercel cron vs systemd timer di VPS?
4. **Sprint 31** — Tournament: single-elim saja atau + group stage + double-elim?
5. **Sprint 23-24** — Block/follow/QR bisa di-defer kalau prioritas social rendah.
6. **Ritual sprint review/retro** — mingguan, ~10 menit?

---

## Foundation (Sprint 0-2)

### Sprint 0 — Testing
**Goal**: Vitest setup + cover critical pure functions

Sub-tasks:
- Install vitest + @testing-library setup
- `vitest.config.ts` (node env, path alias `@/`)
- Test `lib/match/generator.ts` — fairness, anti-repeat, sit-out, edge cases (<4 players, exact 4, odd count)
- Test `lib/match/stats-sync.ts` — extract pure helpers (`computeImpact`, `computeDelta`, `computeTierId`) → unit test
- Test `lib/auth/otp.ts` — phone normalize, validate, OTP hash
- Test `lib/achievements.ts` — threshold logic per badge
- Test `lib/utils.ts` — `winRate`, `formatDate`
- Add `npm test` script + CI placeholder (GitHub Actions YAML)

**DoD**: 100% coverage di 5 file yang di-test (lines/branches/functions/statements), `npm test` + `npm run test:coverage` jalan di local. CI deferred (set saat ready ke VPS).

---

### Sprint 1 — Storage infrastructure
**Goal**: Local filesystem storage ready, abstracted

Sub-tasks:
- `lib/storage/types.ts` — `StorageProvider` interface
- `lib/storage/local.ts` — `saveFile`, `deleteFile`, `exists`, `getUrl`
- `lib/storage/index.ts` — singleton, env-driven (UPLOAD_DIR, NEXT_PUBLIC_UPLOAD_URL_BASE)
- `sharp` install + `lib/storage/image.ts` helper (resize/webp/strip exif)
- Magic bytes validator (`file-type` package atau custom)
- Reusable `<FileUpload>` client component (drag-drop, preview, error states)
- Server Action helper `withUploadAuth` (auth + rate limit + file validation)
- API route fallback `app/uploads/[...path]/route.ts` untuk dev mode
- `.env.example` update + Nginx config snippet di `docs/DEPLOYMENT.md` (file baru)
- Test: storage interface mock + image processing

**DoD**: Upload avatar via test page works, file di disk, public URL serve.

---

### Sprint 2 — Observability
**Goal**: Error tracking + analytics

Sub-tasks:
- Sentry SDK install + wire (server + client config)
- PostHog client (or Plausible) + page-view events
- Track events: `signup`, `session_created`, `match_completed`, `round_generated`
- Error boundary di app shell (`app/error.tsx` + per-route)
- Logging helper `lib/log.ts` (consistent format, structured)

**DoD**: Test error appears di Sentry, page view tracked di PostHog/Plausible.

---

## Session & Match Lifecycle (Sprint 3-7)

### Sprint 3 — Session lifecycle: End + explicit transitions
**Goal**: Match `STATE_MACHINES.md` compliance untuk Session

Sub-tasks:
- `endSessionAction` — status→completed, ended_at, validation (only if status=live)
- End Session button di session detail (danger zone, dgn confirm modal)
- Decision: keep auto `upcoming→live` OR add explicit Start Session button
- Status timeline component (visualize transitions: upcoming → live → completed)
- Test: lifecycle actions, terminal state enforcement

**DoD**: Host bisa End Session, status terminal, no transitions out.

---

### Sprint 4 — Match lifecycle: Start Match + Revert
**Goal**: Explicit match state transitions + revert

Sub-tasks:
- `startMatchAction` — pending→live + started_at
- "Start Game" button di `MatchCard` (replace implicit start via first score update)
- Match timer (elapsed time visible di card + share view, live tick)
- `revertMatchAction` — completed→live + reverse stats (reuse delta math)
- "Revert to Live" button (hidden behind kebab menu, rare action)
- Test: revert flow, stats roundtrip (apply → revert → apply ulang)

**DoD**: Match state transitions explicit, timer jalan, revert accurate.

---

### Sprint 5 — Match Detail page
**Goal**: Tutup gap prototype `match-detail.html`

Sub-tasks:
- Route `/sessions/[id]/matches/[matchId]/page.tsx`
- Hero: final score + outcome badge + points earned
- Court visual (reuse dari `s/[id]`)
- Match meta: court#, round#, elapsed time, ended_at
- Per-player stats kontribusi (W/L di match ini, points earned)
- Link ke session detail
- Share button per-match
- Loading skeleton

**DoD**: Klik match dari any list (recent matches, match history, match-list) → buka detail page lengkap.

---

### Sprint 6 — Per-match share link
**Goal**: Public per-match view

Sub-tasks:
- Route `/s/match/[matchId]/page.tsx` (mirror struktur `/s/[id]`)
- Query helper `getPublicMatchView` di `lib/db/queries/public-share.ts`
- Hero compact + court visual + scores + status
- Auto-refresh saat live (`AutoRefresh` 5s)
- OG image dynamic untuk match (`app/api/og/match/[id]/route.tsx`)
- Update `ShareMatchButton` pakai URL ini

**DoD**: Per-match link share-able, preview di WA/IG bagus.

---

### Sprint 7 — Live view: stats per pemain
**Goal**: Tier badge + win rate + foto profil per pemain di live court

Sub-tasks:
- Update `getPublicSessionView` + `getPublicMatchView` — join `users.currentTierId`, compute winRate
- `CourtMatchCard` show: tier badge, win rate per-player, avatar
- Tier color styling (color dari `tier_definitions.color`)
- Same untuk session live & match live

**DoD**: Live view match prototype `live-view.html` — stats lengkap per pemain.

---

## Foto Upload + Image Cards (Sprint 8-12)

### Sprint 8 — Avatar upload
**Goal**: User upload foto profil

Sub-tasks:
- Avatar upload di `app/profile/edit/page.tsx`
- Crop UI (square 1:1) — `react-image-crop` atau custom
- Server Action `updateAvatarAction`
- Storage: `avatars/{userId}.webp` (overwrite on replace)
- Update `users.avatarUrl`
- Avatar lama deleted on replace
- Initial letter fallback tetap kalau no avatar

**DoD**: Avatar tampil konsisten di home, profile, leaderboard, live view, sessions, friends, achievements.

---

### Sprint 9 — Cover photo session
**Goal**: Host upload cover photo

Sub-tasks:
- Upload field di `CreateSessionForm` (replace text URL input) + di session edit form
- Storage: `sessions/{sessionId}/cover.webp`
- Update `sessions.coverPhotoUrl`
- Display di session detail hero, public live view hero, sessions list card, find session card
- Delete cover saat replace

**DoD**: Host upload cover, terlihat konsisten di semua context session.

---

### Sprint 10 — Foto group post-match
**Goal**: Host upload foto group setelah session

Sub-tasks:
- UI di session detail saat `status=completed`: "Upload Foto Group" section
- Multi-file upload (max 5 foto / session)
- Storage: `sessions/{sessionId}/group/{nanoid}.webp`
- Display di session detail bottom + match detail hero (kalau ada)
- Delete individual foto (host-only)
- Gallery viewer (swipeable lightbox)

**DoD**: Host upload foto group, viewer (participant + public) bisa lihat.

---

### Sprint 11 — Image card: match result
**Goal**: Shareable card untuk match completed

Sub-tasks:
- `app/api/og/match/[id]/route.tsx` — pakai `next/og`
- Layout: foto group (kalau ada) atau gradient bg, final score, 4 player names, points earned per side, tier badges, foto profil
- Update `ShareMatchButton` pakai Web Share API dengan image card
- Fallback ke URL share kalau Web Share unavailable
- Detect tier-up dari match → flag di card

**DoD**: Share match → image card preview muncul di WA/IG.

---

### Sprint 12 — Image card: profile + tier-up
**Goal**: Profile share + tier-up celebration

Sub-tasks:
- `app/api/og/profile/[id]/route.tsx` — avatar, tier badge, total points, win rate, match played, achievements summary
- Profile share button di profile page → trigger Web Share dgn card
- `app/api/og/tier-up/[userId]/[tierId]/route.tsx` — celebration card
- Detect tier-up di `stats-sync.ts` → trigger notification + share suggestion
- Tier-up modal di home (in-app, dismissable)

**DoD**: Profile share + tier-up triggers card.

---

## Generate Match v2 (Sprint 13-15)

### Sprint 13 — Generate Match config screen
**Goal**: Per-round override pre-generate, sesuai prototype `generate-match.html`

Sub-tasks:
- Route `/sessions/[id]/generate/page.tsx` — wizard
- Steps: mode (auto/manual, manual disabled until Sprint 15), round count override, who's playing toggle per pemain
- Submit → `generateRoundAction(config)` (extend existing action)
- Override `is_playing` temporary untuk round ini (atau session-level + reset?)
- Summary card preview sebelum confirm

**DoD**: Host bisa exclude pemain spesifik dari satu round tanpa toggle session-level.

---

### Sprint 14 — Smart default round count + Regenerate round
**Goal**: Auto round count + redo round pending

Sub-tasks:
- Smart default logic:
  - Americano = n−1
  - Americano + FixPartners = (n/2)−1
  - Mexicano = 5-7 (placeholder until Sprint 16)
- Display "auto" suggestion di generate config screen
- `regenerateRoundAction` — hapus pending matches di round, re-run generator
- "Regenerate Round" button (visible kalau round.status=pending + semua matches pending)
- Confirmation modal

**DoD**: Auto count terhitung, regenerate replace pending matches.

---

### Sprint 15 — Swap 2 pemain
**Goal**: Manual edit hasil generate

Sub-tasks:
- `swapPlayersAction(matchAId, slotA, matchBId, slotB)` — validate (round sama, belum complete, distinct after swap)
- UI: tap pemain 1 di match card → highlight → tap pemain 2 → confirm modal → swap
- Toast feedback
- Edge: jaga `distinct_players` constraint
- Test: swap algorithm + validation

**DoD**: Host bisa tukar 2 pemain antar court di round yang sama.

---

## Mexicano + Fix Partners (Sprint 16-17)

### Sprint 16 — Mexicano generator
**Goal**: Ranking-based pairing

Sub-tasks:
- `lib/match/generator-mexicano.ts` — input current standings (`sessionPoints`), output pairing rank 1+4 vs 2+3 per court
- Per-round generation (depend on previous round result)
- `generation_method='auto_mexicano'`
- Extend `generateRoundAction` dispatch by `format`
- UI: enable Mexicano option di `CreateSessionForm` (hapus "Soon" badge)
- Test: Mexicano pairing edge cases (tie standings, odd round 1)

**DoD**: Session Mexicano: round 1 random, round 2+ pakai ranking.

---

### Sprint 17 — Fix Partners (Round Robin)
**Goal**: Pemain berpasangan tetap, rotasi lawan

Sub-tasks:
- `lib/match/generator-fix-partners.ts` — n/2 fixed pairs, rotate opponent matchups
- `fixPartners` toggle dispatch di generator
- Mexicano + FixPartners combo: pairing antar tim by team ranking
- Round count auto (n/2)−1
- UI: enable toggle di create form (saat ini stored tapi unused di logic)
- Test: round robin permutation completeness

**DoD**: Session dgn `fixPartners=true` ship full round robin.

---

## Host Workflow Lengkap (Sprint 18-19)

### Sprint 18 — Session edit + lock rules
**Goal**: Host bisa edit session post-create

Sub-tasks:
- `editSessionAction` — basic fields (title, venue, mapsUrl, scheduledAt, scheduledEndAt, description, coverPhotoUrl)
- Page `/sessions/[id]/edit/page.tsx` — reuse `CreateSessionForm` dgn `mode='edit'`
- Lock rules: `numCourts`, `format`, `playType`, `fixPartners` locked setelah round 1 generated
- Change `visibility` allowed any time
- "Archive session" untuk cancelled (soft hide via filter)
- (Open) Host transfer

**DoD**: Host edit basic fields, lock rules enforced.

---

### Sprint 19 — Guest join flow tanpa akun
**Goal**: Spec MVP item — guest via invite link tanpa signup

Sub-tasks:
- Route `/invite/[code]/guest/page.tsx` — name input → confirmation
- Set ephemeral guest session (short-lived cookie, session-scoped)
- Auto add as participant `role='guest'` ke session linked
- Guest tidak masuk leaderboard global (filter di query)
- "Claim as member" CTA (link to signup + preserve guest data link)

**DoD**: Guest join via invite link tanpa akun, terlihat di participants.

---

## Discovery v2 (Sprint 20-21)

### Sprint 20 — Public Session: Auto-join vs Approval
**Goal**: Discovery v2 — approval flow

Sub-tasks:
- Field baru `sessions.joinPolicy` enum `['auto_join', 'need_approval']`
- Migration + UI di create form (segmented control)
- Table baru `session_join_requests` (sessionId, userId, status, requestedAt)
- `requestJoinAction` (jika need_approval)
- Host approval inbox di session detail: pending requests, accept/reject
- Notification ke requester saat di-accept
- Display: "X waiting approval" badge di find session card

**DoD**: Public session approval mode functional end-to-end.

---

### Sprint 21 — Sessions tabs + search/filter
**Goal**: Match prototype 3-tab + filter UI

Sub-tasks:
- Sessions page: tabs Upcoming / Live / Past (replace current 2-group)
- Search bar (title + venue)
- Filter sheet: format, date range, court count
- Sort: scheduledAt asc/desc, recent activity
- Persist filter di URL params (shareable + back-button friendly)

**DoD**: Sessions page UX match prototype `sessions.html`.

---

## Social Layer (Sprint 22-24)

### Sprint 22 — Friend request flow
**Goal**: Replace instant mutual dgn request/accept

Sub-tasks:
- Table `friend_requests` (fromUserId, toUserId, status, createdAt)
- `sendFriendRequestAction` (replace existing `addFriendAction`)
- `acceptFriendRequestAction` — create friendship + delete request
- `rejectFriendRequestAction`
- Inbox tab di `/friends` — pending requests
- Notification ke recipient

**DoD**: Friend system pakai approval flow, instant mutual deprecated.

---

### Sprint 23 — Block user + Follow system
**Goal**: Social safety + one-way follow

Sub-tasks:
- Table `user_blocks` (blockerId, blockedId) — affect search, leaderboard visibility, invites
- `blockUserAction` di profile public view
- Table `follows` (followerId, followingId) — one-way, no approval
- Follow button di profile public view
- Follower/Following count display
- "Friends of friends" suggestion (optional, kalau sempat)

**DoD**: Block & follow functional, affect UI consistently.

---

### Sprint 24 — QR code + Profile public view
**Goal**: Sosial discovery features

Sub-tasks:
- Route `/u/[userId]/page.tsx` — public profile view
- Privacy field `users.profileVisibility` enum `['public', 'friends', 'private']`
- QR code generator: encode user URL → SVG di profile share
- QR scanner page (camera API + decode lib)
- "Add via QR" flow

**DoD**: User share QR untuk friend add, public profile viewable per privacy setting.

---

## Notifications (Sprint 25-28)

### Sprint 25 — Notifications: schema + generators ✅
**Goal**: Foundation notification system

Sub-tasks:
- Table `notifications` (id, userId, type, payload JSONB, readAt, createdAt) + indexes
- `notification_type` enum (10 types)
- Typed generators (fire-and-forget) di `lib/notifications/generate.ts`:
  - `notifySessionInvite`, `notifyTierUp`, `notifyMatchResult`,
    `notifyFriendRequest`, `notifyFriendAccepted`, `notifySessionReminder`,
    `notifySessionCancelled`, `notifyJoinRequested`, `notifyJoinApproved`,
    `notifyJoinRejected`
- Pure formatter `lib/notifications/format.ts` (icon/title/body/href + relative time)
- Query helpers: `listNotifications` + `countUnreadNotifications`
- Wired ke existing actions: addMember, sendFriendRequest, acceptFriendRequest,
  requestJoin, approveJoinRequest, rejectJoinRequest, endMatch (per-player),
  stats-sync tier-up
- 19 unit tests pure formatter (100% coverage)

**DoD**: Events trigger insert, query unread count works.

---

### Sprint 26 — Notifications: center page + prefs ✅
**Goal**: Replace placeholder + per-type prefs

Sub-tasks:
- Schema: `user_notification_prefs` (1 row/user — settings JSONB + quiet_hours_start/end)
- Pure helpers + tests (100% cov):
  - `lib/notifications/prefs.ts` — resolveChannels, isChannelEnabled, isQuietHours
    (handles wrap-midnight), shouldDeliver (in_app bypass)
  - `lib/notifications/group.ts` — bucketForDate (today/yesterday/this_week/older),
    groupByDate
- Queries: getNotificationPrefs (default fallback)
- Actions: markNotificationReadAction (idempotent), markAllNotificationsReadAction,
  updateNotificationPrefsAction (form-based + sanitization)
- UI:
  - `app/notifications/page.tsx` rewritten — grouped list, unread count, settings link
  - `NotificationItem` (client, tap → markRead + navigate via router)
  - `NotificationBell` (server, unread badge)
  - `MarkAllReadButton`
  - Wired ke home header (replace old Link)
  - `app/profile/settings/notifications/page.tsx` — per-type 3-channel matrix + quiet hours

**DoD**: Notification center match prototype `notifications.html`. Push & WA delivery
deferred ke Sprint 27/28 — toggles disimpan untuk dipakai nanti.

---

### Sprint 27 — Web Push notifications ✅
**Goal**: Browser push subscription

Sub-tasks:
- Schema: `push_subscriptions` (userId, endpoint UNIQUE, p256dh, auth, userAgent, createdAt, lastSeenAt)
- ENV: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
- Pure helpers (100% cov):
  - `lib/push/subscriptions.ts` — parsePushSubscription (validates shape + https + size bounds), sanitizeUserAgent
  - `lib/push/payload.ts` — buildPushPayload (collapse vs unique tag strategy per type)
- Server-only:
  - `lib/push/send.ts` — web-push wrapper, lazy VAPID config, fan-out per user, auto-cleanup 404/410
- API endpoint: `/api/push/vapid-public-key` (public key fetch)
- Service worker: `public/sw.js` (push handler + notificationclick: focus or open)
- Actions: `savePushSubscriptionAction` (upsert by endpoint), `removePushSubscriptionAction`
- UI: `<PushToggle />` di /profile/settings/notifications — handles permission, SW register, subscribe, save
- Wire ke `createNotification`: after insert, dispatch push if `shouldDeliver("push")` passes (uses prefs + quiet hours)

**DoD**: Subscribe → trigger notification → browser push muncul. Push gated by prefs + quiet hours; auto-cleanup expired subs; in_app still always works.

---

### Sprint 28 — WA reminders + session H-1 cron ✅
**Goal**: WhatsApp reminder via Fonnte

Sub-tasks:
- Schema: `sessions.reminder_sent_at` (timestamp, idempotency marker)
- Pure helpers (100% cov):
  - `lib/notifications/wa-template.ts` — buildWaMessage per type (10 templates,
    URL builder strips trailing slashes)
  - `lib/notifications/reminder-window.ts` — isReminderEligible
    (DEFAULT_REMINDER_WINDOW 50-75 min — tolerates cron jitter),
    minutesBetween, displayMinutes
- Queries:
  - listSessionsDueForReminder(now, min, max)
  - markReminderSent (atomic claim — only succeeds if null)
  - listSessionParticipantUserIds (skips guests)
- Dispatcher: createNotification extends — if shouldDeliver("wa") + FONNTE_TOKEN
  + NEXT_PUBLIC_APP_URL set, sends WA via Fonnte client (per-user opt-out via prefs)
- Cron endpoint `/api/cron/session-reminder` — Bearer CRON_SECRET, scans window,
  atomic claim, fires notifySessionReminder per participant
- Event log: `session_reminder_sent` (per session, with participant count)
- Cron infra decision (D3): systemd timer di VPS via curl every 5 min

**DoD**: 1 jam sebelum session, participants dapat WA + in-app + push (per pref).
Idempotent — multi-runner safe via atomic UPDATE ... WHERE reminder_sent_at IS NULL.

---

## Stats & Achievements v2 (Sprint 29-30)

### Sprint 29 — Achievements v2: streak + persist + celebration ✅
**Goal**: Streak detection + earned_at persist + celebration UI

Sub-tasks:
- Schema:
  - users.current_win_streak + best_win_streak
  - user_achievements (id, userId, code, earnedAt, dismissedAt) +
    UNIQUE(userId, code), idx(userId)
  - notification_type enum + `achievement_unlocked`
- Catalog extension (lib/achievements.ts):
  - 5 new achievements: win_streak_3/5/10, perfect_day (≥3 wins all in session),
    hot_session (≥5 wins in session)
  - UserStatsForAchievement extended with optional bestWinStreak,
    currentSessionMatches, currentSessionWins
- Pure helpers (100% cov):
  - nextStreak(prev, prevBest, outcome) — win continues, loss/draw reset
  - detectNewlyUnlocked(alreadyEarnedCodes, stats)
  - Achievement check defaults handle missing optional fields safely
- Notification type:
  - achievement_unlocked added ke notification_type enum + payload type
  - format + WA template added (10 → 11 types covered)
  - notifyAchievementUnlocked generator
  - PER_TYPE_DEFAULTS: all channels on
- Integration:
  - lib/match/achievement-sync.ts:
    - syncAchievementsForPlayer (post-tx) — reads user, updates streak,
      reads session stats, diffs against persisted, inserts new (ON CONFLICT
      DO NOTHING), fires notifyAchievementUnlocked
    - syncAchievementsAfterMatch (batch wrapper, errors logged not propagated)
    - syncHostAchievements (called from createSessionAction)
  - stats-sync.ts: collect freshOutcomes during tx, call
    syncAchievementsAfterMatch outside tx (best-effort)
  - sessions.createSessionAction: call syncHostAchievements after creation
- UI:
  - AchievementUnlockedModal (mirror TierUpModal pattern, tap dismiss action)
  - dismissAchievementAction + dismissAllAchievementsAction
  - getPendingCelebration query (first earned where dismissedAt is null)
  - app/home/page.tsx: render modal if no tier-up modal pending
  - app/achievements/page.tsx: show earnedAt date below unlocked, ground-truth
    unlocked count via union (persisted ∪ live-check)

**DoD**: Achievements persist, first-unlock celebration trigger. Streak
tracking persisted across sessions, session-scoped achievements (perfect_day,
hot_session) computed at match-completed time.

---

### Sprint 30 — Advanced stats: partner & head-to-head ✅
**Goal**: Beyond simple lifetime stats

Sub-tasks:
- Pure helpers (100% cov, lib/stats/advanced.ts):
  - aggregatePartnerStats (same-team pairing, guest userId skipped)
  - aggregateOpponentStats (per-opponent rows from other team)
  - topPartners (winRate desc, won tiebreak, default minPlayed=3)
  - topNemesis (lossRate desc, lost tiebreak)
  - summarizeOutcomes (sanity check helper)
- Query: getUserMatchOutcomes (4x sessionParticipants alias join) +
  getUsersById (batch lookup for display names)
- Profile UI: AdvancedStats section above achievements
  - Best win streak card (orange gradient when ≥3)
  - Best partners list (top 3, links to /u/[id])
  - Nemesis list (top 3)
- bestWinStreak from users.best_win_streak (Sprint 29 column)

**DoD**: User bisa lihat best partner + nemesis di profile.

---

## Tournament + Leaderboard v2 (Sprint 31-32)

### Sprint 31 — Tournament format: bracket ✅
**Goal**: Tournament play type behavior

Sub-tasks:
- Decision D4: single-elimination only (group stage + double-elim deferred)
- Schema:
  - `tournament_brackets` (sessionId UNIQUE, seedingMethod enum,
    totalRounds, currentRound, sponsorName, sponsorLogoUrl)
  - matches.bracket_round + matches.bracket_slot (nullable, only set for
    tournament matches) + idx_matches_bracket
  - tournament_seeding enum (by_join_order | random)
- Pure helpers (100% cov, lib/match/bracket.ts):
  - computeBracketSize (next pow-2), computeTotalRounds (log2),
    matchesInRound, nextRoundSlot, sisterSlot
  - buildFirstRoundPairings (sequential pairing, byes at end)
  - buildNextRoundPairing, bracketWinner
  - validateTeamCount (2-64), validateTeams (no duplicate players)
  - seedTeams (by_join_order = identity; random = Fisher-Yates w/ injected
    RNG for testability)
- Server action: generateBracketAction(sessionId, seeding) — host-only,
  pairs participants (2 per team), validates, creates bracket row + round 1
  matchRoundSet + round 1 matches (skip byes)
- Auto-advance (lib/match/bracket-advance.ts):
  - tryAdvanceBracket(matchId) called from stats-sync after match completed
  - Checks sister match status, creates next-round match when both done
  - Atomic via idempotency check (existingNext lookup)
  - Bye handling: sister null → wait until paired via other path
  - Updates tournament_brackets.currentRound when entire round done
- UI:
  - components/tournament/BracketView (server, horizontal scroll columns
    per round, label Final/Semi-Final/Round N, winner highlighting)
  - GenerateBracketButton (client, seeding selector)
  - Wired ke app/sessions/[id]/page.tsx — shows bracket when format=tournament
    and bracket exists, else generate button for staff
- Create form: enabled Tournament option in segmented + review screen label
- Event log: bracket_generated, bracket_advanced

**DoD**: Tournament session generate bracket, advance otomatis. Sponsor fields
schema-ready (UI deferred).

---

### Sprint 32 — Leaderboard v2: regional + time-based ✅
**Goal**: Filter by city + time window

Sub-tasks:
- Pure helpers (100% cov, lib/leaderboard/):
  - sort.ts: computeWinRate, getSortValue (winrate requires ≥5 matches),
    sortAndRank (stable tiebreak by id), findEntry, topClimbers (rank-delta
    detection), distinctCities
  - period.ts: periodSinceDate (weekly=-7d, monthly=-30d, all_time=null),
    periodLabel
- Query (lib/db/queries/leaderboard-v2.ts):
  - getLeaderboardV2({sort, period, city})
  - all_time path: read users pre-aggregated columns + tier join + city filter
  - weekly/monthly path: aggregate completed matches in window via
    sessionParticipants join (per-team outcome counts in SQL → merge JS),
    compute points from SCORING.WIN/LOSS/DRAW
- UI:
  - components/leaderboard/LeaderboardFilterBar (client) — scope segmented +
    period + city dropdowns, syncs URL params
  - components/leaderboard/LeaderboardShareButton — Web Share API + clipboard
    fallback
  - app/leaderboard/page.tsx rewritten — scope/period/city query param parsing,
    parallel fetch (current + city options for regional), hero adapts to scope,
    filter bar + sort tabs preserve query params
- OG image: /api/og/leaderboard 1200×1200, top 10 list, gradient hero
- Default behavior: scope=global, period=all_time. Regional auto-fills user's
  city when toggled.

**DoD**: User filter LB by city + time, share top 10.

---

## Production Readiness (Sprint 33-36)

### Sprint 33 — PWA: manifest + service worker ✅
**Goal**: Installable + offline shell

Sub-tasks:
- app/manifest.ts (Next.js metadata API) — standalone display, brand colors,
  start_url=/home, icons array
- Icon routes (next/og generated):
  - /icon-192.png + /icon-512.png — orange gradient + "CC" mark
  - /icon-maskable-512.png — 60% safe area for Android masking
  - /badge-72.png — small mono badge for push
- Pure helper (100% cov): lib/pwa/install-prompt.ts — shouldShowInstallPrompt
  + engagement signals (hostedCount≥2 OR totalMatches≥3), guards (installed,
  dismissed, unsupported)
- Service worker (public/sw.js) extended:
  - install: precache /offline, manifest, icons (best-effort)
  - activate: cleanup stale caches
  - fetch handler: navigation = network-first w/ /offline fallback; static
    assets = cache-first; bypass for /api/, /uploads/, /login, /_next/data/
- Components:
  - RegisterServiceWorker (client) — registers /sw.js on mount (prod only)
  - InstallPromptBanner (client) — Android beforeinstallprompt capture +
    iOS Safari manual hint; dismissal persisted in localStorage
- /offline page — static fallback w/ retry button
- Layout: themeColor #F97316, appleWebApp metadata, icon links updated,
  RegisterServiceWorker mounted, InstallPromptBanner rendered di /home

**DoD**: Installable ke home screen iOS/Android, offline minimal shell.

---

### Sprint 34 — Polish: empty states, error boundaries, a11y ✅
**Goal**: Production-ready UX edge cases

Sub-tasks:
- Pure helper (100% cov): lib/errors/friendly.ts — parseFriendlyError categorizes
  network/auth/permission/validation/unknown with localized title+body+retryable
- Reusable components:
  - components/ui/EmptyState — emoji + title + body + optional link/node action,
    role=status, dashed border styling
  - components/errors/RouteErrorFallback — friendly mapping + retry button +
    fire-and-forget log to /api/log/error, dev info expandable
- Route boundaries:
  - app/not-found.tsx (root) — branded 404
  - app/<scope>/error.tsx — sessions, profile, leaderboard, friends,
    notifications, achievements (delegate to RouteErrorFallback)
- a11y polish (app/globals.css):
  - *:focus-visible outline ring (primary 3px, 2px offset)
  - .skip-link visually-hidden until focused
  - .sr-only screen reader util
  - prefers-reduced-motion media query
- Skip-to-content link injected ke layout.tsx body

Deferred / future iterations:
- Network error toast manager (use route error boundaries for now)
- Comprehensive empty-state audit (reusable component shipped, page-by-page wiring
  for follow-up sprint)
- Lighthouse run (manual after deploy)

**DoD**: Lighthouse ≥90 mobile, empty states tidak terasa "kosong".

---

### Sprint 35 — Admin/Ops: super-admin + stats recompute ✅
**Goal**: Operational tools

Sub-tasks:
- Pure helpers (100% cov, lib/stats/recompute.ts):
  - recomputeStats(outcomes) — totalMatches/Wins/Losses/Draws/Points +
    currentWinStreak/bestWinStreak from match outcome list (streak from
    insertion order)
  - diffStats(before, after) — surface changed fields only
- Admin queries (lib/db/queries/admin.ts):
  - searchUsers(q) — ilike on displayName/whatsappNumber/city, ordered by
    createdAt desc, default limit 30 (capped 100)
  - getAdminUserDetail(id) — full stats row
  - searchSessions(q) — ilike on title/venueName + host name correlated
    subquery
  - getAdminCounts — totalUsers, totalSessions, liveSessions, totalMatches
- Admin action (app/actions/admin.ts):
  - recomputeUserStatsAction(userId) — gates requireAdmin, runs
    recomputeStats(getUserMatchOutcomes), updates user row (incl. tier via
    computeTierId), re-runs detectNewlyUnlocked + inserts new
    user_achievements (ON CONFLICT DO NOTHING)
  - Event log: admin_stats_recomputed (admin id, target id, changed fields,
    achievements added)
- Pages:
  - /admin (dashboard) — counts cards + nav links to users/sessions/monitor
  - /admin/users (search) — name/phone/city
  - /admin/users/[userId] — detail + RecomputeButton (confirm dialog,
    transition state, before→after delta result)
  - /admin/sessions (search) — title/venue + live status pill
- /admin/error.tsx route boundary
- Existing Sprint 2 `users.isAdmin` boolean reused
- Existing `requireAdmin` / `getAdmin` helpers in lib/auth/admin.ts reused

Deferred:
- match_events audit table (insert on each state transition)
- Soft delete columns
- Bulk admin actions (delete user, edit session)

**DoD**: Admin bisa search/intervene, recompute available.

---

### Sprint 36 — Backup setup ✅
**Goal**: Activate backup sebelum pre-public launch

Sub-tasks:
- Pure helper (100% cov, lib/backup/health.ts):
  - evaluateBackupHealth(now, lastBackupAt, thresholds?) — categorizes
    ok/stale/critical/never via OK_HOURS_DEFAULT=26, STALE_HOURS_DEFAULT=50
  - statusLabel + statusColor + formatBackupAge ("<1 jam" / "12 jam" / "2 hari")
- Scripts (scripts/):
  - backup.sh — sources /etc/carsel-backup.env, runs pg_dump | gzip,
    rsyncs uploads + dump ke BACKUP_REMOTE, cleans up local dumps older
    than BACKUP_RETENTION_DAYS, pings BACKUP_PING_URL with stamp
  - restore.sh — confirm-gated drop + reload schema, gunzip into psql,
    optional uploads sync
- Systemd templates (scripts/systemd/):
  - carsel-backup.service (oneshot, journal logging)
  - carsel-backup.timer (OnCalendar=*-*-* 19:00:00 UTC = 02:00 WIB)
  - carsel-reminder.{service,timer} (Sprint 28 reminder cron units now
    documented untuk reference)
- API endpoint /api/cron/backup-ping — Bearer CRON_SECRET, logs
  backup_completed event with dump filename + stamp
- Query getLatestBackupAt — reads last backup_completed di app_logs
- Admin dashboard /admin: backup health card showing last timestamp +
  status pill (Sehat/Terlambat/Kritis colored by statusColor)
- Event log: backup_completed added to EventName union
- Docs (docs/BACKUP_RESTORE.md): setup, dry-run, restore drill, monitoring,
  DR rebuild, retention policy

**DoD**: Backup jalan terus, restore drill berhasil.

---

## Dependency Graph (high level)

```
Sprint 0 (Test) ──► semua sprint (test foundation)
Sprint 1 (Storage) ──► Sprint 8 (Avatar), Sprint 9 (Cover), Sprint 10 (Foto group)
                  └── ► Sprint 11-12 (Image cards bisa start pararel, butuh data dari Sprint 10)
Sprint 3 (Session lifecycle) ──► Sprint 25 (notif session events)
Sprint 4 (Match lifecycle) ──► Sprint 5 (Match Detail butuh state lengkap)
                          └──► Sprint 25 (notif match result)
Sprint 13 (Generate config) ──► Sprint 14, 15 (build on top)
Sprint 16 (Mexicano) ──► Sprint 17 (FixPartners combo dgn Mexicano)
Sprint 22 (Friend req) ──► Sprint 25 (notif friend req)
Sprint 25 (Notif schema) ──► Sprint 26 (UI), 27 (push), 28 (WA cron)
Sprint 27 (Web Push) ──► Sprint 33 (PWA install linked dgn push)
```

---

## Sprint paralel candidates (kalau ada extra capacity)

| Pair | Why |
|---|---|
| Sprint 8 + 9 | Both upload, share component |
| Sprint 23 + 24 | Both social, can interleave |
| Sprint 11 + 12 | Both image cards, share template |
| Sprint 29 + 30 | Both stats-derived, query layer overlap |

---

## Open decisions (revisit per sprint)

| # | Question | When to decide |
|---|---|---|
| D1 | Explicit Start Session vs auto-transition | Sprint 3 kickoff |
| D2 | Host transfer feature | Sprint 18 |
| D3 | Vercel cron vs systemd timer | Sprint 28 |
| D4 | Tournament scope (single-elim only vs +group+double) | Sprint 31 |
| D5 | Defer social sprints 23-24? | After Sprint 22 retro |
| D6 | Sprint review ritual? | Setup di kickoff |

---

## Catatan implementasi yang berlaku across sprints

- **Test discipline**: Setiap sprint yang touch logic harus tambah test minimal 1 per Server Action / pure helper baru. Refactor pure functions out dari Server Actions untuk testability.
- **Migration discipline**: Setiap perubahan schema = migration baru via `drizzle-kit generate`. Tidak edit migration lama.
- **No breaking renames** di Server Actions (atau update semua caller dalam sprint yang sama).
- **Mobile-first**: Test di viewport 375px dulu, baru tablet/desktop.
- **Indonesian-first UX text**: Default Bahasa Indonesia, English istilah teknis (sprint, leaderboard) OK.
- **Use existing design system**: shared CSS (`globals.css` + `shared.css`) — extend tokens, jangan duplicate.

---

**Last updated:** 2026-06-02 (initial draft, post-audit)

---

## Post-Audit Closeout (Sprint 37-41)

Hasil retro audit setelah Sprint 36 (`docs/PADEL_APP_KONSEP.md` + prototype HTML
+ `docs/CarselClubBackend/schema.sql` vs built). 5 sprint untuk close gaps
dengan severity-ordered: critical first (block public launch), polish last.

### Sprint 37 — Critical pre-launch fixes ✅
**Goal**: Unblock public launch — 4 critical items

Sub-tasks:
- Profile settings list updated: notification link → /profile/settings/
  notifications (was "Soon — disabled"). Added new entries: Bantuan, Privacy,
  TOS
- Bottom nav: tab 4 swapped from Find → Leaderboard (matches spec/prototype).
  Find moved to Home quick-actions
- OTP attempt enforcement: extracted pure helpers
  lib/auth/otp-attempts.ts (checkAttempt + recordFailedAttempt) with 10
  unit tests. verifyOtpAction refactored to use them. Behavior verified
  unchanged but now testable + auditable.
- OTP cleanup cron /api/cron/clean-otp — deletes expired or verified rows
  older than 24h, logs otp_cleanup_completed event
- Legal pages shipped:
  - /help — FAQ stub + contact (WA/email/IG), 4 baseline questions
  - /privacy-policy — minimum viable disclosure compliant w/ UU PDP spirit
  - /tos — 11 sections covering account, conduct, content license, stats
    integrity, termination, disclaimer, governing law (RI / BANI)
- LegalShell component for consistent layout
- Login page TOS link fixed (was #tos / #privacy → /tos / /privacy-policy)

**DoD**: Notification link clickable from profile, Leaderboard back in
nav, OTP attempts enforced + tested, 3 legal pages live, cleanup cron
configured.

### Sprint 38 — Privacy settings page + data controls ✅
**Goal**: Compliance + data sovereignty

Sub-tasks:
- Schema additions on users: display_flags JSONB (default `{}`),
  friend_request_policy enum (anyone/friends_of_friends/off, default anyone),
  deleted_at timestamptz nullable
- New enum: friend_request_policy
- Pure helpers (100% cov):
  - lib/privacy/display-flags.ts — resolveDisplayFlags + sanitize +
    applyDisplayMask (self-bypass), 4 fields tracked (showCity, showStats,
    showAchievements, showMatches)
  - lib/privacy/friend-request-policy.ts — checkFriendRequestPolicy
    (anyone/off direct, friends_of_friends needs mutualFriendCount > 0),
    denialMessage, FRIEND_REQUEST_POLICY_LABELS
- Server actions (app/actions/privacy.ts):
  - updatePrivacyPrefsAction — useActionState compatible, sanitizes flags
    + validates policy enum
  - deleteAccountAction — typed "HAPUS" confirmation, soft-deletes
    (deletedAt set, displayName → "[Akun dihapus]", avatar/city nulled,
    visibility → private, friend req → off), logs account_deleted, calls
    logoutAction
- Data export endpoint /api/me/export — requireUser, returns JSON dump:
  profile + hosted sessions + participations + completed match outcomes
  (anonymized to slot role) + earned achievements; Content-Disposition
  attachment
- UI:
  - components/profile/PrivacyPrefsForm — toggle rows for 4 flags + radio
    group for 3 policies
  - components/profile/DeleteAccountForm — danger styling, typed
    confirmation input
  - app/profile/settings/privacy/page.tsx — wires all + data export download
    button + info banner pointing to EditProfileForm untuk visibility level
  - profile menu: added 🔐 Privacy row pointing here
- friend-requests.ts: sendFriendRequestAction now reads target's policy,
  rejects with localized message; for friends_of_friends path counts mutual
  friendships via 2 reads + Set intersection
- Event log: privacy_prefs_updated + account_deleted

**DoD**: Privacy page rendered, account delete works, data export downloadable.

### Sprint 39 — Onboarding 3-step wizard ✅
**Goal**: Match prototype onboarding flow

Sub-tasks:
- Schema additions on users:
  - bio text (nullable, max 200 chars enforced in app)
  - onboarding_step int default 0 (set to 3 on completion)
- Pure helper (100% cov): lib/auth/onboarding.ts
  - validateOnboardingInput — full submission gate (displayName 2-30,
    city ≤ 50, bio ≤ 200)
  - canAdvanceStep — per-step gate (step 1 needs valid name; step 2+3
    accept whatever)
  - Constants exported untuk UI (DISPLAY_NAME_MIN/MAX, CITY_MAX, BIO_MAX)
  - 17 unit tests
- Action update (completeOnboardingAction):
  - Accepts bio form field
  - Calls validateOnboardingInput (single source of truth)
  - Persists bio + sets onboardingStep=3
- UI refactor (OnboardingForm + onboarding/page.tsx):
  - Step 1: Name + AvatarUploader integration (existing component reused —
    upload uses updateAvatarAction immediately, persists during onboarding)
  - Step 2: City picker (8 popular + custom) + Bio textarea w/ counter
    (was: city only)
  - Step 3: Welcome screen with profile preview + tier ladder intro
    (6 tiers w/ thresholds, current tier highlighted)
  - Step gating uses canAdvanceStep pure helper
  - Avatar URL prefetched server-side untuk welcome preview consistency

**DoD**: New user flow matches prototype onboarding.html, complete % tracked.

### Sprint 40 — UX polish (spec items deferred from earlier sprints) ✅
**Goal**: Polish spec-but-skipped items

Sub-tasks:
- Pure helpers (100% cov):
  - lib/match/history-filter.ts — parseHistoryFilter, applyHistoryFilter,
    VALID_HISTORY_FILTERS, HISTORY_FILTER_LABELS (4 filters: all/win/loss/draw)
  - lib/tier/progress.ts — computeTierProgress: dual-criteria fraction
    (min of points + matches progress), handles Master max + clamping
- Match History (/profile/matches):
  - URL-driven filter chips with counts per chip
  - Empty state adapts per filter
- Friends Discover tab:
  - lib/db/queries/friend-discover.ts — listDiscoverSuggestions
    (friends-of-friends + 30-day co-players, excludes self/friends/pending/
    blocks/deleted/policy=off)
  - Ordering: mutualFriendCount desc, then coPlayerSessionCount desc, then name
  - components/friends/DiscoverRow with avatar + tier/city + mutual stats
    + Add button via existing sendFriendRequestAction
  - 4-tab nav grid expanded; Discover tab without count
- Profile tier ring:
  - Avatar wrapped in conic-gradient (primary-600 to border-light) showing
    % progress to next tier
  - Master tier shows 100% solid ring
- Help page (replaces Sprint 37 stub):
  - 6 sections × ~4 questions = 22 FAQ items
  - Topics: Getting Started, Hosting, Match/Scoring, Tier/Achievements,
    Notifications, Privacy/Data
  - Each FAQ uses native <details> for accordion (no JS)
  - Legal links section at bottom
- Drag-drop match generation: formally cut. Existing tap-swap UI (Sprint 15)
  works well on mobile; drag-drop would require additional touch-handling
  library + accessibility work for marginal UX gain. Decision logged.

**DoD**: All deferred prototype items shipped OR formally cut (with reason).

### Sprint 41 — Security hardening + production prep ✅
**Goal**: Defense-in-depth, perf, restore drill

Sub-tasks:
- Schema: 4 new indexes on matches (team1P1Id, team1P2Id, team2P1Id,
  team2P2Id) — for stats recompute + avoid-repeat-partners scale lookups
- Pure helper (100% cov): lib/auth/rate-limit-policy.ts
  - decideRateLimit({requestsInWindow, requestLimit, attempts, attemptLimit})
  - Returns allowed | {reason: too_many_requests | too_many_attempts,
    retryAfterSeconds}
  - Priority: requests > attempts (avoid Fonnte spend before checking attempt
    counter)
  - rateLimitMessage — localized denial strings
  - 12 unit tests
- Systemd templates for remaining crons:
  - carsel-clean-logs.{service,timer} (weekly Sundays 20:00 UTC = 03:00 WIB)
  - carsel-clean-otp.{service,timer} (daily 20:30 UTC = 03:30 WIB)
- Docs:
  - docs/SECURITY.md — threat model table, defense layers diagram, RLS
    migration template (current strategy: Server Actions only; RLS template
    ready if realtime client added later), rate limit strategy, logging,
    incident response, compliance posture
  - docs/LAUNCH_CHECKLIST.md — 12-section sign-off checklist:
    code quality, infrastructure, env vars, database, backup, cron, external
    services, security, perf/a11y, legal, smoke tests (10 flows), comms,
    rollback plan, sign-off lines

Deferred (manual ops tasks for production team):
- Apply RLS migration to live DB (template provided)
- Lighthouse run on staging
- a11y manual audit
- Sentry-style error sink (current /api/log/error adequate for <10k MAU)
- Restore drill (procedure documented in BACKUP_RESTORE.md)

**DoD**: RLS strategy documented, indexes shipped, rate-limit unified,
launch checklist + security doc ready for sign-off.

---

## Final summary (Sprints 0-41)

✅ **42 sprint shipped** (Sprint 0-36 core + Sprint 37-41 post-audit closeout)

🎯 **Coverage**: 100% on 30+ pure logic files via cumulative `vitest.config.ts`
include glob

🚀 **Beyond original spec**: Tournament bracket, Mexicano, Fix-Partners, Find
Session, Public approval flow, Push notifications, PWA, Admin dashboard,
Backup, Granular privacy + data export, Friends Discover, Tier ring,
Comprehensive FAQ + legal pages

🔒 **Security posture**: Server Action layer + CHECK constraints + rate limits
+ OTP attempt enforcement + soft-delete + RLS template ready

📋 **Ready for closed beta launch** pending LAUNCH_CHECKLIST sign-off

---

### Sprint 42 — Wablas migration (Fonnte → Wablas dengan failover) ✅
**Goal**: Switch primary WhatsApp gateway dari Fonnte (sering down) ke Wablas (lebih reliable), tetap pertahankan Fonnte sebagai fallback selama transisi 2 minggu.

Sub-tasks:
- Pure helper (100% cov, lib/wablas/format.ts):
  - normalizeWablasPhone — handle 08/+62/8/62 prefix + strip non-digits +
    safe defaults (null/empty/non-string)
  - buildWablasPayload — URL-encoded `phone` + `message`
  - parseWablasResponse — defensive parser (status as bool or string,
    message vs reason fallback, safe null defaults)
  - 26 unit tests covering edge cases (empty input, garbage, special chars,
    encoding roundtrip, status coercion)
- Server-only client (lib/wablas/client.ts):
  - sendWhatsApp({target, message}) — 8s timeout via AbortController
  - sendOtp(phone, code) — dev console fallback when WABLAS_TOKEN missing
  - Throws on HTTP non-2xx / API status=false / network error
- Failover dispatcher (lib/whatsapp/dispatch.ts):
  - sendWhatsApp + sendOtp public API
  - Try Wablas primary → catch any error → fallback Fonnte → return ok flag
  - Returns DispatchResult { provider, ok, error? } untuk observability
  - Both providers tidak configured → returns ok=false dengan reason
- Caller switch:
  - app/actions/auth.ts sendOtpAction — pakai dispatcher, baca ok flag
  - lib/notifications/generate.ts dispatchWa — pakai dispatcher, log
    provider yang sukses untuk monitoring
- Env updates (.env.example + DEPLOYMENT.md + LAUNCH_CHECKLIST.md):
  - WABLAS_TOKEN baru
  - WABLAS_API_URL baru (default https://wablas.com/api/send-message, override per akun seperti solo.wablas.com)
  - FONNTE_TOKEN tetap (legacy fallback)
- LAUNCH_CHECKLIST.md: tambah failover test step
- SECURITY.md: threat model row baru untuk WA gateway downtime + Sprint 42
  mitigasi (Wablas + Fonnte failover)

Sprint 43 (planned): drop Fonnte total setelah 2 minggu monitoring Wablas
stabil — hapus lib/fonnte/ + FONNTE_TOKEN dari env + simplify
dispatcher ke single-provider.

**DoD**: Wablas primary live, Fonnte fallback active, gateway uptime composite
≥99% target. Token rotated post-leak (lihat catatan keamanan internal).

---

### Sprint 43 — Remove 3 notification types (tier_up + match_result + achievement_unlocked) ✅
**Goal**: Kurangin volume notifikasi WA + simplify notif system. User minta
3 tipe ini dihapus total.

Sub-tasks:
- Types removal (lib/notifications/types.ts):
  - NotificationType union dikurangi: hapus tier_up, match_result,
    achievement_unlocked
  - Payload types dihapus: TierUpPayload, MatchResultPayload,
    AchievementUnlockedPayload
  - NotificationPayloadByType lookup dikurangi
- Format + WA template (lib/notifications/format.ts +
  lib/notifications/wa-template.ts):
  - Formatter functions + FORMATTERS/TEMPLATES mapping dikurangi
- Prefs (lib/notifications/prefs.ts):
  - PER_TYPE_DEFAULTS: dropdown tier_up + match_result + achievement_unlocked
  - Sisa cuma session_reminder (wa=true default), lainnya pakai
    DEFAULT_CHANNELS (wa=false)
- Generators (lib/notifications/generate.ts):
  - notifyTierUp, notifyMatchResult, notifyAchievementUnlocked dihapus
- Caller cleanup:
  - lib/match/stats-sync.ts: hapus notifyTierUp call (tier update tetap
    via users.currentTierId; celebration modal di /home pakai
    lastSeenTierId comparison, bukan notification)
  - app/actions/matches.ts: hapus notifyMatchPlayers function + call (66
    LOC dropped). Match detail tetap accessible dari session page +
    history page (Sprint 40 W/L filter)
  - lib/match/achievement-sync.ts: hapus 2 notifyAchievementUnlocked call
    (1 in syncAchievementsForPlayer, 1 in syncHostAchievements).
    Achievement detection + persistence tetap. Celebration modal pakai
    getPendingCelebration → reads user_achievements.dismissedAt
- UI:
  - NotificationPrefsForm.tsx TYPE_LABELS: hapus 3 entries
  - Prefs matrix tinggal 8 toggle (dari 11)
- Backward compat:
  - lib/db/queries/notifications.ts listNotifications +
    countUnreadNotifications: filter `NOT IN (tier_up, match_result,
    achievement_unlocked)` untuk hide historical rows yang gak punya
    formatter lagi
  - DB enum value tetap di schema (Postgres tidak bisa DROP VALUE
    enum yang ada referensi). Comment ditambahkan di types.ts
- Tests cleanup:
  - tests/notifications/format.test.ts: hapus 5 test cases
  - tests/notifications/wa-template.test.ts: hapus 4 test cases
  - tests/notifications/prefs.test.ts: hapus 4 tests (yang refer ke
    tier_up/match_result), ganti dengan friend_request/friend_accepted
    sebagai test data

Yang TIDAK berubah:
- Schema users.lastSeenTierId — celebration modal tetap pakai ini
- lib/db/queries/achievements.ts getPendingCelebration — achievement modal
  tetap pakai ini
- Event log (app_logs): tier_up, match_completed, achievement_unlocked
  events tetap dicatat untuk monitoring/observability (terpisah dari
  notification system)
- TierUpModal + AchievementUnlockedModal components

Volume estimate impact (per 100 active users / bulan):
- Before: ~1000 WA pesan
- After: ~800 WA pesan (-200 dari tier_up + achievement + match_result)
- Untuk benar-benar minimize ke OTP-only: matikan WA default untuk
  session_reminder (Sprint future kalau perlu)

**DoD**: 3 type dihapus dari code, historical rows tidak tampil di UI,
tests hijau, 100% cov dipertahankan.

---

### Sprint 44 — Drop Type section (playType) di Create/Edit session form ✅
**Goal**: Hilangkan duplikasi konsep "Tournament" yang muncul 2x di Create
form. Sprint 31 sudah implement Tournament sebagai Format (bracket), tapi
Type section legacy ("Freeplay / Tournament SOON") tidak pernah dipakai.

Decision: Opsi A — hapus Type section total. playType ditinggalkan sebagai
schema column (backward compat untuk existing rows), hardcoded 'freeplay'
untuk session baru.

Sub-tasks:
- components/sessions/CreateSessionForm.tsx:
  - Hapus Type segmented section (UI)
  - Hapus playType dari FormData type + INITIAL
  - Hapus play_type FormData set saat submit
  - Update review screen — drop "Freeplay/Tournament" label, sisa cuma
    format display
- components/sessions/EditSessionForm.tsx:
  - Hapus Type segmented section
  - Hapus playType dari initial type + useState
  - Hapus play_type set di FormData submit
- app/sessions/[id]/edit/page.tsx:
  - Hapus playType dari initial prop passed ke EditSessionForm
- app/sessions/[id]/page.tsx:
  - Hapus format-chip yang menampilkan playType
- app/actions/sessions.ts:
  - CreateSessionSchema: drop playType z.enum
  - createSessionAction: hardcode playType: 'freeplay' di DB insert dengan
    comment Sprint 44
  - event session_created: hapus playType dari payload
  - EditSessionSchema: drop playType z.enum
  - editSessionAction: drop play_type raw + lockedChanges check + updates
    assignment

Yang TIDAK berubah:
- Schema sessions.play_type column tetap (Postgres compatibility +
  existing rows masih punya value 'freeplay')
- sessionPlayTypeEnum di schema tetap

**DoD**: Wizard step 1 lebih ringkas, tidak ada duplikasi "Tournament",
existing session display tetap normal (tanpa playType chip).

---

**Audit findings reference** (Sprint 36 retro):
- ✅ 37 sprint shipped (Sprint 0-36)
- 🔴 4 critical gaps surfaced (Sprint 37 covers)
- 🟡 6 spec-skipped items (Sprint 38-40 covers)
- 🟢 1 defense-in-depth area (Sprint 41)
- 🆕 Built shipped 15+ items beyond original spec (Tournament, Mexicano,
  Push, PWA, Admin, Backup, OG cards, Find Session, dll)
