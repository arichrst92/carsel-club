# Carsel Club — Pre-Deploy VPS Questionnaire (ARCHIVED)

> 🛑 **ARCHIVED — 2026-06-06**: VPS target pindah ke `212.85.24.151` (kosong). Dokumen ini & file `VPS_PREDEPLOY_ANSWERS.md` + `VPS_PREDEPLOY_FEEDBACK.md` tidak relevan lagi. Simpan untuk referensi.

**Tujuan (BATAL):** Mengumpulkan info VPS sebelum deploy Carsel Club ke `carsel.club` (IP `72.60.74.202`) — supaya **tidak mengganggu website lain** yang sudah jalan di server tersebut.

**Cara isi:** Jalankan setiap perintah di kolom **Cek**, lalu paste output ke kolom **Jawaban / Output**. Kalau tidak yakin atau ragu, isi "tidak tahu" — lebih aman.

**Catatan keamanan:** Hindari menyertakan password, secret, atau private key di dokumen ini. Untuk file `.env` atau secret, sebut nama variabelnya saja (mis. "DB password sudah disimpan di password manager").

---

## 0. Akses VPS

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 0.1 | Username SSH untuk deploy (sebaiknya bukan root) | — | |
| 0.2 | Login pakai SSH key atau password? | `cat ~/.ssh/authorized_keys \| wc -l` | |
| 0.3 | User punya akses `sudo` tanpa password? | `sudo -n true && echo YES \|\| echo NO` | |
| 0.4 | OS + versi | `lsb_release -d ; uname -r` | |
| 0.5 | Arsitektur CPU | `uname -m` | |
| 0.6 | Total RAM + free RAM saat ini | `free -h` | |
| 0.7 | Disk usage + free space | `df -h /` | |
| 0.8 | Timezone server | `timedatectl \| grep zone` | |

---

## 1. Website Lain yang Sudah Jalan

> Ini paling kritikal — kita harus tahu apa saja yang akan terdampak.

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 1.1 | Daftar domain yang sudah jalan di VPS ini (sebutkan semua) | — | |
| 1.2 | Estimasi traffic per domain (low/medium/high) | — | |
| 1.3 | Ada SLA/uptime requirement? Jam berapa boleh maintenance window? | — | |
| 1.4 | Folder root tiap website ada di mana? | `ls -la /var/www/ ; ls -la /srv/ ; ls -la /home/*/` | |
| 1.5 | Ada apps yang listen di port `3000`, `3001`, `3002`, `3030`? (Carsel butuh 1 port internal) | `sudo ss -tlnp \| grep -E ':(3000\|3001\|3002\|3030)'` | |
| 1.6 | Semua port yang sedang listen | `sudo ss -tlnp` | |

---

## 2. Web Server (Reverse Proxy)

> Tergantung apa yang sudah ada — Nginx / Apache / Caddy — config Carsel beda.

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 2.1 | Web server utama apa? | `systemctl is-active nginx apache2 caddy httpd 2>/dev/null` | |
| 2.2 | Versi-nya | `nginx -v 2>&1` atau `apache2 -v` atau `caddy version` | |
| 2.3 | Path config | `ls /etc/nginx/sites-enabled/ ; ls /etc/apache2/sites-enabled/ ; ls /etc/caddy/` | |
| 2.4 | Daftar server_name / domain yang sudah dikonfigurasi (PENTING — supaya tidak collision) | `sudo nginx -T \| grep server_name` atau `sudo apache2ctl -S` | |
| 2.5 | Apakah ada `default_server` block? | `sudo nginx -T \| grep -E 'default_server\|listen .* default'` | |
| 2.6 | Bisakah kita tambah server block baru tanpa restart paksa? (sebaiknya pakai `reload`, bukan `restart`) | — | |
| 2.7 | Cara reload yang biasa dipakai | `sudo nginx -s reload` / `sudo systemctl reload nginx` | |

---

## 3. Postgres

> Carsel butuh Postgres 14+ (idealnya 16).

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 3.1 | Postgres sudah jalan? | `sudo systemctl is-active postgresql` | |
| 3.2 | Versi-nya | `psql --version ; sudo -u postgres psql -c 'SELECT version();'` | |
| 3.3 | Port (default 5432) | `sudo ss -tlnp \| grep postgres` | |
| 3.4 | Listen di localhost saja atau public? (HARUS localhost) | `sudo cat /etc/postgresql/*/main/postgresql.conf \| grep listen_addresses` | |
| 3.5 | Daftar DB existing (supaya kita kasih nama yang tidak bentrok) | `sudo -u postgres psql -l` | |
| 3.6 | Daftar role/user existing | `sudo -u postgres psql -c '\du'` | |
| 3.7 | Konfigurasi `pg_hba.conf` (auth method untuk localhost) | `sudo cat /etc/postgresql/*/main/pg_hba.conf \| grep -v ^#` | |
| 3.8 | Postgres jalan native atau di Docker? | `docker ps \| grep -i postgres ; systemctl status postgresql` | |
| 3.9 | Tablespace lokasi data | `sudo -u postgres psql -c 'SHOW data_directory;'` | |
| 3.10 | Apakah ada backup routine yang sudah jalan untuk DB lain? | `crontab -l ; ls /etc/cron.d/` | |

