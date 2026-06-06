# Carsel Club — Production Deploy Runbook (ARCHIVED)

> 🛑 **ARCHIVED — 2026-06-06**: VPS target dibatalkan. Carsel Club pindah ke VPS kosong `212.85.24.151`. Runbook baru: `DEPLOY_RUNBOOK_FRESH_VPS.md`.
> Dokumen ini disimpan sebagai referensi pattern (sudoers, systemd, nginx config). JANGAN dieksekusi terhadap VPS lama 72.60.74.202.

**Target (BATAL):** `https://carsel.club` di VPS `72.60.74.202` (shared dgn `ide.asia`)

---

## Konvensi cara baca

Setiap step berformat:

```
### Step N.M — Judul
🎯 Tujuan: kenapa step ini dilakukan
👤 Run as: user yang menjalankan
⏱ Estimasi: durasi
🟢/🟡/🔴 Risk: dampak ke IDE Asia kalau gagal

$ <command>
# Expected output:
# <yang harus muncul>

❓ Verifikasi: cara cek step ini sukses
↩  Rollback: cara undo kalau gagal
```

Risk legenda:
- 🟢 **Zero risk** untuk IDE Asia — boleh kapan saja
- 🟡 **Touches shared service** (nginx/postgres reload) — perlu hati-hati
- 🔴 **Critical** — bisa downtime IDE Asia. WAJIB di maintenance window + PIC standby

---

# PHASE 0 — Pre-flight Checks (H-7, 30 menit)

## Step 0.1 — Login VPS sebagai root, snapshot state

🎯 Backup config existing sebelum sentuh apa pun
👤 Run as: `root`
⏱ 5 menit
🟢 Zero risk

```bash
ssh root@72.60.74.202

# Buat folder backup
mkdir -p /var/backups/carsel-preinstall
cd /var/backups/carsel-preinstall

# Snapshot config existing
nginx -T > nginx-snapshot.txt 2>&1
crontab -l > root-crontab-snapshot.txt 2>&1
ls -laR /etc/letsencrypt/live/ > certs-snapshot.txt 2>&1
systemctl list-units --type=service --state=running > services-snapshot.txt 2>&1
pm2 jlist > pm2-snapshot.json 2>&1 || echo "pm2 not available globally" > pm2-snapshot.json
free -h > memory-snapshot.txt
df -hT > disk-snapshot.txt
ss -tlnp > ports-snapshot.txt

# Cek isi
ls -la
```

❓ **Verifikasi**: 8 file di-create, semuanya tidak kosong (kecuali pm2 kalau memang tidak ada).

↩ **Rollback**: tidak ada — read-only.

---

## Step 0.2 — Cek port 3030 benar-benar kosong

🎯 Confirm port internal Carsel tidak collision
👤 Run as: `root`
⏱ 1 menit
🟢 Zero risk

```bash
ss -tlnp | grep -E ':(3030|3100|3000)\b'
```

❓ **Expected**: hanya port 3000 yang muncul (dipakai IDE Asia/PM2). Port 3030 + 3100 kosong.

Kalau 3030 ternyata dipakai, pilih port lain (3100 / 3001 / 8080). Catat di catatan.

---

## Step 0.3 — Cek Postgres benar-benar belum ada

🎯 Confirm strategi install fresh
👤 Run as: `root`
⏱ 1 menit
🟢 Zero risk

```bash
systemctl list-unit-files | grep postgres
dpkg -l | grep -E 'postgresql|postgres-' | head -10
ls /etc/postgresql/ 2>/dev/null
ls /var/lib/postgresql/ 2>/dev/null
docker ps -a 2>/dev/null | grep -i postgres
```

❓ **Expected**: semua command return kosong atau "not found".

🚨 **Kalau ada Postgres existing**: STOP. Strategy beda — pakai cluster yang ada, buat DB+role baru. Hubungi PIC.

---

## Step 0.4 — Cek Node.js + npm

🎯 Confirm versi Node ≥ 20 (Next.js 16 require)
👤 Run as: `root`
⏱ 1 menit
🟢 Zero risk

