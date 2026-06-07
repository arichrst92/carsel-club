#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# deploy.sh — one-command deploy ke VPS production carsel.club
#
# Usage:
#   ./deploy.sh "perbaikan login mobile responsive"
#
# Yang dilakukan:
#   1. Cek working tree bersih (atau confirm)
#   2. Typecheck lokal (npx tsc --noEmit)
#   3. Build lokal (sanity check sebelum push) — optional via FAST=1 skip
#   4. Git commit semua perubahan dgn pesan kamu
#   5. Git push origin main
#   6. SSH ke VPS, pull, npm ci, build, restart service
#   7. Smoke test https://carsel.club/ return 200/307
#
# Env override:
#   FAST=1 ./deploy.sh "msg"   → skip local build (cuma typecheck)
#   SKIP_TESTS=1 ./deploy.sh "msg"  → skip typecheck (DANGER)
# ──────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Config ─────────────────────────────────────────────────────
VPS_HOST="carsel@212.85.24.151"
VPS_PATH="/var/www/carsel-club"
SERVICE="carsel-next.service"
LIVE_URL="https://carsel.club/"

# ─── Colors ─────────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1;34m'; N='\033[0m'

step() { echo -e "\n${B}▶ $1${N}"; }
ok()   { echo -e "${G}✓ $1${N}"; }
warn() { echo -e "${Y}⚠ $1${N}"; }
err()  { echo -e "${R}✗ $1${N}" >&2; }

# ─── Arg check ──────────────────────────────────────────────────
if [[ $# -lt 1 ]]; then
  err "Usage: ./deploy.sh \"pesan perbaikan\""
  echo "Contoh: ./deploy.sh \"perbaikan login mobile responsive\""
  exit 1
fi

MSG="$*"
START_TS=$(date +%s)

# ─── Step 1: cek git ────────────────────────────────────────────
step "1/7 Cek git state"
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  err "Bukan git repo. Jalankan dari root project."
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  warn "Branch sekarang: $CURRENT_BRANCH (bukan main)"
  read -p "Lanjut deploy dari branch ini? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && { err "Batal."; exit 1; }
fi

if [[ -z "$(git status --porcelain)" ]]; then
  warn "Tidak ada perubahan untuk di-commit"
  read -p "Lanjut deploy code yg sudah di-push? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && { err "Batal."; exit 1; }
  SKIP_COMMIT=1
else
  ok "Ada perubahan untuk di-commit"
  git status --short
  SKIP_COMMIT=0
fi

# ─── Step 2: typecheck ──────────────────────────────────────────
if [[ "${SKIP_TESTS:-0}" == "1" ]]; then
  warn "2/7 Typecheck DI-SKIP (SKIP_TESTS=1)"
else
  step "2/7 Typecheck (npx tsc --noEmit)"
  if npx tsc --noEmit; then
    ok "Typecheck pass"
  else
    err "Typecheck gagal. Fix dulu sebelum deploy."
    exit 1
  fi
fi

# ─── Step 3: local build (sanity check) ─────────────────────────
if [[ "${FAST:-0}" == "1" ]]; then
  warn "3/7 Local build DI-SKIP (FAST=1)"
else
  step "3/7 Local build sanity check (npm run build)"
  if npm run build > /tmp/carsel-build.log 2>&1; then
    ok "Local build sukses"
    rm -f /tmp/carsel-build.log
  else
    err "Local build gagal — cek /tmp/carsel-build.log"
    tail -30 /tmp/carsel-build.log
    exit 1
  fi
fi

# ─── Step 4: commit ─────────────────────────────────────────────
if [[ "$SKIP_COMMIT" == "0" ]]; then
  step "4/7 Commit: \"$MSG\""
  git add -A
  git commit -m "$MSG"
  ok "Commit dibuat: $(git log -1 --oneline)"
else
  step "4/7 Commit di-skip (tidak ada perubahan)"
fi

# ─── Step 5: push ───────────────────────────────────────────────
step "5/7 Push ke origin/$CURRENT_BRANCH"
if git push origin "$CURRENT_BRANCH"; then
  ok "Push sukses"
else
  err "Push gagal. Mungkin perlu pull dulu."
  exit 1
fi

# ─── Step 6: deploy ke VPS ──────────────────────────────────────
step "6/7 Deploy ke VPS ($VPS_HOST)"

# Heredoc dgn variabel di-expand lokal — pakai 'EOSSH' (quoted) supaya
# tidak ada expansion lokal, semua di-run remote.
ssh "$VPS_HOST" bash -se <<EOSSH
set -euo pipefail
cd $VPS_PATH

echo "▶ sync to origin/$CURRENT_BRANCH (hard reset — VPS is deploy-only, no local work)"
# Why hard-reset instead of plain pull: when 'npm ci' falls back to 'npm install'
# (e.g. transient network blip or peer-dep change), npm mutates package-lock.json
# in-place. The next deploy's 'git pull' then fails with
# "local changes would be overwritten". Since the VPS is purely a deploy target
# and never holds work-in-progress, force-aligning to remote is correct & safe.
# node_modules and .next are gitignored, so reset doesn't touch them.
git fetch origin $CURRENT_BRANCH
git reset --hard origin/$CURRENT_BRANCH

echo "▶ npm ci"
npm ci --silent || npm install --silent

echo "▶ npm run build"
npm run build

echo "▶ npm run db:migrate (idempotent)"
npm run db:migrate 2>&1 | tail -5 || echo "  (no new migrations)"

echo "▶ restart service"
sudo systemctl restart $SERVICE
sleep 3
sudo systemctl is-active $SERVICE

echo "▶ smoke test internal :3000"
curl -fsI -m 5 http://127.0.0.1:3000/ | head -1
EOSSH

ok "Deploy ke VPS sukses"

# ─── Step 7: smoke test public ──────────────────────────────────
step "7/7 Smoke test public $LIVE_URL"
sleep 2
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" -m 10 "$LIVE_URL" || echo "000")
case "$HTTP_CODE" in
  200|301|302|307|308)
    ok "Live URL respond $HTTP_CODE — production OK"
    ;;
  *)
    err "Live URL respond $HTTP_CODE — cek manual di browser"
    err "Logs: ssh $VPS_HOST 'sudo journalctl -u $SERVICE -n 50'"
    exit 1
    ;;
esac

# ─── Done ───────────────────────────────────────────────────────
DURATION=$(( $(date +%s) - START_TS ))
echo
echo -e "${G}════════════════════════════════════════════════${N}"
echo -e "${G}✓ DEPLOY SUKSES dalam ${DURATION}s${N}"
echo -e "${G}  Pesan: $MSG${N}"
echo -e "${G}  Live:  $LIVE_URL${N}"
echo -e "${G}════════════════════════════════════════════════${N}"
