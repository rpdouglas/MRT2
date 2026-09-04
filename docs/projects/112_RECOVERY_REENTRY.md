# 🌅 Project 112: Recovery Reentry State

**Status:** ⚪ Planned — not yet through `/planning`
**Primary Persona:** Ned (Pink Cloud), secondarily anyone returning after a gap
**Objective:** When a user returns after 14+ days away, greet them without a broken-streak display or guilt copy, and let their streak/clean-time metrics resurface only after 7 days of renewed engagement — a pattern named in `CLAUDE.md` and `docs/PERSONAS.md` but confirmed by a 2026-09-03 code audit to have zero implementation anywhere in `src/`.

---

## 1. The Executive Summary

**User Story:**
- **As** Ned, returning to the app after three weeks away (post-Pink-Cloud-Crash, maybe after a hard month), I want to be welcomed back without my broken streak staring at me, so that reopening the app doesn't feel like walking back into a room where everyone knows I failed.

**Competitive Gap:** Most habit/recovery apps either show the broken streak immediately (punishing) or hide streaks entirely (no reward at all). MRT's documented design intent is a middle path — hide the number briefly, let it earn its way back — which no competitor in the category (I Am Sober, Reframe, Sober Grid, Loosid) does. This is a small feature with an outsized emotional-safety payoff for exactly the relapse-risk moment (a long gap, possibly following a lapse) the product's own persona work identifies as highest-stakes.

**Why this matters more than its size suggests:** a returning user mid-way through or just after a difficult stretch is close to Ned's Day-90 Pink-Cloud-Crash risk profile — the worst possible moment for the app to greet them with a visual "you failed" signal. This is a safety-adjacent feature, not just a polish item, even though its implementation is small.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [ ] **Data Sensitivity:** Low. This feature reads existing plaintext fields (`lastLogin`, task-completion timestamps) already in `users/{uid}`/`tasks/{id}` — no new sensitive data category.
- [ ] **Encryption Strategy:** None needed — no new Firestore fields are required (see Schema below; this can be built entirely from data that already exists).
- [ ] **Key Rotation:** N/A — nothing new to include in `executePinRotation`.

---

## 3. Schema & Architecture 🗄️

**No new Firestore fields required.** This is the key architectural finding from grounding this spec in the real code:

