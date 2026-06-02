# Padel App — Dokumen Konsep Produk

**Tanggal:** 9 Mei 2026
**Status:** Konseptual (sebelum fase teknis)
**Owner:** Ari Christian (arichrst@ide.asia)

---

## 1. Positioning & Visi Produk

**Tagline:** *All-in-one tool dari pre-match sampai post-match share untuk komunitas padel Indonesia.*

| Aspek | Keputusan |
|---|---|
| **Target user utama** | Host / Organizer (host-first) |
| **Pemain & komunitas** | Datang sebagai konsekuensi dari host yang aktif |
| **Skala komunitas** | Open community nasional Indonesia |
| **Pemilik venue** | TIDAK jadi user (venue diisi manual oleh host) |
| **Platform awal** | Website mobile-responsive (full mobile UI dengan bottom navigation) |

**Retention metric utama:** Jumlah host yang membuat session berulang.

**Differentiator:** Coverage lengkap end-to-end (pre-match → match → post-match), berbeda dari kompetitor yang biasanya hanya cover sebagian flow.

---

## 2. Format Permainan

### 2.1 Mode

| Mode | Deskripsi |
|---|---|
| **Americano** | Partner & lawan rotate setiap round. Goal: semua pemain main bareng/lawan semua. |
| **Mexicano** | Round 1 acak, Round 2+ pairing berdasarkan ranking saat itu (rank 1+4 vs 2+3). |

**Hanya 2 format yang didukung di MVP.** Tidak ada Round Robin sebagai format terpisah.

### 2.2 Toggle "Fix Partners" (All Fix Pairs)

- Toggle dalam Americano/Mexicano untuk Round Robin behavior
- Saat ON: semua pemain berpasangan tetap, hanya rotasi lawan
- Mexicano + Fix Partners: pairing antar tim berdasarkan ranking tim saat itu

### 2.3 Konfigurasi Saat Create Session

Host pilih saat create session:
- Mode: Americano / Mexicano
- Type: Freeplay / Tournament (bobot point sama)
- Single court / Multi court (set jumlah)
- Visibility: Private (invite-only) / Public (discoverable)
- Untuk Public: Auto-join atau Need Approval

**Catatan penting:**
- **Tidak ada batas jumlah pemain** di session maupun match. Pemain bisa bertambah kapan saja (sebelum atau saat session berjalan).
- **Match TIDAK punya batas poin/waktu.** Host atau co-host memutuskan kapan match berakhir saat scoring (klik "End Match"). Tidak ada target poin/durasi yang di-set saat create session.

### 2.4 Pemain Ganjil

**Sit-out rotation** — pemain yang istirahat bergiliran. Algoritma harus fair (semua pemain dapat jumlah sit-out yang sama).

### 2.5 Pemain Bertambah Hari H

- Pemain bisa di-add mid-session
- Match generator harus bisa include mereka di round selanjutnya
- Sit-out rotation tetap fair

---

## 3. Match Generation

### 3.1 Mode Generate

| Mode | Deskripsi |
|---|---|
| **Auto Generate** (sebelumnya "AI") | Random optimized + hindari partner berulang dalam n round |
| **Manual** | Drag-and-drop UI + edit hasil Auto Generate |

### 3.2 Match Round Set

Konsep: 1 session bisa punya beberapa "Match Round Set" (batch matches yang di-generate dalam 1 kali create match).

- Bisa create extra match kapan saja mid-session
- Setiap batch bisa punya setting berbeda
- Saat create match, ada toggle:
  - "Host ikut main?" (yes/no)
  - "Co-host ikut main?" (yes/no, per co-host)
  - Jumlah match: **manual input** atau **automatic**

### 3.3 Smart Default (Auto Round Count)

| Format | Default Round |
|---|---|
| Americano (no fix partner) | n−1 round |
| Americano + fix partner | (n/2)−1 round |
| Mexicano | 5–7 round (host bisa adjust) |
| Multi-court | Pararel, durasi proporsional |

Host selalu bisa override.

### 3.4 Mexicano Generation Logic

- Round 1: generate random
- Round 2+: generate **per round** setelah round sebelumnya selesai (pairing depends on current ranking)

---

## 4. Scoring & Point System

### 4.1 Match Outcome Points

| Hasil | Point |
|---|---|
| Menang | **3** |
| Kalah | **1** |
| Draw | **2** (hanya mungkin di time-based) |

Point-based main sampai ada pemenang (no draw).

### 4.2 Karakteristik Sistem

- **Lifetime accumulation** (tidak ada season/reset)
- **Tidak Elo-style** (semua match equal value)
- **Tournament & Freeplay = bobot sama**

**Konsekuensi disain:** sistem reward engagement (sering main = banyak point), bukan skill murni.

### 4.3 Leaderboard

3 kolom utama, bisa di-sort:
- Total Point
- Win Rate (%)
- Match Played

Match Played penting sebagai konteks untuk validasi Win Rate.

**Scope leaderboard:**
- Global (Indonesia)
- Regional (filter by kota)
- Internal session (live untuk session berjalan, termasuk guest)

---

## 5. Tier System (Gamification)

### 5.1 6 Tier — Lifetime Achievement

| Tier | Min Point | Min Match | Estimasi (3x/minggu) |
|---|---|---|---|
| Rookie | 0 | 0 | Start |
| Intermediate | 300 | 30 | ~1.5 bulan |
| Advanced | 1,000 | 100 | ~5 bulan |
| Pro | 3,000 | 250 | ~12–15 bulan |
| Elite | 7,500 | 500 | ~2.5 tahun |
| Master | 15,000 | 1,000 | ~4+ tahun |

