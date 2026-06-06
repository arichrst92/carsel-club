#!/usr/bin/env bash
#
# Carsel Club nightly backup script (Sprint 36).
#
# Performs:
#   1. pg_dump database → gzipped SQL
#   2. rsync uploads directory + db dump → remote destination
#   3. POST ping to app endpoint so admin dashboard sees fresh backup
#
# Environment (sourced from /etc/carsel-backup.env):
#   DATABASE_URL       — postgres connection string
#   UPLOAD_DIR         — local uploads directory (e.g. /var/www/carsel-uploads)
#   BACKUP_LOCAL_DIR   — staging dir for db dumps (e.g. /var/backups/carsel)
#   BACKUP_REMOTE      — rsync destination (e.g. b2:carsel-backups/ or user@host:/path/)
#   BACKUP_PING_URL    — https://carsel.club/api/cron/backup-ping
#   CRON_SECRET        — Bearer token for the ping endpoint
#   BACKUP_RETENTION_DAYS — local cleanup threshold (default 14)
#
# Output:
#   - exits 0 on success
#   - exits non-zero on any failure (systemd captures + alerts)

set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/etc/carsel-backup.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL required}"
: "${UPLOAD_DIR:?UPLOAD_DIR required}"
: "${BACKUP_LOCAL_DIR:?BACKUP_LOCAL_DIR required}"
: "${BACKUP_REMOTE:?BACKUP_REMOTE required}"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DB_DUMP="${BACKUP_LOCAL_DIR}/db-${STAMP}.sql.gz"

mkdir -p "$BACKUP_LOCAL_DIR"

echo "[backup] starting at $STAMP"

# 1. pg_dump
echo "[backup] pg_dump → ${DB_DUMP}"
pg_dump --no-owner --no-acl --format=plain "$DATABASE_URL" \
  | gzip --best > "$DB_DUMP"

# 2. rsync (uploads + dump dir) to remote
echo "[backup] rsync uploads → ${BACKUP_REMOTE}"
rsync -aP --delete \
  "$UPLOAD_DIR/" "${BACKUP_REMOTE%/}/uploads/"

echo "[backup] rsync db dump → ${BACKUP_REMOTE}"
rsync -aP \
  "$DB_DUMP" "${BACKUP_REMOTE%/}/db/"

# 3. cleanup old local dumps
find "$BACKUP_LOCAL_DIR" -name "db-*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete || true

# 4. ping app endpoint to log success
if [ -n "${BACKUP_PING_URL:-}" ] && [ -n "${CRON_SECRET:-}" ]; then
  echo "[backup] ping ${BACKUP_PING_URL}"
  curl -fsS -X POST \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    -d "{\"dump\":\"$(basename "$DB_DUMP")\",\"stamp\":\"$STAMP\"}" \
    "$BACKUP_PING_URL" || echo "[backup] ping failed (non-fatal)"
fi

echo "[backup] done"
