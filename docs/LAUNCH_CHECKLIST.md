# Pre-launch checklist — Carsel Club

> Sprint 41 deliverable. Sign off all items before flipping DNS to production.

## 0. Code quality

- [ ] `npm test` hijau (all suites pass)
- [ ] `npm run test:coverage` = 100% on `lib/**/*.ts` tracked files (see `vitest.config.ts`)
- [ ] `npm run build` no TS errors, no Turbopack errors
- [ ] `git status` clean on `main`
- [ ] Last commit pushed to `origin/main`
- [ ] Tag release: `git tag v1.0.0 && git push --tags`

## 1. Infrastructure

- [ ] VPS provisioned (4 vCPU / 8 GB RAM minimum for closed beta)
- [ ] Nginx installed + alias `/uploads/*` → `/var/www/carsel-uploads/`
- [ ] Postgres 16+ running, `carsel_app` user with limited grants
- [ ] Node 22+ installed
- [ ] App deployed to `/opt/carsel/app`
- [ ] systemd service `carsel-app.service` enabled
- [ ] DNS A record points to VPS
- [ ] HTTPS via Let's Encrypt (certbot + nginx integration)
- [ ] Firewall allows :80, :443, :22 only

## 2. Environment variables

- [ ] `.env.local` populated:
  - [ ] `DATABASE_URL` — production string with strong password
  - [ ] `WABLAS_TOKEN` — real Wablas API token
  - [ ] `WABLAS_API_URL` — per-account endpoint (contoh `https://solo.wablas.com/api/send-message`)
  - [ ] `FONNTE_TOKEN` — optional, legacy fallback gateway (Sprint 42 transisi; drop di Sprint 43)
  - [ ] `AUTH_SESSION_SECRET` — `openssl rand -base64 32`
  - [ ] `NEXT_PUBLIC_APP_URL` — `https://carsel.club`
  - [ ] `UPLOAD_DIR` — `/var/www/carsel-uploads`
  - [ ] `NEXT_PUBLIC_UPLOAD_URL_BASE` — `/uploads`
  - [ ] `CRON_SECRET` — `openssl rand -base64 32`
  - [ ] `LOG_RETENTION_DAYS` — 30
  - [ ] `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generated via `npx web-push generate-vapid-keys`
  - [ ] `VAPID_SUBJECT` — `mailto:admin@carsel.club`

## 3. Database

- [ ] Migrations applied: `npx drizzle-kit migrate`
- [ ] Tier definitions seeded (`tier_definitions` table populated 1-6)
- [ ] First admin user promoted: `UPDATE users SET is_admin = true WHERE whatsapp_number = '628XXX'`
- [ ] Backup user has read-only grants for `pg_dump`

## 4. Backup & monitoring

- [ ] `/etc/carsel-backup.env` populated (see `docs/BACKUP_RESTORE.md`)
- [ ] `scripts/backup.sh` symlinked to `/opt/carsel/scripts/`
- [ ] systemd units installed:
  - [ ] `carsel-backup.timer` enabled
  - [ ] `carsel-reminder.timer` enabled (Sprint 28 H-1 reminder)
- [ ] Manual `backup.sh` dry-run successful
- [ ] **Restore drill executed on staging** (rebuild DB from backup, verify `/admin` counts match)
- [ ] Backup health card di `/admin` shows green within 26h post first backup

## 5. Cron jobs

- [ ] `/api/cron/clean-logs` scheduled (weekly)
- [ ] `/api/cron/clean-otp` scheduled (daily)
- [ ] `/api/cron/session-reminder` scheduled (every 5 min via systemd)
- [ ] `/api/cron/backup-ping` works (auto-pinged by backup.sh)

## 6. External services

- [ ] Wablas account active, paket aktif + saldo cukup
- [ ] Wablas device shows as connected di dashboard
- [ ] OTP test: send to admin's WA → receive within 30s
- [ ] Failover test: temporarily invalidate Wablas token → trigger OTP → confirm Fonnte fallback bekerja → restore Wablas
- [ ] VAPID keys validated: `/api/push/vapid-public-key` returns key
- [ ] Push test: subscribe via `/profile/settings/notifications`, trigger sample notification

## 7. Security

- [ ] `AUTH_SESSION_SECRET` ≥ 32 random bytes
- [ ] `CRON_SECRET` ≥ 32 random bytes
- [ ] DB password not committed (only in `.env.local` + `/etc/carsel-backup.env`)
- [ ] `/etc/carsel-backup.env` is `chmod 600 root:root`
- [ ] `nginx` config rejects requests larger than 12MB (upload guard)
- [ ] No `console.log` of sensitive data in code review pass
- [ ] OTP rate-limit verified working (try 4 OTP requests in 10min → blocked)
- [ ] First admin user enabled MFA on email/host platform

## 8. Performance / a11y

- [ ] Lighthouse run on `/home`, `/sessions`, `/leaderboard`, `/profile` from mobile profile:
  - [ ] Performance ≥ 90
  - [ ] Accessibility ≥ 95
  - [ ] Best Practices ≥ 90
  - [ ] SEO ≥ 90
- [ ] Manual a11y pass:
  - [ ] Keyboard nav (Tab/Shift-Tab) reaches all interactive elements
  - [ ] Focus ring visible (Sprint 34 added `:focus-visible`)
  - [ ] Skip-to-content link works
  - [ ] Screen reader announces form labels + error messages
  - [ ] Color contrast WCAG AA on primary CTAs

## 9. Legal & compliance

- [ ] `/privacy-policy` reviewed by legal (or accepted as minimum viable)
- [ ] `/tos` reviewed by legal
- [ ] Contact email in legal pages monitored
- [ ] Data export flow tested (`/profile/settings/privacy` → Download JSON)
- [ ] Account delete flow tested (soft-delete + anonymize verified in DB)
- [ ] DPO designated (or formally deferred until X users)

## 10. App flow smoke tests

Run the following on production with a fresh test account:

- [ ] Signup → OTP verify → onboarding (3 steps) → home
- [ ] Create session → invite 4 player → generate match → start match → end match → check stats
- [ ] Edit completed match → score updates → stats reconcile
- [ ] Revert match → stats reverse
- [ ] Share match link to non-logged user → public live view loads
- [ ] Friend request → accept → friends list shows mutual
- [ ] Subscribe to push → trigger notification → receives on device
- [ ] Profile → Privacy → Download JSON works
- [ ] Profile → Edit → change visibility to Private → /u/[id] from other user shows private view

## 11. Communication

- [ ] Announcement post drafted (Instagram, WA Status)
- [ ] Invite link for closed beta participants
- [ ] Support inbox monitored (WhatsApp + email)
- [ ] Roadmap teaser (what's next post-v1)

## 12. Rollback plan

- [ ] DNS TTL set to 60s minimum 24h before launch
- [ ] Old DNS record documented
- [ ] DB backup IMMEDIATELY before launch
- [ ] Rollback decision-maker identified
- [ ] Communication template for downtime

---

**Sign-off**:

- [ ] Engineering: ____________ Date: ____________
- [ ] Ops: ____________ Date: ____________
- [ ] Legal: ____________ Date: ____________
- [ ] Owner: ____________ Date: ____________

🚀
