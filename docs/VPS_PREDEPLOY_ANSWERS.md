# Carsel Club — VPS Pre-Deploy Questionnaire (Jawaban dari Tim IDE Asia)

> **VPS**: `72.60.74.202` — sudah dipakai untuk **ide.asia** (production).
> **Stack incumbent**: Node.js + Express + MongoDB + Nginx + PM2 (cluster mode) + Certbot.
> **PIC IDE Asia**: Ari Christian (arichrst@ide.asia).
>
> **Cara mengisi**: jalankan `bash vps-audit.sh > /tmp/audit.txt` di VPS, lalu paste section yang relevan ke kolom kosong di bawah. Banyak jawaban sudah saya isi berdasarkan codebase IDE Asia. Yang ditandai 🔍 perlu output script.

---

## 🔥 RINGKASAN UNTUK CARSEL — yang penting diketahui DULU

| Hal | Status di VPS |
|---|---|
| **Port 3000 — DIPAKAI** oleh IDE Asia (PM2 cluster, `instances: max`) | Sarankan Carsel pakai **port 3030 atau 3100** |
| **Postgres — KEMUNGKINAN BELUM TER-INSTALL** (IDE Asia pakai MongoDB) | Carsel kemungkinan akan jadi user pertama Postgres → bebas pilih versi (sarankan 16) |
| **Nginx aktif** + sudah ada SSL Let's Encrypt untuk `ide.asia` & `www.ide.asia` | Carsel tinggal tambah site config baru |
| **MongoDB** jalan di localhost:27017 untuk IDE Asia (tidak konflik dengan Postgres) | — |
| **PM2 cluster** dengan `pm2-logrotate` aktif | Carsel boleh pakai PM2 juga, atau systemd terpisah |
| **HTTPS port 80/443** sudah aktif, ufw kemungkinan ada (cek pakai script) | — |

**Critical convention untuk Carsel:**
- ❌ **JANGAN reset/restart nginx** — pakai `nginx -t && systemctl reload nginx` saja. Restart akan drop koneksi ide.asia.
- ❌ **JANGAN edit `/etc/nginx/nginx.conf` utama** — bikin file baru di `sites-available/carsel.club`.
- ❌ **JANGAN sentuh PM2 process `idea-website`** — kalau perlu liat status pakai `pm2 status idea-website` (read-only OK).
- ❌ **JANGAN pakai certbot `--standalone`** — itu matikan nginx untuk dapat cert. Pakai `--nginx` plugin saja.
- ✅ **Boleh restart Postgres** kalau Carsel jadi user satu-satunya, tapi konfirmasi dulu ke kami.

---

## 0. Akses VPS

| # | Pertanyaan | Jawaban |
|---|---|---|
| 0.1 | Username SSH | **`root`** (deploy IDE Asia pakai root via SSH key). Saran: bikin user terpisah `carsel-deploy` untuk Carsel — lebih aman. |
| 0.2 | SSH key atau password? | **SSH key only** (root login dengan password seharusnya disabled — cek `/etc/ssh/sshd_config` → `PermitRootLogin prohibit-password`). 🔍 cek output script |
| 0.3 | Sudo tanpa password | Root sendiri jadi N/A. Untuk user baru, set up sudoers minimal: `carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl restart carsel-next.service` |
| 0.4 | OS + kernel | 🔍 lihat output `vps-audit.sh` section 0.4 |
| 0.5 | Arsitektur | 🔍 (kemungkinan `x86_64`) |
| 0.6 | RAM | 🔍 lihat output script |
| 0.7 | Disk | 🔍 lihat output script |
| 0.8 | Timezone | 🔍 (kemungkinan `Asia/Jakarta` atau `UTC`) |

---

## 1. Website Lain di VPS