```bash
node -v
npm -v
which node
```

❓ **Expected**: `v20.x.x` atau lebih tinggi.

Kalau < v20: lihat **Appendix A** untuk upgrade. JANGAN upgrade kalau IDE Asia depend pada versi spesifik — koordinasi dulu.

---

## Step 0.5 — Cek nginx + certbot ready

🎯 Confirm tooling production ready
👤 Run as: `root`
⏱ 1 menit
🟢 Zero risk

```bash
nginx -v
nginx -t
certbot --version
certbot plugins | grep nginx
ls /etc/nginx/sites-available/
ls /etc/nginx/sites-enabled/
```

❓ **Expected**:
- nginx test passes (`syntax is ok, test is successful`)
- certbot plugins menampilkan `nginx`
- `sites-enabled` ada `idea-website` (atau nama lain) symlink

---

# PHASE 1 — System Prep (H-7 sd H-5, 1 jam)

## Step 1.1 — Buat user `carsel-deploy`

🎯 User non-root untuk operasi Carsel
👤 Run as: `root`
⏱ 5 menit
🟢 Zero risk

```bash
# Buat user
adduser --disabled-password --gecos "Carsel Deploy" carsel-deploy

# Tambah ke group www-data (untuk akses uploads)
usermod -aG www-data carsel-deploy

# Setup SSH key (Carsel team kirim public key dulu)
mkdir -p /home/carsel-deploy/.ssh
chmod 700 /home/carsel-deploy/.ssh
# PASTE public key Carsel di sini:
cat > /home/carsel-deploy/.ssh/authorized_keys <<'EOF'
ssh-ed25519 AAAA... carsel-deploy@local
EOF
chmod 600 /home/carsel-deploy/.ssh/authorized_keys
chown -R carsel-deploy:carsel-deploy /home/carsel-deploy/.ssh

# Test login dari mesin Carsel:
# ssh carsel-deploy@72.60.74.202
```

❓ **Verifikasi**: dari mesin dev Carsel, `ssh carsel-deploy@72.60.74.202` → masuk tanpa password.

↩ **Rollback**: `userdel -r carsel-deploy`

---

## Step 1.2 — Setup sudoers minimal untuk carsel-deploy

🎯 User bisa restart service-nya sendiri tanpa root
👤 Run as: `root`
⏱ 3 menit
🟢 Zero risk

```bash
# Pakai visudo.d (file terpisah)
cat > /etc/sudoers.d/carsel-deploy <<'EOF'
# Carsel deploy minimal sudoers
carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl start carsel-next.service
carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl stop carsel-next.service
carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl restart carsel-next.service
carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl reload carsel-next.service
carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl status carsel-next.service
carsel-deploy ALL=(ALL) NOPASSWD:/usr/bin/journalctl -u carsel-next.service *
carsel-deploy ALL=(ALL) NOPASSWD:/usr/sbin/nginx -t
carsel-deploy ALL=(ALL) NOPASSWD:/bin/systemctl reload nginx
EOF
chmod 440 /etc/sudoers.d/carsel-deploy

# Validate
visudo -c -f /etc/sudoers.d/carsel-deploy
```

❓ **Verifikasi**: `visudo -c` print `parsed OK`. Lalu dari user `carsel-deploy`:
```bash
sudo -n systemctl status nginx  # should NOT prompt password but might say "not in sudoers" for this — that's OK, hanya yg di-whitelist yang lewat
```

↩ **Rollback**: `rm /etc/sudoers.d/carsel-deploy`

---

## Step 1.3 — Buat folder structure Carsel

🎯 Folder app + uploads + backup
👤 Run as: `root`
⏱ 2 menit
🟢 Zero risk

```bash
mkdir -p /var/www/carsel-club
mkdir -p /var/www/carsel-uploads
mkdir -p /var/backups/carsel/{postgres,uploads}

# Ownership
chown carsel-deploy:carsel-deploy /var/www/carsel-club
chown carsel-deploy:www-data /var/www/carsel-uploads
chmod 755 /var/www/carsel-uploads

chown -R root:root /var/backups/carsel
chmod 750 /var/backups/carsel
```

