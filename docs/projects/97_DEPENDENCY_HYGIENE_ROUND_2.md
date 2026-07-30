# 📁 Project 97: Dependency Hygiene Round 2

**Status:** ⚪ Planned
**Primary Persona:** Ned (task list swipe interactions — `SwipeableTaskRow.tsx`), universal (Daily Crossword players — `crossword-layout-generator` replacement)
**Objective:** Close the remaining `DEPENDENCY_AUDIT.md` findings explicitly deferred from PROJ-92 — replace two unmaintained dependencies (`@use-gesture/react`, `crossword-layout-generator`), clean up `knip`-surfaced dead code, and add `eslint-plugin-jsx-a11y` as a static-analysis complement to PROJ-91's runtime axe-core CI gate.

---

## 1. The Executive Summary
**User Story:** As a developer maintaining this codebase, I don't want to depend on packages that stopped receiving updates years ago for functionality this app could implement directly or maintain in-house.
**Source:** `DEPENDENCY_AUDIT.md` (2026-07-29) §5 Migration Opportunities, §6 Unused Dependencies; deferred explicitly from `docs/projects/92_PERFORMANCE_SCALE_POLISH.md`'s Out of Scope section.

**Scope note:** each of the two library replacements below has a genuinely different risk profile (touch/gesture UX vs. backend puzzle-generation correctness) and may warrant splitting into separate implementation passes even within this one spec — flagged in Phase 1 as a strategy decision, not pre-decided here.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None — dependency swaps and dead-code removal only, no data model touched.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes.

**Files impacted:**
* `src/components/tasks/SwipeableTaskRow.tsx` — replace `@use-gesture/react` (last release March 2024, >28 months old) with native `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers or CSS `touch-action: pan-x`. **Real regression risk**: swipe gesture interactions are easy to subtly break (wrong threshold, no momentum, conflicting with vertical scroll) — needs real device testing, not just unit tests.
* `functions/src/crosswordPrompts.ts`, `functions/src/crossword-layout-generator.d.ts` — replace `crossword-layout-generator` (last release April 2022, untyped, >4 years old) with a custom TypeScript grid-layout algorithm. **Real correctness risk**: must produce valid, solvable crossword grids matching the Daily Crossword feature's (PROJ-79) existing output shape — needs verification against real puzzle generation, not just that it compiles.
* `knip`-surfaced dead code: `src/lib/games/goalLadder/types.ts`, `src/lib/games/types.ts` (unused files), plus 8 unused exported functions/constants (`NED_TEAL`, `updateStockValue`, `DEFAULT_HERO_COLOR`, `MILESTONE_CHIPS`, `NED_PROFILE`/`MAYA_PROFILE`/`DAVID_PROFILE`/`WALT_PROFILE`, `getROSCAssessmentCount`, `getCompletedTasksForToday`, `usePageVersion`/`getEnvColor`) — delete.
* `package.json` (root) — add `eslint-plugin-jsx-a11y` to the flat ESLint config.

---

## 4. Implementation Phases 🏗️

### Phase 1: Strategy decision
* Decide whether to tackle `@use-gesture/react` and `crossword-layout-generator` replacement in the same pass or split into two separate PRs/sessions, given their unrelated risk profiles (client touch UX vs. backend algorithm correctness). Recommend splitting at implementation time unless both turn out to be small enough to verify independently within one sitting.

### Phase 2: `@use-gesture/react` replacement
* Implement native touch handlers in `SwipeableTaskRow.tsx`.
* Test against real swipe gestures (not just simulated pointer events) — mobile device or emulator touch simulation, not just unit tests.

### Phase 3: `crossword-layout-generator` replacement
* Implement a custom grid-layout algorithm matching the existing package's output contract.
* Verify against the Daily Crossword feature end-to-end (a generated puzzle must actually be solvable and match the UI's expected grid shape).

### Phase 4: Dead code + lint cleanup
* Delete the 2 unused files and 8 unused exports.
* Add `eslint-plugin-jsx-a11y`, run it against the full codebase, triage any new findings (expect some overlap with what PROJ-91's axe-core gate already covers, since jsx-a11y catches static JSX patterns while axe catches runtime-rendered ones).

### Phase 5: Edge Cases
* [ ] Confirm `SwipeableTaskRow.tsx`'s replacement doesn't regress accessibility (keyboard-only task completion must still work, independent of swipe).
* [ ] Confirm the crossword replacement handles the same edge cases the legacy package did (word overlaps, grid symmetry) — needs the actual legacy behavior understood before replacing it, not assumed.
* [ ] Confirm `eslint-plugin-jsx-a11y`'s ruleset doesn't conflict with existing `eslint-disable` overrides already documented in the codebase.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** swipe gesture behavior, crossword grid generator output validity.
* [ ] **Manual:** real-device swipe testing for `SwipeableTaskRow.tsx`; solve a generated crossword end-to-end in the app.
* [ ] **Lint:** `npm run lint` clean with `eslint-plugin-jsx-a11y` added — triage and either fix or explicitly suppress (with reasoning) any new findings.
* [ ] **Regression:** full `npm run check`, plus the existing Daily Crossword e2e coverage (`e2e/golden-paths/subway.spec.ts` per its own documented gap in `docs/ACTIVE_CYCLE.md` — note that gap still isn't closed as of this ticket and isn't this ticket's job to close).
