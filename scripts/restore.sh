#!/usr/bin/env bash
#
# Carsel Club restore script (Sprint 36).
#
# WARNING — destructive operation. Drops + reloads the database from a dump.
#
# Usage:
#   ./scripts/restore.sh <path-to-db.sql.gz>
#
# Env from /etc/carsel-backup.env:
#   DATABASE_URL
#   UPLOAD_DIR (optional — to also restore uploads from remote)
#   BACKUP_REMOTE (optional)

set -euo pipefail

ENV_FILE="${BACKUP_ENV_FILE:-/etc/carsel-backup.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL required}"

DUMP_PATH="${1:?usage: restore.sh <path-to-db.sql.gz>}"

if [ ! -f "$DUMP_PATH" ]; then
  echo "[restore] dump not found: $DUMP_PATH" >&2
  exit 1
fi

echo "[restore] === DESTRUCTIVE OPERATION ==="
echo "[restore] target DB: $DATABASE_URL"
echo "[restore] dump:      $DUMP_PATH"
read -r -p "[restore] Type 'YES' to confirm: " confirm
if [ "$confirm" != "YES" ]; then
  echo "[restore] aborted"
  exit 1
fi

# Drop + recreate schema (assumes 'public' schema)
echo "[restore] resetting schema"
psql "$DATABASE_URL" <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SQL

echo "[restore] loading dump"
gunzip -c "$DUMP_PATH" | psql "$DATABASE_URL"

if [ -n "${UPLOAD_DIR:-}" ] && [ -n "${BACKUP_REMOTE:-}" ]; then
  echo "[restore] syncing uploads from ${BACKUP_REMOTE}"
  rsync -aP "${BACKUP_REMOTE%/}/uploads/" "$UPLOAD_DIR/"
fi

echo "[restore] done"
