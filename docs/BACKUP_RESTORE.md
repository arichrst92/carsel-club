# Backup & Restore — Carsel Club

> Sprint 36 deliverable. Activated sebelum public launch.

## Overview

Backup runs daily at **02:00 WIB** via systemd timer. Two artifacts shipped to remote storage:

1. `db-<UTC-stamp>.sql.gz` — `pg_dump` plain text format, gzipped
2. `uploads/` — rsync mirror of `/var/www/carsel-uploads/`

After successful backup, the script pings `/api/cron/backup-ping` so the admin dashboard surfaces backup freshness.

## Prerequisites

- `rsync` installed on VPS
- `postgresql-client` (for `pg_dump` / `psql`)
- Remote destination configured (Backblaze B2 via rclone OR secondary VPS via SSH)

## Setup (one-time)

1. **Place scripts**:
   ```bash
   sudo mkdir -p /opt/carsel
   sudo cp scripts/backup.sh scripts/restore.sh /opt/carsel/scripts/
   sudo chmod +x /opt/carsel/scripts/*.sh
   ```

2. **Create env file** `/etc/carsel-backup.env`:
   ```bash
   DATABASE_URL=postgres://carsel_app:STRONG@localhost:5432/carsel_club
   UPLOAD_DIR=/var/www/carsel-uploads
   BACKUP_LOCAL_DIR=/var/backups/carsel
   BACKUP_REMOTE=b2:carsel-backups/
   # or:  user@backup-host:/var/backups/carsel/
   BACKUP_PING_URL=https://carsel.club/api/cron/backup-ping
   CRON_SECRET=YOUR_CRON_SECRET
   BACKUP_RETENTION_DAYS=14
   ```
   Then `sudo chmod 600 /etc/carsel-backup.env`.

3. **Install systemd units**:
   ```bash
   sudo cp scripts/systemd/carsel-backup.{service,timer} /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now carsel-backup.timer
   ```

4. **Verify**:
   ```bash
   systemctl list-timers carsel-backup.timer
   sudo journalctl -u carsel-backup.service --since "1 day ago"
   ```

## Manual trigger (dry-run)

```bash
sudo /opt/carsel/scripts/backup.sh
```

Watch the journal:
```bash
sudo journalctl -u carsel-backup.service -f
```

## Restore drill (test on staging)

```bash
# Pull latest dump locally
rsync -aP b2:carsel-backups/db/ /tmp/carsel-db/

# List newest:
ls -lt /tmp/carsel-db/ | head -5

# Restore (DESTRUCTIVE — confirm with YES)
DATABASE_URL=postgres://staging_url BACKUP_ENV_FILE=/etc/carsel-staging.env \
  /opt/carsel/scripts/restore.sh /tmp/carsel-db/db-20260601T190000Z.sql.gz
```

Validate:
1. Login as known user
2. Check `/admin` counts match expected
3. Verify session detail page loads with rounds + matches
4. Verify uploads (avatar/cover) render

## Monitoring

- **Admin dashboard** (`/admin`) shows backup health card:
  - **Sehat** — last backup ≤ 26h ago
  - **Terlambat** — 26h-50h ago (missed one day)
  - **Kritis** — > 50h or never
- **Systemd alerts**: enable an `OnFailure=` unit (commented in service file) to fire email/Slack/PagerDuty
- **App logs**: `backup_completed` events visible at `/monitor`

## Disaster recovery — full rebuild

1. Provision new VPS, install Node/Postgres/Nginx (see `DEPLOYMENT.md`)
2. Restore env files (`.env.local`, `/etc/carsel-backup.env`)
3. Run `restore.sh` against latest dump
4. Restart app, verify `/admin` counts
5. Update DNS A record

Total RTO target: **< 1 hour** from clean VPS.

## Retention

- Remote: kept indefinitely (cheap storage)
- Local staging: 14 days (configurable via `BACKUP_RETENTION_DAYS`)