❓ **Verifikasi**:
```bash
ls -la /var/www/ | grep carsel
ls -la /var/backups/carsel/
```

---

## Step 1.4 — Install Postgres 16

🎯 Database backend untuk Carsel
👤 Run as: `root`
⏱ 10 menit
🟡 Touches system (apt install + service start)

```bash
# Tambah PGDG repo (versi 16 stable)
apt update
apt install -y curl ca-certificates lsb-release gnupg
install -d /usr/share/postgresql-common/pgdg
curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

apt update
apt install -y postgresql-16 postgresql-client-16

# Verify
systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

❓ **Expected**:
- `systemctl status postgresql` → active (running)
- `SELECT version()` → `PostgreSQL 16.x ...`

❓ **Verifikasi config**:
```bash
grep listen_addresses /etc/postgresql/16/main/postgresql.conf
# Should be: listen_addresses = 'localhost'  (default)

ss -tlnp | grep 5432
# Should be: 127.0.0.1:5432 (NOT 0.0.0.0)
```

↩ **Rollback**:
```bash
apt purge -y postgresql-16 postgresql-client-16
rm -rf /etc/postgresql/16 /var/lib/postgresql/16
```

---

## Step 1.5 — Buat DB + role Carsel

🎯 Isolated user untuk app — minimum privilege
👤 Run as: `postgres`
⏱ 5 menit
🟢 Zero risk

```bash
# Generate password kuat dulu
PG_PASS=$(openssl rand -base64 32 | tr -d '+/=' | head -c 32)
echo "Postgres password (SAVE TO PASSWORD MANAGER): $PG_PASS"

# Buat DB + role
sudo -u postgres psql <<EOF
CREATE ROLE carsel_app WITH LOGIN PASSWORD '$PG_PASS';
CREATE DATABASE carsel_club OWNER carsel_app ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;
\c carsel_club
GRANT ALL PRIVILEGES ON DATABASE carsel_club TO carsel_app;
GRANT ALL ON SCHEMA public TO carsel_app;
EOF

# Test connection
PGPASSWORD="$PG_PASS" psql -h localhost -U carsel_app -d carsel_club -c "SELECT current_database(), current_user;"
```

❓ **Expected**: connection test sukses, return `carsel_club | carsel_app`.

⚠️ **Save**: copy `PG_PASS` ke password manager Carsel team SEKARANG. Tidak akan re-displayed.

↩ **Rollback**:
```bash
sudo -u postgres psql -c "DROP DATABASE carsel_club; DROP ROLE carsel_app;"
```

---

# PHASE 2 — App Deploy (H-5 sd H-3, 1 jam)

## Step 2.1 — Setup GitHub deploy key

🎯 `carsel-deploy` bisa `git pull` dari repo
👤 Run as: `carsel-deploy`
⏱ 5 menit
🟢 Zero risk

```bash
# Login sebagai carsel-deploy
su - carsel-deploy

# Generate deploy key (read-only, no passphrase untuk auto-pull)
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "carsel-deploy@72.60.74.202"

# Print public key — paste ke GitHub:
# Settings → Deploy keys → Add deploy key → UNCHECK "Allow write access"
cat ~/.ssh/github_deploy.pub

# Configure SSH untuk pakai key ini saat akses github.com
cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking accept-new
EOF
chmod 600 ~/.ssh/config

# Test
ssh -T git@github.com
# Expected: "Hi <repo-name>! You've successfully authenticated, but GitHub does not provide shell access."
```

---

## Step 2.2 — Clone repo

🎯 Source code di `/var/www/carsel-club/`
👤 Run as: `carsel-deploy`
⏱ 2 menit
🟢 Zero risk

```bash
cd /var/www
# Repo URL — adjust kalau di organization
git clone git@github.com:<USER-OR-ORG>/carsel-club.git carsel-club
cd carsel-club
git checkout main  # atau release tag stable
git log -1
```

❓ **Verifikasi**: `git log -1` print commit terakhir. Folder `/var/www/carsel-club` berisi `package.json`, `app/`, `lib/`, dst.

---

## Step 2.3 — Install dependencies + build

🎯 Production build siap di-serve
👤 Run as: `carsel-deploy`
⏱ 10–15 menit (build paling lama)
🟢 Zero risk

```bash
cd /var/www/carsel-club

