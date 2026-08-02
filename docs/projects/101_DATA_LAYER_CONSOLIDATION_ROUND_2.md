# 📁 Project 101: Data Access Layer Consolidation — Round 2

**Status:** ⚪ Planned
**Primary Persona:** Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) — no end-user-facing behavior change; closes a gap `PROJ-59` left open and fixes a latent cache bug.
**Objective:** Close the TanStack Query / React findings from `docs/reports/2026-08_full_production_readiness_audit.md`'s Medium-Effort bucket (§20): finish the `useFirestoreCrud` migration `PROJ-59` started, fix the `useTasksList`/`useTaskOperations` cache-key mismatch, and add the missing `AuthContext` unit test coverage.

---

## 1. The Executive Summary
**User Story:** As a developer maintaining this codebase, I want the three hooks `useFirestoreCrud.ts` was explicitly extracted *from* to actually use it, instead of hand-rolling the same optimistic-update pattern independently forever — and I want the zero-knowledge boundary's auth logic to have direct test coverage, not just indirect e2e coverage.
**Source:** `docs/reports/2026-08_full_production_readiness_audit.md` §1 (Architecture Review), §5 (TanStack Query Review), §11 (Testing Review), §20.

**Scope note:** This is a direct continuation of `PROJ-59` (Data Access Layer Consolidation), which built `useFirestoreCrud.ts` from the shared shape of these three hooks but didn't migrate the hooks themselves — the abstraction has existed in parallel with the duplication it was meant to remove since `PROJ-59` shipped.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** `journals`/`workbook_answers` content is encrypted before write in both the current hand-rolled hooks and `useFirestoreCrud` — this ticket changes *which code path* performs the write, not the encryption step itself. Confirm each migrated hook's call to `encrypt()`/`decrypt()` survives the migration unchanged.
* [x] **Encryption Strategy:** No change to `src/lib/crypto.ts`. Verify during migration that `useFirestoreCrud`'s generic mutation wrapper doesn't accidentally bypass an encryption call that the hand-rolled version had inline.
* [x] **Key Rotation:** N/A — no schema or key-derivation change.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No new collections or fields.

**Files impacted:**
* `src/hooks/useTaskOperations.ts`, `useJournalOperations.ts`, `useWorkbookAnswers.ts` — migrate onto `useFirestoreQuery`/`useFirestoreMutation` from `src/hooks/useFirestoreCrud.ts`.
* `src/hooks/useTasksList.ts` — the live `onSnapshot`-based hook actually feeding the Tasks page.
* `src/contexts/__tests__/AuthContext.test.tsx` (new).

---

## 4. Implementation Phases 🏗️

### Phase 1: Migrate `useJournalOperations.ts`
* Migrate onto `useFirestoreCrud.ts`'s primitives first — it's the simplest of the three (no optimistic updates currently, per the audit — invalidate-only with telemetry on error), lowest risk to start with.
* Confirm the existing `['journals', uid]` query-key convention is preserved exactly (a key-shape mismatch here would silently break invalidation for every other `journals`-keyed consumer — `JournalHistory.tsx`, `JournalInsights.tsx`, `AchievementsTab.tsx`, `useAnchorStatus.ts` all read variants of this key).

### Phase 2: Migrate `useWorkbookAnswers.ts` and `useTaskOperations.ts`
* Both currently hand-roll a full optimistic-update pattern (cancel/snapshot/rollback) — confirm `useFirestoreCrud`'s mutation wrapper supports the same optimistic shape before migrating, or extend it if it doesn't yet.
* `useTaskOperations.ts` specifically: while migrating, fix the cache-key mismatch found during the audit (Phase 3 below) as part of the same pass rather than as a separate change, since touching this hook's mutation logic twice would be wasted effort.

### Phase 3: Fix the `useTasksList`/`useTaskOperations` cache mismatch
* `useTaskOperations.ts`'s optimistic `onMutate` writes to `['tasks', uid]` via `setQueryData`, but `useTasksList.ts` (the hook the actual Tasks page renders from) is a raw `onSnapshot` + local `useState`, never touching TanStack's cache. Only `AchievementsTab.tsx`'s independent `useQuery(['tasks', uid])` instance ever reads that key.
* Decide the fix during implementation: either (a) migrate `useTasksList` onto TanStack Query properly (bigger change, but resolves the "two data sources for the same collection" issue at the root), or (b) remove the now-pointless optimistic-update machinery from `useTaskOperations` since it's not actually serving the UI a user watches. Document whichever is chosen and why in this spec once decided — don't leave the dead code in place after this ticket if (b) is chosen.

### Phase 4: `AuthContext.test.tsx`
* Add direct unit coverage for `AuthContext.tsx`, which currently has none (only `EncryptionContext.tsx` has a dedicated test file among the four contexts) despite being part of the auth/ZK-adjacent surface. Cover at minimum:
  * The `isAdmin` OR logic (`!!idTokenResult.claims.admin || profile.role === 'admin'`) — both branches, and update this test if `PROJ-99`'s admin-convergence phase changes this logic before this ticket lands (check `PROJ-99`'s status first).
  * The `import.meta.env.DEV`-gated `mockUser` bypass — confirm it activates in a DEV-mode test render and does *not* activate when `DEV` is false (complementing, not duplicating, the existing `e2e/security/mockuser-prod.spec.ts` production-build check).
  * `onAuthStateChanged` handling for the null-user (logged-out) and profile-fetch-failure paths.

### Phase 5: Edge Cases
* [ ] Confirm each migration phase leaves `npm run test:once` green with zero test changes required beyond what's expected from the internal refactor (a hook migration that requires rewriting its own tests from scratch is a sign the migration changed behavior, not just implementation).
* [ ] Confirm offline behavior (`navigator.onLine === false`) is preserved identically pre/post-migration for all three hooks — `useFirestoreCrud` must not introduce a stricter online-only assumption than the hand-rolled versions had.
* [ ] Confirm Phase 3's chosen fix doesn't change what a user sees on the Tasks page mid-mutation (the optimistic-update UX, if any, should feel identical before and after).

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** Existing test suites for all three migrated hooks must pass unchanged (or with only mechanical updates, e.g. mock setup) — a large diff to `useTaskOperations.test.ts`/`useJournalOperations.test.ts`/`useWorkbookAnswers.test.ts` is a signal to slow down and check for a behavior change, not just push through.
* [ ] **New:** `AuthContext.test.tsx` covering the three scenarios in Phase 4.
* [ ] **The Subway Test:** Re-run existing offline-resilience e2e coverage after the migration — this ticket touches the exact hooks that mediate offline-first behavior for tasks/journals/workbooks.
* [ ] **Manual:** Complete a task, save a journal entry, and save a workbook answer in a real (or emulator) session post-migration, confirming no regression in the actual save/optimistic-update UX.
* [ ] **Regression:** Full `npm run check` after every phase.
