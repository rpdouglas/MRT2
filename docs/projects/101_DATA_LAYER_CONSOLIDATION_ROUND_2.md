# 📁 Project 101: Data Access Layer Consolidation — Round 2

**Status:** ✅ Shipped
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

### Phase 1: Migrate `useJournalOperations.ts` — ✅ Shipped
* [x] Migrated onto `useFirestoreQuery`/`useFirestoreMutation`. The `['journals', user?.uid]` key is unchanged byte-for-byte. **One documented, intentional side effect**: `onError`'s `trackMutationFailed` domain tag changes from the hand-picked `'journal'` (singular) to the shared wrapper's `String(queryKey[0])`, i.e. `'journals'` (plural, the actual collection/key name) — cosmetic PostHog label drift, not a behavior change, and the same convention every hook migrated under this ticket now shares. Zero test changes needed beyond this — all 5 existing `useJournalOperations.test.ts` tests passed unmodified.

### Phase 2: Migrate `useWorkbookAnswers.ts` and `useTaskOperations.ts` — ✅ Shipped
* [x] `useWorkbookAnswers.ts`: migrated onto `useFirestoreQuery` (read) + `useFirestoreMutation` (write, with an `optimisticUpdate` spec reproducing the exact same entry-patching logic). All 6 existing tests passed unmodified.
* [x] `useTaskOperations.ts`: migrated all 4 mutations onto `useFirestoreMutation`. **Extended `useFirestoreCrud.ts`'s `MutationSpec`** with a new optional `onSuccess?: (data, args) => void` field, wired into the underlying `useMutation` config — this hook's `'task_created'`/`'task_completed'` PostHog telemetry fired from `onSuccess` and had no equivalent hook in the original primitive; extending it (rather than working around it) keeps the telemetry calls unchanged and makes the extension available to any future migration with the same need.
* [x] The cache-key mismatch fix (originally scoped as Phase 3) was folded into this same pass per the plan's own suggestion, rather than touching this hook's mutation logic twice — see Phase 3 below for what actually shipped.

### Phase 3: Fix the `useTasksList`/`useTaskOperations` cache mismatch — ✅ Shipped (option b, not option a)
* [x] **Investigated first, then chose option (b): removed the optimistic-update machinery from `useTaskOperations.ts`,** rather than option (a)'s migrate-`useTasksList`-onto-TanStack-Query. Reasoning found during implementation, not assumed going in: `useTasksList.ts` carries its own explicit design comment establishing it's a deliberate live `onSnapshot` subscription (cross-tab/cross-device real-time updates for the Ledger), not a one-shot fetch — and `Tasks.tsx` (the only consumer) renders exclusively from that hook's local state, never from the `['tasks', uid]` TanStack cache `useTaskOperations` was optimistically writing to. Firestore's client SDK already echoes a pending local write into `onSnapshot` listeners before the server round-trip completes, so the optimistic layer was never actually contributing to what the user sees on the Tasks page — it was dead weight targeting an orphaned cache key. Migrating `useTasksList` onto TanStack Query (option a) would have been the architecturally "purer" fix but meant touching the live, already-verified real-time path that page depends on, for a ticket whose own premise is zero end-user-facing behavior change; deleting confirmed-dead code was the lower-risk choice. `addTask`/`toggleTask`/`deleteTask` now do a plain mutate-then-invalidate with no `onMutate`/rollback step; `updateTask` never had one to begin with.
* [x] `useTaskOperations.test.ts`'s two tests that asserted the removed optimistic-patch/rollback behavior were rewritten (not just mechanically patched) to assert what the hook does now instead: calls the underlying `TaskLib` function and invalidates the correct cache key, and doesn't throw synchronously on an API rejection. This is the anticipated, larger-than-mechanical test diff the plan's own Phase 5 edge case flagged as a possibility if option (b) were chosen — not an unplanned regression signal.

### Phase 4: `AuthContext.test.tsx` — ✅ Shipped
* [x] New file, 7 tests. `isAdmin` OR logic: custom-claim-only (fallback telemetry NOT fired), role-fallback-only (fallback telemetry fired once), neither (false, no telemetry). `onAuthStateChanged` handling: null-user clears `user`/`isAdmin`/`userTier` and resolves `loading`; a profile-fetch throw still sets the Firebase Auth `user` (so the app isn't stuck logged-out) but defaults `userTier` to `'free'`, never resolves `isAdmin` true, and fires `trackClientError('user_profile_fetch', 'Error')`. `mockUser` DEV-only bypass: activates from the `?mockUser=` query param and short-circuits before ever registering a real `onAuthStateChanged` listener when `import.meta.env.DEV` is true (via `vi.stubEnv('DEV', true)`); falls through to the real listener and never touches `localStorage`'s `mrt_mock_user` key when `DEV` is `false`. Mocking strategy matches `EncryptionContext.test.tsx`'s existing precedent — only I/O boundaries mocked (`firebase/auth`'s `onAuthStateChanged`, `../lib/db`, `../lib/messaging`, `posthog-js`, `../lib/telemetry`); `db` from `../lib/firebase` mocked to `null` specifically to skip the Stripe-subscriptions `onSnapshot` branch, which this ticket doesn't touch and would otherwise have required mocking `firebase/firestore` too just to reach.

### Phase 5: Edge Cases
* [x] Every migration phase left `npm run test:once` green with zero unplanned test changes: `useJournalOperations.test.ts` and `useWorkbookAnswers.test.ts` needed none at all; `useTaskOperations.test.ts`'s two rewritten tests are the anticipated exception tied directly to Phase 3's architectural decision, not an unplanned regression signal.
* [x] Offline behavior: none of the three migrated hooks (nor `useFirestoreCrud.ts` itself) ever checked `navigator.onLine` before or after this migration — offline resilience for these collections comes entirely from Firestore's own IndexedDB persistence layer (PROJ-64), which is untouched by this ticket. Nothing to preserve or regress here.
* [x] Confirmed Phase 3's chosen fix changes nothing about what a user sees on the Tasks page mid-mutation: `Tasks.tsx` never read the optimistic cache key before this ticket either, so its perceived responsiveness (driven by Firestore's own local-write echo into `useTasksList.ts`'s `onSnapshot` listener) is bit-for-bit unaffected.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** All pre-existing tests for the three migrated hooks pass (`useJournalOperations.test.ts` 5/5 unmodified, `useWorkbookAnswers.test.ts` 6/6 unmodified, `useTaskOperations.test.ts` 2/2 — both rewritten per Phase 3's documented deviation). `useFirestoreCrud.test.ts` 6/6 unmodified despite the new optional `onSuccess` field (additive, non-breaking).
* [x] **New:** `AuthContext.test.tsx` — 7 tests covering all three Phase 4 scenarios (2 extra beyond the minimum 3: the "neither claim nor role" false case, and the profile-fetch-failure path split from the null-user path).
* [ ] **The Subway Test:** Not re-run against a live browser/emulator in this environment — no browser session available. The unit-level offline-behavior edge case above (no `navigator.onLine` dependency in any touched file, before or after) is the closest verification this environment can perform; a human should still spot-check the Subway Test for real before treating this as fully verified, per this repo's standing practice for UI-adjacent changes with no browser session available.
* [ ] **Manual:** Not run against a live/emulator session in this environment (no browser). Covered instead by the unit tests above plus the full regression suite below.
* [x] **Regression:** `npm run check` (lint + spec-quality + 669/669 tests + build) clean after all phases.