**Rencana Carsel:**
- DB name: `carsel_club`
- Role: `carsel_app`
- Tolong **konfirmasi** kalau ini bentrok dengan existing.

---

## 4. Node.js & Process Manager

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 4.1 | Node.js sudah ter-install? Versinya? (butuh 20+) | `node -v ; which node` | |
| 4.2 | Pakai system Node, nvm, atau lainnya? | `ls ~/.nvm 2>/dev/null ; which node` | |
| 4.3 | Sudah ada PM2 / systemd / Docker untuk app lain? | `pm2 list 2>/dev/null ; systemctl list-units --type=service \| grep -iE 'node\|next'` | |
| 4.4 | Boleh kita pakai systemd service baru bernama `carsel-next.service`? | — | |
| 4.5 | Kalau pakai PM2: nama yang available | `pm2 list` | |
| 4.6 | npm / pnpm / yarn yang dipakai | `npm -v ; pnpm -v 2>/dev/null ; yarn -v 2>/dev/null` | |

---

## 5. SSL / Certbot

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 5.1 | Certbot terinstall? Versi? | `certbot --version` | |
| 5.2 | Plugin yang aktif (HARUS pakai nginx/apache plugin, JANGAN `--standalone` karena akan matikan web server) | `certbot plugins` | |
| 5.3 | Sertifikat existing untuk domain lain | `sudo certbot certificates` | |
| 5.4 | Auto-renew sudah jalan? | `sudo systemctl status certbot.timer` atau `sudo crontab -l \| grep certbot` | |
| 5.5 | Email yang dipakai untuk register Let's Encrypt | — | |

---

## 6. Firewall

