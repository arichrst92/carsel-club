# Padel App — MVP Scoping & Roadmap

**Tanggal:** 9 Mei 2026
**Status:** MVP scope finalized
**Strategi Launch:** Phased / Beta tertutup → Polish → Open Public
**Target Timeline:** Tidak ada deadline (quality > speed)
**Resource:** Solo dev (AI-assisted)
**User Pertama:** Circle padel sendiri

---

## Kerangka MVP

**Core Value Loop (non-negotiable):**

> Host bikin session → undang pemain → main → input score → lihat leaderboard → selesai

Semua keputusan scoping mengacu pada loop ini sebagai fondasi.

---

## Filosofi Scoping

| Prinsip | Implikasi |
|---|---|
| Solo dev + AI | Lean fokus, hindari kompleksitas tinggi yang tidak penting |
| Closed beta circle | Forgiving audience — fungsi > polish |
| No deadline | Bisa invest di fondasi tech yang baik |
| Phased launch | MVP fokus core mechanics, growth features di v2 |

---

## MVP v1 — Closed Beta

**Tujuan:** Core loop bekerja end-to-end dengan layer sharing lengkap. Circle padel kamu bisa pakai untuk session real, sambil setiap session jadi mini-iklan organik via share.

### 1. Authentication

- Sign up + Login (email/WA OTP)
- Profile dasar (nama, avatar)

### 2. Session Management

- Create Session
  - Format: Americano only (Mexicano di v1.5)
  - Type: Freeplay only (Tournament di v1.5)
  - Single / Multi court (set jumlah)
  - Visibility: Private / Public flag (tapi Find Session belum aktif — ini di v2)
  - Set jumlah pemain awal (bisa bertambah hari H)
  - Lokasi & waktu
- Add players (member + guest by name)
- Invite via WhatsApp link (private session)
- Pemain bertambah mid-session

### 3. Match Mechanics

- Auto Generate match (random + hindari partner berulang)
- Toggle "Host ikut main?" + per co-host
- Sit-out rotation fair (algoritma equal sit-out)
- Co-host management (sama persis dgn host, unlimited)
- Match Round Set — create extra match mid-session dengan setting baru
- Smart default round count (n−1 untuk Americano), bisa override manual

### 4. Scoring

- Score input (host/co-host strict, pemain read-only)
- Live update session leaderboard
- Match outcome → point auto-allocate (Win 3 / Loss 1 / Draw 2)

### 5. Live Match Sharing (LENGKAP)

- Public web link (no auth needed untuk viewer)
- Per match link + per session link (dua scope)
- View menampilkan:
  - Live score
  - Nama pemain
  - **Denah lapangan visual** (posisi 4 pemain)
  - **Stats** (tier badge, win rate, foto profil)
- Auto-refresh real-time

### 6. Post-Match Sharing (LENGKAP)

- Foto group upload (host-only)
- Image card auto-generate berisi:
  - Foto group
  - Leaderboard final
  - Tier achievement (kalau ada tier-up)
- Native Share API → langsung share ke WA / IG Story / app pilihan

### 7. Profile

- Basic profile lengkap dgn:
  - Nama, avatar
  - Tier badge + progress bar ke tier berikutnya
  - Total Point | Win Rate | Match Played
- Profile sharing — image card lengkap (avatar, tier, stats, achievements)
- Match History (list session + role + result)

### 8. Tier System

- 6 tier (Rookie → Master)
- Auto-promote saat threshold (Point + Match Minimum) tercapai
- Tidak ada relegation
- Visual badge di profile, leaderboard, live view

### 9. Leaderboard Global

- 3 kolom: Point | Win Rate | Match Played
- Sortable by salah satu kolom
- Filter dasar: All-time

### 10. Growth Hook

- Referral link ("Invite to App") — generic invite untuk join komunitas

### 11. UI Shell

- Bottom navigation 5 tab:
  - Home (incoming session, quick actions, tier progress)
  - Sessions (My Sessions, Match History)
  - Create (FAB tengah)
  - Leaderboard (global)
  - Profile

### Tidak Masuk MVP v1 (Penting Diingat)

- ❌ Mexicano format
- ❌ Tournament type
- ❌ Manual drag-drop match generation
- ❌ Find Session (public discovery, search, filter)
- ❌ Public session Auto-join / Need Approval
- ❌ Regional leaderboard (filter kota)
- ❌ Friend list / Follow system
- ❌ Achievement badges (selain tier)
- ❌ Fix Partners toggle (Round Robin)
- ❌ Advanced stats (best streak, partner stats, head-to-head)
- ❌ QR code untuk add friend
- ❌ Notification system (push/email)
- ❌ Tournament bracket

