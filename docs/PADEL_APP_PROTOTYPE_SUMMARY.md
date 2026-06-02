# Carsel Club — Prototype Summary

**Tanggal:** 10 Mei 2026
**Status:** Prototype phase complete (28 screens lengkap)
**Tipe:** High-fidelity interactive HTML prototype, mobile-only (375–420px)
**Lokasi:** `/Users/idea/Library/CloudStorage/OneDrive-IDEAsia/Carsel Club/CarselClubPrototype/`

---

## 1. Overview

Setelah fase konsep selesai, prototype dibangun sebagai **clickable HTML prototype** untuk validasi UX & visual design sebelum masuk ke fase teknis (coding nyata). Total **28 screen** dengan navigasi end-to-end yang konsisten.

**Karakteristik prototype:**
- High-fidelity (mendekati final design, bukan wireframe abstrak)
- Mobile-only viewport (max-width 420px)
- Light Mode + Vibrant Tropical color palette
- Friendly rounded typography (Quicksand + Nunito)
- Plain HTML/CSS/JS — tidak butuh build tool, bisa di-open langsung di browser
- Single shared CSS file (`shared.css`) sebagai design system
- Mock data realistis dengan konteks Indonesia (nama, kota, lapangan)

---

## 2. Screen Catalog (28 screens)

### Auth & Onboarding (4)
| File | Description |
|---|---|
| `login.html` | Welcome screen, single CTA "Continue with WhatsApp" |
| `otp-verify.html` | Phone input → 6-digit OTP boxes (auto-advance, auto-submit, resend timer) |
| `onboarding.html` | 3-step wizard: Avatar+Name, City+Bio, Welcome celebration |
| `invite-landing.html` | Public landing dari WA invite link, dengan 3 CTAs (Sign up Member / Join as Guest / Login) |
| `guest-join.html` | Guest flow: nama input → confirmation → live-view |

### Main Tabs (5)
| File | Description |
|---|---|
| `index.html` | **Home** — tier card hero, quick actions, incoming session, stats grid, recent matches |
| `sessions.html` | **Sessions** — 3 tabs (Upcoming / Live / Past), date-block cards |
| `create-session.html` | **Create** (FAB) — 5-step wizard (Info, Lokasi, Court, Visibility, Review) |
| `leaderboard.html` | **Leaderboard** — global, your-position highlight, top 3 podium, sort tabs |
| `profile.html` | **Profile** — avatar+tier ring, tier journey, stats, achievements preview, settings list |

### Session Flow (4)
| File | Description |
|---|---|
| `session-detail.html` | Pre-Match Lobby — hero, players roster, match settings, sticky Generate Match |
| `generate-match.html` | Configure match generation: mode, round, who's playing, summary preview |
| `match-list.html` | Battle list per round — match cards dengan status (pending/live/done) |
| `match-scoring.html` | 3-state screen: Pending (Start Game), Live (timer + tap zones), Done (final banner) |

### Match-Related (3)
| File | Description |
|---|---|
| `session-leaderboard.html` | Live ranking saat session berjalan, sortable Point/WR/MP |
| `match-history.html` | Per-match list dengan insights, filter Win/Loss, date grouping |
| `match-detail.html` | Deep dive 1 match: hero with score, court visual, points earned, key stats, timeline |

### Sharing (1)
| File | Description |
|---|---|
| `live-view.html` | Public live view — branded, no auth, 2 courts visualisasi, top 3 preview, install banner |

### Profile Settings (5)
| File | Description |
|---|---|
| `friends.html` | Friends list — 3 tabs (Friends/Requests/Discover), search, per-row actions |
| `notification-settings.html` | Channel toggles (WA/Push/Email) + per-type prefs + Quiet Hours |
| `privacy-settings.html` | Profile visibility (radio), display toggles, friend req prefs, data & account |
| `help-support.html` | FAQ accordion, contact options (WA/Email/Feedback), legal links |
| `achievements.html` | 18 badges grouped per kategori, 3-state visual (Unlocked/Progress/Locked) |