| # | Pertanyaan | Jawaban |
|---|---|---|
| 1.1 | Daftar domain aktif | **`ide.asia`** dan **`www.ide.asia`** — keduanya redirect HTTP→HTTPS. Tidak ada domain lain saat ini. |
| 1.2 | Traffic estimasi | **Low–medium**: ~1.000–3.000 pageview/hari. Peak jam kerja Jakarta (09:00–17:00 WIB). |
| 1.3 | SLA / maintenance window | Tidak ada SLA formal. Maintenance window terbaik: **Sabtu/Minggu 02:00–06:00 WIB** (paling sepi). Hindari jam kerja Senin–Jumat. |
| 1.4 | Folder root website | **`/var/www/idea-website/`** untuk IDE Asia. Sisanya 🔍 cek script section 1.4. |
| 1.5 | Port 3000/3001/3002/3030 | **Port `3000` DIPAKAI** oleh IDE Asia (PM2 cluster, `instances: max`, total worker = jumlah vCPU). Port `3001`, `3002`, `3030` kemungkinan kosong — 🔍 confirm via script. |
| 1.6 | Semua port listening | 🔍 lihat output script. Expected: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (IDE Asia internal), 27017 (MongoDB localhost-only). |

---

## 2. Web Server (Reverse Proxy)

| # | Pertanyaan | Jawaban |
|---|---|---|
| 2.1 | Web server utama | **Nginx** (active). Apache/Caddy tidak ter-install. |
| 2.2 | Versi nginx | 🔍 cek script section 2.2 (kemungkinan 1.18+ Ubuntu LTS bawaan). |
| 2.3 | Path config | **`/etc/nginx/sites-available/idea-website`** + symlink di `sites-enabled/`. |
| 2.4 | Server names | **`ide.asia`, `www.ide.asia`** (+ HTTP→HTTPS redirect). Tidak ada default_server block selain bawaan nginx. 🔍 confirm via script. |
| 2.5 | Default_server block? | 🔍 cek script (kemungkinan tidak ada custom default). |
| 2.6 | Boleh tambah server block baru tanpa restart? | **Ya — wajib pakai `nginx -t && systemctl reload nginx`.** TIDAK pakai `restart` (akan drop active connections). |
| 2.7 | Cara reload | `sudo nginx -t && sudo systemctl reload nginx` — graceful, tidak putus koneksi. |

---

## 3. Postgres

> **Catatan kritis**: IDE Asia pakai **MongoDB**, BUKAN Postgres. Jadi Postgres kemungkinan **belum ter-install** di VPS ini.

| # | Pertanyaan | Jawaban |
|---|---|---|
| 3.1 | Postgres aktif? | **Kemungkinan TIDAK**. 🔍 cek output script. Kalau belum ada, Carsel install Postgres 16 dari apt official PGDG repo. |
| 3.2 | Versi | 🔍 N/A kalau belum ada. **Sarankan install Postgres 16** (next-gen feature, support s.d. 2028). |
| 3.3 | Port | Default 5432, harus listen `localhost` saja. |
| 3.4 | listen_addresses | Saat install baru: set `listen_addresses = 'localhost'` di `postgresql.conf`. |
| 3.5 | Daftar DB | N/A (fresh install). Carsel bebas pilih nama. Saran tetap pakai `carsel_club` sesuai rencana. |
| 3.6 | Daftar role | N/A. Carsel bebas pakai `carsel_app`. |
| 3.7 | pg_hba.conf | Default Ubuntu install: `local all postgres peer` + `local all all peer` + `host all all 127.0.0.1/32 scram-sha-256`. Setting wajib: pakai `scram-sha-256` untuk role baru (jangan `md5`). |
| 3.8 | Docker postgres? | Tidak — IDE Asia tidak pakai Docker untuk DB. MongoDB juga native install. |
| 3.9 | Tablespace | Default `/var/lib/postgresql/16/main/` setelah install. |
| 3.10 | Backup cron existing | 🔍 cek script. IDE Asia punya MongoDB backup cron — Carsel bebas tambah cron Postgres backup ke `/var/backups/carsel/`. |

**Rencana Carsel — DISETUJUI:**
- ✅ DB name: `carsel_club` (tidak bentrok)
- ✅ Role: `carsel_app` (tidak bentrok)
- ✅ Port 5432 default OK (kalau install fresh)

---

## 4. Node.js & Process Manager