---

## MVP v1.5 — Pre-Public Polish

**Tujuan:** Polish & tambahan format sebelum dibuka ke beta yang lebih luas.

| Kategori | Fitur |
|---|---|
| **Format** | Mexicano (dengan ranking-based pairing per round) |
| **Format** | Tournament type (bobot point sama) |
| **Match** | Manual drag-drop match generation |
| **Match** | Edit hasil Auto Generate (swap pemain) |
| **Leaderboard** | Regional leaderboard (filter by kota) |

### Kapan Pindah dari v1 ke v1.5?

Indikator readiness:
- Circle pakai aktif > 2 bulan tanpa bug major
- Match generator algoritma sudah validated dengan banyak edge case
- Live link sudah dipakai dan reliable
- Image card design sudah dipoles

---

## MVP v2 — Public Open

**Tujuan:** Siap untuk user di luar jaringan kamu. Growth & discovery layer aktif.

| Kategori | Fitur |
|---|---|
| **Discovery** | Find Session (public, search/filter by kota/tanggal) |
| **Discovery** | Public Session — Auto-join / Need Approval flow |
| **Social** | Friend list / Follow system |
| **Social** | Achievement badges (beyond tier — "10 wins streak", "First tournament", dst) |

### Kapan Pindah dari v1.5 ke v2?

Indikator readiness:
- Closed beta merasa MVP sudah solid
- Sudah ada brand identity (nama, logo, tone)
- Sudah ada strategi marketing/onboarding untuk user baru
- Tech stack siap untuk scale (caching, monitoring)

---

## Backlog (Belum Prioritas)

Fitur yang tetap di konsep tapi tidak masuk roadmap awal. Akan di-prioritize ulang setelah ada data:

- Fix Partners toggle (Round Robin behavior)
- Advanced stats (best streak, partner stats, head-to-head)
- QR code untuk add friend
- Tournament khusus dengan bracket
- Notification system (push/email)
- Sponsorship / Branded Tournament
- Multi-language (kalau perlu English)
- Native mobile app (iOS/Android)

---

## Effort Estimation (Rough)

Untuk solo dev AI-assisted, estimasi kasar:

| Fase | Effort | Catatan |
|---|---|---|
| Setup tech stack + auth + data model | 1–2 minggu | Fondasi |
| MVP v1 core (Session, Match, Score) | 3–4 minggu | Heart of product |
| MVP v1 sharing (Live link, Image card, Profile share) | 2–3 minggu | Complexity tinggi |
| MVP v1 polish + closed beta launch | 1–2 minggu | Bug fixing, UX polish |
| **Total MVP v1** | **~7–11 minggu** | Bisa lebih cepat dgn AI-assist agresif |
| MVP v1.5 | 3–4 minggu | After validation |
| MVP v2 | 4–6 minggu | Growth layer |

*Catatan: estimasi sangat tergantung kompleksitas tech stack pilihan, data model, dan AI tooling.*

---

## Critical Path / Dependencies

Urutan pengembangan yang make sense:

1. **Tech stack & arsitektur** (framework, DB, hosting)
2. **Data model & schema** (User, Session, MatchRoundSet, Match, Score, Tier, dll)
3. **Auth + Profile basic**
4. **Session create + Player management**
5. **Match generator algorithm** ⚠️ critical, butuh testing extensive
6. **Score input + Session leaderboard**
7. **Tier system + Global leaderboard + Match History**
8. **Live Match Sharing** (denah, stats, public web)
9. **Image card generator + Native Share**
10. **Foto group upload + post-match flow**
11. **Profile sharing card**
12. **Referral link**
13. **UI polish + closed beta release**

---

## Yang Perlu Diputuskan Berikutnya

Setelah MVP scope ini disetujui, fase berikutnya:

1. **Tech stack pilih**: Next.js? Vue/Nuxt? Vanilla? Database (Postgres/MongoDB/Supabase)? Hosting?
2. **Auth method**: Email/password? WA OTP? Social login? (untuk MVP v1)
3. **Data model design**: ERD lengkap untuk semua entity
4. **Wireframe key screens**: Create Session, Match Score (dgn lapangan), Live View, Profile, Leaderboard
5. **Branding ringan**: nama app + warna identitas (cukup untuk closed beta, polish nanti)