| # | Pertanyaan | Cek | Jawaban / Output |
|---|---|---|---|
| 6.1 | UFW aktif? | `sudo ufw status verbose` | |
| 6.2 | iptables rules custom? | `sudo iptables -L -n \| head -30` | |
| 6.3 | Cloud-level firewall (Hetzner / Vultr / DigitalOcean) yang membatasi inbound? | — | |
| 6.4 | Port 80, 443 sudah dibuka (untuk Let's Encrypt + HTTPS)? | `sudo ufw status \| grep -E '80\|443'` | |

---

## 7. DNS / Domain

| # | Pertanyaan | Jawaban |
|---|---|---|
| 7.1 | Registrar domain `carsel.club` (Niagahoster / GoDaddy / Cloudflare / dst) | |
| 7.2 | DNS pakai default registrar atau Cloudflare? | |
| 7.3 | Apakah `carsel.club` sudah pernah pointing ke IP lain sebelumnya? Kalau iya, IP mana? | |
| 7.4 | Apakah ada email service untuk domain ini? (MX record) Kalau iya — JANGAN dihapus saat update A record. | |
| 7.5 | Sudah siap kita set: `A carsel.club → 72.60.74.202` + `A www.carsel.club → 72.60.74.202`? | |

---

## 8. File Upload Storage

Carsel menyimpan foto avatar + cover + session photos di filesystem (BUKAN ke DB).

| # | Pertanyaan | Jawaban |
|---|---|---|
| 8.1 | Boleh kita pakai `/var/www/carsel-uploads/`? Estimasi 10–50 GB jangka panjang. | |
| 8.2 | Filesystem `/var` ada di partisi mana? Free space? | `df -h /var` |
| 8.3 | Ada policy backup mounted volume / snapshot? | |

---

## 9. Backup & Monitoring

| # | Pertanyaan | Jawaban |
|---|---|---|
| 9.1 | Backup VPS-level (snapshot harian)? Provider apa? Retention berapa hari? | |
| 9.2 | Boleh kita tambah cron backup harian Postgres ke `/var/backups/carsel/`? Berapa hari retention? | |
| 9.3 | Boleh kita kirim backup ke offsite storage (S3 / R2 / rsync ke server lain)? | |
| 9.4 | Ada monitoring/alerting yang sudah jalan? (UptimeRobot / Grafana / Netdata) | |
| 9.5 | Email/Slack channel untuk error alert? | |

---

## 10. CI/CD & Update Flow

Rencana awal: deploy manual via `git pull` di VPS. Bisa upgrade ke GitHub Actions nanti.

| # | Pertanyaan | Jawaban |
|---|---|---|
| 10.1 | Boleh kita clone repo ke `/var/www/carsel-club/`? | |
| 10.2 | SSH key untuk pull dari GitHub bisa di-setup di akun deploy? (deploy key read-only direkomendasikan) | |
| 10.3 | Boleh pakai PM2 / systemd untuk restart otomatis? | |
| 10.4 | Window deployment yang aman (jam berapa traffic paling rendah)? | |

---

## 11. Resource Sizing Sanity Check

Carsel di production butuh kurang lebih:

| Komponen | Estimasi |
|---|---|
| Next.js (Node) RAM | 400–700 MB steady, peak 1 GB saat build |
| Postgres RAM | 200–500 MB (depend on connections + shared_buffers) |
| Disk app | ~500 MB (node_modules + .next) |
| Disk uploads | 10–50 GB jangka panjang |
| CPU | 1 vCPU cukup untuk MVP (< 1000 DAU) |

| # | Pertanyaan | Jawaban |
|---|---|---|
| 11.1 | Total RAM VPS | |
| 11.2 | Berapa RAM yang sudah dipakai app lain saat ini (rata-rata)? | `free -h` lalu cek `used` |
| 11.3 | Free RAM yang bisa di-alokasikan ke Carsel min ~1.5 GB? | |
| 11.4 | Swap aktif? Size? | `free -h \| grep Swap` |

---

## 12. Konvensi yang Harus Disepakati

Supaya tidak salah edit file yang dipakai bersama:

| # | Konvensi | Disetujui? |
|---|---|---|
| 12.1 | Nginx config Carsel pakai file terpisah di `/etc/nginx/sites-available/carsel.club` + symlink ke `sites-enabled/`. **TIDAK** edit `nginx.conf` utama. | |
| 12.2 | Reload Nginx pakai `sudo nginx -t && sudo systemctl reload nginx` (graceful, tidak putus koneksi). **TIDAK** pakai `restart`. | |
| 12.3 | Certbot pakai `--nginx` plugin. **TIDAK** pakai `--standalone`. | |
| 12.4 | Postgres operasi DB cuma di `carsel_club` DB + `carsel_app` user. **TIDAK** sentuh DB lain. | |
| 12.5 | Tidak pernah `sudo systemctl restart postgresql` tanpa koordinasi (akan reset semua koneksi DB sibling apps). Pakai `reload` kalau cuma ubah config. | |
| 12.6 | Internal Next.js port: **konfirmasi port mana yang boleh dipakai** (sarankan 3030 atau 3100 — bukan 3000). | |
| 12.7 | Semua perubahan major (nginx, certbot, postgres) didokumentasikan di runbook + di-share ke channel ops. | |

---

## 13. Hal-hal yang ingin saya cek sendiri (kalau sudah dapat SSH access)

Sebelum eksekusi apa pun, saya akan jalankan **read-only** commands berikut untuk verifikasi:

```bash
# Snapshot state
sudo nginx -T > /tmp/nginx-snapshot.txt 2>&1   # backup config saat ini
sudo -u postgres pg_dumpall --globals-only > /tmp/pg-globals-snapshot.sql
crontab -l > /tmp/crontab-snapshot.txt
ls -laR /etc/letsencrypt/live/ > /tmp/certs-snapshot.txt
sudo systemctl list-units --type=service > /tmp/services-snapshot.txt
```

**Pertanyaan:** Boleh saya simpan snapshot ini di `/var/backups/carsel-preinstall/`?

---

## 14. Eskalasi & Emergency Contact

| # | Pertanyaan | Jawaban |
|---|---|---|
| 14.1 | Siapa PIC infra VPS ini? (nama + kontak) | |
| 14.2 | Kalau ada incident, channel komunikasi apa? (WA / Slack / Telegram) | |
| 14.3 | Akses fisik / console out-of-band (KVM provider) kalau SSH terputus | |
| 14.4 | Maintenance window yang aman: hari + jam? | |

---

## Lampiran A — Skema final yang akan kita pasang

```
/etc/nginx/sites-available/carsel.club           ← config baru (kita yang bikin)
/etc/nginx/sites-enabled/carsel.club             ← symlink

/var/www/carsel-club/                            ← Next.js app (clone dari GitHub)
/var/www/carsel-uploads/                         ← persistent file storage

/etc/systemd/system/carsel-next.service          ← service untuk Node app
/etc/letsencrypt/live/carsel.club/               ← cert Let's Encrypt baru

Postgres:
  DB:   carsel_club
  Role: carsel_app  (LOGIN, owner carsel_club only)
  Port: 5432 (existing cluster, localhost-only)

Internal port Next.js: TBD (sarankan 3030)
```

## Lampiran B — Cara kirim balik jawaban

1. Copy file ini ke editor markdown
2. Isi kolom **Jawaban / Output** (untuk output panjang, attach sebagai file `.txt` terpisah supaya jawaban tetap readable)
3. **JANGAN sertakan password / secret / private key** — sebut nama variabel saja
4. Kirim balik via channel yang sudah disepakati

---

**Last updated:** Sprint 50 pre-deploy planning
