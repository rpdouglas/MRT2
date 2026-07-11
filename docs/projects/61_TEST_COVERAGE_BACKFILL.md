# 📁 Project 61: Test Coverage Backfill — ZK-Adjacent & Firestore-Write Paths

**Status:** ⚪ Planned
**Primary Persona:** The Architect (Admin)
**Objective:** Close the four highest-risk test-coverage gaps identified in the deep review — one decryption-adjacent module and three Firestore-write paths with zero coverage today.

**Source:** `docs/reports/2026-07_codebase_deep_review.md` §5. Precedent: `PROJ-40` (Core Logic Test Suite Audit) — same template, same "no new user-facing behavior" scope.

---

## 1. The Executive Summary
**User Story:** As the Lead Architect, I want automated coverage on the code paths that touch plaintext recovery content or write directly to Firestore, so a future refactor (e.g. PROJ-59) can't silently break decryption or data integrity without a failing test catching it first.
**Competitive Gap:** N/A — internal quality/safety net, mirrors the rationale in `PROJ-40`.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Critical for `exporter.ts` — it calls `decrypt()` from `src/lib/crypto.ts` directly to produce a user's data export. Tests must use synthetic fixture data only, never real user content, and must suppress/avoid logging decrypted fixture values to the console.
* [x] **Encryption Strategy:** Tests for `exporter.ts` must mock or exercise `crypto.ts`'s `decrypt()` with known test vectors, verifying the export payload contains the expected decrypted plaintext *only* within the test's own scope — never asserting via a logged intermediate value.
* [ ] **Key Rotation:** Out of scope — `rotation.ts` already has coverage per `PROJ-40`.

---

## 3. Schema & Architecture 🗄️
No production code changes — test files only.

**Target files for coverage (new test files to create):**
* `src/lib/__tests__/exporter.test.ts` — **highest priority**, decryption-adjacent, currently zero coverage
* `src/hooks/__tests__/useROSCAssessments.test.ts` — Firestore-write hook, zero coverage anywhere
* `src/hooks/__tests__/useRateLimits.test.ts` — Firestore-write hook, zero coverage anywhere
* `functions/src/__tests__/prompts.test.ts` — zero coverage today

**Lower-priority, noted but not scoped in this pass** (per the review, `src/lib/db.ts`, `deletion.ts`, `importer.ts` are also under-tested — defer until the above four are closed):
* `src/lib/db.ts`, `src/lib/deletion.ts`, `src/lib/importer.ts`

---

## 4. Implementation Phases 🏗️

### Phase 1: `exporter.ts` (decryption-adjacent — do first)
* Mock `crypto.ts`'s `decrypt()` with known test vectors and synthetic fixture journal/workbook entries.
* Test: export payload correctly reassembles decrypted content into the expected output shape.
* Test: a decryption failure mid-export surfaces a clear error rather than silently producing a partial/corrupt export.
* **Console hygiene:** per `PROJ-40`'s precedent, suppress expected console output via `vi.spyOn(console, 'error').mockImplementation(() => {})` where a failure path is intentionally exercised — and never assert against a logged decrypted value.

### Phase 2: `useROSCAssessments` and `useRateLimits`
* Mock Firestore (`writeBatch`/`setDoc`/`getDocs` as applicable) per each hook's actual calls.
* Test the optimistic update / rollback-on-error behavior for each mutation, consistent with how `useTaskOperations`/`useJournalOperations` are already tested (mirror their existing test structure rather than inventing a new one).

### Phase 3: `functions/src/prompts.ts`
* Unit test prompt-construction logic in isolation (no live Gemini calls) — confirm the correct fields are interpolated into each prompt template for the flows that use it.

---

## 5. QA & Verification 🧪
* [ ] **Run Suite:** `npm run test:once` — all new and existing suites must pass.
* [ ] **Console Hygiene:** No decrypted fixture content ever printed to console during test runs, including on intentional-failure paths.
* [ ] **Coverage confirmation:** Re-run the ratios from the review's §5 table after this ships and confirm all four target files move from 0 to covered.
