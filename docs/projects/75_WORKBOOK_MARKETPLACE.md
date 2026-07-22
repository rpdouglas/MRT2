# 📁 Project 75: Workbook Marketplace (v1 — Official Catalog)

**Status:** 🟢 Done (v1 — Official Catalog Only)
**Primary Persona:** Walt, Ned
**Objective:** Let a user add or remove official (MRT-authored) workbooks from their personal "My Workbooks" library, laying the per-user "installed" foundation that a future community-authored phase can plug into without rework.

---

## 1. The Executive Summary

**User Story:** As Walt, I want to curate which official workbooks appear in my library — hiding ones I'll never use and adding new ones as MRT ships them — so my Workbooks hub only shows content relevant to my path, without losing any progress I've already logged.

**Competitive Gap:** "I Am Sober," "Reframe," and "Sober Grid" ship a fixed, one-size-fits-all content set with no concept of a personal library. MRT's workbook catalog already spans multiple fellowships/modalities (12-Step, Recovery Dharma, Women for Recovery, general); letting a user tailor which of those appear — while a future phase opens the door to community-authored ones — is a differentiator, not table stakes.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** No. `installedWorkbookIds` is a list of catalog ids the user has chosen to show/hide — metadata about UI preference, not recovery disclosure. Same sensitivity class as `anchorSettings`/`fcmTokens` in the `users/{uid}` document (see CLAUDE.md's encryption-boundary table).
- [x] **Encryption Strategy:** None needed. `installedWorkbookIds` is stored unencrypted on `users/{uid}`, consistent with every other plaintext preference field on that document.
- [x] **Key Rotation:** Not applicable — `installedWorkbookIds` is unencrypted and lives outside `executePinRotation`'s scope (which only covers encrypted collections: journals, workbook_answers, service, game_progress, game_saves).

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `users/{uid}` — one new optional field, no new collection.

**Types (`src/lib/db.ts`):**
```typescript
export interface UserProfile {
  // ...existing fields...
  // Which official workbook ids appear in the user's "My Workbooks" library.
  // undefined means legacy/new user — treat as all official workbooks installed
  // (see getDefaultInstalledWorkbookIds in src/data/workbooks.ts).
  installedWorkbookIds?: string[];
}
```

**Reuse (do not reinvent — per CLAUDE.md "reuse existing hooks/utilities"):**
* `useUserProfile()`'s existing `updateProfile` mutation (`src/hooks/useUserProfile.ts`) — already documented as safe for scalar/array fields with no sibling nested keys, which `installedWorkbookIds` is. No new Firestore read/write path, no new hook-level query key.
* `src/data/workbooks.ts`'s `WORKBOOKS` registry stays the single source of truth for official workbook content (id/title/sections/questions) — preserves the load-bearing `Question.id` immutability invariant and the `src/data/__tests__/workbooks.test.ts` guardrails from PROJ-55. This project only adds a per-user filter on top; it does not change how workbook content is authored or shipped.
* `firestore.rules`: no change required. The existing `users/{userId}` owner-update rule already permits any new field other than the `tier`/`tierSource`/`role`/`pinAttempts` blocklist, so `installedWorkbookIds` writes are already covered.

