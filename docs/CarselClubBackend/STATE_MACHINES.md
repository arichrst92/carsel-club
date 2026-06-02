# Carsel Club — State Machines & Stats Sync Spec

**Version:** v1 (MVP closed beta)
**Date:** 2026-05-11
**Companion to:** `schema.sql`

This doc defines the **behavioral logic** layered on top of the schema:
1. Session state machine
2. Match state machine
3. Stats sync algorithm (denormalized writes on score change)
4. Tier re-evaluation
5. Edge cases & invariants

All stats sync logic runs in **Next.js Server Actions** as atomic Supabase transactions, NOT in Postgres triggers. Rationale: edit-after-completed flow is non-trivial and easier to maintain in TypeScript with version control.

---

## 1. Session State Machine

```
                   ┌──────────────┐
   CREATE  ───────▶│   upcoming   │
                   └──┬───────┬───┘
                      │       │
              start ▼         ▼ cancel
                   ┌──────┐  ┌────────────┐
                   │ live │  │ cancelled  │ (terminal)
                   └──┬───┘  └────────────┘
                      │            ▲
                   end▼            │ cancel
                   ┌──────────┐    │
                   │completed │ ◀──┘ (rare: cancel mid-live)
                   └──────────┘
                   (terminal)
```

### Transitions

| From       | To         | Trigger                                 | Side Effect                                  |
|------------|------------|-----------------------------------------|----------------------------------------------|
| —          | upcoming   | Host: Create Session                    | Insert row, status='upcoming'                |
| upcoming   | live       | Host: start first MatchRoundSet OR explicit "Start Session" | status='live'                |
| live       | completed  | Host: End Session                       | status='completed', ended_at=now()           |
| upcoming   | cancelled  | Host: Cancel Session                    | status='cancelled' (no stats to reverse)     |
| live       | cancelled  | Host: Cancel Session                    | status='cancelled' (freeze stats as-is)      |

### Invariants

- `completed` and `cancelled` are terminal — no transitions out
- `ended_at` only set when status='completed'
- Cancel does NOT reverse already-accrued stats (G2 decision)
- Only host can trigger Cancel & End (co-host can do everything else except these terminal actions — TBD: confirm)

### Auto-transition?

For v1: no auto-transitions. Host explicitly drives all state changes for clarity. Future enhancement: auto-mark `live` when first match starts.

---

## 2. Match State Machine

```
   ┌─────────┐
   │ pending │  ← created when MatchRoundSet generated
   └────┬────┘
        │ start match
   ┌────▼────┐
   │  live   │  ← score editable freely (no stats yet)
   └────┬────┘
        │ end match  (host clicks "End Match")
   ┌────▼──────────────┐
   │    completed      │  ← stats APPLIED to participants
   └─────┬──────┬──────┘
         │      │
   edit▲┘      └▲re-end (if reverted to live)
         │      │
   ┌─────▼──────┴──┐
   │  completed    │  ← stats RE-SYNCED (reverse old → apply new)
   └───────────────┘
```

### Transitions

| From      | To        | Trigger                       | Side Effect                                                       |
|-----------|-----------|-------------------------------|-------------------------------------------------------------------|
| —         | pending   | Auto Generate batch creates Matches | Insert row, status='pending', scores=0,0                    |
| pending   | live      | Host/co-host: Start Match     | status='live', started_at=now()                                   |
| live      | completed | Host/co-host: End Match       | status='completed', ended_at=now(), **stats sync (apply)**        |
| completed | completed | Host/co-host: Edit score (G3) | scores updated, **stats sync (delta = new − old)**                |
| completed | live      | Host/co-host: Revert (rare)   | status='live', ended_at=NULL, **stats sync (reverse to 0)**       |

### Score-editing rules during `live`
- Scores can change freely (incr/decr) WITHOUT triggering stats sync
- Stats only applied on transition to `completed`

### Score-editing rules during `completed`
- Allowed (G3 decision)
- Triggers **delta stats sync**: new impact − old impact

### Invariants

- `team1_score >= 0` and `team2_score >= 0` (DB CHECK)
- All 4 player FKs distinct (DB CHECK)
- Stats sync is atomic — partial application not allowed

---

## 3. Stats Sync Algorithm

### 3.1 Scoring rules (from concept)

For each completed match:
- **Winning team players:** +3 points each, +1 win
- **Losing team players:** +1 point each, +1 loss
- **Draw (equal scores):** +2 points each, +1 draw

Each player gets +1 to `matches_played`.

### 3.2 Outcome computation

```typescript
type Outcome = 'win' | 'loss' | 'draw'
type TeamImpact = { points: number; outcome: Outcome }

function computeImpact(team1Score: number, team2Score: number):
    { team1: TeamImpact; team2: TeamImpact } {
  if (team1Score > team2Score) {
    return {
      team1: { points: 3, outcome: 'win' },
      team2: { points: 1, outcome: 'loss' },
    }
  }
  if (team2Score > team1Score) {
    return {
      team1: { points: 1, outcome: 'loss' },
      team2: { points: 3, outcome: 'win' },
    }
  }
  // Equal scores = draw
  return {
    team1: { points: 2, outcome: 'draw' },
    team2: { points: 2, outcome: 'draw' },
  }
}
```

