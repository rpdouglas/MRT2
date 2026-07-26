# 📁 Project 78: VibrantHeader Right-Column Overflow

**Status:** ✅ Shipped
**Primary Persona:** David (Crisis-first: the SOS button is his primary escape hatch and must never be visually clipped or hard to hit).
**Objective:** Fix `VibrantHeader.tsx` so the right-hand icon group (Help + SOS) never renders past the viewport edge when the center title/subtitle column is wide (long subtitles, narrow screens).

---

## 1. The Executive Summary
**User Story:** As David in an acute crisis state on My Workbooks (or any page with a long header subtitle), I want the SOS button to be fully visible and tappable within the viewport, so that my one guaranteed escape action is never partially cut off.

**Competitive Gap:** N/A — this is a layout regression/bug fix, not a differentiating feature.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Pure CSS/layout fix to `VibrantHeader.tsx`. No data read/written.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
**Firestore Collections Impacted:** None.

**Types (`src/lib/db.ts`):** None — no new types.

---

## 4. Background — how this was found

Found during QA of `docs/projects/77_NAV_TAB_BAR_UNIFICATION.md` (tab-bar unification), while visually verifying My Workbooks at a 412px mobile viewport via Playwright. The SOS button's right edge measured at 441px — 29px past the 412px viewport — while the same measurement on Journal/Dashboard/Tasks landed at ~396-400px (inside bounds).

**Confirmed pre-existing and unrelated to PROJ-77:** reproduced identically (`sosRight: 441.27`) against the original, unmodified `Workbooks.tsx` via `git stash` before PROJ-77's changes were applied. PROJ-77 did not cause or worsen this bug; it was simply the page with the longest header subtitle among the five migrated pages ("Structured guides to process your journey."), which is what exposes the underlying layout bug.

**Root cause (`src/components/VibrantHeader.tsx:72-137`):** the header uses a 3-column flex row (`flex items-center justify-between`):
* Left column (hamburger/back): `flex-1 flex justify-start`
* Center column (title + subtitle): `shrink-0 flex flex-col items-center text-center px-2`
* Right column (help + SOS): `flex-1 flex items-center justify-end gap-3`

The center column is `shrink-0` — it never yields width, so on a long subtitle it claims however much space its content needs. The left/right columns are `flex-1` but have no `min-w-0`, so per default flexbox behavior their `min-width: auto` also refuses to shrink below their own content's min-content size (the icon buttons). When `center content + left min-content + right min-content` exceeds the viewport width, nothing in the row is willing to shrink further, and the row silently overflows past the container edge instead of wrapping, truncating, or scrolling — pushing the right-most element (SOS) outside the visible viewport with no visual indication anything is wrong.

---

## 5. Implementation Phases 🏗️

### Phase 1: Logic & State
* No data/state changes. Pure layout fix in `VibrantHeader.tsx`.

### Phase 2: UI/UX & Gamification
* Implemented Strategy A from the approved plan: the center title/subtitle column (`src/components/VibrantHeader.tsx`) changed from `shrink-0` to `min-w-0`, and the subtitle `<p>` gained `truncate max-w-full`, so a long subtitle ellipsizes instead of forcing the row past the viewport edge. Title's two flanking icons got `shrink-0` defensively so they can't be squeezed by a long title inside the now-shrinkable column. The SOS button and its `flex-1` right-hand column were **not** touched — no `min-w-0` added there, so it keeps its own min-content floor and can never be forced to shrink.
* **Somatic Check:** SOS stays full-size, full opacity, un-shrunk in all measurements — verified below.
* **Reward:** None — this is a layout bug fix, not a gamification surface.

### Phase 3: Edge Cases
* [x] 320px viewport (iPhone SE) with the longest current subtitle (Workbooks') — SOS right edge measured 304px, inside the 320px viewport.
* [x] 412px viewport (Pixel 7) — the width this bug was originally caught at — SOS right edge measured 396px, inside the 412px viewport (previously 441px, 29px past the edge).
* [x] Confirmed no regression to Journal's header rendering (short subtitle) at both widths — identical SOS position (396px/304px) to Workbooks now that both are in-bounds.
* [ ] Not separately re-verified: Vitality/Tasks/Profile headers — all share the same `VibrantHeader` component and none had a subtitle longer than Workbooks', so they were never in the overflow condition; the fix is strictly non-regressive for shorter subtitles per the Phase 3 mechanism (only text that needs to shrink gets truncated).

---

## 6. QA & Verification 🧪
* [x] **Unit Tests:** `src/__tests__/VibrantHeader.test.tsx` — 3/3 pass: SOS renders, subtitle truncates with `min-w-0` on its column, SOS's column stays free of `min-w-0` (regression guard against the fix creeping onto the SOS side).
* [x] **The Subway Test:** N/A — no network dependency.
* [x] **The "Lost PIN" Test:** N/A — no encrypted data touched.
* [x] Manual visual QA at 320px and 412px via Playwright + `?mockUser=` on Workbooks and Journal — DOM measurements (`getBoundingClientRect`) and screenshots both confirm the SOS button fully within viewport bounds, subtitle truncated with an ellipsis, title wraps naturally.
* [x] `npm run lint` (zero warnings), `npx tsc --noEmit`, and `npm run build` — all pass (pre-existing unrelated vendor-chunk-size warning only).
* [x] `npm run test:once` — 620/620 pass (617 baseline + 3 new).
* [x] `npm run docs:check-specs` — 42/42 pass.