**Rejected alternative:** moving the catalog into a new Firestore collection (à la `daily_readings`'s admin-write/all-read pattern) so admins could publish new official workbooks without an app deploy. Deferred — a future community-authoring phase will need its own collection with `authorUid`/moderation-status fields anyway, so building a catalog collection now would likely be replaced, not extended, once that phase starts (see §6).

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* `UserProfile.installedWorkbookIds?: string[]` added to `src/lib/db.ts`.
* `getDefaultInstalledWorkbookIds()` added to `src/data/workbooks.ts` — returns all `WORKBOOKS` ids, used as the fallback when the field is `undefined` (legacy users and brand-new signups both start with every official workbook installed, matching pre-marketplace behavior).
* New hook `src/hooks/useWorkbookLibrary.ts`, built on `useUserProfile()`: exposes `catalog` (full `WORKBOOKS`), `installedWorkbooks` (filtered), `isInstalled(id)`, `addWorkbook(id)`, `removeWorkbook(id)`.
* No new Firebase security rules — see §3.

### Phase 2: UI/UX & Gamification
* `src/pages/Workbooks.tsx`: "My Workbooks" tab now sources cards from `useWorkbookLibrary().installedWorkbooks` instead of the raw `WORKBOOKS` import; shows an empty-state message ("Your library is empty. Visit the Marketplace tab to add a workbook.") if the user has removed everything.
* New third tab, **Marketplace**, alongside the existing Workbooks/Fellowships tabs — lists the full catalog with an Add/Remove toggle per card reflecting install state.
* **Somatic Check:** "Remove" is worded as "Remove from My Workbooks," never "Delete" — it only hides the workbook from the library filter, it does not touch `workbook_answers`. A one-line explainer at the top of the Marketplace tab states this explicitly so removing never reads as destructive or shame-inducing (relevant for David/Ned, who may remove a workbook they're not ready for yet without fear of losing prior answers).
* **Reward:** No XP change. `TOTAL_WORKBOOK_QUESTIONS` in `src/lib/gamification.ts` deliberately stays computed across *all* of `WORKBOOKS`, not filtered by installed set — removing an unfinished workbook must not be able to inflate a user's mastery percentage.

### Phase 3: Edge Cases
* [x] **Offline:** `useWorkbookLibrary` reads through `useUserProfile()`'s existing TanStack Query cache — same offline behavior as every other profile-backed read; add/remove mutations queue like any other `updateProfile` write.
* [x] **Vault locked:** Not applicable — `installedWorkbookIds` is unencrypted and doesn't touch `EncryptionContext`, so the Marketplace tab works identically whether the vault is locked or unlocked.
* [x] **320px viewport:** Marketplace cards reuse the existing Workbooks-tab card layout/theming (`getTheme()`), which already wraps correctly at narrow widths; the Add/Remove button is a compact pill that sits inline with the title.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:**
  * `src/hooks/__tests__/useWorkbookLibrary.test.ts` — default-all-installed fallback when `installedWorkbookIds` is `undefined`, filtering, add/remove mutation payloads, no-op on duplicate add / already-absent remove.
  * `src/pages/__tests__/Workbooks.test.tsx` — "My Workbooks" respects the installed filter (incl. empty-state), Marketplace renders the full catalog with correct Add/Remove state per card, clicking Add/Remove calls through to the hook with the right id.
  * `src/data/__tests__/workbooks.test.ts` — untouched, still passing (content invariants are unaffected by this change).
* [x] **The Subway Test:** No network dependency beyond the existing profile read/write path; behaves the same as any other offline `updateProfile` call.
* [x] **The "Lost PIN" Test:** Not applicable — `installedWorkbookIds` is unencrypted and isn't part of `executeCryptoShredding`.

---

## 6. Future Phases (Not In Scope)

Documented here so the v1 architecture above doesn't need to be reworked when these ship:

* **Phase 2 (Private custom authoring):** A user authors their own workbook for personal use only, mirroring the existing `users/{uid}/templates` journal-template pattern (private subcollection, unencrypted structural content — prompt text, not disclosure). No cross-user visibility.
* **Phase 3 (Community publish + discovery):** A user publishes an authored workbook so other users can discover and install it. This needs genuinely new architecture — nothing existing in the codebase handles one user's content becoming visible to another. Likely shape: a new collection (not a repurposed `installedWorkbookIds`) with `authorUid`, moderation `status` (`pending` | `approved` | `flagged`), and an all-read/author-write rule modeled on `daily_readings`' admin-write/all-read pattern.
* **Moderation model for Phase 3 (per product decision):** AI-assisted review of submitted content, with anything the review flags routed to an admin approval queue — not open-publish, and not a fully manual-only queue. The specific AI review flow (which model/prompt, whether it reuses the `generateAIInsights` proxy or a new Cloud Function) is left to that phase's own spec; note that if it sends workbook content to Gemini, the call site must be added to CLAUDE.md's approved Gemini exception list before shipping, per the existing zero-knowledge boundary rule.
