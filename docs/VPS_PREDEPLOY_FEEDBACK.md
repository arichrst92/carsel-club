# Feedback: VPS Pre-Deploy Answers (untuk Tim IDE Asia)

**Dari:** Carsel Club team
**Ke:** Tim IDE Asia ops (PIC: Ari Christian)
**Tanggal:** 2026-06-06
**Status:** Review dokumen `VPS_PREDEPLOY_ANSWERS.md` + script `vps-audit.sh`

Terima kasih banyak — pre-fill jawaban sudah komprehensif, plus script audit-nya rapi. Co-existence dgn IDE Asia sudah cukup well-mapped. Berikut feedback final supaya bisa langsung schedule deploy window.

---

## ✅ Yang sudah DEAL (tidak perlu dibahas lagi)

| Item | Decision |
|---|---|
| Port internal Carsel Next.js | **3030** (3000 dipakai IDE Asia) |
| DB name + role Postgres | `carsel_club` + `carsel_app` |
| Nginx config | File terpisah `sites-available/carsel.club` + symlink |
| Cara reload nginx | `nginx -t && systemctl reload nginx` (never restart) |
| Certbot | `--nginx` plugin (never `--standalone`) |
| Folder app + uploads | `/var/www/carsel-club/` + `/var/www/carsel-uploads/` |
| Service name | `carsel-next.service` (systemd, BUKAN PM2) |
| Letsencrypt email | Akan pakai email Carsel (TBD: `team@carsel.club` atau email lain — confirm di point #7) |
| Postgres backup | `/var/backups/carsel/`, retention 7d local + 30d offsite |
| Maintenance window | Sabtu 02:00–06:00 WIB |

---

## 🚨 BLOCKING — wajib selesai sebelum eksekusi

### 1. Output `vps-audit.sh`

Mohon jalankan script yang sudah dibuat:

```bash
sudo bash docs/vps-audit.sh > /tmp/vps-audit-$(date +%Y%m%d).txt 2>&1
```

Lalu kirim balik output ke kami. **11 field yang ditandai 🔍** akan terjawab dari sini (Node version, RAM total, disk free, port 3030 benar2 kosong, dst).

### 2. Konfirmasi Postgres BENAR-BENAR belum ada

Section 3 jawaban: "Kemungkinan TIDAK". Ini perlu **definitive** sebelum kita decide strategy install. Yang kami butuh:

```bash
systemctl list-unit-files | grep postgres
dpkg -l | grep -E 'postgresql|postgres'
ls /etc/postgresql/ 2>/dev/null
ls /var/lib/postgresql/ 2>/dev/null
docker ps -a | grep -i postgres
```

Kalau **ada** Postgres existing (bahkan stopped), strategy berubah: pakai cluster yang sama, buat DB+role baru saja. Kalau **definitely tidak ada**, install fresh dari PGDG repo.

### 3. RAM total VPS

Kritikal untuk sizing decision. Skenario:

| Total RAM | Verdict |
|---|---|
| 4 GB+ | ✅ Comfortable. IDE Asia (1 GB) + Postgres (300 MB) + Carsel (700 MB) + buffer (~1 GB). |
| 2–3 GB | ⚠️ Tight. **Wajib tambah swap 2 GB**. Postgres `shared_buffers` set ke 128 MB max. |
| < 2 GB | ❌ Tidak cukup. Perlu upgrade VPS atau pertimbangan lain. |

### 4. VPS provider apa? (Hostinger / Hetzner / DigitalOcean / Vultr / lain)

Penting untuk:
- **Cloud-level firewall** (Hetzner Firewall, DO Firewall, Vultr Firewall) — port 80/443 harus dibuka di sana JUGA, bukan cuma UFW.
- **Snapshot/backup** policy provider (sebagian auto, sebagian manual).
- **Console out-of-band** procedure kalau SSH putus.

---

## ❓ Klarifikasi yang perlu dijawab

### 5. DNS — `carsel.club` registrar + apakah pakai Cloudflare proxy?

Section 7.1–7.2 masih open. Pertanyaan spesifik:

- Registrar mana? (Niagahoster / Cloudflare / Namecheap / GoDaddy / dst)
- DNS-nya pakai default registrar atau Cloudflare di front?
- Kalau Cloudflare proxy aktif (orange cloud): kita **wajib disable sementara** waktu certbot dijalankan (HTTP-01 challenge butuh access langsung ke origin). Setelah cert dapat, boleh re-enable.
- Atau: pakai **DNS-01 challenge** dengan Cloudflare API token (tidak perlu disable proxy, tapi setup lebih ribet).

**Rekomendasi:** kalau pakai Cloudflare, sementara DNS-only (gray cloud) saat deploy. Aktifkan proxy setelah cert OK.

### 6. User `carsel-deploy` — confirm spec

Section 0.1 saran bikin user terpisah dari root — **kami setuju kuat**. Detail spesifik:

- Username exact: `carsel-deploy` (sesuai saran) atau `carsel`?
- Home: `/home/carsel-deploy`
- Shell: `/bin/bash`
- SSH key: kami generate sendiri di mesin dev → kirim public key ke tim VPS untuk paste ke `~/.ssh/authorized_keys`
- Sudoers minimal — usulkan:
  ```
  carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl restart carsel-next.service
  carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl reload carsel-next.service
  carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl status carsel-next.service
  carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl reload nginx
  carsel-deploy ALL=(ALL) NOPASSWD:/usr/sbin/nginx -t
  carsel-deploy ALL=(ALL) NOPASSWD:/usr/bin/journalctl -u carsel-next.service*
  ```
  Tidak boleh sudo blanket — supaya kalau credential bocor, blast radius terbatas.
- Group membership: `www-data` (untuk akses `/var/www/carsel-uploads/`)
- Ownership: `/var/www/carsel-club` → `carsel-deploy:carsel-deploy`, `/var/www/carsel-uploads` → `carsel-deploy:www-data` mode 755.

### 7. Letsencrypt email untuk Carsel

Konfirmasi email yang dipakai. Kandidat:
- `team@carsel.club` (perlu setup MX dulu)
- `arichrst@ide.asia` (sudah pasti aktif)
- Email pribadi PIC Carsel

Pilihan paling pragmatis: pakai email yang **pasti aktif & dimonitor** supaya notifikasi expire 30/14/1 hari ter-baca. Saran: `arichrst@ide.asia` (PIC sama orang) atau email Gmail pribadi yang dicek tiap hari.

### 8. Postgres install — locale + tuning

Kalau install fresh Postgres 16, mohon clarify saat install:

- Locale: **`en_US.UTF-8`** (default, paling kompatibel) atau `id_ID.UTF-8` (sorting bahasa Indonesia)? Carsel sebagian besar pakai ASCII di kolom kritikal, jadi `en_US.UTF-8` cukup.
- Cluster name: default `main` OK.
- `shared_buffers`: default 128 MB OK kalau RAM < 4 GB. Akan disesuaikan setelah baseline.
- `max_connections`: 100 (default) cukup untuk MVP (Carsel pakai connection pooler di app-level).

### 9. GitHub deploy key — read-only?

Setuju pakai deploy key per-repo (bukan user-level). Confirm:
- **Read-only** (Allow write access: NO) → cukup untuk `git pull`
- Pasang di repo `idea-asia/carsel-club` (atau organization name lainnya)
- Generate di server: `ssh-keygen -t ed25519 -f ~/.ssh/carsel_deploy -C "carsel-deploy@72.60.74.202"`

### 10. Monitoring — apa yang dipakai?

Section 9.4 mention Sentry untuk IDE Asia. Carsel:
- **Error tracking**: kemungkinan pakai Sentry juga (project terpisah). Confirm budget/akun.
- **Uptime monitoring**: UptimeRobot free tier (50 monitors, 5 menit interval) cukup. Endpoint: `https://carsel.club/api/health` (Carsel sudah punya / akan dibuat).
- **Logs**: `journalctl -u carsel-next.service` cukup awal. Tidak perlu ELK/Loki dulu.
- **Resource monitoring**: sepakat Netdata kalau perlu, bind localhost + SSH tunnel.

### 11. Snapshot pre-install — siapa yang jalankan?

Tim IDE Asia offer untuk run sendiri (atau bareng). **Kami pilih: dijalankan oleh tim IDE Asia sebelum Carsel dapat akses SSH**, biar baseline rollback bersih sebelum kami sentuh apa pun.

Hasil snapshot disimpan di `/var/backups/carsel-preinstall/`. Kalau ada masalah di hari deploy, kita punya checkpoint untuk compare config.

---

## 📋 Decisions yang perlu Carsel team ambil

| # | Decision | Default usulan |
|---|---|---|
| D1 | Letsencrypt email | `arichrst@ide.asia` (paling aman, sudah aktif) |
| D2 | Username sistem | `carsel-deploy` |
| D3 | Process manager | **systemd** `carsel-next.service` (bukan PM2) |
| D4 | Backup offsite | Cloudflare R2 (zero egress) — kalau team ada akun |
| D5 | Sentry project | TBD — confirm sebelum production cutover |
| D6 | DNS strategy | Cloudflare DNS-only (gray cloud) saat deploy, re-enable proxy setelah cert OK |

---

## 🗺 Proposed deploy timeline (setelah field BLOCKING di atas terjawab)

| Hari | Aktivitas | Risk |
|---|---|---|
| **H-7** | Tim VPS jalankan `vps-audit.sh` + snapshot pre-install + buat user `carsel-deploy` + setup deploy key GitHub + DNS A record + (kalau Cloudflare) gray-cloud | Zero risk untuk IDE Asia |
| **H-5** | Carsel verifikasi SSH access + Postgres install fresh + buat DB+role + run migration (drizzle) | Postgres baru — zero impact IDE Asia |
| **H-3** | Build Next.js di VPS + systemd service file + smoke test internal port 3030 | Zero risk (belum exposed) |
| **H-1** | Nginx config Carsel + `nginx -t` (dry-run) + `systemctl reload nginx` + certbot `--nginx -d carsel.club -d www.carsel.club` | **Risiko sentuh nginx** — perlu PIC IDE Asia stand-by 30 menit |
| **H-0 (Sabtu 02:00)** | Production cutover + smoke test public + monitoring check | Maintenance window — IDE Asia low traffic |
| **H+1** | Postgres backup cron + uploads backup cron + UptimeRobot endpoint | Zero risk |

---

## 🔜 Next steps (sekuensial)

1. **Tim VPS**: jalankan `vps-audit.sh`, kirim output `audit.txt`
2. **Tim VPS**: confirm Postgres existence definitive (point #2 di atas)
3. **Carsel team**: ambil decision D1–D6
4. **Carsel team**: kasih info DNS (point #5)
5. **Tim VPS + Carsel**: schedule **kickoff call 30 menit** (WhatsApp / call) untuk align timeline + tukar SSH public key + handover
6. **Carsel team**: generate SSH key + buat GitHub deploy key
7. **Tim VPS**: bikin user `carsel-deploy` + paste SSH public key + verify login
8. **Carsel team**: dry-run di staging path (kalau ada) atau langsung jalankan timeline H-7 → H+1

---

## 🙏 Catatan apresiasi

Pre-fill jawabannya sudah very thorough. Convention section (12.1–12.7) yang ditegaskan ulang sangat helpful — itu jadi guard rail kami juga supaya tidak salah eksekusi.

Yang paling kami apresiasi:
- ⭐ Script audit `vps-audit.sh` — read-only, structured, paste-able output
- ⭐ Highlight port 3000 dipakai IDE Asia + saran pakai 3030 (potensi conflict critical)
- ⭐ Saran user terpisah `carsel-deploy` + sudoers minimal (security-first)
- ⭐ Offer snapshot pre-install dijalankan bareng — kami ambil saran ini.

Setelah point BLOCKING #1–#4 dijawab, kita bisa langsung proceed ke kickoff call.

---

**Cc:** Ari Christian (PIC IDE Asia + Carsel)
**Tanggal review:** 2026-06-06
**Status:** Menunggu output `vps-audit.sh` dan decision D1–D6
