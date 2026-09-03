# 💊 Project 111: MAT Dose-Tracking & Discreet Notifications (Jordan)

**Status:** ⚪ Planned — not yet through `/planning`
**Primary Persona:** Jordan (The Stabiliser)
**Objective:** Give Jordan a single-tap daily dose log, a renameable sobriety/stability counter, and discreet push notifications — closing the three concrete gaps a 2026-09-03 code audit confirmed are entirely absent today (`customCounterLabel`-type field, dose-logging UI/schema, and drug-name-free notification copy all return zero matches in `src/`).

---

## 1. The Executive Summary

**User Story:**
- **As** Jordan, I want to log today's Suboxone dose in one tap from the Dashboard so that tracking compliance doesn't feel like a chore competing with my day.
- **As** Jordan, I want to rename "Days Sober" to "Days of Stability" (or any label I choose) so that the app's own language doesn't imply my prescribed medication is cheating.
- **As** Jordan, I want reminder notifications that say "Time for your morning routine check-in" — never "Take your Suboxone" — so that a glance at my lock screen never outs my medical status to whoever's next to me.

**Competitive Gap:** No mainstream recovery app (I Am Sober, Reframe, Sober Grid, Loosid) supports MAT as a first-class tracked path rather than treating it as an asterisk on an abstinence counter. Per `docs/PERSONAS.md`, this is explicitly one of MRT's five persona-hierarchy roles ("Primary Stabilization Driver") — shipping it is a direct, differentiated answer to a documented, named user, not a generic feature request.

