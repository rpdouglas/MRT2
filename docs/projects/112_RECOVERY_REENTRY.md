# 🌅 Project 112: Recovery Reentry State

**Status:** ✅ Shipped
**Primary Persona:** Ned (Pink Cloud), secondarily anyone returning after a gap
**Objective:** When a user returns after 14+ days away, greet them without a broken-streak display or guilt copy, and let their streak metrics resurface only after 7 days of renewed engagement — a pattern named in `CLAUDE.md` and `docs/PERSONAS.md` but confirmed by a 2026-09-03 code audit to have zero implementation anywhere in `src/`. Additionally proactively notify the user (push) when they actually cross the 14-day mark, since that moment can only ever be detected server-side — a client-side check can't fire for a user who isn't opening the app.

---

## 0. `/planning` Session Corrections (2026-09-07) — read before implementing

The v0.1 draft below was written against a pre-`PROJ-76` mental model. Two corrections came out of grounding it in the current codebase:

**Correction 1 — the target component was wrong.** `PROJ-76` (Gamification Dashboard Relocation, shipped) already moved every streak/XP display off the Dashboard into an opt-in Profile → Achievements tab, specifically to reduce first-screen cognitive load for David. `SobrietyHero.tsx`'s Years/Months/Days is the **sobriety clock** (elapsed time since `sobrietyDate`) — a continuous value that doesn't reset from inactivity, so there's nothing to "suppress" there; doing so would hide accurate positive information for no reason. The real "breaks from inactivity" numbers live in `AchievementsTab.tsx`: **Journal Streak** (`stats.journal.journalStreak`), **Habit Fire** (`stats.task.habitFire`), and **Vitality Day Streak** (`stats.vitality.bioStreak`). **This spec now targets `AchievementsTab.tsx`, not `SobrietyHero.tsx`.** Resolves the original §6 Open Question #1 ("universal vs. Ned-specific") differently than either offered option: it's neither — the question was really "does this belong on the Dashboard at all," and the answer is no, it belongs where the actual streak numbers now live.

**Correction 2 — day-counting can't reuse `rhythmScore.ts`'s pattern, but doesn't need to.** `rhythmScore.ts` counts distinct active days off `Task.currentStreak`/`lastCompletedAt` — a single evolving scalar per task, not an append-only log, so it can't reliably reconstruct 7 days of history for a user with only 1-2 recurring tasks. `AchievementsTab.tsx` already fetches **full, unbounded** journal and task history (`['journals', uid]`, `['tasks', uid]` — no date bound, for the existing gamification calc), and `gamification.ts`'s `calculateConsecutiveStreak()` already runs off genuine per-entry `createdAt` timestamps. Since that data is already in memory, "days of re-engagement since reentry" can be derived live with a small new helper — **no `reentryActiveDays` array, no new query.** The only genuinely new state needed is a single anchor timestamp.

**Correction 3 (added during the notification discussion) — one field serves both the UI and the notification.** `reentryStartedAt: Timestamp | null` is written by *either* side, whichever notices the 14-day gap first: `dailyBeacon` (server, daily scan, only reaches users with a registered push token) or `AuthContext` on the user's actual return (client fallback, covers everyone else). Both read/write the same field — no divergent logic, no second flag needed for notification dedup.

---

## 1. The Executive Summary

**User Story:**
- **As** Ned, returning to the app after three weeks away (post-Pink-Cloud-Crash, maybe after a hard month), I want to be welcomed back without my broken streak staring at me — and I don't want the app pestering me daily while I'm gone, just one quiet acknowledgment that it's still here — so that reopening the app doesn't feel like walking back into a room where everyone knows I failed.

**Competitive Gap:** Most habit/recovery apps either show the broken streak immediately (punishing) or hide streaks entirely (no reward at all). MRT's documented design intent is a middle path — hide the number briefly, let it earn its way back — which no competitor in the category (I Am Sober, Reframe, Sober Grid, Loosid) does. This is a small feature with an outsized emotional-safety payoff for exactly the relapse-risk moment (a long gap, possibly following a lapse) the product's own persona work identifies as highest-stakes.