### 3.3 Stats delta — apply to one participant

```typescript
type StatsDelta = {
  pointsDelta:   number  // can be negative (for reverse)
  matchesDelta:  number  // +1, 0, or -1
  winsDelta:     number  // +1, 0, or -1
  lossesDelta:   number  // +1, 0, or -1
  drawsDelta:    number  // +1, 0, or -1
}

async function applyStatsDelta(
  supabase: SupabaseClient,
  participantId: string,
  delta: StatsDelta,
): Promise<void> {
  // Update session-scope stats on session_participants
  await supabase.rpc('apply_participant_delta', {
    p_participant_id: participantId,
    p_points: delta.pointsDelta,
    p_matches: delta.matchesDelta,
    p_wins: delta.winsDelta,
    p_losses: delta.lossesDelta,
    p_draws: delta.drawsDelta,
  })

  // Fetch participant to see if it's a member (user_id NOT NULL)
  const { data: sp } = await supabase
    .from('session_participants')
    .select('user_id')
    .eq('id', participantId)
    .single()

  // If member, update lifetime stats on users table
  if (sp?.user_id) {
    await supabase.rpc('apply_user_delta', {
      p_user_id: sp.user_id,
      p_points: delta.pointsDelta,
      p_matches: delta.matchesDelta,
      p_wins: delta.winsDelta,
      p_losses: delta.lossesDelta,
      p_draws: delta.drawsDelta,
    })
    // Tier re-evaluation handled inside apply_user_delta or after
    await reevaluateTier(supabase, sp.user_id)
  }
}
```

**Note:** Use Postgres `rpc()` functions (defined below) to keep stats updates atomic at row level. Alternatively, use raw SQL via service_role.

### 3.4 Score change handler (main entry point)

```typescript
async function applyMatchScoreChange(
  supabase: SupabaseClient,
  matchId: string,
  newTeam1Score: number,
  newTeam2Score: number,
  transitionToCompleted: boolean,
): Promise<void> {
  // Atomic transaction: read match → compute deltas → write match + stats
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  const wasCompleted = match.status === 'completed'
  const willBeCompleted = transitionToCompleted || wasCompleted

  // Old impact (what's currently applied to stats)
  const oldImpact = wasCompleted
    ? computeImpact(match.team1_score, match.team2_score)
    : { team1: { points: 0, outcome: null }, team2: { points: 0, outcome: null } }

  // New impact (what should be applied after this change)
  const newImpact = willBeCompleted
    ? computeImpact(newTeam1Score, newTeam2Score)
    : { team1: { points: 0, outcome: null }, team2: { points: 0, outcome: null } }

  // Compute per-team deltas
  const team1Delta = computeDelta(oldImpact.team1, newImpact.team1, wasCompleted, willBeCompleted)
  const team2Delta = computeDelta(oldImpact.team2, newImpact.team2, wasCompleted, willBeCompleted)

  // Apply to all 4 players
  await Promise.all([
    applyStatsDelta(supabase, match.team1_p1_id, team1Delta),
    applyStatsDelta(supabase, match.team1_p2_id, team1Delta),
    applyStatsDelta(supabase, match.team2_p1_id, team2Delta),
    applyStatsDelta(supabase, match.team2_p2_id, team2Delta),
  ])

  // Update match row last
  await supabase.from('matches').update({
    team1_score: newTeam1Score,
    team2_score: newTeam2Score,
    status: willBeCompleted ? 'completed' : match.status,
    ended_at: willBeCompleted && !wasCompleted ? new Date().toISOString() : match.ended_at,
  }).eq('id', matchId)
}

function computeDelta(
  oldImpact: TeamImpact | { points: 0, outcome: null },
  newImpact: TeamImpact | { points: 0, outcome: null },
  wasCompleted: boolean,
  willBeCompleted: boolean,
): StatsDelta {
  return {
    pointsDelta: newImpact.points - oldImpact.points,
    matchesDelta: (willBeCompleted ? 1 : 0) - (wasCompleted ? 1 : 0),
    winsDelta:    (newImpact.outcome === 'win'  ? 1 : 0) - (oldImpact.outcome === 'win'  ? 1 : 0),
    lossesDelta:  (newImpact.outcome === 'loss' ? 1 : 0) - (oldImpact.outcome === 'loss' ? 1 : 0),
    drawsDelta:   (newImpact.outcome === 'draw' ? 1 : 0) - (oldImpact.outcome === 'draw' ? 1 : 0),
  }
}
```

### 3.5 Postgres RPC functions (optional but recommended)

Define these in Supabase for atomic increment ops:

```sql
CREATE OR REPLACE FUNCTION apply_participant_delta(
  p_participant_id UUID,
  p_points INT, p_matches INT, p_wins INT, p_losses INT, p_draws INT
) RETURNS VOID AS $$
BEGIN
  UPDATE session_participants
  SET session_points  = session_points + p_points,
      session_matches = session_matches + p_matches,
      session_wins    = session_wins + p_wins,
      session_losses  = session_losses + p_losses,
      session_draws   = session_draws + p_draws
  WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION apply_user_delta(
  p_user_id UUID,
  p_points INT, p_matches INT, p_wins INT, p_losses INT, p_draws INT
) RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_points  = total_points + p_points,
      total_matches = total_matches + p_matches,
      total_wins    = total_wins + p_wins,
      total_losses  = total_losses + p_losses,
      total_draws   = total_draws + p_draws,
      updated_at    = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Tier Re-evaluation

After `users.total_points` OR `users.total_matches` changes, check if tier should update.

```typescript
async function reevaluateTier(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('total_points, total_matches, current_tier_id')
    .eq('id', userId)
    .single()

  // Find highest tier where user meets BOTH thresholds
  const { data: tiers } = await supabase
    .from('tier_definitions')
    .select('id, min_points, min_matches, display_order')
    .lte('min_points', user.total_points)
    .lte('min_matches', user.total_matches)
    .order('display_order', { ascending: false })
    .limit(1)

  const newTierId = tiers?.[0]?.id ?? 1 // fallback to Rookie

  if (newTierId !== user.current_tier_id) {
    await supabase.from('users')
      .update({ current_tier_id: newTierId })
      .eq('id', userId)
    // Optional: emit "tier up" notification/celebration here
  }
}
```

### Tier downgrade?

Per concept doc: "no relegation". Stats only increment (denormalized aggregates never decrease in normal flow). However, edit-after-completed CAN decrease stats (G3). Question:

**Should tier downgrade if stats decrease via edit?**
- Strict no: tier never goes down. Implementation: take MAX(current_tier_id, new_tier_id).
- Pragmatic yes: tier reflects actual stats. Edit was probably correction of error, accept consequence.

**Recommendation:** Pragmatic yes for v1 — tier mirrors stats exactly. Simpler mental model. Edits are rare in practice.

---

## 5. Edge Cases & Invariants

### 5.1 Late join (G5)
- Insert SessionParticipant with `is_playing=true`, stats=0
- No need to backfill — they start fresh
- Auto Generate next round picks them up via `WHERE is_playing=true`

### 5.2 Toggle `is_playing` (host opts out)
- Just flip the flag
- Existing stats preserved
- Auto Generate next round excludes them
- They can be re-included by flipping back

### 5.3 Cohost assignment
- Update SessionParticipant.role from 'player' to 'co_host'
- DB CHECK enforces user_id NOT NULL (G4)
- Multiple co-hosts allowed (no DB limit)

### 5.4 Guest promotion to member?
- Out of scope for v1. Guests are ephemeral.
- Future v2: "Claim your guest stats" — link guest activity to new user account.

### 5.5 Delete session
- ON DELETE CASCADE removes MatchRoundSets, Matches, SessionParticipants
- BUT — stats already applied to users.* remain (denormalized)
- Question: should deleting completed session reverse stats?
  - **Recommendation:** No. v1 doesn't expose "delete session" UI for completed sessions. Only allow delete for `cancelled` or `upcoming` (no stats yet).

### 5.6 Concurrent score updates (race condition)
- Two co-hosts editing same match simultaneously
- Postgres row-level locking via `SELECT ... FOR UPDATE` in the transaction
- Last write wins, but stats sync still atomic
- For v1 closed beta: low concurrency, acceptable

### 5.7 OTP rate limiting
- Index on (whatsapp_number, expires_at) supports lookup
- App logic: max 3 OTP requests per phone per 10 min, max 5 verify attempts per OTP
- Cleanup: delete OTPs older than 1 day (cron)

---

## 6. Open Questions / Future Considerations

- **Audit log:** Currently no event log. If we want "match history with timeline", consider adding `match_events` table later.
- **Soft delete:** No `deleted_at` columns. If needed, add later.
- **Stats recomputation:** Provide an admin tool to recompute stats from match data (in case denormalized stats drift). Out of scope v1.
- **Notification:** Tier up, match invite, etc. Out of scope v1 (in v2 backlog).

---

## 7. Implementation Checklist

When implementing in Next.js:
- [ ] Server Action: `createSession(input)` → INSERT row, status='upcoming'
- [ ] Server Action: `addParticipant(sessionId, payload)` → INSERT with role+user_id/guest_name
- [ ] Server Action: `generateRound(sessionId)` → INSERT MatchRoundSet + Matches (via algorithm)
- [ ] Server Action: `startMatch(matchId)` → UPDATE status='live', started_at
- [ ] Server Action: `updateMatchScore(matchId, t1, t2)` → conditional stats sync
- [ ] Server Action: `endMatch(matchId)` → UPDATE status='completed' + stats sync
- [ ] Server Action: `editCompletedMatch(matchId, t1, t2)` → stats sync (delta)
- [ ] Server Action: `endSession(sessionId)` → status='completed'
- [ ] Server Action: `cancelSession(sessionId)` → status='cancelled' (freeze)
- [ ] Helper: `computeImpact(s1, s2)`
- [ ] Helper: `reevaluateTier(userId)`
- [ ] DB function: `apply_participant_delta(...)`
- [ ] DB function: `apply_user_delta(...)`

---

**END OF SPEC v1**