**Scope note:** this spec covers the three concrete gaps found in the audit (dose log, custom label, discreet notifications). Jordan's persona doc also references a "Side-Effect Correlation Matrix" (craving/mood/sleep vs. dose timing) — that's a larger analytics feature building *on top of* the dose-log data this spec creates, and is deliberately left as a Phase 2/future follow-up rather than bundled in here, to keep this spec's blast radius bounded and reviewable.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [ ] **Data Sensitivity:** Yes — "did I take a specific medication today" is sensitive medical data, arguably more sensitive than most journal content because it's structured and unambiguous (unlike free-text prose, it can't be misread). Treat with the same seriousness as journal/workbook content.
- [ ] **Encryption Strategy:** Split, following the existing `tasks`/`rosc_assessments`/`game_progress` partial-encryption precedent in `CLAUDE.md`'s ZK boundary table (not a new pattern):
  - `mat_doses/{id}`: `uid`, `loggedAt` (Timestamp), `date` (string, `YYYY-MM-DD`, for compliance-rate queries) — **plaintext**, matching `tasks/{id}`'s existing precedent ("needed for streak evaluation"). The fact that a dose was logged on a given day, with no note attached, is comparable in sensitivity to a completed task.
  - `mat_doses/{id}.encryptedNote` — **optional, AES-GCM encrypted** via `src/lib/crypto.ts`, for any free-text the user adds (side effects, how they're feeling). This is the sensitive part and follows the exact `journals/{id}.content` pattern.
  - `users/{uid}.customCounterLabel` — **plaintext**, added to the existing unencrypted `users/{uid}` profile-metadata doc. This is UI copy the user chose ("Days of Stability"), not recovery content — same category as `anchorSettings` in the current ZK table, not a new exception.
- [ ] **Key Rotation:** `mat_doses/{id}.encryptedNote` must be included in `executePinRotation` (re-encrypt) and `executeCryptoShredding` (delete), same as `game_progress`'s encrypted fields. `customCounterLabel` needs neither (plaintext metadata, like `sponsorName`).
- [ ] **Notification content boundary:** push notification bodies are generated server-side (`functions/src/index.ts`, The Beacon). MAT reminder copy must be a fixed, generic string (e.g. "Time for your morning routine check-in") with **zero interpolation of drug name, dose amount, or `customCounterLabel`** — the label itself could be revealing (e.g. a user might name it something identifying), so it must never appear in a push payload, only inside the authenticated app.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**

- **New: `mat_doses/{id}`**
  ```typescript
  interface MatDoseLog {
    id: string;
    uid: string;
    loggedAt: Timestamp;        // plaintext — server timestamp at log time
    date: string;                // plaintext — 'YYYY-MM-DD' in user's local tz, for compliance-rate grouping
    isEncrypted: boolean;
    encryptedNote?: string;      // AES-GCM, 'IV:Ciphertext' — optional side-effect/feeling note
  }
  ```
  Firestore rules: owner-only read/write, same shape as `journals`'s existing rule block.

- **Modified: `users/{uid}`** (`src/lib/db.ts` `UserProfile`)
  ```typescript
  // MAT mode — opt-in, defaults undefined/false (not every user is on MAT)
  matModeEnabled?: boolean;
  customCounterLabel?: string;   // e.g. "Days of Stability" — overrides the hardcoded "Days" label
  ```

**Types (`src/lib/db.ts`):** as above, added to the existing `UserProfile` interface — not a new file.

**Existing infrastructure this reuses rather than duplicates:**
- `journalTemplates.ts` already has a MAT-relevant prompt ("Took my medication as prescribed today? (Yes/No)") in a guided journal template — that's free-text reflection, separate from this spec's structured one-tap log, and stays as-is.
- The Beacon (`functions/src/index.ts`) already has a generic-notification-content pattern (`BeaconAlert { title, body }`) — the discreet MAT reminder is a new `BeaconAlert` variant using this existing interface, not a new notification pipeline.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
- `useMatDoseLog()` React Query hook: `logDose(note?: string)`, `getTodaysDose()`, `getComplianceRate(days: number)` (percentage of days with a log in the last N days — same shape as `rhythmScore.ts`'s existing forgiving-consistency math, reuse the pattern rather than inventing a new formula).
- Firestore security rules for `mat_doses/{id}` (owner-only, matching `journals`).
- `customCounterLabel`/`matModeEnabled` read/write via the existing `useUserProfile()` hook — no new profile hook needed.

### Phase 2: UI/UX
- **Dashboard widget:** a single-tap "Log Dose" button, visible only when `matModeEnabled` — same one-tap bar David's SOS button and Ned's task-complete swipe already meet, per the persona's own UX Constraint ("logging a dose must take exactly one tap from the dashboard widget"). Reuse `DynamicAnchorWidget.tsx`'s existing two-card layout pattern rather than a new component shape — add dose-log as a third card when MAT mode is on, following the same `needsX`/icon/label structure already there (and now amber, not red, per `TD-28`).
- **Custom counter label:** a text input in Profile → General (next to where `sponsorName` already lives), writing `customCounterLabel`. `SobrietyHero.tsx:227`'s hardcoded `"Days"` label becomes `userProfile.customCounterLabel || "Days"` — a one-line change once the field exists.
- **Somatic Check:** the MAT-mode toggle and custom label live in Profile, not forced during onboarding — Jordan opts in, it's never assumed. No "Enable MAT tracking?" prompt shown to non-MAT users.
- **Reward:** compliance-rate percentage shown quietly (matching Rhythm Score's tone: no XP, no streak-break punishment) — a missed day should read like Tasks' Forgiveness Tap, not like a failure state.

### Phase 3: Discreet Notifications
- New `BeaconAlert` case in `functions/src/index.ts` for MAT reminders: fixed copy, e.g. `{ title: "Daily Check-In", body: "Time for your morning routine check-in." }` — no drug name, no dose amount, ever, per the Security Audit above.
- Respects the existing `pushNotificationsEnabled` opt-out — no new opt-out mechanism needed.

### Phase 4: Edge Cases
- [ ] `navigator.onLine` is false → dose log writes to TanStack Query cache optimistically, syncs on reconnect (same pattern as task completion).
- [ ] `isVaultUnlocked` is false → the dose-log *action* (plaintext `loggedAt`/`date`) still works without unlocking, matching Tasks' precedent; the optional encrypted note field is disabled/hidden until unlock, with an inline note like SOS Modal's existing "Requires unlocking your vault first."
- [ ] 320px screen (iPhone SE) → dose-log card fits the existing `DynamicAnchorWidget` two-card grid without introducing horizontal scroll (it becomes 3 cards or wraps — needs a real layout decision during implementation, not assumed here).
- [ ] User disables MAT mode after logging doses → historical `mat_doses` entries are neither deleted nor hidden; the Dashboard widget and Profile label control simply stop showing. Data export (PDF/JSON) should still include MAT history per Walt/Maya's data-sovereignty expectations even for a Jordan-track user.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests:** `useMatDoseLog()` CRUD + compliance-rate math; `customCounterLabel` fallback behavior (renders "Days" when unset, per the existing default).
- [ ] **The Subway Test:** dose log renders/queues correctly offline.
- [ ] **The "Lost PIN" Test:** `mat_doses.encryptedNote` confirmed re-encrypted by `executePinRotation` and deleted by `executeCryptoShredding` — plaintext `loggedAt`/`date` persist through rotation (they're not vault-key-derived), matching `tasks`' existing behavior.
- [ ] **Notification content check:** a fixture test asserting the MAT `BeaconAlert` body string contains no medication-related keywords (`Suboxone`, `Buprenorphine`, `opioid`, `naltrexone`, etc.) — a lightweight regression guard against a future edit accidentally interpolating something sensitive into a push payload.

---

## 6. Open Questions

*These should be resolved during `/planning`, not silently assumed.*

| # | Question | Options |
|---|---|---|
| 1 | Does `matModeEnabled` gate anything beyond the Dashboard widget and counter label — e.g. does it change onboarding copy, or Welcome page framing? | (a) UI-only gate, no onboarding change (simplest, matches this spec's bounded scope) · (b) Also offers MAT-specific onboarding path |
| 2 | Should missed-dose days affect the compliance-rate number the same way Tasks' Rhythm Score treats missed days (forgiving, 14-day rolling), or does medical compliance need a stricter/different metric? | (a) Reuse Rhythm Score's exact forgiving formula · (b) A distinct, possibly stricter formula — needs a product call, since under-representing a real compliance gap could matter clinically in a way a missed journaling day doesn't |
| 3 | Is one `mat_doses` log per day sufficient, or do some MAT regimens need multiple doses/day (e.g. split-dose Suboxone)? | (a) One log/day (simplest, matches the "Days of Stability" framing) · (b) Multiple timestamped logs/day — bigger schema and UI implication |

---

*MRT · PROJ-111 MAT Dose-Tracking & Discreet Notifications · v0.1 DRAFT · 2026-09-03 · Status: Planned*