### Modals/Auxiliary (3)
| File | Description |
|---|---|
| `add-player.html` | Modal: tabs Member/Guest, multi-select members, batch add guests |
| `notifications.html` | Notification center dengan filter, date-grouped, type-color icons |
| `empty-states.html` | Showcase 4 empty state variants (Home/Sessions/Match/LB) |

---

## 3. Design System

### Color Palette (Tropical)

| Role | Color | Hex |
|---|---|---|
| Primary (court turquoise) | Teal-500 | `#14B8A6` |
| Primary dark | Teal-700 | `#0F766E` |
| Accent (energy) | Coral / Rose-400 | `#FB7185` |
| Accent dark | Rose-500 | `#F43F5E` |
| Yellow accent | Yellow-400 | `#FACC15` |
| Sky | Sky-400 | `#38BDF8` |
| Success | Emerald-500 | `#10B981` |
| Warning | Amber-500 | `#F59E0B` |
| Danger | Red-500 | `#EF4444` |

**Tier Colors:** Rookie (slate) · Intermediate (lime) · Advanced (cyan) · Pro (purple) · Elite (pink) · Master (amber)

### Typography
- **Display** (heading): Quicksand 500/600/700 — friendly rounded
- **Body**: Nunito 400/600/700/800 — readable, high contrast

### Layout
- Mobile container: max 420px width
- Bottom navigation: 76px height
- Header: 60px height
- Border radius: 8/12/16/20/24px scale (sm to 2xl)
- Standard spacing: 4/8/12/16/20/24/32/40/48px

### Key Components Built
Buttons (primary lg/secondary lg/start game/whatsapp), Cards (tier/session/match/profile), Form Inputs (text, OTP, segmented, chips, stepper, toggle, radio), Lists (player, session, match, achievement, friend, notif, settings), Hero variants (tier, session, match-detail, live, achievement), Court visual (full + compact mini), Scoreboard (digital + court overlay), Padel court visual dengan denah & player positions, Empty states (hero illustration + checklist + actions).

---

## 4. User Flow Maps

### Auth Flow
```
Welcome (login.html)
    ↓ Continue with WhatsApp
OTP Verify (phone input → 6-digit boxes)
    ↓ Auto-submit when complete
Onboarding (3-step: Avatar+Name → City → Welcome)
    ↓ Mulai Main Padel!
Home (index.html)
```

### Invite Link Flow (dari WhatsApp)
```
WhatsApp link → Invite Landing (invite-landing.html)
    ├── Sign Up & Join Member → otp-verify → onboarding → home
    ├── Join as Guest → guest-join → confirmation → live-view
    ├── Login (existing) → login flow
    └── Decline → close
```

### Session Flow (Host journey)
```
Home/Sessions → Create Session (5-step wizard)
    ↓ Create
Session Detail (manage players, settings)
    ├── Tambah Pemain → Add Player Modal
    ├── Invite via WA → external WA share
    └── Generate Match → Generate Match (config)
        ↓ Generate
Match List (battle list)
    ↓ Pick a match
Match Scoring (Pending → Start Game → Live → End → Done)
    ↓ Back
Match List → Generate Extra Match → repeat
    ↓ All done → End Round Set
Session Detail → Foto group upload (post-match)
```

### Profile Flow
```
Profile (main tab)
    ├── Tier Journey (visual)
    ├── Stats Lengkap (4 cards)
    ├── Achievements preview → achievements.html
    ├── Recent Matches → match-history.html → match-detail.html
    ├── Share My Profile → image card share
    └── Settings
        ├── Friends → friends.html
        ├── Notifications → notification-settings.html
        ├── Privacy → privacy-settings.html
        ├── Help & Support → help-support.html
        └── Logout → login
```

---

## 5. Gap Analysis vs MVP v1 Scope