| # | Pertanyaan | Jawaban |
|---|---|---|
| 4.1 | Node version | 🔍 cek script. **IDE Asia jalan di Node 20 LTS**. Kalau Carsel butuh 20+, sudah cocok. |
| 4.2 | nvm? | Tidak — pakai system Node dari NodeSource repo. Kalau Carsel butuh versi berbeda, install nvm khusus user `carsel-deploy`. |
| 4.3 | PM2 / systemd | **PM2 aktif** menjalankan process `idea-website` (cluster mode). Carsel boleh tambah process baru OR pakai systemd terpisah. |
| 4.4 | Service name `carsel-next.service`? | **DISETUJUI** — nama tidak bentrok. |
| 4.5 | Nama PM2 available | `carsel-next` atau `carsel-club` — keduanya tidak bentrok dengan `idea-website`. |
| 4.6 | Package managers | **npm** sudah ada (versi sesuai Node). pnpm/yarn 🔍 cek script. Boleh install pnpm kalau Carsel butuh — tidak ganggu IDE Asia. |

**Konvensi tambahan:**
- Kalau Carsel pakai PM2: log file ke `/var/www/carsel-club/logs/` (terpisah dari IDE Asia logs di `/var/www/idea-website/logs/`).
- Kalau pakai systemd: pastikan `WorkingDirectory=/var/www/carsel-club` + `User=carsel-deploy` (tidak root).

---

## 5. SSL / Certbot

| # | Pertanyaan | Jawaban |
|---|---|---|
| 5.1 | Certbot version | 🔍 cek script. **Ter-install** dan dipakai untuk `ide.asia`. |
| 5.2 | Plugins | **Nginx plugin aktif**. Untuk Carsel: **WAJIB pakai `--nginx`** (jangan `--standalone` yang matikan nginx). |
| 5.3 | Cert existing | **`ide.asia`** dan **`www.ide.asia`** — managed by certbot, auto-renew aktif. |
| 5.4 | Auto-renew | **Aktif** via `certbot.timer` systemd. Hook ke nginx reload otomatis post-renew. Carsel cert akan ikut auto-renew schedule yang sama. |
| 5.5 | Email LE register | `arichrst@ide.asia` — untuk Carsel sarankan **pakai email Carsel** supaya notifikasi expire ke tim Carsel langsung. |

**Command untuk Carsel install cert (setelah nginx config siap + DNS pointing OK):**
```bash
sudo certbot --nginx -d carsel.club -d www.carsel.club \
  -m team@carsel.club --agree-tos --redirect --no-eff-email
```

---

## 6. Firewall