**Why this matters more than its size suggests:** a returning user mid-way through or just after a difficult stretch is close to Ned's Day-90 Pink-Cloud-Crash risk profile — the worst possible moment for the app to greet them with a visual "you failed" signal, or to nag them with a re-engagement push that reads as pressure. This is a safety-adjacent feature, not just a polish item, even though its implementation is small.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** Low. Reads/writes existing plaintext fields (`lastLogin`, `fcmTokens`, journal/task `createdAt`) already in `users/{uid}`/`journals/{id}`/`tasks/{id}` — no new sensitive data category. The one new field (`reentryStartedAt`) is plaintext metadata, same category as `lastSeenDailyImageDate`/`lastAutoBackupFailedAt`.
- [x] **Encryption Strategy:** None needed. `AchievementsTab.tsx` already decrypts journal `content` client-side for the existing word-count XP bonus (TD-21) — this feature reuses that already-decrypted data for day-uniqueness counting only, doesn't add a new decrypt path, and never sends anything to Gemini.
- [x] **Key Rotation:** N/A — nothing new for `executePinRotation`/`executeCryptoShredding`; `reentryStartedAt` is not recovery content.

---

## 3. Schema & Architecture 🗄️

**One new field.** `src/lib/db.ts`:
```ts
export interface UserProfile {
  // ...existing fields
  reentryStartedAt?: Timestamp | null; // set by whichever side (server dailyBeacon or client AuthContext) first detects a ≥14-day lastLogin gap; cleared by the client once 7 days of re-engagement accrue
}
```

**Existing-code nuance that must be preserved, not "fixed":** `getOrCreateUserProfile()` (`src/lib/db.ts:323-332`) reads the user's doc (`userSnap`, containing the *previous* session's `lastLogin`), then calls `updateDoc(userRef, { lastLogin: Timestamp.now() })` — but **returns `userSnap.data()`**, the pre-update snapshot. Verified during `/planning`: **nothing downstream of `AuthContext.tsx:94` actually keeps that returned value today** — `AuthContext` only reads `profile.tier`/`profile.role`/`profile.fcmSwVersion` off it and discards the rest; every other consumer (`useUserProfile()`, used by `AchievementsTab`/`Dashboard`) does a **separate** `getProfile()` fetch via TanStack Query that fires *after* `AuthContext` has already awaited the `updateDoc` — so it always sees the just-overwritten "now" value, never the prior session's. **Implementation must capture the pre-update `lastLogin` directly inside `AuthContext.tsx` at line 94** (expose e.g. `previousLastLogin` on `useAuth()`) rather than relying on any downstream re-fetch, or `daysAway` silently computes as `0` forever. A unit test locking in `getOrCreateUserProfile`'s pre-update-return behavior is required (§5) since a future refactor could "fix" that ordering without realizing this feature now depends on it.

**Day-counting helper (`src/lib/gamification.ts`):** add `countActiveDaysSince(journals: ScorableJournal[], since: Date): number` — same date-uniqueness logic as `calculateConsecutiveStreak()`'s `uniqueDays` set, but bounded by `createdAt >= since` instead of "trailing consecutively from today." Reuses data `AchievementsTab.tsx` already has in memory; no new query.

**Server side (`functions/src/index.ts`):** no new collection, no new index. `dailyBeacon`'s existing per-user doc read already has `lastLogin`; add `reentryStartedAt` to the same read and to the `updateDoc`/batch write already happening for stale-token pruning.

---

## 4. Implementation Phases 🏗️

### Phase 1: `AuthContext.tsx` — capture the pre-update `lastLogin`
At the existing `getOrCreateUserProfile(currentUser)` call site (`AuthContext.tsx:94`), capture `profile.lastLogin` into a new piece of context state (`previousLastLogin`) before it's discarded. Exposed via `useAuth()`.