*Threshold ini draft kalibrasi — perlu di-adjust setelah ada data real.*

### 5.2 Karakteristik Tier

- **No relegation** — tier sekali naik tetap (lifetime achievement)
- **Basis: Point + Match Minimum** (bukan Win Rate)
- Tidak ada "active status" / inaktif tag

---

## 6. User Roles & Permissions

### 6.1 Guest

- Definisi: **nama saja** (host ketik manual, no WA, no link aktif)
- **Tidak ada history claim** ke akun member
- Hanya muncul di **leaderboard internal session**, tidak di global
- Ephemeral (hilang setelah session selesai)

### 6.2 Member (akun terdaftar)

Memiliki:
- Profile (avatar, tier, stats, achievements)
- Match History persistent
- Incoming Session/Match
- Win Rate
- Share Profile (image card lengkap)
- **Friend list / Follow system**

### 6.3 Host & Co-Host

| Aspek | Detail |
|---|---|
| **Co-Host authority** | Sama persis dengan Host |
| **Maksimum co-host** | Unlimited |
| **Reasoning** | Host sering ikut main, jadi butuh co-host untuk handle scoring |
| **Toggle "ikut main"** | Per individu, set saat create match |
| **Score input** | **Strict** — hanya host/co-host yang bisa input score. Pemain lain read-only. |

---

## 7. Live Match Sharing

### 7.1 Mekanisme

- **Public web link** (auto-refresh) — viewer buka tanpa login
- Scope: **per match** dan **per session** (dua level link)

### 7.2 Yang Ditampilkan

- Live score
- Nama pemain
- **Denah lapangan visual** (posisi 4 pemain)
- **Stats** (tier badge, win rate, foto profil)

### 7.3 Format

- 1 link per session → bisa lihat semua court yang sedang main
- 1 link per match → fokus 1 match spesifik
- Auto-refresh (real-time atau polling)

---

## 8. Post-Match

### 8.1 Foto Group

- **Hanya host yang bisa upload** (foto official)

### 8.2 Sharing Output

Saat post-match share, generate **image card** berisi:
- Foto group
- Leaderboard final (point + win rate)
- Tier achievement (kalau ada tier-up di session ini)

### 8.3 Share Mechanism

- **Native Share API** (Web Share) — langsung ke WA / IG Story / app pilihan
- Card design jadi mini-iklan app (branding)

---

## 9. Account & Profile

### 9.1 Fitur

- Match History
- Incoming Session/Match
- Win Rate
- Tier display + progress
- Share Profile
- **Friend list / Follow system**
- Invite Others via WA

### 9.2 Profile Sharing

Image card lengkap (premium-feel) dengan:
- Avatar
- Tier badge
- Total Point + Win Rate + Match Played
- Achievements
- Optional: QR code untuk add friend

### 9.3 Invite Others

- **Referral link umum ke app** ("join padel community")
- Bukan session-spesifik (untuk session pakai invite session terpisah)

---

## 10. Information Architecture

### 10.1 Bottom Navigation (5 Tab)

| Tab | Konten |
|---|---|
| **Home** | Incoming session, quick actions (Create Session, Join via code), tier progress |
| **Sessions** | Find Session (public), My Sessions (private + joined), Match History |
| **Create** (FAB tengah) | Quick access ke Create Session |
| **Leaderboard** | Global/regional leaderboard (sort by point/winrate/match) |
| **Profile** | Account, tier, stats, share profile, settings |

### 10.2 Public Pages (Tanpa Auth)

- `/live/[sessionId]` — view live session
- `/live/[matchId]` — view live match spesifik
- `/profile/[username]` — public profile (saat di-share)
- `/join/[inviteCode]` — landing untuk guest yang diundang

---

## 11. Tech Considerations (Preview)

*Akan didetailkan di fase berikutnya.*

- **Mobile-first responsive web** (PWA candidate untuk install ke home screen)
- **Public routes** untuk live link (no auth needed)
- **Image generation** untuk share card (Canvas/SVG)
- **Real-time update** untuk live link (polling vs WebSocket)
- **Match generator algorithm** (constraint-based + fairness)
- **Storage**: foto group, avatar
- **Auth**: WhatsApp number? Email? Social?

---

## 12. Yang Perlu Diputuskan di Fase Berikutnya

1. **Tech stack** (framework, database, hosting)
2. **Authentication method** (WA OTP, email, social login)
3. **Wireframe / UI design** untuk key screens (Create Session, Match Score, Live View)
4. **MVP scoping** — mana yang masuk versi 1, mana yang ditunda
5. **Branding** (nama app, logo, color palette)
6. **Monetization model** (kalau perlu — freemium tier? premium host? sponsorship?)
7. **Notification strategy** (push, WA, email)
8. **Onboarding flow** (untuk member dan untuk guest yang convert)

---

## Catatan Penting

- **Draft kalibrasi tier** (Section 5.1) perlu validasi setelah ada user real
- **"AI" generation** akan di-rebrand jadi **"Auto Generate"** atau **"Smart Match"** di UI (lebih akurat)
- Konsep **Match Round Set** = abstraksi penting di data model
- Friend list / Follow system = entry untuk fitur sosial yang bisa expand di versi lanjut (feed, post, comment)
