# Carsel Club — Deployment Notes

Living doc — di-update setiap sprint yang touch infra. Initial version disusun di Sprint 1 (storage).

---

## VPS Layout (Production)

```
/var/www/carsel-club/         ← Next.js app (deployed via rsync/CI)
  ├── .next/                  ← build output
  ├── node_modules/
  └── package.json

/var/www/carsel-uploads/      ← UPLOAD_DIR (persistent volume — di-backup)
  ├── avatars/
  ├── sessions/{id}/
  └── cards/

/etc/nginx/sites-enabled/carsel.club  ← Nginx config (see below)
```

**Postgres** running di localhost:5432 sebagai service systemd. Database `carsel_club`, user `carsel_app`.

**Process manager:** systemd service `carsel-next.service` (atau PM2 — TBD saat actual deploy).

---

## Nginx Configuration

Serve aplikasi via reverse proxy ke Node (port 3000) + serve `/uploads/*` langsung dari disk.

```nginx
# /etc/nginx/sites-enabled/carsel.club

server {
    listen 80;
    listen [::]:80;
    server_name carsel.club www.carsel.club;

    # Certbot akan redirect ke HTTPS otomatis
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name carsel.club www.carsel.club;

    ssl_certificate     /etc/letsencrypt/live/carsel.club/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/carsel.club/privkey.pem;

    # Body size limit (server-side guard; lib/storage juga check)
    client_max_body_size 12M;

    # === Static uploads — direct serve, tidak melalui Node ===
    location /uploads/ {
        alias /var/www/carsel-uploads/;

        # Aggressive caching untuk content yang immutable (filename = nanoid)
        add_header Cache-Control "public, max-age=31536000, immutable";

        # Sniff prevention
        add_header X-Content-Type-Options nosniff;

        # CORS untuk images (optional — kalau perlu cross-origin)
        # add_header Access-Control-Allow-Origin "*";

        # Disable directory listing
        autoindex off;

        # 404 di-handle Nginx langsung (tidak fall through ke Node)
        try_files $uri =404;
    }

    # === Next.js static assets ===
    location /_next/static/ {
        alias /var/www/carsel-club/.next/static/;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # === Next.js app ===
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
```

### Setup steps (one-time)

```bash
# 1. Buat upload dir + permission
sudo mkdir -p /var/www/carsel-uploads
sudo chown -R www-data:www-data /var/www/carsel-uploads
sudo chmod 755 /var/www/carsel-uploads

# 2. Install Nginx config
sudo cp deploy/nginx-carsel.club.conf /etc/nginx/sites-available/carsel.club
sudo ln -s /etc/nginx/sites-available/carsel.club /etc/nginx/sites-enabled/
sudo nginx -t  # validate
sudo systemctl reload nginx

# 3. SSL via Certbot
sudo certbot --nginx -d carsel.club -d www.carsel.club

# 4. Set env var di production .env
echo 'UPLOAD_DIR=/var/www/carsel-uploads' >> /var/www/carsel-club/.env.local
echo 'NEXT_PUBLIC_UPLOAD_URL_BASE=/uploads' >> /var/www/carsel-club/.env.local
```

---

## Dev fallback

Untuk dev local tanpa Nginx, Next.js handle `/uploads/*` via `app/uploads/[...path]/route.ts`:
- Reads file dari `UPLOAD_DIR` (default `./uploads`)
- Sets content-type berdasarkan extension
- Cache-Control: public, max-age=3600

Tidak perlu config tambahan untuk dev — tinggal `npm run dev`.

---

## sharp di VPS

Sharp pakai native binding (libvips). Di Ubuntu/Debian umumnya prebuilt binary auto-install via npm. Kalau gagal:

```bash
# Install libvips dependencies
sudo apt-get install -y libvips-dev

# Reinstall sharp dengan rebuild
cd /var/www/carsel-club
npm rebuild sharp --build-from-source
```

---

## Backup (deferred sampai Sprint 36)

**Saat ini:** belum di-setup. Risk closed beta accepted.

**Plan Sprint 36** (cron + Backblaze B2 atau VPS secondary):
- Daily 02:00 WIB rsync `/var/www/carsel-uploads/` ke off-site
- Postgres `pg_dump` nightly + sync
- Restore drill di staging
- Monitoring alert kalau backup gagal

Lihat: `docs/SPRINT_BACKLOG.md` Sprint 36.

---

## Health & monitoring (TBD)

Defer ke Sprint 2 (Observability) — Sentry + PostHog. Belum di-setup di Sprint 1.

---

## Env vars per environment

| Var | Dev | Prod |
|---|---|---|
| `DATABASE_URL` | `postgres://carsel:devpass@localhost:5432/carsel_club` | `postgres://carsel_app:STRONGPASS@localhost:5432/carsel_club` |
| `AUTH_SESSION_SECRET` | 32+ char (generate sekali) | 32+ char (separate dari dev) |
| `WABLAS_TOKEN` | (kosong → dev fallback ke console log) | Real token dari Wablas dashboard |
| `WABLAS_API_URL` | `https://wablas.com/api/send-message` | Per-account endpoint, contoh `https://solo.wablas.com/api/send-message` |
| `FONNTE_TOKEN` | (kosong) | Legacy fallback (Sprint 42 transisi) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://carsel.club` |
| `UPLOAD_DIR` | `./uploads` | `/var/www/carsel-uploads` |
| `NEXT_PUBLIC_UPLOAD_URL_BASE` | `/uploads` | `/uploads` (atau CDN URL) |
| `MAX_UPLOAD_BYTES` | `10485760` (10 MB) | `10485760` |

Generate `AUTH_SESSION_SECRET`:
```bash
openssl rand -base64 32
```

---

## Process / build

```bash
# Build
npm run build

# Start (production)
NODE_ENV=production npm start

# Atau via systemd
sudo systemctl restart carsel-next
sudo journalctl -u carsel-next -f
```

Systemd unit example:

```ini
# /etc/systemd/system/carsel-next.service
[Unit]
Description=Carsel Club Next.js
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/carsel-club
EnvironmentFile=/var/www/carsel-club/.env.local
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```