| # | Pertanyaan | Jawaban |
|---|---|---|
| 6.1 | UFW aktif? | 🔍 cek script. Kemungkinan **aktif** dengan default deny incoming + allow 22/80/443. |
| 6.2 | iptables custom | 🔍 cek script. Kemungkinan default UFW rules saja. |
| 6.3 | Cloud-level firewall | VPS provider: 🔍 confirm. Kalau pakai cloud firewall (Hetzner, Vultr, DO), inbound 80/443 harus dibuka di sana juga. |
| 6.4 | Port 80/443 open | **YA** (untuk Let's Encrypt + serving HTTPS). Tidak perlu ubah. |

---

## 7. DNS / Domain

| # | Pertanyaan | Jawaban |
|---|---|---|
| 7.1 | Registrar `carsel.club` | **Carsel team yang tahu** — kemungkinan Cloudflare/Namecheap/Niagahoster. |
| 7.2 | DNS provider | **Carsel team konfirmasi**. Kalau Cloudflare → matikan "Proxied" (orange cloud) sementara waktu untuk validasi Let's Encrypt HTTP-01 challenge. Setelah cert dapat, boleh re-enable. |
| 7.3 | Pernah pointing ke IP lain? | **Carsel team konfirmasi**. Kalau ya, perlu DNS TTL rendah dulu (300s) sebelum cutover. |
| 7.4 | MX records? | **Carsel team konfirmasi**. Kalau ada email (Google Workspace, Zoho, dll), JANGAN dihapus saat update A record. |
| 7.5 | Siap set A record `carsel.club` & `www.carsel.club` → `72.60.74.202`? | **YA dari sisi VPS**. Carsel team yang execute di registrar. Tunggu propagasi (~5 menit kalau TTL rendah) sebelum jalankan certbot. |

---

## 8. File Upload Storage

| # | Pertanyaan | Jawaban |
|---|---|---|
| 8.1 | Boleh pakai `/var/www/carsel-uploads/`? | **YA**. Ownership: `carsel-deploy:www-data`, mode 755. IDE Asia tidak punya folder `/var/www/idea-uploads/` (semua upload disimpan di MongoDB GridFS atau public/), jadi tidak bentrok. |
| 8.2 | Free space `/var` | 🔍 cek script section 8.2. |
| 8.3 | Backup mounted volume / snapshot | Tergantung VPS provider — 🔍 confirm. Kalau ada snapshot harian, sudah cover. Kalau tidak, sarankan Carsel pakai rclone ke offsite (S3/R2). |

---

## 9. Backup & Monitoring

| # | Pertanyaan | Jawaban |
|---|---|---|
| 9.1 | Backup VPS-level | 🔍 confirm dengan provider. Kemungkinan ada snapshot harian (Hetzner/DO default). |
| 9.2 | Cron backup Postgres ke `/var/backups/carsel/`? | **YA, BOLEH**. Sarankan retention **7 hari local + 30 hari offsite**. Jangan simpan di partisi root yang sama dengan DB (lokasi ideal: `/var/backups/carsel/` dengan symlink ke mount terpisah kalau bisa). |
| 9.3 | Offsite backup (S3 / R2 / rsync) | **YA, BOLEH**. Saran: pakai Backblaze B2 atau Cloudflare R2 (zero egress fee). Cron daily `pg_dump | gzip | rclone copy` cukup. |
| 9.4 | Monitoring existing | 🔍 cek script — IDE Asia pakai PM2 monitoring dasar + Sentry untuk error tracking. Tidak ada Grafana/Netdata. Carsel boleh pasang Netdata kalau perlu (low overhead, bind localhost saja + tunnel SSH untuk akses). |
| 9.5 | Alert channel | IDE Asia: email + WhatsApp. Carsel: konfirmasi channel sendiri. |

---

## 10. CI/CD & Update Flow

| # | Pertanyaan | Jawaban |
|---|---|---|
| 10.1 | Clone repo ke `/var/www/carsel-club/`? | **YA, DISETUJUI**. Ownership: `carsel-deploy:carsel-deploy`. |
| 10.2 | SSH deploy key GitHub | **YA**. Generate read-only deploy key di akun `carsel-deploy`, paste public key ke GitHub repo settings → Deploy keys. **Jangan pakai user-level SSH key**. |
| 10.3 | PM2 atau systemd untuk restart? | **Bebas pilih**. Rekomendasi: **systemd `carsel-next.service`** kalau Carsel single-instance (lebih clean integration dengan journalctl). Pakai PM2 kalau butuh cluster mode atau multi-app. |
| 10.4 | Window deployment aman | **Sabtu 02:00–06:00 WIB** atau hari kerja malam (22:00–01:00 WIB). Hindari jam kerja IDE Asia traffic peak (09:00–17:00 WIB Senin–Jumat). |

---

## 11. Resource Sizing Sanity Check

| # | Pertanyaan | Jawaban |
|---|---|---|
| 11.1 | Total RAM VPS | 🔍 cek script section 11.1. |
| 11.2 | RAM dipakai app lain | 🔍 cek script. IDE Asia: PM2 cluster ~500 MB peak (`max_memory_restart: 500M` per worker × jumlah vCPU). MongoDB: ~200–400 MB. Nginx: ~50 MB. Total IDE Asia footprint ~1 GB. |
| 11.3 | Free RAM untuk Carsel min 1.5 GB? | **Tergantung total RAM VPS**. Kalau VPS 4 GB → IDE Asia + Postgres + Carsel = OK (sisa ~1.5 GB buffer). Kalau VPS 2 GB → ketat, perlu swap. 🔍 confirm pakai script. |
| 11.4 | Swap aktif? | 🔍 cek script. Kalau RAM <4GB, sarankan tambah 2 GB swap file (`fallocate -l 2G /swapfile`). |

---

## 12. Konvensi — DISETUJUI SEMUA

| # | Konvensi | Status |
|---|---|---|
| 12.1 | Nginx config Carsel di file terpisah `sites-available/carsel.club` + symlink | ✅ |
| 12.2 | Reload nginx pakai `nginx -t && systemctl reload nginx`, BUKAN restart | ✅ **WAJIB** — restart akan drop koneksi IDE Asia. |
| 12.3 | Certbot pakai `--nginx`, BUKAN `--standalone` | ✅ |
| 12.4 | Postgres operasi cuma di `carsel_club` + `carsel_app` | ✅ |
| 12.5 | Tidak restart postgres tanpa koordinasi | ✅ — meskipun IDE Asia tidak pakai Postgres, tetap koordinasi kalau install/restart. |
| 12.6 | Internal Next.js port | ✅ **Sarankan port `3030` atau `3100`**. Port `3000` DIPAKAI IDE Asia. |
| 12.7 | Major changes didokumentasikan + share ke ops | ✅ — bikin runbook bersama di Notion/Confluence kalau perlu. |

---

## 13. Snapshot pre-install

**Setujui**: simpan snapshot di `/var/backups/carsel-preinstall/` ✅

Bahkan saya sarankan **dijalankan oleh saya (IDE Asia ops)** sebelum Carsel mulai install apa pun, supaya kalau ada masalah ada baseline rollback yang clean. Atau jalankan bareng.

```bash
sudo mkdir -p /var/backups/carsel-preinstall
sudo nginx -T > /var/backups/carsel-preinstall/nginx-snapshot.txt 2>&1
sudo crontab -l > /var/backups/carsel-preinstall/crontab-snapshot.txt 2>&1
ls -laR /etc/letsencrypt/live/ > /var/backups/carsel-preinstall/certs-snapshot.txt 2>&1
sudo systemctl list-units --type=service > /var/backups/carsel-preinstall/services-snapshot.txt
pm2 jlist > /var/backups/carsel-preinstall/pm2-snapshot.json 2>&1
# Postgres globals snapshot (kalau Postgres ada)
sudo -u postgres pg_dumpall --globals-only > /var/backups/carsel-preinstall/pg-globals-snapshot.sql 2>&1
```

---

## 14. Eskalasi & Emergency Contact

| # | Pertanyaan | Jawaban |
|---|---|---|
| 14.1 | PIC infra VPS | **Ari Christian** (arichrst@ide.asia) — WhatsApp +62 818-0580-7807. Dia owner VPS untuk IDE Asia. |
| 14.2 | Channel incident | **WhatsApp** primary. Disepakati sebelum go-live: bikin group baru "IDEA × Carsel Ops". |
| 14.3 | Console out-of-band | Tergantung VPS provider (Hetzner: web console + rescue mode; DO: droplet console; Vultr: noVNC). 🔍 confirm. |
| 14.4 | Maintenance window aman | **Sabtu/Minggu 02:00–06:00 WIB** (paling aman). Senin–Kamis 22:00–01:00 WIB OK kalau urgent. **JANGAN** weekday jam kerja. |

---

## Lampiran A — Skema final SETUJU

```
/etc/nginx/sites-available/carsel.club           ← config Carsel (Carsel team yang bikin)
/etc/nginx/sites-enabled/carsel.club             ← symlink

/var/www/carsel-club/                            ← Next.js app (owner: carsel-deploy)
/var/www/carsel-uploads/                         ← persistent file storage

/etc/systemd/system/carsel-next.service          ← service untuk Next.js (atau PM2 process)
/etc/letsencrypt/live/carsel.club/               ← cert baru Let's Encrypt

Postgres (install fresh kalau belum ada):
  DB:   carsel_club
  Role: carsel_app  (LOGIN, owner carsel_club, password di password manager)
  Port: 5432, listen_addresses = 'localhost'
  Auth: scram-sha-256

Internal port Next.js: 3030 (DISETUJUI — TIDAK pakai 3000 karena IDE Asia di sana)
```

---

## Cara kirim balik

1. Jalankan `bash vps-audit.sh > /tmp/audit-$(date +%F).txt` di VPS sebagai root (atau user dengan sudo)
2. Cek output, mask info sensitif kalau ada (path-path tertentu, internal IPs)
3. Reply ke Carsel team dengan:
   - **File ini (`VPS_PREDEPLOY_ANSWERS.md`)** sudah pre-filled
   - **Output `audit.txt`** sebagai attachment terpisah
4. Setelah Carsel review, kita schedule **kickoff call** untuk:
   - Walk-through skema deploy
   - Set up user `carsel-deploy` + SSH key
   - Coordinate first nginx reload + certbot run

---

**Last reviewed:** _tanggal isi setelah jalankan script_
**Reviewer (IDE Asia ops):** Ari Christian