### ✅ Already Covered in Prototype
- Auth (WA OTP) + Onboarding
- Create Session (Americano + Freeplay only)
- Session Detail dengan pemain management
- Match Round Set (extra match mid-session)
- Auto Generate match
- Toggle host/co-host ikut main
- Score input strict (host/co-host)
- Sit-out rotation (implied di generate-match)
- 6 Tier system + Global Leaderboard (Point/WR/MP)
- Match History per match
- Live Match Sharing dengan denah lapangan + stats
- Profile basic + tier ring
- Profile sharing card placeholder
- Referral link (Profile → Invite Friends)
- Bottom nav 5 tab
- Notifications (in-app)
- Add Player (Member + Guest)
- Guest flow dari invite link
- Public/Private session flag (Public marked Soon)
- Image card share preview (placeholder action)
- Match end manual (host/co-host)
- No player count limit

### ⚠️ Visualized but Marked "Soon" in Prototype (v1.5+)
- Mexicano format (segmented option disabled)
- Tournament type (segmented option disabled)
- Manual drag-drop match generation (mode disabled)
- Public Session discovery / Find Session
- Regional leaderboard filter

### ❌ Not Yet Visualized (Need Future Iteration)
- **Foto group upload UI** — actual file upload mechanic + camera/gallery picker
- **Image card design final** — share card visual untuk match result, profile share, tier achievement
- **Onboarding details** — phone input field, address picker dropdown (cities full list)
- **Empty states for power-user scenarios** (failed network, error fallbacks)
- **Friend profile public view** — when other user's profile is shared
- **Sessions search/filter UI** — modal/sheet untuk advanced filter
- **Notification permission prompt** (browser-level)
- **PWA install prompt** banner

### 🔄 Beyond v1 (Roadmap reminders)
- v1.5: Mexicano, Tournament, Manual drag-drop, Edit AI result, Regional LB
- v2: Find Session, Auto-join/Approval, Friend list (deeper), Achievement badges (deeper)
- v3+: Fix Partners toggle, Advanced stats, QR code, Tournament bracket, Push notif, Native apps, Multi-language

---

## 6. Decisions Made During Prototyping

Beberapa keputusan/refinement yang muncul saat membangun prototype:

1. **Match-end is manual** — Tidak ada batas poin/waktu di create session. Host/co-host akhiri manual. _(Update concept doc)_
2. **No player count limit** — Hapus stepper "Target Pemain". Display jadi "X pemain" tanpa /Y. _(Update concept doc)_
3. **Public visibility = Soon (v2)** — Marked disabled dengan badge, sama seperti Mexicano/Tournament. _(Konsisten dengan MVP scoping)_
4. **Match List screen** — New abstraction antara Generate Match & Match Scoring. Battle list per round dengan status pending/live/done.
5. **Match Scoring 3 states** — Pending (Start Game) / Live (timer + scoring) / Done (final banner + nav).
6. **Auth WA only** — Hapus Email & Google login di v1, fokus WhatsApp untuk Indonesia.
7. **Guest join dari invite link** — Tambah opsi Guest tanpa akun, dengan komparasi Member vs Guest jelas.
8. **Tier ring di profile avatar** — Conic gradient menunjukkan progress, gimmick visual yang menarik.
9. **Match Round Set abstraksi** — Sudah implemented di prototype: 1 session bisa multiple round set, bisa generate extra mid-session.
10. **Score di tengah court visual** — Awalnya di pojok, pindah ke center antara players & net (lebih readable).

---

## 7. Tech Considerations Hasil dari Prototype

Dari prototype, beberapa tech requirement jadi lebih jelas:

### Frontend
- **Mobile-first responsive web** (PWA candidate)
- **State machine** untuk Match Scoring (Pending/Live/Done)
- **Real-time update** untuk Live View (polling atau WebSocket)
- **Image generation** untuk share card (Canvas API atau server-side render)
- **Form wizard** pattern (Create Session 5-step, Onboarding 3-step)
- **Modal/Sheet pattern** (Add Player)
- **Public routes tanpa auth** untuk live link, invite link, guest join

### Backend Concerns
- **Session-Match-Score data model** dengan Match Round Set abstraksi
- **Tier auto-promotion logic** saat threshold tercapai
- **Leaderboard caching** (global, regional)
- **Notification queue** (WA OTP + push)
- **WhatsApp integration** (OTP, invite link, share)
- **Photo upload & storage** untuk foto group + avatar
- **Public session ID generation** (short readable codes seperti `x7k2`)