# Install deps (production install, no devDeps)
npm ci --omit=dev

# Tapi build BUTUH devDeps (TypeScript, tailwind, dst) — install ulang full
npm ci

# Build
npm run build
# Wait ~5–10 menit untuk Next.js 16 + Turbopack

# Setelah build sukses, prune devDeps untuk hemat disk
npm prune --omit=dev
```

❓ **Verifikasi**:
- Folder `.next/` dan `.next/standalone/` ada
- `du -sh .next` → ~100–300 MB

❌ **Kalau build gagal**: cek pesan error. Common: `sharp` compile fail → `npm rebuild sharp`. Node version mismatch → cek `package.json` engines.

---

## Step 2.4 — Buat `.env.local` production

🎯 Environment vars production
👤 Run as: `carsel-deploy`
⏱ 5 menit
🟢 Zero risk

```bash
cd /var/www/carsel-club

# Generate secrets
AUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)
VAPID_PUBLIC=$(npx web-push generate-vapid-keys | grep Public | awk '{print $NF}')
VAPID_PRIVATE=$(npx web-push generate-vapid-keys | grep Private | awk '{print $NF}')

cat > .env.local <<EOF
# === Database ===
DATABASE_URL=postgres://carsel_app:REPLACE_WITH_PG_PASS@localhost:5432/carsel_club

# === App ===
NEXT_PUBLIC_APP_URL=https://carsel.club

# === WhatsApp (Wablas) ===
WABLAS_TOKEN=REPLACE_WITH_REAL_TOKEN
WABLAS_API_URL=https://solo.wablas.com/api/send-message
WABLAS_SECRET_KEY=REPLACE_WITH_REAL_SECRET

# === Auth ===
AUTH_SESSION_SECRET=$AUTH_SECRET

# === Storage ===
UPLOAD_DIR=/var/www/carsel-uploads
NEXT_PUBLIC_UPLOAD_URL_BASE=/uploads
MAX_UPLOAD_BYTES=10485760

# === Cron + Logs ===
CRON_SECRET=$CRON_SECRET
LOG_RETENTION_DAYS=30

# === Web Push (VAPID) ===
NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC
VAPID_PRIVATE_KEY=$VAPID_PRIVATE
VAPID_SUBJECT=mailto:arichrst@ide.asia

# === Node ===
NODE_ENV=production
PORT=3030
EOF

# Permission ketat — hanya carsel-deploy yang bisa baca
chmod 600 .env.local

# Edit dan replace placeholder REPLACE_WITH_*
nano .env.local
```

❓ **Verifikasi**:
- `cat .env.local | grep -c REPLACE` → harus return `0` (semua placeholder sudah diisi)
- `stat -c %a .env.local` → `600`

⚠️ **WAJIB**: copy semua secret yang di-generate ke password manager.

---

## Step 2.5 — Run database migrations

🎯 Schema Postgres up-to-date
👤 Run as: `carsel-deploy`
⏱ 2 menit
🟢 Zero risk

```bash
cd /var/www/carsel-club

# Drizzle migration (sesuai script di package.json)
npm run db:migrate
# Atau kalau pakai drizzle-kit langsung:
# npx drizzle-kit migrate

