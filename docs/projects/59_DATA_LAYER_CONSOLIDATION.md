# 📁 Project 59: Data Access Layer Consolidation

**Status:** ✅ Shipped
**Primary Persona:** The Architect (Admin) — cross-cutting, no direct end-user-facing behavior change
**Objective:** Eliminate every remaining raw Firestore call in user-facing code by routing it through TanStack Query, and extract a shared CRUD-hook factory so the correct pattern is easier to write than a bypass.

**Source:** `docs/reports/2026-07_codebase_deep_review.md` §1 (single highest-value finding in that review — the exact smell PROJ-58 fixed in `Profile.tsx` recurs in ~10 other files).

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want exactly one code path per Firestore collection so that cache invalidation, optimistic updates, and offline queuing behave consistently everywhere, instead of some screens silently drifting stale while others correctly refresh.
**Competitive Gap:** N/A — internal architecture consistency, not a competitive feature. The payoff is fewer stale-cache bugs like the one PROJ-58 fixed in `Profile.tsx` (Dashboard badges going stale after a save).

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Yes. This touches read/write paths for `journals` and `service` (ZK-encrypted) and `tasks`/`insights` (plaintext) collections — not the encryption logic itself, only *how* the app talks to Firestore around it.
* [x] **Encryption Strategy:** No change to `src/lib/crypto.ts` or the encrypt/decrypt call sites. Risk is procedural: any migrated write path must continue calling `encryptData()`/`decryptData()` exactly where the current raw call does, before the mutation is wrapped in `useMutation`. Each migrated file needs a before/after diff check confirming the encryption call site didn't move or disappear.
* [ ] **Key Rotation:** No new fields added to rotation-eligible collections; `executePinRotation` scope is unaffected.

---

## 3. Schema & Architecture 🗄️
No new Firestore fields or collections. This is a call-site migration, not a schema change.

**Files in scope (from the review):**

