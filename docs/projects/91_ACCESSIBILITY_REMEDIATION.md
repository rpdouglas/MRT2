# 📁 Project 91: WCAG 2.2 AA Accessibility Remediation

**Status:** ✅ Shipped
**Primary Persona:** David (contrast/sunlight legibility, crisis-flow reliability), universal (screen-reader/keyboard users)
**Objective:** Fix the accessibility violations actually confirmed in the current codebase (verified by direct code reading, not the audit's file references), and add an automated axe-core CI gate so regressions are caught going forward instead of relying on another manual sweep.

---

## 1. The Executive Summary
**User Story:** As a screen-reader or keyboard-only user, I want every interactive control to have an accessible name and a keyboard path, and every header's text to be legible, so the app is usable regardless of how I navigate it.
**Source:** `docs/reports/PRODUCTION_READINESS_AUDIT.md` §4.2 (UX-01, div-as-button, contrast), §6.3 Action #12 (CI a11y gate).

**Scope correction vs. the audit — read before assigning work from the audit text directly:**
- The audit named `CravingBuster.tsx` and `FastLane.tsx` as having icon-only controls without `aria-label`. **Verified false** — every icon-bearing button across all 24 files under `src/components/games/` already has `aria-label` and/or visible text. No change needed there.
- The audit claimed a div-as-button anti-pattern in "legacy workbook list items." **Verified false** — `Workbooks.tsx`/`WorkbookDetail.tsx`/`WorkbookSession.tsx` use real `<Link>`/`<button>` elements throughout. A repo-wide grep for `<div onClick=`, `<li onClick=`, `<span onClick=` found exactly **one** instance in all of `src/`, and it isn't a list item (see §3).
- The audit called out `bg-cyan-200` page backgrounds. In the pages checked, text on these backgrounds sits inside white/semi-transparent cards, not bare on the pastel background — the real, measured risk is elsewhere (see §3).

The real violations found by directly reading the code are narrower than the audit implied, but real and worth fixing — see §3.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None — pure UI markup/accessibility attributes and one shared config value (theme.ts gradient stops).
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes.

**Confirmed violations (verified by reading the current code, not the audit):**

1. **`src/components/games/jeopardy/QuestionModal.tsx:26-28`** — the modal's close control renders only the `×` HTML entity, no `aria-label`. Fix: `aria-label="Close question"`.
2. **`src/pages/WorkbookSession.tsx:127-129`** — icon-only exit button (`XMarkIcon`), no `aria-label`. Fix: `aria-label="Exit to workbook section list"`.
3. **`src/pages/WorkbookDetail.tsx:185-190`** — per-section play/redo icon button (`PlayCircleIcon`/`ArrowPathIcon`), no `aria-label`. Fix: dynamic label, e.g. `` `${isComplete ? 'Redo' : 'Start'} ${section.title}` `` — a static label would be ambiguous with multiple sections on the page.
4. **`src/pages/WorkbookDetail.tsx:327-333`** — "add to habits" icon button (`PlusCircleIcon`/`CheckCircleIcon`), no `aria-label`. Fix: dynamic label referencing the action text, e.g. `` isAdded ? 'Added to tasks' : `Add "${action}" to tasks` ``.
5. **`src/components/SobrietyHero.tsx:131`** — the color-picker popover's full-screen dismiss backdrop (`<div onClick={...} />`, no `role`/`tabIndex`/`onKeyDown`). No Escape-key handler exists anywhere in the file. Fix: add a `keydown` listener (Escape closes the popover) while it's open — not a `role="button"` conversion, since this element isn't meant to be tabbed to, it just needs a keyboard-accessible dismiss path.
**§39's hypothesis was wrong — the automated check disproved it, and found different real issues instead.** This is the actual value of Phase 2's plan (verify before touching `theme.ts`): running the real axe scan (not my manual sRGB math) found:
- `THEME.vitality.header` — **zero contrast violations**. My manual calculation was incorrect; no change made.
- `THEME.tools.header` — 16 nodes flagged `incomplete` (needs human judgment, not a confirmed failure) — all involve semi-transparent white overlays (`bg-white/10`, `bg-white/60`) that axe cannot auto-resolve without knowing the true composited color. **Not fixed in this ticket** — logged under Out of Scope as a design-review follow-up, since axe itself didn't call it a violation.
- **The actual universal, confirmed violation across all 7 scanned routes**: `index.html`'s `<meta name="viewport">` had `maximum-scale=1.0, user-scalable=no`, disabling pinch-zoom — a hard WCAG failure (`meta-viewport`, moderate impact) the original audit never caught at all. Fixed by removing both attributes, leaving `width=device-width, initial-scale=1.0`.
- **Dashboard-specific, found only by the automated scan** (outside every file the audit or the manual code-reading pass named): a HeadlessUI `MenuButton` in `src/components/dashboard/DynamicAnchorWidget.tsx:143` (Daily Reading fellowship-switcher) rendered only a `ChevronDownIcon`, no accessible name — `critical`-impact `button-name` violation. Fixed with `aria-label="Choose fellowship reading"`.
- **Also found only by the automated scan**: `src/pages/Dashboard.tsx:179` — the "Backup Needed" banner's "Go" link, white text on `bg-amber-600`, measured at 3.18:1 (needs 4.5:1). Fixed by darkening to `bg-amber-700`/`hover:bg-amber-800` — confirmed passing by re-running axe, not just recalculating by hand.

**Explicitly NOT in scope (verified compliant, no action):** all of `src/components/games/`, `src/pages/Workbooks.tsx`, `WorkbookDetail.tsx`'s and `WorkbookSession.tsx`'s list/navigation elements (all real `<Link>`/`<button>`, not divs).

**New tooling:**
* `package.json` — add `@axe-core/playwright` (devDependency).
* `e2e/golden-paths/a11y.spec.ts` (new) — imports `{ test, expect }` from `../fixtures/emulator` (matching this repo's existing convention, inherits the auto-onboarded-user fixture), runs `AxeBuilder` against Dashboard, Journal, Workbooks, Tools Hub, Games Hub, and one representative game screen, asserting zero WCAG 2.2 AA violations.

---

## 4. Implementation Phases 🏗️

### Phase 1: Fix confirmed violations
* Add `aria-label`s to the 4 icon-only buttons (items 1-4 above).
* Add Escape-key dismissal to `SobrietyHero.tsx`'s color-picker popover (item 5).

### Phase 2: Automated contrast verification + fix
* Installed `@axe-core/playwright`, wrote `e2e/golden-paths/a11y.spec.ts` covering all 7 target routes at once (`waitForLoadState('networkidle')` doesn't work for this app — Firestore's persistent realtime-listener connection means network never goes idle — used `page.locator('h1, h2, h3').first().waitFor(...)` instead, since every route including VaultGate's locked/setup screens renders a heading once ready).
* Ran it against current `theme.ts`: found the `vitality`/`tools` hypothesis was wrong (see §3) and surfaced 3 real, different violations instead (`meta-viewport`, the Dashboard `MenuButton`, the Dashboard amber-600 "Go" link).
* Fixed all 3; re-ran to confirm each fix actually resolved its violation rather than assuming it.

### Phase 3: CI gate
* All 7 routes now pass with zero violations, in one spec file (`e2e/golden-paths/a11y.spec.ts`), running under the existing `npm run test:e2e` path (golden-paths suite, emulator-backed) — no new bespoke Playwright config needed.
* Verified the new spec runs cleanly alongside the 4 pre-existing golden-path specs in the same suite (11/11 passing together).

### Phase 4: Edge Cases
* [x] `SobrietyHero.tsx`'s Escape handler only attaches while `isColorPickerOpen` is true and is torn down on close/unmount — confirmed no conflicting global keydown listener exists elsewhere in the file.
* [x] `WorkbookDetail.tsx`'s dynamic `aria-label`s reference `section.title`/the action string directly, so they're only ambiguous if two sections or actions share identical text — an existing content-authoring concern, not introduced by this fix.
* [x] Confirmed the axe scan runs cleanly against `VaultGate`-wrapped routes (Journal/Workbooks/Vitality) — the fixture's fresh onboarded user hits the vault *setup* screen (no vault created yet), which passed with zero violations as-is.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** not added — the axe e2e gate is the primary regression net for this ticket's scope; `npm run test:once` (662/662) still green, confirming no unrelated regression.
* [x] **Build:** `npm run build` clean.
* [x] **Lint/Typecheck:** `npm run lint` and `npm run docs:check-specs` clean (58 specs pass).
* [x] **Accessibility/E2E:** `e2e/golden-paths/a11y.spec.ts` — all 7 routes pass with zero WCAG 2.2 AA violations.
* [x] **Regression:** ran the full golden-path suite (`gate`, `ledger`, `subway`, `vault`, `a11y` — 11 tests) together via `npm run test:e2e`; all pass, confirming the new spec doesn't interfere with the existing ones.

---

## Out of Scope
* `THEME.tools.header`'s 16 axe-`incomplete` nodes (semi-transparent overlay contrast) — axe itself couldn't confirm these as violations; needs a human/design-tool visual check, not a code fix. Logged here rather than guessed at.
* Any further `VibrantHeader`/`theme.ts` rework — the CI gate now exists to catch anything real in the other themes going forward.
* `jsx-a11y` ESLint plugin — a static-analysis complement to the runtime axe gate, but a separate tooling decision from this ticket's verified-violations scope.