# Verify schema
sudo -u postgres psql carsel_club -c "\dt"
```

❓ **Expected**: list tables muncul (users, sessions, matches, dst).

↩ **Rollback**: kalau migration setengah jalan dan error:
```bash
sudo -u postgres psql -c "DROP DATABASE carsel_club; CREATE DATABASE carsel_club OWNER carsel_app;"
# Lalu jalankan migrate ulang dari awal
```

---

## Step 2.6 — Seed data awal (tier definitions, achievements)

🎯 Lookup tables yang app butuh dari awal
👤 Run as: `carsel-deploy`
⏱ 2 menit
🟢 Zero risk

```bash
cd /var/www/carsel-club
npm run db:seed
# Atau: tsx scripts/seed.ts
```

❓ **Verifikasi**:
```bash
sudo -u postgres psql carsel_club -c "SELECT count(*) FROM tier_definitions;"
# Expected: 6 (Rookie, Bronze, Silver, Gold, Platinum, Master)
```

---

# PHASE 3 — Service Setup (H-3, 30 menit)

## Step 3.1 — Buat systemd service file

🎯 Auto-start + restart kalau crash
👤 Run as: `root`
⏱ 5 menit
🟢 Zero risk

```bash
cat > /etc/systemd/system/carsel-next.service <<'EOF'
[Unit]
Description=Carsel Club Next.js app
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=carsel-deploy
Group=carsel-deploy
WorkingDirectory=/var/www/carsel-club
Environment=NODE_ENV=production
Environment=PORT=3030
EnvironmentFile=/var/www/carsel-club/.env.local

# Standalone Next.js: jalankan node server.js
# (kalau pakai mode non-standalone, ganti ke: ExecStart=/usr/bin/npm start)
ExecStart=/usr/bin/node /var/www/carsel-club/.next/standalone/server.js

Restart=on-failure
RestartSec=10s
StandardOutput=journal
StandardError=journal

# Resource limits
MemoryMax=1G
TasksMax=200

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/carsel-uploads /var/www/carsel-club

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
```

⚠️ **PENTING**: kalau Next.js bukan standalone mode, ganti `ExecStart` ke:
```
ExecStart=/usr/bin/npm start
```
Cek `next.config.ts` → `output: 'standalone'` ada atau tidak.

---

## Step 3.2 — Start service + verify smoke test

🎯 App jalan di localhost:3030
👤 Run as: `root`
⏱ 3 menit
🟡 First start

```bash
systemctl start carsel-next.service
sleep 5
systemctl status carsel-next.service

# Smoke test internal
curl -I http://127.0.0.1:3030/
# Expected: HTTP/1.1 200 OK atau 307 (redirect ke /login)

# Cek logs
journalctl -u carsel-next.service -n 50 --no-pager
```

❓ **Expected**:
- `systemctl status` → `active (running)`
- `curl 127.0.0.1:3030` → respon 200/302/307 (bukan connection refused)
- Logs: `▲ Next.js 16.x ... Ready in Xms`

❌ **Kalau gagal**:
- `Connection refused` → port salah / app crash. Cek `journalctl -u carsel-next -n 100`
- `Cannot find module` → dependencies belum lengkap. `npm install` ulang
- DB error → cek `DATABASE_URL` di `.env.local`

↩ **Rollback**:
```bash
systemctl stop carsel-next.service
systemctl disable carsel-next.service
```

---

## Step 3.3 — Enable auto-start

🎯 Service start otomatis saat VPS reboot
👤 Run as: `root`
⏱ 1 menit
🟢 Zero risk

```bash
systemctl enable carsel-next.service
systemctl is-enabled carsel-next.service
# Expected: enabled
```

---

# PHASE 4 — Nginx + SSL (H-1, **Maintenance Window**, 30 menit)

> 🔴 **CRITICAL PHASE** — sentuh nginx production. WAJIB:
> - Window: Sabtu 02:00–06:00 WIB
> - PIC IDE Asia standby 30 menit
> - Backup config existing sudah ada di `/var/backups/carsel-preinstall/nginx-snapshot.txt`

## Step 4.1 — Set DNS A record

🎯 `carsel.club` → 72.60.74.202
👤 Run by: Carsel team di registrar/Cloudflare
⏱ 5 menit + propagasi
🟢 Zero risk di VPS

```
A     carsel.club        → 72.60.74.202   TTL 300
A     www.carsel.club    → 72.60.74.202   TTL 300
```

⚠️ Kalau pakai Cloudflare: **DNS-only (gray cloud)** saat deploy. Orange-cloud nanti setelah cert OK.

❓ **Verifikasi** (dari mesin manapun):
```bash
dig +short carsel.club @1.1.1.1
dig +short www.carsel.club @1.1.1.1
# Expected: 72.60.74.202
```

Tunggu sampai propagasi OK (5–15 menit) sebelum lanjut Step 4.4.

---

## Step 4.2 — Backup nginx config existing (DOUBLE CHECK)

🎯 Safety net sebelum tambah server block
👤 Run as: `root`
⏱ 1 menit
🟢 Zero risk

```bash
cp -r /etc/nginx /var/backups/carsel-preinstall/nginx-etc-$(date +%Y%m%d-%H%M%S)
nginx -T > /var/backups/carsel-preinstall/nginx-config-pre-carsel.txt 2>&1
```

---

## Step 4.3 — Buat nginx server block (HTTP only dulu)

🎯 Validasi config sebelum HTTPS
👤 Run as: `root`
⏱ 5 menit
🟡 Edit nginx config

```bash
cat > /etc/nginx/sites-available/carsel.club <<'EOF'
# HTTP only — sementara, sebelum certbot pasang HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name carsel.club www.carsel.club;

    # ACME challenge untuk Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Sementara, proxy semua ke Next.js. Certbot akan replace ini ke HTTPS.
    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Folder untuk ACME challenge
