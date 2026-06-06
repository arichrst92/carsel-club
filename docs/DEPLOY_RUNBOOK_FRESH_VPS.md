# Carsel Club — Production Deploy Runbook (Fresh VPS)

**Target:** `https://carsel.club` di VPS **`212.85.24.151`** (kosong, dedicated untuk Carsel)
**Estimasi total durasi:** 60–90 menit (tidak ada co-existence concern, bisa dieksekusi sekali jalan)
**Last updated:** 2026-06-06

> ✅ **Asumsi**: VPS kosong, Ubuntu 22.04 LTS atau 24.04 LTS, akses root SSH, RAM ≥ 2 GB, domain `carsel.club` siap di-point.
> Karena VPS dedicated → bisa pakai port 3000 default, install fresh semua tooling, tidak perlu maintenance window khusus.

---

## Konvensi step

```
### Step N — Judul
🎯 Tujuan
⏱ Estimasi
$ <command>
❓ Verifikasi
```

Semua command dijalankan **as root** kecuali ditulis lain.

---

# PHASE 0 — Info VPS (5 menit, sebelum mulai)

## Step 0.1 — Cek akses + spec dasar

🎯 Confirm bisa login + spec sesuai asumsi
⏱ 2 menit

```bash
ssh root@212.85.24.151

# Cek dasar
lsb_release -d
uname -m
free -h
df -h /
nproc
```

❓ **Expected**:
- OS: Ubuntu 22/24 LTS (kalau Debian/CentOS — sebagian command beda, lihat catatan di bawah)
- Arsitektur: `x86_64`
- RAM: ≥ 2 GB (ideal 4 GB)
- Disk free: ≥ 20 GB
- CPU: 1+ core

❌ Kalau RAM < 2 GB → tambah swap (Step 0.2). Kalau OS bukan Ubuntu/Debian → STOP, kasih tahu saya.

## Step 0.2 — (Optional) Tambah swap kalau RAM kecil

🎯 Buffer kalau RAM ketat
⏱ 2 menit
Skip kalau RAM ≥ 4 GB

```bash
# Cek swap existing
free -h | grep Swap

# Kalau 0, tambah 2 GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

free -h
```

---

# PHASE 1 — System Hardening Awal (10 menit)

## Step 1.1 — Update OS

```bash
apt update && apt upgrade -y
apt install -y curl ca-certificates gnupg lsb-release ufw fail2ban
```

## Step 1.2 — Setup firewall (UFW)

🎯 Block semua kecuali SSH + HTTP + HTTPS
⏱ 2 menit

```bash
# Allow SSH dulu — JANGAN sampai kekunci di luar
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

# Enable
ufw --force enable
ufw status verbose
```

❓ **Expected**: status active, default deny incoming, port 22/80/443 allow.

## Step 1.3 — Setup fail2ban (anti brute-force SSH)

```bash
systemctl enable --now fail2ban
fail2ban-client status
```

## Step 1.4 — Buat user deploy (non-root)

🎯 Operasi sehari-hari pakai user terbatas
⏱ 3 menit

```bash
adduser --disabled-password --gecos "Carsel Deploy" carsel
usermod -aG sudo carsel

# Setup SSH key (copy dari mesin dev kamu)
mkdir -p /home/carsel/.ssh
chmod 700 /home/carsel/.ssh

# Cara A — kalau mesin dev kamu punya SSH key dan VPS belum:
#   Di mesin dev: ssh-copy-id carsel@212.85.24.151  (perlu password sekali)
# Cara B — paste manual:
cat > /home/carsel/.ssh/authorized_keys <<'EOF'
ssh-ed25519 AAAA... arichrst@ide.asia
EOF
chmod 600 /home/carsel/.ssh/authorized_keys
chown -R carsel:carsel /home/carsel/.ssh

# Test login dari mesin dev (jangan close session root sebelum test berhasil!)
# ssh carsel@212.85.24.151
```

## Step 1.5 — Disable root SSH (setelah Step 1.4 verified)

🎯 Defense in depth
⏱ 2 menit

```bash
# Verify dulu user carsel bisa login + sudo
sudo -u carsel whoami  # should print 'carsel'

# Edit sshd config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config

# Test config + restart
sshd -t && systemctl restart ssh

# Test dari mesin dev
# ssh carsel@212.85.24.151  → should work
# ssh root@212.85.24.151    → should fail "Permission denied"
```

⚠️ **JANGAN close terminal root sebelum test sukses!** Kalau salah config, satu-satunya cara recovery adalah console out-of-band provider.

---

# PHASE 2 — Install Dependencies (15 menit)

Mulai dari sini run sebagai `carsel` (login ulang sebagai carsel):