*Critical — duplicate competing paths (delete, don't rewrite):*
* `src/pages/Tasks.tsx:60-86` — raw `onSnapshot`, competing with `useTaskOperations` (mutations only). *(Tracked as a standalone chore in `ACTIVE_CYCLE.md` — cheap enough to ship independently of this spec.)*
* `src/pages/Vitality.tsx:87-104,141` — raw `onSnapshot` + `addDoc`, duplicating `useJournalOperations`. *(Same — standalone chore.)*

*Major — fully raw CRUD, no query layer (migrate onto `useQuery`/`useMutation`):*
* `src/components/journal/TemplateEditor.tsx` — `getDocs` (42-43), `deleteDoc` (110), `updateDoc` (140), `addDoc` (143)
* `src/components/journal/JournalAnalysisWizard.tsx:163,182` — raw `addDoc(collection(database,'insights'))` ×2
* `src/components/smart_tools/SmartToolContainer.tsx:66` — raw `getDocs` in a `useEffect` (session resume)
* `src/components/journal/JournalInsights.tsx:121` — raw `getDocs` in a plain `useEffect`
* `src/components/profile/DataManagement.tsx:58,106` — raw `getDoc`/`setDoc` for `lastExportAt` *(coordinate with PROJ-60, which splits this file by concern — migrate the query layer before or as part of that split, not after, to avoid re-touching the file twice)*
* `src/components/AppShell.tsx:42,58` — raw `getDoc`/`setDoc` for background auto-backup timestamp
* `src/components/SOSModal.tsx:25` — raw `getDoc` for sponsor-contact lookup
* `src/pages/Login.tsx:45` — raw `getDoc` for onboarding-routing check
* `src/components/journal/JournalEditor.tsx:105` (`loadUserTags`) — one bypass fetch in an otherwise-correct file

*Moderate — correct reads, drifted writes (swap manual `invalidateQueries()` for `useMutation`):*
* `src/components/admin/ErrorLogViewer.tsx:73` (delete)
* `src/components/dashboard/DynamicAnchorWidget.tsx:73` (reading-date bump)
* `src/pages/Dashboard.tsx:62,67` (build-hash tracking)

*Dead-code candidate (resolve before or during Phase 1):*
* `src/lib/journal.ts` vs `src/hooks/useJournalOperations.ts` — both appear to implement the same journal CRUD independently. Diff them; delete whichever isn't actually imported (the `knip`/`depcheck` chore in `ACTIVE_CYCLE.md` should confirm this mechanically before hand-diffing).
  * **RESOLVED during planning (2026-07-11):** grep of the full import graph shows **zero importers** for `src/lib/journal.ts`'s four exports (`addJournalEntry`, `getUserJournals`, `updateJournalEntry`, `deleteJournalEntry`) — it's entirely dead, not a competitor to be diffed against `useJournalOperations.ts`. A **second** dead path was also found that the original review missed: `src/lib/db.ts`'s own `addJournalEntry`/`getJournalHistory` exports (lines 226-248) also have zero importers. `useJournalOperations.ts` (the one actually used, imported by `JournalEditor.tsx` and `SmartToolContainer.tsx`) calls `firebase/firestore` directly and imports neither dead file. Phase 1 deletes both dead paths outright — no diffing/preservation needed.

**Two bugs found during planning (2026-07-11), added to scope:**
* **Cache-invalidation mismatch:** `useJournalOperations.ts` invalidates `queryKey: ['journals']` (no uid) after every add/update/delete, but every reader (`Dashboard.tsx`, `useAnchorStatus.ts`, `JournalHistory.tsx`) queries `['journals', user.uid]` (or a 3-key variant in `JournalHistory.tsx`). The keys never match, so saving a journal entry never invalidates Dashboard's journal-streak cache — the exact stale-cache class of bug PROJ-58 fixed in `Profile.tsx`, now confirmed live in `useJournalOperations.ts` itself. Several readers mask this with `refetchOnMount: 'always'`. Must fix `useJournalOperations.ts`'s key to `['journals', user?.uid]` in Phase 1, before the factory is modeled on it.
* **Duplicated profile-fetch:** `AppShell.tsx`, `SOSModal.tsx`, `Login.tsx`, `DataManagement.tsx`, `DynamicAnchorWidget.tsx`, `Dashboard.tsx`, `useRateLimits.ts`, and `useAnchorStatus.ts` each hand-roll their own `getDoc(users/{uid})` instead of calling the existing `useUserProfile()` hook (`src/hooks/useUserProfile.ts`), which already wraps this correctly with `['profile', uid]` + `updateProfile`/`patchFields` mutations. Keys happen to match so there's no cache bug, just six-plus copies of the same query to keep in sync. **Added to this project's scope at approval** — `useRateLimits.ts` and `useAnchorStatus.ts` were not in the original file list above but are now in scope for Phase 1.

**New shared factory (`src/hooks/useFirestoreCrud.ts` — name TBD at implementation time):**
```typescript
// Illustrative shape only — finalize against the 3 existing hooks' actual signatures
function useFirestoreCrud<T>(collectionPath: string, queryKey: string[]) {
  // useQuery for reads
  // useMutation with onMutate/onError/onSettled optimistic pattern + invalidateQueries
}
```
Modeled on the identical shape already shared by `useTaskOperations`, `useJournalOperations`, and `useWorkbookAnswers` — extract, don't invent.

---

## 4. Implementation Phases 🏗️

### Phase 1: Resolve dead code + fix the two planning-discovered bugs + extract the factory
* Delete `src/lib/journal.ts` entirely and delete the dead `addJournalEntry`/`getJournalHistory` exports from `src/lib/db.ts` (both zero-importer — see §3).
* Fix `useJournalOperations.ts`'s `queryKey` from `['journals']` to `['journals', user?.uid]` so it matches every reader. Add a regression test proving add/update/delete invalidates `['journals', uid]`.
* Fold the duplicate `users/{uid}` profile-fetch in `AppShell.tsx`, `SOSModal.tsx`, `Login.tsx`, `DataManagement.tsx`, `DynamicAnchorWidget.tsx`, `Dashboard.tsx`, `useRateLimits.ts`, and `useAnchorStatus.ts` onto the existing `useUserProfile()` hook.
* Extract `useFirestoreCrud<T>` from the (now-consistent) 3 existing structurally-identical hooks. This must land *before* Phase 2 so new migrations use the factory instead of hand-rolling yet another one-off hook.

### Phase 2: Migrate the "Major" raw-CRUD files
* One PR per file (or small logical groups) — `TemplateEditor.tsx`, `JournalAnalysisWizard.tsx`, `SmartToolContainer.tsx`, `JournalInsights.tsx`, `AppShell.tsx`, `SOSModal.tsx`, `Login.tsx`, `JournalEditor.tsx`.
* `DataManagement.tsx`'s two raw calls migrate as part of PROJ-60's file split, not separately, to avoid double-touching a file about to be restructured.
* **Somatic Check:** `Login.tsx` and `SOSModal.tsx` sit on David's crisis path (onboarding routing, sponsor-contact lookup) — migration must not add a visible loading flicker or extra tap where a synchronous-feeling `getDoc` currently returns instantly from cache.

### Phase 3: Clean up the "Moderate" write-drift files
* `ErrorLogViewer.tsx`, `DynamicAnchorWidget.tsx`, `Dashboard.tsx` — swap manual `invalidateQueries()` calls for proper `useMutation`. Lowest risk, do last.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** All migrated files with existing tests confirmed no behavior regression. Every zero-coverage file got a smoke test in its migration commit (`TemplateEditor`, `JournalAnalysisWizard`, `JournalInsights`, `AppShell`/`DataManagement` via profile consolidation, `SOSModal`, `Login`, `ErrorLogViewer`, `DynamicAnchorWidget`, `Dashboard`). Final count: 414 tests / 59 files, all passing.
* [x] **The Subway Test:** `Login.tsx`/`SOSModal.tsx` migrated onto `useUserProfile()`, which is populated from the same shared cache other app screens already warm — no added loading flicker; regression-tested via `Login.test.tsx`'s 3-way branch coverage (onboarded / not onboarded / query-error fallback).
* [ ] **The "Lost PIN" Test:** N/A — no crypto/rotation logic touched.
* [x] **Encryption call-site check:** `zk-audit` skill run against the full diff — PASS. No `journals`/`service` write moved; both `encrypt()` call sites (`SmartToolContainer.tsx`, `JournalEditor.tsx`) verified unchanged. See skill output in session log for the full field-by-field write audit.

**Post-implementation notes (2026-07-12):**
* Two additional bugs found and fixed during Phase 2 migration, beyond the two found in planning: (1) `JournalEditor.tsx`'s `getSmartMood()` read `queryClient.getQueryData(['journals'])` — the same orphaned key `useJournalOperations` used to write to — meaning the mood-prefill heuristic has never worked in production; fixed to `['journals', uid]`. (2) `DynamicAnchorWidget.tsx`'s `FELLOWSHIPS.DEFAULT` fallback referenced a key that has never existed in `src/data/fellowships.ts`, crashing for any user without `anchorSettings.defaultFellowship` set whenever their daily-readings collection was empty — caught by the new smoke test, fixed to fall back to `FELLOWSHIPS.AA`.
* `JournalAnalysisWizard.tsx`'s insights save now reuses `lib/insights.ts`'s existing `saveInsight()`/`InsightPayload` instead of a second, independent raw `addDoc` — this required widening `InsightPayload`'s `journal` variant, which had never matched what was actually being written (declared `AnalysisResult` shape that no producer in the codebase emits; actual writes use a `pillars.growth` shape `InsightsLog.tsx` was already defensively reading).
* `TemplateEditor.tsx` now reuses `db.ts`'s existing `getUserTemplates`/`saveUserTemplate`/`deleteUserTemplate` instead of duplicating raw Firestore calls — required widening `JournalTemplate` to include the `content`/`createdAt`/`updatedAt` fields real template docs already carry but the type never declared.
* Found but **not** fixed (flagged for a follow-up ticket, out of scope here): `InsightsLog.tsx` reads via a bespoke `useState`/`useEffect` + `getInsightHistory()` rather than TanStack Query — a raw-bypass pattern the original codebase review missed. `TemplateEditor.tsx`'s template `content` field is written in plaintext with no encryption call site (pre-existing, not a regression, but also not in CLAUDE.md's ZK table at all — needs a product decision on whether template content should be encrypted).