mkdir -p /var/www/certbot
chown www-data:www-data /var/www/certbot

# Enable
ln -s /etc/nginx/sites-available/carsel.club /etc/nginx/sites-enabled/

# TEST DRY-RUN dulu — JANGAN reload kalau test gagal
nginx -t
```

❓ **Expected**: `syntax is ok` + `test is successful`.

❌ **Kalau test gagal**:
```bash
# Inspect error
nginx -t
# Disable symlink
rm /etc/nginx/sites-enabled/carsel.club
nginx -t  # confirm IDE Asia masih OK
```

↩ **Rollback total** kalau dipakai sebagai langkah safety:
```bash
rm /etc/nginx/sites-enabled/carsel.club
rm /etc/nginx/sites-available/carsel.club
nginx -t && systemctl reload nginx
```

---

## Step 4.4 — Reload nginx (CRITICAL)

🎯 Aktifkan server block baru
👤 Run as: `root`
⏱ 1 menit
🔴 Touches IDE Asia indirectly

```bash
# Reload — graceful, tidak putus koneksi IDE Asia
systemctl reload nginx

# Verify nginx tetap healthy
systemctl status nginx
curl -I http://ide.asia/  # smoke test IDE Asia masih jalan
curl -I http://carsel.club/  # smoke test Carsel
```

❓ **Expected**:
- `nginx active (running)` (bukan failed)
- IDE Asia respon normal (200 atau 301 ke HTTPS)
- Carsel respon 200/307

❌ **Kalau IDE Asia tiba-tiba error**: ROLLBACK SEGERA:
```bash
rm /etc/nginx/sites-enabled/carsel.club
nginx -t && systemctl reload nginx
# Notify PIC IDE Asia
```

---

## Step 4.5 — Jalankan certbot untuk HTTPS

🎯 SSL cert dari Let's Encrypt + auto-config nginx ke HTTPS
👤 Run as: `root`
⏱ 5 menit
🟡 Touches nginx config

```bash
certbot --nginx \
  -d carsel.club -d www.carsel.club \
  -m arichrst@ide.asia \
  --agree-tos --redirect --no-eff-email

# Certbot akan:
# 1. Validasi domain via HTTP-01 challenge
# 2. Dapat cert
# 3. Edit /etc/nginx/sites-available/carsel.club → tambah server block HTTPS
# 4. Reload nginx
```

❓ **Expected**: "Congratulations! ... Successfully received certificate." + nginx reload sukses.

❌ **Kalau gagal**:
- DNS belum propagasi → tunggu lagi
- Cloudflare proxy aktif → matikan dulu (gray cloud)
- Port 80 di-block → cek UFW + cloud firewall

---

## Step 4.6 — Smoke test HTTPS + uploads serving

🎯 Verify production-ready
👤 Run as: `root`
⏱ 5 menit
🟢 Zero risk

```bash
# Cert info
certbot certificates | grep carsel

