#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# VPS audit script — answers VPS_PREDEPLOY_QUESTIONNAIRE.md
# Read-only. Safe to run on production. Does NOT modify any state.
#
# Usage on VPS (as user with sudo):
#   bash vps-audit.sh > /tmp/vps-audit-$(date +%Y%m%d).txt 2>&1
#   cat /tmp/vps-audit-*.txt   # then paste relevant sections into the answers
#
# Output is grouped by questionnaire section so it's easy to map back.
# ──────────────────────────────────────────────────────────────────

set -u  # don't unset variables silently; do NOT use -e (some commands may fail intentionally)

section() {
  echo
  echo "════════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════════════════════"
}

q() {
  echo
  echo "── $1 ──"
}

section "0. AKSES VPS"

q "0.1 username SSH (yang sedang menjalankan script ini)"
whoami
echo "uid/gid:"; id

q "0.2 jumlah authorized_keys"
wc -l "$HOME/.ssh/authorized_keys" 2>/dev/null || echo "no authorized_keys file"

q "0.3 sudo tanpa password?"
sudo -n true 2>/dev/null && echo "YES (sudo -n succeeds)" || echo "NO (sudo requires password)"

q "0.4 OS + kernel"
lsb_release -d 2>/dev/null || cat /etc/os-release | grep PRETTY
uname -r

q "0.5 arsitektur CPU"
uname -m

q "0.6 RAM"
free -h

q "0.7 disk usage"
df -h /

q "0.8 timezone"
timedatectl 2>/dev/null | grep -i zone || date +"%Z %z"

section "1. WEBSITE LAIN DI VPS"

q "1.4 folder root website"
ls -la /var/www/ 2>/dev/null
echo "--- /srv/ ---"
ls -la /srv/ 2>/dev/null
echo "--- /home/ ---"
ls -la /home/ 2>/dev/null

q "1.5 apa yang listen di port 3000/3001/3002/3030?"
sudo ss -tlnp 2>/dev/null | grep -E ':(3000|3001|3002|3030)\b' || echo "(none of those ports listening)"

q "1.6 SEMUA port listening"
sudo ss -tlnp 2>/dev/null || ss -tln 2>/dev/null

section "2. WEB SERVER"

q "2.1 web server aktif"
for svc in nginx apache2 caddy httpd; do
  state=$(systemctl is-active "$svc" 2>/dev/null)
  echo "  $svc: ${state:-not-found}"
done

q "2.2 versi"
nginx -v 2>&1 | head -1
apache2 -v 2>/dev/null | head -1
caddy version 2>/dev/null

q "2.3 path config"
ls /etc/nginx/sites-enabled/ 2>/dev/null
ls /etc/nginx/sites-available/ 2>/dev/null
ls /etc/apache2/sites-enabled/ 2>/dev/null
ls /etc/caddy/ 2>/dev/null

q "2.4 server_name yang sudah dikonfigurasi"
sudo nginx -T 2>/dev/null | grep -E 'server_name|listen ' | sort -u
echo "(apache2:)"
sudo apache2ctl -S 2>/dev/null | head -20

q "2.5 default_server block"
sudo nginx -T 2>/dev/null | grep -E 'default_server|listen .* default'

section "3. POSTGRES (mungkin tidak ada — IDE Asia pakai MongoDB)"

q "3.1 postgres aktif?"
systemctl is-active postgresql 2>/dev/null || echo "not-running"

q "3.2 versi postgres (kalau ada)"
psql --version 2>/dev/null || echo "psql tidak ter-install"

q "3.3 port postgres"
sudo ss -tlnp 2>/dev/null | grep -E 'postgres|:5432' || echo "(no postgres listening)"

q "3.4 listen_addresses"
sudo cat /etc/postgresql/*/main/postgresql.conf 2>/dev/null | grep -E '^listen_addresses' || echo "(no postgresql.conf found)"

q "3.5 list databases"
sudo -u postgres psql -l 2>/dev/null | head -30 || echo "(postgres not available)"

q "3.6 list roles"
sudo -u postgres psql -c '\du' 2>/dev/null || echo "(postgres not available)"

q "3.7 pg_hba.conf (auth methods)"
sudo cat /etc/postgresql/*/main/pg_hba.conf 2>/dev/null | grep -v '^#' | grep -v '^$' | head -20

q "3.8 docker postgres?"
which docker > /dev/null && sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep -i postgres
which docker > /dev/null || echo "docker not installed"

q "3.10 cron untuk DB backup"
crontab -l 2>/dev/null
echo "--- /etc/cron.d ---"
ls /etc/cron.d/ 2>/dev/null

section "4. NODE.JS & PROCESS MANAGER"

q "4.1 node version"
node -v 2>/dev/null
which node 2>/dev/null

q "4.2 nvm?"
ls "$HOME/.nvm" 2>/dev/null | head -3 || echo "no nvm in \$HOME"

q "4.3 PM2 + systemd services untuk node apps"
pm2 list 2>/dev/null
echo "--- systemd node-related services ---"
systemctl list-units --type=service --no-pager 2>/dev/null | grep -iE 'node|next|nest|express'

q "4.5 PM2 process list"
pm2 jlist 2>/dev/null | head -100 || echo "(pm2 not running for this user)"

q "4.6 package managers"
npm -v 2>/dev/null && echo "npm OK"
pnpm -v 2>/dev/null && echo "pnpm OK"
yarn -v 2>/dev/null && echo "yarn OK"

section "5. SSL / CERTBOT"

q "5.1 certbot version"
certbot --version 2>/dev/null || echo "(certbot tidak ada)"

q "5.2 plugins"
certbot plugins 2>/dev/null

q "5.3 certificates"
sudo certbot certificates 2>/dev/null

q "5.4 auto-renew"
sudo systemctl status certbot.timer 2>/dev/null | head -10
sudo crontab -l 2>/dev/null | grep -i certbot
ls /etc/cron.*/certbot 2>/dev/null

section "6. FIREWALL"

q "6.1 UFW status"
sudo ufw status verbose 2>/dev/null

q "6.2 iptables (sample)"
sudo iptables -L -n 2>/dev/null | head -30

q "6.4 port 80/443 dibuka?"
sudo ufw status 2>/dev/null | grep -E '80|443'

section "8. STORAGE"

q "8.2 partisi /var"
df -h /var

q "free space breakdown"
df -hT 2>/dev/null

section "11. RESOURCE SIZING"

q "11.1 total RAM"
free -h | head -3

q "11.2 RAM usage saat ini"
free -h

q "11.4 swap"
free -h | grep -i swap
echo "--- swap configuration ---"
swapon --show 2>/dev/null

q "load average + uptime"
uptime
echo "--- CPU ---"
nproc
cat /proc/cpuinfo | grep "model name" | head -1

section "13. SNAPSHOT FILE STATE (untuk dokumentasi)"

q "running services (top 30)"
systemctl list-units --type=service --state=running --no-pager 2>/dev/null | head -30

q "open files limit"
ulimit -n

q "system load"
top -bn1 | head -5

echo
echo "════════════════════════════════════════════════════════════════"
echo "  audit selesai. Output di-pipe ke file kalau Anda redirect."
echo "════════════════════════════════════════════════════════════════"
