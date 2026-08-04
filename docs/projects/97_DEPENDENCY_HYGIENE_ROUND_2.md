# 📁 Project 97: Dependency Hygiene Round 2

**Status:** ✅ Shipped (Phase 2 descoped — see §6 Addendum)
**Primary Persona:** Ned (task list swipe interactions — `SwipeableTaskRow.tsx`), All (Daily Crossword players — `crossword-layout-generator`, descoped)
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

### Phase 1: Strategy decision — ✅ Done (2026-08-04, via `/planning`)
* Ran a full `/planning` pass before touching code, re-verifying every claim in this spec against the live codebase (it was 6 days stale). Found: (a) 4 of the spec's "8 unused exports" were never actually dead — `NED_TEAL`/`updateStockValue`/`DEFAULT_HERO_COLOR`/`MILESTONE_CHIPS` are all used internally within their own file, just over-exported; knip flags them only because no *other* file imports them. (b) no CVEs exist on either package, in root or `functions/`, and no newer release exists to bump to for either — this is purely a staleness concern. (c) a fresh `knip` run found 16 more unused exports + 25 unused exported types beyond this spec's original list, mostly `mockData.ts`'s per-persona constants (same used-internally-only pattern).
* **Decision: split.** `@use-gesture/react` replacement + the *verified* dead code + `eslint-plugin-jsx-a11y` shipped now (Phases 2 and 4 below). `crossword-layout-generator` replacement (Phase 3) is descoped — see §6 Addendum. The 16+25 newly-found knip items are deliberately *not* absorbed into this ticket's scope; logged as a fresh debt-ledger follow-up instead.

