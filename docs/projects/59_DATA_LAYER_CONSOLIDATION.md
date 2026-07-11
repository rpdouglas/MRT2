# 📁 Project 59: Data Access Layer Consolidation

**Status:** ⚪ Planned
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

### Phase 1: Resolve dead code + extract the factory
* Diff `journal.ts` vs `useJournalOperations.ts`; delete the loser.
* Extract `useFirestoreCrud<T>` from the 3 existing structurally-identical hooks. This must land *before* Phase 2 so new migrations use the factory instead of hand-rolling yet another one-off hook.

### Phase 2: Migrate the "Major" raw-CRUD files
* One PR per file (or small logical groups) — `TemplateEditor.tsx`, `JournalAnalysisWizard.tsx`, `SmartToolContainer.tsx`, `JournalInsights.tsx`, `AppShell.tsx`, `SOSModal.tsx`, `Login.tsx`, `JournalEditor.tsx`.
* `DataManagement.tsx`'s two raw calls migrate as part of PROJ-60's file split, not separately, to avoid double-touching a file about to be restructured.
* **Somatic Check:** `Login.tsx` and `SOSModal.tsx` sit on David's crisis path (onboarding routing, sponsor-contact lookup) — migration must not add a visible loading flicker or extra tap where a synchronous-feeling `getDoc` currently returns instantly from cache.

### Phase 3: Clean up the "Moderate" write-drift files
* `ErrorLogViewer.tsx`, `DynamicAnchorWidget.tsx`, `Dashboard.tsx` — swap manual `invalidateQueries()` calls for proper `useMutation`. Lowest risk, do last.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** For each migrated file with existing tests, confirm no behavior regression (cache still invalidates, optimistic UI still updates). Files with zero current coverage should get at least a smoke test as part of their migration PR, not deferred to PROJ-61.
* [ ] **The Subway Test:** Re-verify offline resilience for `Login.tsx` and `SOSModal.tsx` specifically — these are on David's crisis path and must degrade gracefully with no network.
* [ ] **The "Lost PIN" Test:** N/A — no crypto/rotation logic touched.
* [ ] **Encryption call-site check:** For every migrated file that writes to `journals` or `service`, confirm `encryptData()` still wraps the payload in exactly the same place post-migration (run the `zk-audit` skill on the diff before merging each phase).