```bash
ssh carsel@212.85.24.151
```

## Step 2.1 — Install Node.js 20 LTS

🎯 Runtime Next.js 16
⏱ 3 menit

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

node -v   # v20.x.x
npm -v
```

## Step 2.2 — Install Postgres 16

🎯 Database
⏱ 5 menit

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16

# Verify
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

## Step 2.3 — Buat DB + role

🎯 Isolated user untuk app
⏱ 3 menit

```bash
# Generate password kuat
PG_PASS=$(openssl rand -base64 32 | tr -d '+/=' | head -c 32)
echo "================================================="
echo "POSTGRES PASSWORD (SAVE TO PASSWORD MANAGER NOW):"
echo "$PG_PASS"
echo "================================================="

# Buat DB + role
sudo -u postgres psql <<EOF
CREATE ROLE carsel_app WITH LOGIN PASSWORD '$PG_PASS';
CREATE DATABASE carsel_club OWNER carsel_app ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8' TEMPLATE template0;
\c carsel_club
GRANT ALL PRIVILEGES ON DATABASE carsel_club TO carsel_app;
GRANT ALL ON SCHEMA public TO carsel_app;
EOF

# Test connect
PGPASSWORD="$PG_PASS" psql -h localhost -U carsel_app -d carsel_club -c "SELECT current_database();"
```

⚠️ **Catat password** ke password manager. Diperlukan di Step 3.4.

## Step 2.4 — Install Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl status nginx
curl -I http://212.85.24.151/    # Expected: 200 (Nginx default welcome)
```

---

# PHASE 3 — Deploy Carsel App (20 menit)

## Step 3.1 — Folder structure

```bash
sudo mkdir -p /var/www/carsel-club
sudo mkdir -p /var/www/carsel-uploads
sudo mkdir -p /var/backups/carsel/postgres

sudo chown carsel:carsel /var/www/carsel-club
sudo chown carsel:www-data /var/www/carsel-uploads
sudo chmod 755 /var/www/carsel-uploads
sudo chown -R root:root /var/backups/carsel
```

## Step 3.2 — GitHub deploy key

```bash
# Generate key (no passphrase untuk auto-pull)
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" -C "carsel@212.85.24.151"

# Print public key — paste ke GitHub:
# Repo settings → Deploy keys → Add → UNCHECK "Allow write access"
cat ~/.ssh/github_deploy.pub

# Configure SSH untuk pakai key ini
cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  StrictHostKeyChecking accept-new
EOF
chmod 600 ~/.ssh/config

ssh -T git@github.com
# Expected: "Hi <repo>! You've successfully authenticated..."
```

## Step 3.3 — Clone + install + build

```bash
cd /var/www
git clone git@github.com:<USER-OR-ORG>/carsel-club.git carsel-club
cd carsel-club
git checkout main

# Install + build
npm ci
npm run build

# Trim devDeps untuk hemat disk
npm prune --omit=dev
du -sh .next node_modules
```

❓ **Expected**: `.next/` ada, build sukses tanpa error.

## Step 3.4 — Buat `.env.local`

```bash
cd /var/www/carsel-club

# Generate semua secret
AUTH_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)
VAPID_OUT=$(npx web-push generate-vapid-keys --json)
VAPID_PUBLIC=$(echo "$VAPID_OUT" | grep publicKey | cut -d'"' -f4)
VAPID_PRIVATE=$(echo "$VAPID_OUT" | grep privateKey | cut -d'"' -f4)

cat > .env.local <<EOF
# === Database ===
DATABASE_URL=postgres://carsel_app:<PASTE_PG_PASS_HERE>@localhost:5432/carsel_club

# === App ===
NEXT_PUBLIC_APP_URL=https://carsel.club

# === WhatsApp (Wablas) ===
WABLAS_TOKEN=<PASTE_WABLAS_TOKEN>
WABLAS_API_URL=https://solo.wablas.com/api/send-message
WABLAS_SECRET_KEY=<PASTE_WABLAS_SECRET>

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

# === Runtime ===
NODE_ENV=production
PORT=3000
EOF

chmod 600 .env.local

# Edit untuk replace <PASTE_*> placeholder
nano .env.local
```

❓ **Verifikasi**: `grep -c '<PASTE' .env.local` harus return `0`.

⚠️ Simpan AUTH_SECRET, CRON_SECRET, VAPID_PRIVATE ke password manager.

## Step 3.5 — Migrate database

```bash
cd /var/www/carsel-club
npm run db:migrate

# Verify
sudo -u postgres psql carsel_club -c "\dt"
```

❓ **Expected**: list ~25+ tables.

## Step 3.6 — Seed lookup data