### Phase 2: `useRecoveryReentry()` hook (new)
Given `previousLastLogin` (from Phase 1) and `profile.reentryStartedAt`:
- If `reentryStartedAt` is already set (server beat the client to it), use it directly.
- Else, if `daysAway` (from `previousLastLogin` to now) `>= 14`, write `reentryStartedAt = now` via `patchFields` (client-side fallback for users `dailyBeacon` never reaches — no push token registered).
- `isReentry = !!reentryStartedAt`.
- `daysBack = countActiveDaysSince(journals, reentryStartedAt)` (journals already loaded by the calling component — see Phase 3).
- `streakResurfaced = daysBack >= 7` → on reaching this, clear `reentryStartedAt` back to `null`.

### Phase 3: `AchievementsTab.tsx` — suppress, don't hide
Wire `useRecoveryReentry()` in. When `isReentry && !streakResurfaced`: replace the numeric display in the **Journal Streak**, **Habit Fire**, and **Vitality Rhythm** cards with warm reentry copy (reuse the design system's established tone — "Yesterday is behind you" style, `docs/design/mrt_design_system.md` §IX.A/§IX.B — not inventing new voice). The Rank/Level/XP card is untouched — XP accumulates monotonically, nothing to suppress there. Once `streakResurfaced`, cards revert to normal numeric display — should read as the streak quietly "coming back," not a jarring reappearance; a brief, quiet acknowledgment (not full milestone-tier celebration) is appropriate.

**Known boundary condition, explicitly accepted rather than fixed here:** `AchievementsTab.tsx` queries `tasks` directly and does not run `reconcileOverdueTask()` (that only fires from `useTasksList`'s `onSnapshot`, i.e. the Tasks page) — so a user who opens Profile → Achievements *before* ever visiting Tasks in a new session may still see a stale, pre-gap `currentStreak` value underlying Habit Fire. Documented as a known pre-existing cross-component inconsistency (not introduced by this feature); not in scope to fix.

**Somatic Check:** No guilt copy, no "you were gone for X days" framing, no reference to what the user missed — matches the existing empty-state guardrail ("Yesterday is behind you," not "You missed your check-in").

**Reward:** None during the suppressed window — the reward *is* the numbers quietly reappearing at day 7.

### Phase 4: Server-side detection + push notification (`functions/src/index.ts`)
`dailyBeacon` already runs daily over every user with a registered FCM token (`fcmTokens != []`) via the existing `BeaconAlert` pure-function chain (`computeMilestoneAlert` → `computeHabitAlert` → `computeMatReminderAlert`, first non-null wins, one push/user/day).

- Add `computeReentryAlert(lastLogin: Timestamp | undefined, reentryStartedAt: Timestamp | null | undefined, nowUTC: Date): BeaconAlert | null` — fires only when the gap first reaches 14 days **and** `reentryStartedAt` is not already set (that null-check is the dedup guard: it can fire at most once per absence, never daily, which would itself become the nagging pattern this feature exists to prevent).
- **New priority order:** `computeMilestoneAlert` → **`computeReentryAlert`** → `computeHabitAlert` → `computeMatReminderAlert`. Reentry must outrank the habit-nagging alert, not just sit alongside it — "you have 3 overdue habits!" is exactly the punishing message a 14-day-absent user shouldn't get instead of a reentry-appropriate one. Milestone still wins over it unconditionally — good news is never suppressed.
- When `computeReentryAlert` fires, `dailyBeacon` also writes `reentryStartedAt = now` to that user's doc in the same pass (mirrors the existing stale-token-pruning batch write already in this function).
- **Copy — checked against `docs/design/mrt_design_system.md` §X's Non-Manipulation Commitment** (no artificial scarcity, no social pressure, **no loss-framed reminders**): must not mention streaks, days away, or "missing" the user. Fixed, generic copy — same discipline as `computeMatReminderAlert`'s documented invariant (never interpolates anything user-specific). Draft: *Title: "Whenever you're ready" / Body: "My Recovery Toolkit is here when you want it — no rush."* Maps to the design system's "Accountability" notification row (standard push, user-configured, neutral tone) — not "Grounding" (silent) or "Milestone" (celebratory), since it's neither ambient nor good-news.
- **Toggle:** inherits the existing blanket `pushNotificationsEnabled` gate (same as milestone/habit/MAT alerts today) — no new granular per-alert-type toggle. Disabling push already clears `fcmTokens`, which already excludes the user from `dailyBeacon`'s query entirely; no additional server-side check needed.
- **No changes to `dailyBeacon`'s query shape, pagination, or cost profile** — this is a new branch inside the already-scanned, already-token-gated user set, not a new scan.

### Phase 5: Edge Cases
- [ ] `lastLogin` gap exactly on the 14-day boundary → round down; 14 full days away triggers reentry (matches "14+ days" spec language), both client and server sides.
- [ ] 0 recurring tasks/journal entries in the 7-day resurfacing window (not fully re-engaged) → streak stays suppressed indefinitely until 7 active days accrue; no forced timeout that reveals a still-broken streak.
- [ ] `navigator.onLine` false at login → comparison uses whatever cached profile data TanStack Query has; acceptable staleness, not security-sensitive.
- [ ] `isVaultUnlocked` false → this feature only touches plaintext data — works identically regardless of vault state, no gating needed.
- [ ] Brand-new user (first-ever login, no prior `lastLogin`) → `isReentry` must be `false` by construction, not accidentally true from an undefined comparison (the `else`/create branch of `getOrCreateUserProfile()`).
- [ ] User has no push token → never scanned by `dailyBeacon`'s reentry branch at all; `reentryStartedAt` is set purely by the client fallback (Phase 2) whenever they eventually return — UI suppression still works correctly, they just never got the proactive nudge.
- [ ] User returns, then goes quiet again for another 14+ days later → `reentryStartedAt` was cleared to `null` once `streakResurfaced` fired after the first absence, so the guard naturally allows a fresh notification/suppression cycle for the second absence.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:**
  - `countActiveDaysSince()` — boundary cases (0 entries, entries before/after `since`, entries spanning multiple days).
  - `useRecoveryReentry()` — `isReentry`/`daysBack`/`streakResurfaced` across boundary cases (exactly 14 days, 13 days, first-ever login, 7-days-back reached, `reentryStartedAt` already set by server vs. not).
  - A dedicated regression test confirming `getOrCreateUserProfile()`'s pre-update-snapshot-return behavior keeps working (§3).
  - `computeReentryAlert()` — fires at exactly 14 days, doesn't fire when `reentryStartedAt` already set, doesn't fire under 14 days.
  - `processUserBatch` priority-ordering regression: reentry beats habit alert; milestone beats reentry.
- [ ] **Component Tests:** First dedicated `AchievementsTab.tsx` reentry-state coverage — suppressed rendering for all 3 affected cards, normal rendering otherwise, and the "visited Achievements before ever visiting Tasks" boundary condition (§4 Phase 3) documented as an accepted known limitation, not silently papered over.
- [ ] **The Subway Test:** reentry state computable/renderable offline from cached profile + journal/task data.
- [ ] **The "Lost PIN" Test:** N/A — no encrypted data involved.

---

## 6. Open Questions — resolved during `/planning` (2026-09-07)

| # | Question | Resolution |
|---|---|---|
| 1 | Does the reentry state apply per-persona differently, or is it a single universal Dashboard behavior? | Moot — see Correction 1. It's not a Dashboard behavior at all; it lives on `AchievementsTab.tsx`, which Walt's flows don't depend on regardless. Universal, no persona branching. |
| 2 | Should the 7-day resurfacing count reset if the user goes away again mid-window? | **Total, not consecutive** (spec's original option b) — matches `rhythmScore.ts`'s own stated philosophy ("more forgiving than a streak"); a stricter consecutive requirement risks re-triggering the exact punishing dynamic this feature exists to avoid. |
| 3 (new) | Should the push notification be gated behind a dedicated toggle separate from the existing blanket `pushNotificationsEnabled`? | No — inherit the existing blanket toggle, consistent with every other `dailyBeacon` alert type; no granular per-type toggle exists anywhere in the app today, and adding one here would be scope creep. |

---

*MRT · PROJ-112 Recovery Reentry State · v0.2 · 2026-09-07 · Status: Planned, strategy approved via `/planning`*