### Phase 2: `@use-gesture/react` replacement — ✅ Done (2026-08-04)
* Replaced with native `onTouchStart`/`onTouchMove`/`onTouchEnd`/`onTouchCancel` handlers in `SwipeableTaskRow.tsx`. No `preventDefault()`-vs-passive-listener fight needed: the existing `touchAction: 'pan-y'` CSS already stops the browser from natively panning the row horizontally, so JS never has to contest a scroll. A lightweight axis-lock (10px movement decides horizontal-vs-vertical, then holds for the gesture) replicates `@use-gesture`'s `axis:'x'` locking so a vertical scroll never causes the swipe-reveal layers to flicker.
* `src/components/tasks/__tests__/SwipeableTaskRow.test.tsx` added (none existed before) — 8 tests: render smoke test, right-swipe-completes and left-swipe-opens-forgiveness-sheet past threshold+velocity, under-distance-threshold no-op, under-velocity-despite-large-movement no-op, vertical-scroll-gesture ignored even if it ends past the horizontal threshold, `isLogView` disables swipe entirely, `touchcancel` resets cleanly.
* Real-device swipe testing (this spec's own stated requirement, §5) is still outstanding — see Phase 5.
* Bundle: `vendor` chunk dropped from 540.48KB to 519.82KB raw (182.64KB → 176.15KB gzip) with `@use-gesture/react` removed — measured via a real before/after `npm run build`, not estimated.

### Phase 3: `crossword-layout-generator` replacement — descoped, not done
* See §6 Addendum for the reasoning. `functions/src/index.ts`, `crosswordPrompts.ts`, and `crossword-layout-generator.d.ts` are untouched.

### Phase 4: Dead code + lint cleanup — ✅ Done (2026-08-04)
* Deleted the 2 unused files (`src/lib/games/goalLadder/types.ts`, `src/lib/games/types.ts`) — verified zero importers.
* Of the spec's original 8 "unused exports": 4 were genuinely dead with zero references anywhere (`getROSCAssessmentCount`, `getCompletedTasksForToday`, `usePageVersion`, `getEnvColor`) — deleted, along with a now-unused `isSameDay` import in `tasks.ts`. The other 4 (`NED_TEAL`, `updateStockValue`, `DEFAULT_HERO_COLOR`, `MILESTONE_CHIPS`) were used internally within their own file — the `export` keyword was dropped, the code stayed.
* Added `eslint-plugin-jsx-a11y` (`^6.10.2`) to `eslint.config.js`, scoped to `**/*.tsx`. First run found 48 problems, not "some overlap" as this spec originally guessed — triaged all of them individually, none left unaddressed:
  * 37 `label-has-associated-control`: ~34 were genuine bugs (a visually-adjacent `<label>` with zero programmatic association to its control — a screen reader user tabbing to the field would get no accessible name at all) — fixed with `id`/`htmlFor` pairing across 12 files. The remaining few were `<label>` elements captioning a *group* of controls (e.g. a button row, a dynamic list of per-player inputs) rather than one — those aren't real form labels; converted to `<p>` (same visual styling) with `aria-label` added to each real control instead.
  * 7 `no-autofocus`: all 7 are deliberate "focus the primary field when a modal/tool/step opens" patterns (`VaultGate` PIN entry, `AccountDeletionModal`'s re-auth step, `TaskFormModal`'s title field — already conditional on `!initialTask`, `PersonifyTool`'s add/edit forms, `ResentmentBurner`'s sole textarea, `Profile.tsx`'s vault-reset confirmation, `WorkbookSession.tsx`'s answer field). This matches WCAG's own modal-focus-management guidance, not the "autofocus on ordinary page load" anti-pattern the rule is meant to catch — suppressed all 7 with a one-line reason each rather than removing working UX.
  * 2 `no-redundant-roles` (`AppShell.tsx`'s two `<ul role="list">`): **not a bug** — Tailwind's preflight resets `list-style: none` on every `ul`/`ol`, and Safari/VoiceOver has historically dropped the implicit list semantics once `list-style` is `none`; `role="list"` is the documented fix for exactly this. Suppressed with the reasoning inline, role kept.
  * 2 `click-events-have-key-events`/`no-static-element-interactions` (`SobrietyHero.tsx`'s popover backdrop `<div onClick>`): the popover's own toggle button is already a real, keyboard-operable `<button>`, so the backdrop is mouse/touch-only convenience, not the sole path to closing it. Suppressed with reasoning.
* `npm run lint` (the real CI command, `--report-unused-disable-directives --max-warnings 0`) clean, confirming every suppression comment is actually load-bearing, not stale.

### Phase 5: Edge Cases
* [x] Confirmed `SwipeableTaskRow.tsx`'s replacement doesn't regress accessibility — `TaskRow.tsx`'s completion control is a real `<button>` with its own `onClick`, entirely independent of the swipe-bound outer `<div>`; the touch-handler swap never touched it.
* [ ] Crossword edge cases — N/A, Phase 3 descoped.
* [x] Confirmed `eslint-plugin-jsx-a11y`'s ruleset doesn't conflict with existing `eslint-disable` overrides — `npm run lint --report-unused-disable-directives` came back clean.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `SwipeableTaskRow.test.tsx` (8 tests, new file). Crossword grid generator: N/A, descoped.
* [ ] **Manual:** real-device swipe testing for `SwipeableTaskRow.tsx` — **not done from this sandbox, needs a human with a real touchscreen.** Chrome DevTools touch emulation isn't a substitute for the class of bug this component is most at risk of (momentum, exact threshold feel).
* [x] **Lint:** `npm run lint` clean with `eslint-plugin-jsx-a11y` added, all 48 findings triaged (fixed or suppressed with reasoning), zero unused disable-directives.
* [x] **Regression:** full `npm run check` (lint, 68 specs, 693+8 tests, build) clean.

---

## 6. Addendum (2026-08-04): `crossword-layout-generator` replacement descoped

Per the `/planning` pass in Phase 1: this package has zero CVEs (confirmed via `npm audit` in `functions/`), still installs and runs correctly, and no newer release exists to bump to for either package — so "the package is old" isn't, on its own, a real forcing function. Writing a from-scratch replacement for its actual job (crossword grid interlocking/placement — a genuinely hard combinatorial-optimization problem) is multi-day work with real correctness risk (must still place ≥`CROSSWORD_MIN_PLACED_WORDS`, produce solvable/symmetric grids) on a working, zero-CVE, low-traffic (one nightly Cloud Function run) feature. That's a poor effort-to-risk trade relative to the rest of this ticket.

Moved to `docs/BACKLOG.md`'s trigger-based section rather than left implicit — trigger: the package becomes uninstallable (e.g. a Node engine bump it can't support), gets a real CVE, or Daily Crossword needs a capability only a rewrite could provide. Not "revisit because it's old."