```bash
npm run db:seed

# Verify
sudo -u postgres psql carsel_club -c "SELECT count(*) FROM tier_definitions;"
# Expected: 6
```

---

# PHASE 4 — Systemd Service (5 menit)

## Step 4.1 — Buat service file

```bash
sudo tee /etc/systemd/system/carsel-next.service > /dev/null <<'EOF'
[Unit]
Description=Carsel Club Next.js app
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=carsel
Group=carsel
WorkingDirectory=/var/www/carsel-club
Environment=NODE_ENV=production
EnvironmentFile=/var/www/carsel-club/.env.local
ExecStart=/usr/bin/node /var/www/carsel-club/.next/standalone/server.js

Restart=on-failure
RestartSec=10s
StandardOutput=journal
StandardError=journal

MemoryMax=1G
TasksMax=200

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/carsel-uploads /var/www/carsel-club

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
```

⚠️ **CEK dulu**: kalau `next.config.ts` BELUM ada `output: 'standalone'`, tambah dulu (kalau tidak ada, `ExecStart` ganti ke `/usr/bin/npm start`).

```bash
grep -q "standalone" /var/www/carsel-club/next.config.ts && echo "OK standalone mode" || echo "TAMBAH output: 'standalone' ke next.config.ts dulu"
```

## Step 4.2 — Start + verify

```bash
sudo systemctl enable --now carsel-next.service
sleep 5
sudo systemctl status carsel-next.service
sudo journalctl -u carsel-next.service -n 30 --no-pager

# Smoke test internal
curl -I http://127.0.0.1:3000/
# Expected: HTTP 200 atau 307 (redirect ke /login)
```

❓ **Kalau error**: cek journalctl. Common:
- `EADDRINUSE` → port 3000 collision (cek `ss -tlnp | grep 3000`)
- `Cannot find module` → `cd /var/www/carsel-club && npm install --omit=dev`
- DB error → cek DATABASE_URL di `.env.local`, test manual `psql`

---

# PHASE 5 — DNS + Nginx + HTTPS (15 menit)

## Step 5.1 — Set DNS A record

🎯 Domain → IP
⏱ 2 menit (+ propagasi 5–15 menit)

Di registrar / Cloudflare:

```
A     carsel.club        → 212.85.24.151   TTL 300
A     www.carsel.club    → 212.85.24.151   TTL 300
```

⚠️ Kalau pakai Cloudflare: **DNS-only (gray cloud)** dulu. Orange-cloud setelah cert OK.

❓ **Verifikasi propagasi**:

```bash
dig +short carsel.club @1.1.1.1
dig +short www.carsel.club @1.1.1.1
# Expected: 212.85.24.151
```

Tunggu sampai keduanya return 212.85.24.151 sebelum lanjut.

## Step 5.2 — Buat nginx server block (HTTP)

```bash
sudo tee /etc/nginx/sites-available/carsel.club > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name carsel.club www.carsel.club;

    client_max_body_size 12M;

    # ACME challenge untuk Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Static uploads — direct serve, tidak ke Node
    location /uploads/ {
        alias /var/www/carsel-uploads/;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options nosniff;
        autoindex off;
        try_files $uri =404;
    }

    # Next.js static assets
    location /_next/static/ {
        alias /var/www/carsel-club/.next/standalone/.next/static/;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
EOF

# ACME folder
sudo mkdir -p /var/www/certbot
sudo chown www-data:www-data /var/www/certbot

# Enable
sudo ln -s /etc/nginx/sites-available/carsel.club /etc/nginx/sites-enabled/

# Hapus default nginx (kalau ada — biar gak collision)
sudo rm -f /etc/nginx/sites-enabled/default

# Test + reload
sudo nginx -t
sudo systemctl reload nginx

# Smoke test
curl -I http://carsel.club/
# Expected: 307 ke /login atau 200
```

## Step 5.3 — Pasang SSL via Certbot

```bash
sudo certbot --nginx \
  -d carsel.club -d www.carsel.club \
  -m arichrst@ide.asia \
  --agree-tos --redirect --no-eff-email
```

Certbot akan:
1. Validasi HTTP-01 challenge
2. Dapat cert
3. Auto-edit `/etc/nginx/sites-available/carsel.club` → tambah server block HTTPS + redirect HTTP→HTTPS
4. Reload nginx

❓ **Verifikasi**:

```bash
curl -I https://carsel.club/
# Expected: HTTP 200 atau 307 + valid cert

curl -I http://carsel.club/
# Expected: 301 redirect ke https://

sudo certbot certificates
# Expected: cert info untuk carsel.club + www, expires ~90 hari
```

## Step 5.4 — Verify auto-renew aktif

