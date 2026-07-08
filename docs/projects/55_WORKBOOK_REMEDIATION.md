# 📁 Project 55: Workbook Remediation

**Status:** 🟢 Done
**Primary Persona:** Ned | Walt
**Objective:** Close six gaps in the 12-Step Workbook feature — templated filler content in Steps 2-11, a direct-Firestore architecture deviation, an orphaned data module, a fragile decryption heuristic, missing test coverage, and a stale gamification denominator — without breaking any user's already-saved answers.

---

## 1. The Executive Summary
**User Story:** As Ned, working Step 4 of the program, I want real, step-specific reflection questions grounded in the actual step's teaching — not "Step 4 Reflection Q3: What barriers do you face regarding this principle?" repeated with cosmetic changes across 10 different steps — so the workbook actually helps me do the step instead of feeling like a placeholder.
**Competitive Gap:** Dedicated step-work apps and paper workbooks provide real per-step material for all 12 steps. Today, 10 of MRT's 12 steps are indistinguishable filler under the hood — a trust and retention risk once a user notices the pattern, not just a content-polish item.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Yes — `workbook_answers` contains user step-work reflections (emotional/PII-adjacent). No change to sensitivity: this project does not add new data, only changes question text and the read/write code path.
* [x] **Encryption Strategy:** Uses `src/lib/crypto.ts` via `EncryptionContext` (`encrypt`/`decrypt`), unchanged. The new `useWorkbookAnswers` hook must decrypt only inside its `queryFn`/`mutationFn` (in-memory TanStack Query cache), never persisting plaintext, matching the existing precedent in `useROSCAssessments.ts` and journal hooks.
* [x] **Key Rotation:** No change — workbook answers already participate in whatever PIN-rotation flow exists for other encrypted collections; this project doesn't touch that flow.
* [x] **Non-negotiable id stability:** Every workbook question `id` (`s{n}_intro`, `s{n}_q1`…`s{n}_q15`) is a component of the Firestore document id (`workbookId_questionId`, `users/{uid}/workbook_answers/{docId}`). The Phase 3 content rewrite must preserve every `id` value exactly. Changing an id does not delete data — it silently orphans a user's already-saved answer (the doc remains in Firestore but is no longer addressable by the UI), which is a data-loss-from-the-user's-perspective bug even though no code throws an error.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `users/{uid}/workbook_answers/{workbookId_questionId}`: no field changes. Existing fields (`answer`, `isEncrypted`, `workbookId`, `sectionId`, `questionId`, `uid`, `updatedAt`) are unchanged.

**Types (`src/lib/db.ts`):** `WorkbookAnswer` interface is unchanged — reused as-is.

**New files:**
* `src/lib/workbookAnswers.ts` — plain async CRUD (`getWorkbookAnswers`, `saveWorkbookAnswer`), mirrors `src/lib/rosc.ts`.
* `src/hooks/useWorkbookAnswers.ts` — TanStack Query hook (read via `useQuery`, write via `useMutation` with optimistic rollback), mirrors `src/hooks/useROSCAssessments.ts` and `src/hooks/useTaskOperations.ts`.

**Deleted files:**
* `src/lib/workbooks.ts` — orphaned duplicate data module, zero importers.

---

## 4. Implementation Phases 🏗️

### Phase 1: Low-risk mechanical fixes
* Delete `src/lib/workbooks.ts` (dead code).
* Compute `TOTAL_WORKBOOK_QUESTIONS` dynamically in `src/lib/gamification.ts` from `WORKBOOKS` instead of a hardcoded default; remove the stale local `TOTAL_WORKBOOK_QUESTIONS = 45` constant in `src/pages/Dashboard.tsx`.
* **Reward/Gamification UX:** change the Dashboard's workbook stat display from a bare "Mastery %" to an explicit "Questions Answered: X / Y" framing, so correcting the denominator (45 → ~280) reads as "the workbook got bigger," not "my progress vanished."

### Phase 2: Logic & State — Architecture migration
* Define `useWorkbookAnswers` React Query hook (query key `['workbook_answers', uid, workbookId ?? 'all']`) to replace direct `getDocs`/`setDoc` calls in `WorkbookDetail.tsx`, `WorkbookSession.tsx`, and `useAutoSave.ts`.
* Decryption is gated strictly on the `isEncrypted` boolean field (fixes the fragile `.includes(':')` heuristic in `WorkbookDetail.tsx`'s `handleAnalyze` as a side effect of the migration, not a standalone patch).
* No new Firebase security rules needed — `workbook_answers` rule (`isOwner(userId)`) already covers all read/write paths.

### Phase 3: Content — UI/UX
* Replace `createStepStructure()`-generated Steps 2-11 with hand-written, step-specific questions (15 unique literature-grounded `context` strings per step, matching Steps 1 & 12's depth but going further — no shared/repeated context strings).
* **Somatic Check:** No new UI is introduced; existing Zen Mode layout (intro slide, context callout, textarea) is reused as-is. Content is written in the same paraphrase-not-quote, compassionate, non-clinical voice already established in Steps 1, 12, and the Dharma/Women's workbooks.
* **Reward:** No change to XP tied to workbook questions (`WORKBOOK_QUESTION` XP value in `gamification.ts` stays at 15/question) — the increased real question count naturally increases total achievable XP, which is an intended side effect, not a new mechanic.

### Phase 4: Edge Cases
* [x] `navigator.onLine` false: unaffected — TanStack Query mutation queuing/retry behavior is inherited from the same pattern already used by `useTaskOperations`/`useJournalOperations`; no new offline logic is introduced.
* [x] `isVaultUnlocked` false: unaffected — encryption/decryption still routes through `EncryptionContext` exactly as before; the migration doesn't change vault-lock behavior.
* [x] 320px viewport: unaffected — no layout/component changes, only data-source and content changes.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** (278 tests passing project-wide, `npm run lint` and `tsc -b` clean)
  - `src/data/__tests__/workbooks.test.ts` (new) — shape/count guardrails, regression guard against `/Reflection Q\d/` placeholder text reappearing.
  - `src/hooks/__tests__/useWorkbookAnswers.test.ts` (new) — query key correctness, `isEncrypted`-gated decryption, mutation encrypt-before-write, doc id computation, cache invalidation.
  - `src/hooks/__tests__/useAutoSave.test.ts` (modified) — mocks updated from `firebase/firestore` to the injected `saveAnswer` function.
  - `src/lib/__tests__/gamification.test.ts` (modified) — `calculateWorkbookStats` default-denominator coverage.
* [x] **The Subway Test:** `WorkbookSession.tsx` autosave delegates to `useWorkbookAnswers`'s mutation, which inherits TanStack Query's queuing/retry behavior — no new offline logic introduced beyond what `useTaskOperations` already exercises.
* [x] **The "Lost PIN" Test:** Not applicable — no crypto-shredding behavior changes; `isEncrypted`-gated decrypt failure already falls back to a redacted string in both the old and new code paths.