### Algorithms
- **Match generator**: Random + avoid partner berulang dalam round set
- **Sit-out rotation**: Fairness algorithm (semua dapat jumlah sit-out yang sama)
- **Smart default round count** untuk Auto mode
- **Mexicano pairing** (v1.5): Per-round generation berdasarkan ranking saat itu

---

## 8. Recommended Next Steps

Setelah prototype phase ini selesai, transition ke **fase teknis** dengan urutan yang make sense:

### Phase 1: Tech Foundation (1-2 minggu)
1. **Tech stack decision** (framework, database, hosting)
2. **Data model & ERD** lengkap (User, Session, MatchRoundSet, Match, Score, Tier, Achievement, dll)
3. **Auth design** (WhatsApp OTP via Twilio/Whapi.cloud/dll)
4. **Project setup** (folder structure, code conventions, lint, deployment)

### Phase 2: Core Build — Backend First (3-4 minggu)
1. Database schema migrations
2. Auth + User CRUD
3. Session + Match CRUD
4. Match generator algorithm + sit-out rotation
5. Tier system + Leaderboard queries
6. WhatsApp integration (OTP + share)
7. Public routes (live, invite, guest)

### Phase 3: Frontend Implementation (3-4 minggu)
1. Convert prototype screens jadi component-based (React/Vue/Svelte)
2. Reuse `shared.css` design system yang sudah validated
3. Connect ke API backend
4. Real-time update (polling/WebSocket) untuk Live View & Match Scoring
5. Image generation untuk share card

### Phase 4: Polish & Closed Beta Launch (2-3 minggu)
1. Bug fixing dari testing internal
2. Analytics setup (PostHog / Plausible)
3. Error tracking (Sentry)
4. Deploy ke staging → production
5. Onboard first 10–20 users from circle padel

**Total estimated:** ~10–12 minggu untuk MVP v1 closed beta launch

---

## 9. Files Reference

**Workspace:** `/Users/idea/Library/CloudStorage/OneDrive-IDEAsia/Carsel Club/`

```
Carsel Club/
├── PADEL_APP_KONSEP.md (concept doc)
├── PADEL_APP_MVP_SCOPING.md (MVP roadmap)
├── PADEL_APP_PROTOTYPE_SUMMARY.md (this file)
└── CarselClubPrototype/
    ├── shared.css (design system, ~3000+ lines)
    ├── login.html
    ├── otp-verify.html
    ├── onboarding.html
    ├── invite-landing.html
    ├── guest-join.html
    ├── index.html (Home)
    ├── sessions.html
    ├── create-session.html
    ├── leaderboard.html
    ├── profile.html
    ├── session-detail.html
    ├── generate-match.html
    ├── match-list.html
    ├── match-scoring.html
    ├── session-leaderboard.html
    ├── match-history.html
    ├── match-detail.html
    ├── live-view.html
    ├── friends.html
    ├── notification-settings.html
    ├── privacy-settings.html
    ├── help-support.html
    ├── achievements.html
    ├── add-player.html
    ├── notifications.html
    ├── empty-states.html
    └── sitemap.html (demo navigator — to be created)
```

---

## 10. Apa yang Belum Diputuskan

Sebelum lanjut ke teknis, beberapa keputusan yang masih open dan perlu diskusi:

1. **Tech stack** — Next.js? Vue/Nuxt? Vanilla? Database? Hosting?
2. **WhatsApp OTP provider** — Twilio Verify? Whapi.cloud? Custom Bot? Cost analysis perlu.
3. **Storage** — Cloudflare R2? AWS S3? Vercel Blob? (untuk foto group, avatar)
4. **Real-time strategy** — Polling sederhana untuk MVP (cheap), atau WebSocket dari awal (better UX)
5. **Domain & branding final** — `carsel.club` confirm? Logo design final?
6. **Closed beta size** — Berapa user untuk validate? 10? 50?
7. **Monetization eventual** — Freemium? Premium host? Sponsorship? (tidak urgent, tapi worth thinking)

---

**Status:** Prototype phase **DONE**. Ready untuk Phase 1 (Tech Foundation) berikutnya.