# Test HTTPS
curl -I https://carsel.club/
curl -I https://www.carsel.club/

# Test redirect HTTP → HTTPS
curl -I http://carsel.club/
# Expected: 301 redirect ke https://

# Test IDE Asia masih OK
curl -I https://ide.asia/
```

❓ **Expected**: semua respon HTTP 200/301/307, tidak ada 5xx.

---

## Step 4.7 — Tune nginx Carsel — uploads alias + static caching

🎯 Static file diserve nginx langsung (bukan via Node)
👤 Run as: `root`
⏱ 5 menit
🟡 Edit nginx config

Certbot sudah generate config dasar. Tambah `location /uploads/` + `location /_next/static/`. Edit `/etc/nginx/sites-available/carsel.club`:

```bash
# Buka editor
nano /etc/nginx/sites-available/carsel.club
```

Di dalam server block HTTPS (yang generate certbot), tambah **sebelum** `location / { proxy_pass ... }`:

```nginx
    # Body size limit (server-side guard)
    client_max_body_size 12M;

    # Static uploads — direct serve
    location /uploads/ {
        alias /var/www/carsel-uploads/;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options nosniff;
        autoindex off;
        try_files $uri =404;
    }

    # Next.js static assets — di .next/standalone/.next/static
    location /_next/static/ {
        alias /var/www/carsel-club/.next/standalone/.next/static/;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public assets (icon.png, full-logo.png, manifest, sw.js)
    location /sw.js {
        alias /var/www/carsel-club/public/sw.js;
        add_header Cache-Control "no-cache";
    }
    location /manifest.webmanifest {
        alias /var/www/carsel-club/public/manifest.webmanifest;
        add_header Cache-Control "public, max-age=3600";
    }
```

Lalu:

```bash
nginx -t
# Hanya kalau test pass:
systemctl reload nginx

# Verify
curl -I https://carsel.club/icon.png
# Expected: 200, Cache-Control: public, max-age=31536000
```

---

# PHASE 5 — Backup & Monitoring (H+1, 30 menit)

## Step 5.1 — Postgres backup cron harian

🎯 Daily dump + retention 7 hari
👤 Run as: `root`
⏱ 5 menit
🟢 Zero risk

```bash
cat > /etc/cron.d/carsel-postgres-backup <<'EOF'
# Daily Postgres backup untuk Carsel — jam 02:30 WIB
30 2 * * * postgres /usr/local/bin/carsel-pg-backup.sh
EOF

cat > /usr/local/bin/carsel-pg-backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
DATE=$(date +%Y%m%d-%H%M)
OUT=/var/backups/carsel/postgres/carsel_club-$DATE.sql.gz
pg_dump --no-owner --no-acl carsel_club | gzip > "$OUT"
chmod 600 "$OUT"
# Retention 7 hari
find /var/backups/carsel/postgres -name 'carsel_club-*.sql.gz' -mtime +7 -delete
echo "[$(date)] Backup OK: $OUT ($(du -h "$OUT" | cut -f1))" >> /var/log/carsel-backup.log
EOF
chmod 755 /usr/local/bin/carsel-pg-backup.sh

# Test sekali manual
sudo -u postgres /usr/local/bin/carsel-pg-backup.sh
ls -la /var/backups/carsel/postgres/
```

❓ **Verifikasi**: file `.sql.gz` ada, size ~10–100 KB (DB masih kosong).

---

## Step 5.2 — Uploads backup mingguan ke offsite (opsional H+1)

🎯 Foto session aman kalau VPS hilang
👤 Run as: `root`
⏱ 15 menit (setup rclone + B2/R2)

Lihat **Appendix B** — perlu credential B2/R2 dulu.

---

## Step 5.3 — UptimeRobot endpoint

🎯 Alert kalau Carsel down
👤 Run by: Carsel team via UptimeRobot dashboard
⏱ 3 menit
🟢 Zero risk

- URL: `https://carsel.club/api/health` (cek endpoint ini ada — kalau belum, buat)
- Interval: 5 menit
- Alert: email + WhatsApp via Pushover

---

## Step 5.4 — Sentry (opsional)

Lihat **Appendix C**.

---

# PHASE 6 — Update / Maintenance Flow (rutin)

## Deploy update kode

Setiap kali ada commit baru ke `main`:

```bash
# SSH sebagai carsel-deploy
ssh carsel-deploy@72.60.74.202

cd /var/www/carsel-club
git pull origin main
npm ci
npm run build
npm prune --omit=dev
sudo systemctl restart carsel-next.service

# Smoke test
sleep 3
curl -I https://carsel.club/
```

⏱ Total: ~5–10 menit. **Downtime: ~5–10 detik** saat restart (cold start Next.js).

## DB migration baru

```bash
cd /var/www/carsel-club
git pull
npm ci
npm run db:migrate  # Drizzle akan apply migration baru
npm run build
sudo systemctl restart carsel-next.service
```

⚠️ Untuk migration breaking (DROP COLUMN dst), backup dulu manual:
```bash
sudo -u postgres /usr/local/bin/carsel-pg-backup.sh
# Lalu baru migrate
```

---

# Appendix A — Upgrade Node.js ke v20

Kalau Node existing < v20:

```bash
# Pakai NodeSource setup
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v
# Expected: v20.x.x
```

⚠️ Kalau IDE Asia jalan di Node yg sama, koordinasi dulu — restart PM2 dia setelah upgrade.

---

# Appendix B — Offsite backup ke Cloudflare R2

```bash
apt install -y rclone

# Setup R2 credentials (interactive)
rclone config
# Pilih: New remote → name "r2" → type "s3" → provider "Cloudflare"
# Region: auto, endpoint: https://<account-id>.r2.cloudflarestorage.com

# Test
rclone ls r2:carsel-backups

# Cron weekly
cat > /etc/cron.d/carsel-uploads-offsite <<'EOF'
# Mingguan: Minggu 03:00 WIB — sync uploads ke R2
0 3 * * 0 root /usr/bin/rclone sync /var/www/carsel-uploads/ r2:carsel-uploads/ --max-age 30d
EOF
```

---

# Appendix C — Sentry setup

```bash
cd /var/www/carsel-club
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# Ikuti wizard — tambah SENTRY_DSN ke .env.local
sudo systemctl restart carsel-next.service
```

---

# Appendix D — Rollback emergency (production cutover gagal)

Kalau Carsel break dan IDE Asia tidak terdampak:

```bash
# Stop service Carsel
sudo systemctl stop carsel-next.service
sudo systemctl disable carsel-next.service

# Disable nginx site
sudo rm /etc/nginx/sites-enabled/carsel.club
sudo nginx -t && sudo systemctl reload nginx

# Carsel sekarang 404, IDE Asia tetap normal
```

Kalau IDE Asia kena impact (extreme case):

```bash
# Restore nginx config dari snapshot
sudo cp -r /var/backups/carsel-preinstall/nginx-etc-* /etc/nginx
sudo nginx -t && sudo systemctl reload nginx

# Notify PIC SEGERA
```

---

# Appendix E — Health check checklist

Run setelah deploy + tiap morning check:

```bash
# Service status
systemctl is-active carsel-next.service nginx postgresql
# Expected: 3x "active"

# Disk
df -h / /var | awk '{print $5, $6}'
# Alert kalau > 80%

# Memory
free -h | awk '/Mem:/ {print "Used:", $3, "Free:", $4}'

# Postgres
sudo -u postgres psql carsel_club -c "SELECT count(*) FROM users; SELECT count(*) FROM sessions;"

# Cert expiry
certbot certificates | grep -E "carsel|VALID"

# Backup latest
ls -lh /var/backups/carsel/postgres/ | tail -3

# HTTP smoke
curl -sI https://carsel.club/ | head -1
curl -sI https://carsel.club/icon.png | head -1
```

---

**End of runbook.** Pertanyaan: tag PIC infra.

**Last updated:** Sprint 50 deploy planning