```bash
sudo systemctl status certbot.timer
# Expected: active (waiting), next trigger ~12 jam lagi

# Dry run untuk test renew tanpa actual request
sudo certbot renew --dry-run
```

---

# PHASE 6 — Backup Setup (10 menit)

## Step 6.1 — Postgres daily backup

```bash
sudo tee /usr/local/bin/carsel-pg-backup.sh > /dev/null <<'EOF'
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
sudo chmod 755 /usr/local/bin/carsel-pg-backup.sh

# Cron 02:30 WIB daily
sudo tee /etc/cron.d/carsel-postgres-backup > /dev/null <<'EOF'
30 2 * * * postgres /usr/local/bin/carsel-pg-backup.sh
EOF

# Test sekali manual
sudo -u postgres /usr/local/bin/carsel-pg-backup.sh
ls -la /var/backups/carsel/postgres/
```

## Step 6.2 — (Opsional) Offsite backup

Lihat appendix B di runbook lama (`DEPLOY_RUNBOOK.md`) untuk setup R2/B2 — pattern sama.

---

# PHASE 7 — Smoke Test + Go Live (5 menit)

## Step 7.1 — End-to-end test

```bash
# Buka browser:
# https://carsel.club/login
# - Cek halaman load, logo Carsel muncul (icon.png)
# - Coba register user baru via OTP WA (test Wablas integration)
# - Cek session creation flow
# - Cek upload avatar (test storage)
```

## Step 7.2 — Daily health-check command (catat untuk rutin)

```bash
# Bisa di-alias di ~/.bashrc carsel user
systemctl is-active carsel-next.service nginx postgresql
df -h /var
free -h
sudo certbot certificates | grep -E "carsel|VALID|Expir"
ls -lh /var/backups/carsel/postgres/ | tail -3
curl -sI https://carsel.club/ | head -1
```

## Step 7.3 — UptimeRobot (opsional tapi recommended)

- Buat akun gratis: https://uptimerobot.com
- Add monitor → HTTP → `https://carsel.club/` → interval 5 menit
- Alert: email + WhatsApp (via Pushover integration kalau ada)

---

# Flow Update Kode (rutin setelah deploy)

Setiap push ke `main`:

```bash
ssh carsel@212.85.24.151
cd /var/www/carsel-club
git pull origin main
npm ci
npm run build
npm prune --omit=dev
sudo systemctl restart carsel-next.service
sleep 3
curl -I https://carsel.club/   # smoke
```

**Downtime per deploy: ~5–10 detik** (cold start Next.js).

## Update yang include migration DB

```bash
# Backup dulu sebelum migration breaking
sudo -u postgres /usr/local/bin/carsel-pg-backup.sh

cd /var/www/carsel-club
git pull
npm ci
npm run db:migrate
npm run build
sudo systemctl restart carsel-next.service
```

---

# Rollback (emergency)

Kalau deploy break production:

```bash
cd /var/www/carsel-club
git log --oneline -5   # cari commit sebelumnya yang OK
git checkout <commit-sha>
npm ci
npm run build
sudo systemctl restart carsel-next.service
```

Kalau DB ter-corrupt karena migration:

```bash
# Stop service
sudo systemctl stop carsel-next.service

# Restore dari backup terakhir
LATEST=$(ls -t /var/backups/carsel/postgres/*.sql.gz | head -1)
sudo -u postgres dropdb carsel_club
sudo -u postgres createdb -O carsel_app carsel_club
gunzip < "$LATEST" | sudo -u postgres psql carsel_club

# Restart service
sudo systemctl start carsel-next.service
```

---

# Quick Reference

| Tindakan | Command |
|---|---|
| Status app | `sudo systemctl status carsel-next` |
| Logs app | `sudo journalctl -u carsel-next -f` |
| Restart app | `sudo systemctl restart carsel-next` |
| Reload nginx | `sudo nginx -t && sudo systemctl reload nginx` |
| Postgres console | `sudo -u postgres psql carsel_club` |
| Backup manual | `sudo -u postgres /usr/local/bin/carsel-pg-backup.sh` |
| Cek cert expire | `sudo certbot certificates` |
| Force renew cert | `sudo certbot renew --force-renewal` |

---

**Sebelum jalan**: konfirmasi sekali lagi:

- [ ] VPS `212.85.24.151` accessible via SSH sebagai root
- [ ] Domain `carsel.club` siap di-update DNS-nya
- [ ] Public SSH key kamu siap di-paste (untuk user `carsel`)
- [ ] Wablas token + secret siap di-paste ke `.env.local`
- [ ] GitHub repo URL Carsel Club siap (untuk deploy key)

Setelah semua ✅, langsung jalan dari **Phase 0 Step 0.1**.
