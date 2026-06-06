# Security — Carsel Club

> Sprint 41 deliverable. Defense-in-depth posture + threat model + future RLS migration.

## Threat model

| Threat | Likelihood | Impact | Mitigation today |
|---|---|---|---|
| OTP brute force | medium | account takeover | per-code attempt limit (Sprint 37), request rate limit (3/10min), 24h auto-cleanup |
| OTP replay | low | account takeover | codeHash bcrypt, verifiedAt mark + cleanup |
| Session fixation | low | account takeover | JWT in httpOnly cookie, 30d expiry, no localStorage |
| CSRF on server actions | low | unwanted writes | Next.js Server Actions automatically include CSRF protection via Origin check |
| Unauthorized session access | medium | private session leak | `isSessionStaff` / `canUserViewSession` gates in Server Actions, no client DB |
| Spam friend requests | medium | UX degradation | per-target policy (anyone/friends-of-friends/off — Sprint 38) |
| Stat manipulation | low | leaderboard pollution | host-only score input, admin recompute (Sprint 35), event log audit (`/monitor`) |
| Account takeover via WA porting | low | account takeover | rely on telco-level WA verification + Fonnte authenticity |
| Data exfiltration | low | privacy breach | per-user query scoping, no raw SQL exposed, export endpoint scoped to self |
| Spam bot signup | low | resource drain | OTP requirement + Fonnte cost per send |

## Layers of defense (today)

```
[Browser]
    ↓ (httpOnly cookie + Origin header)
[Next.js middleware]  ←  cookie verify + path-gating (/login redirect)
    ↓
[Server Action] ─→ getCurrentUser() / requireAdmin() / isSessionStaff()
    ↓ (parameterized via Drizzle)
[Postgres]  ←  CHECK constraints (stats consistency, distinct players, scores ≥ 0)
```

**No client-side DB queries.** All reads/writes go through Server Actions or API routes that require `requireUser()`. Adding Supabase JS or similar realtime client in the future would bypass this and **require RLS to be activated** (see below).

## RLS strategy (future)

Postgres Row-Level Security policies are NOT enabled today because all access goes through Server Actions w/ auth-aware queries. The migration template below activates defense-in-depth for when a realtime client is added.

**Step 1 — set session user**: add to `lib/db/client.ts` per-request:

```ts
await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
```

**Step 2 — enable policies** (migration):

```sql
-- Helper function
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE SQL STABLE;

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select_public ON users FOR SELECT USING (
  profile_visibility = 'public'
  OR id = current_user_id()
  OR EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user_id_lo = LEAST(id, current_user_id())
       AND f.user_id_hi = GREATEST(id, current_user_id()))
  )
);
CREATE POLICY users_update_self ON users FOR UPDATE USING (id = current_user_id());

-- sessions (private only to participants + staff)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_select ON sessions FOR SELECT USING (
  visibility = 'public'
  OR host_id = current_user_id()
  OR EXISTS (
    SELECT 1 FROM session_participants sp
    WHERE sp.session_id = id AND sp.user_id = current_user_id()
  )
);

-- matches: same visibility as parent session
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY matches_select ON matches FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM match_round_sets mrs
    JOIN sessions s ON s.id = mrs.session_id
    WHERE mrs.id = match_round_set_id AND (
      s.visibility = 'public'
      OR s.host_id = current_user_id()
      OR EXISTS (
        SELECT 1 FROM session_participants sp
        WHERE sp.session_id = s.id AND sp.user_id = current_user_id()
      )
    )
  )
);

-- notifications: own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_owner ON notifications USING (
  user_id = current_user_id()
);

-- push subscriptions: own only
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_owner ON push_subscriptions USING (
  user_id = current_user_id()
);

-- app_logs: admin only
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_admin_only ON app_logs USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = current_user_id() AND u.is_admin = true)
);
```

Apply via separate migration file `drizzle/manual_rls_enable.sql`. **Test thoroughly in staging first** — overly restrictive policies will break admin Server Actions that read across users.

## Rate limit consolidation (Sprint 41)

Pure helper `lib/auth/rate-limit-policy.ts` provides single decision combining:

- Request rate (DB-backed, 3 / 10 min default)
- Per-code attempt rate (DB column on `otp_verifications.attempts`, 5 max)

Priority: requests > attempts (avoid Fonnte spend before checking attempt counter).

## Logging & monitoring

- **`/monitor` page** (admin-only) shows recent `app_logs` events including auth failures, error spikes, admin actions.
- `app_logs.type='event'` events: 30+ tracked (see `lib/log/types.ts`)
- Retention: 30 days, cleaned via `/api/cron/clean-logs`
- Sentry-style external sink: deferred — current in-DB logs adequate for pre-launch scale (<10k MAU)

## Incident response

1. **Suspected compromise of admin account**: revoke via `users.isAdmin = false` SQL, rotate `AUTH_SESSION_SECRET`, force re-login (invalidates all cookies)
2. **Mass spam signups**: enable temporary Fonnte rate-limit at gateway, drop suspicious phone prefixes via SQL `DELETE FROM otp_verifications WHERE whatsapp_number LIKE 'PATTERN%'`
3. **DB corruption**: see `docs/BACKUP_RESTORE.md` restore drill (RTO < 1 hour)
4. **Service outage**: monitoring via systemd `OnFailure=`; backup runs decoupled from app

## Compliance posture

- **UU PDP 27/2022 spirit**: privacy policy + data export + soft-delete account
- **Data residency**: VPS Indonesia OK
- **Children**: 17+ ToS, no proactive enforcement (low risk for adult-targeted padel app)
- **DPO**: not formally designated (small-scale closed beta); add before public launch