- `users/{uid}.lastLogin` already exists (`src/lib/db.ts`) and is exactly what "14+ days away" detection needs.
- **Important existing-code nuance to preserve, not "fix":** `getOrCreateUserProfile()` (`src/lib/db.ts:255-264`) reads the user's doc (`userSnap`, containing the *previous* session's `lastLogin`), then calls `updateDoc(userRef, { lastLogin: Timestamp.now() })` — but **returns `userSnap.data()`**, the pre-update snapshot. That means the `UserProfile` object every caller already receives on login *already contains the prior session's `lastLogin`*, even though Firestore's stored doc has since been overwritten to "now" in the same call. Reentry detection should read `lastLogin` off the object returned from this call (or cache it in `AuthContext` at that moment), not re-fetch the profile afterward — a second fetch would see the already-updated "now" value and the gap would be lost. Confirm this behavior with a unit test before relying on it (it reads as intentional but isn't documented as such anywhere).
- Streak/clean-time source data (`stats.days` in `SobrietyHero.tsx`, task-completion history in `tasks/{id}`) is already plaintext and queryable — no new collection needed to compute "has this user completed a recurring task in the last 7 days."

**Types (`src/lib/db.ts`):** no changes needed. If reentry *state* needs to persist across a session (e.g. "still in the 7-day resurfacing window"), the cleanest option is deriving it live from `lastLogin` + task-completion history on every render rather than storing a new field — avoids a write path entirely. Revisit only if derivation proves too expensive.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
- `useRecoveryReentry()` hook (or a plain derived value inside `useUserProfile()`/`Dashboard.tsx`): given the `lastLogin` captured at this session's start (per the Schema note above) and "now," compute `daysAway`. `isReentry = daysAway >= 14`.
- Once `isReentry` is true, track "days back" by counting distinct days with ≥1 completed recurring task since the reentry login (reuse `rhythmScore.ts`'s existing day-counting logic rather than writing new date math). `streakResurfaced = daysBack >= 7`.

### Phase 2: UI/UX
- **Dashboard greeting:** when `isReentry && !streakResurfaced`, `SobrietyHero.tsx`'s streak number is suppressed (matching the existing "no broken streak shown" rule) and replaced with warm reentry copy — reuse the empty-state copy *pattern* already established elsewhere in the app (e.g. `docs/design/mrt_design_system.md`'s "Yesterday is behind you" style, non-binding as a design system but fine as copy-voice reference) rather than inventing a new tone from scratch.
- Once `streakResurfaced` is true, `SobrietyHero.tsx` reverts to its normal display — this should read as the streak "coming back," not a sudden reappearance the user has to notice on their own; a brief, quiet celebratory moment (not full milestone-confetti-tier, just enough to acknowledge it) is appropriate here.
- **Somatic Check:** absolutely no guilt copy, no "you were gone for X days" framing, no reference to what the user missed. The existing empty-state guardrail in this codebase ("Yesterday is behind you," not "You missed your check-in") is the tone bar.
- **Reward:** none during the suppressed window — the reward *is* the streak/counter quietly reappearing at day 7, not a separate mechanic.

### Phase 3: Edge Cases
- [ ] What if the user's `lastLogin` gap is exactly on the 14-day boundary? Round down — 14 full days away triggers reentry, matching the spec language ("14+ days").
- [ ] What if the user completes 0 recurring tasks in the 7-day resurfacing window (still not fully re-engaged)? Streak stays suppressed indefinitely until 7 days-with-activity accrue — no forced timeout that reveals a still-broken streak.
- [ ] `navigator.onLine` is false at login → `lastLogin` comparison uses whatever cached profile data TanStack Query has; acceptable staleness, no special handling needed (this isn't a security-sensitive computation).
- [ ] `isVaultUnlocked` is false → this feature only touches plaintext Dashboard data (`lastLogin`, task completion, clean-time counter) — works identically regardless of vault state, no gating needed.
- [ ] A brand-new user (first-ever login) → `daysAway` computation must not fire on a null/absent prior `lastLogin` (the `else` branch in `getOrCreateUserProfile()` creating a new profile) — `isReentry` should be `false` by construction here, not accidentally true from an undefined comparison.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:** `useRecoveryReentry()`'s `isReentry`/`daysBack`/`streakResurfaced` logic across boundary cases (exactly 14 days, 13 days, first-ever login, 7-days-back reached). A dedicated test confirming `getOrCreateUserProfile()`'s pre-update-snapshot-return behavior (the Schema note above) keeps working, since a future refactor could "fix" that ordering without realizing this feature depends on it.
- [ ] **The Subway Test:** reentry state computable/renderable offline from cached profile + task data.
- [ ] **The "Lost PIN" Test:** N/A — no encrypted data involved.

---

## 6. Open Questions

| # | Question | Options |
|---|---|---|
| 1 | Does the reentry state apply per-persona differently, or is it a single universal Dashboard behavior? | (a) Universal (simplest, matches this spec's scope — the suppressed-streak rule benefits every persona, not just Ned) · (b) Ned-specific, skipped for personas who already hide gamification (Walt) — likely unnecessary complexity since Walt's Dashboard already doesn't show streaks by design (PROJ-76) |
| 2 | Should the 7-day resurfacing count reset if the user goes away again mid-window? | (a) Yes — must be 7 *consecutive-ish* active days, matching Rhythm Score's own trailing-window logic · (b) No — any 7 active days total within some larger window counts, more forgiving |

---

*MRT · PROJ-112 Recovery Reentry State · v0.1 DRAFT · 2026-09-03 · Status: Planned*
