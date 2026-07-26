# 📁 Project 77: Nav Tab-Bar Unification

**Status:** ✅ Shipped
**Primary Persona:** Cross-cutting (no single primary — this is an infrastructure/design-consistency pass affecting the tab navigation on My Journal, My Vitality, My Workbooks, My Tasks, and My Profile). Constrained by David's and Walt's navigation rules (see §4).
**Objective:** Give every feature page the same tab-bar visual pattern already used by My Journal — a white pill bar that overlaps the header via negative margin, with an active-tab state contrasted against that feature's own color from `src/lib/theme.ts` — replacing today's four inconsistent, hand-rolled implementations.

---

## 1. The Executive Summary
**User Story:** As any user navigating between sub-views within a feature (e.g. Tasks' Today/Later/Log, Vitality's Move/Fuel/Breath), I want the tab bar to look and feel the same way it does in My Journal — floating over the header, colored to match the feature I'm in — so that the app reads as one coherent product instead of five differently-styled sections.

**Competitive Gap:** Neither "I Am Sober" nor "Reframe" nor "Sober Grid" apply a consistent, module-colored navigation chrome across their feature areas — most competitor apps use a single flat global tab bar with no per-section identity. MRT's per-feature color system (`THEME.<feature>`) is already a differentiator; this project makes sure the in-page navigation actually expresses it consistently, rather than only the header doing so.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** No. This is a presentational/CSS change to existing tab controls. No new data is read, written, or displayed.
* [x] **Encryption Strategy:** N/A — no `src/lib/crypto.ts` involvement. No Firestore reads/writes are added or changed.
* [x] **Key Rotation:** N/A — nothing here touches `executePinRotation` or any encrypted collection.

---

## 3. Schema & Architecture 🗄️
*Define the exact Firestore paths and TypeScript interfaces.*

**Firestore Collections Impacted:**
* None.

**Types (`src/lib/db.ts`):**
```typescript
// No new Firestore-backed types. A new shared UI component (see Phase 2) may
// introduce a local prop-typed interface, e.g.:
// interface TabItem { id: string; label: string; icon: React.ComponentType<...>; badge?: number }
// This lives with the component, not in db.ts.
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* No React Query hooks needed — no data layer involved.
* No Firebase security rules changes.
* Confirm `src/lib/theme.ts` (`THEME.<feature>.header.{from,via,to}`) remains the single source of truth for per-feature color; do not introduce a parallel palette. Reconcile `.claude/skills/design/SKILL.md`'s Module Colour System table against `theme.ts` while here (it's currently missing Journal/Workbooks/Profile/Tools entries — same class of drift previously fixed for Tools Hub in `docs/projects/71_TOOLS_HUB_REGROUPING.md`).
* Preserve each page's existing tab-selection mechanism as-is — this is a styling pass, not a state-management refactor:
  * Journal: URL search param (`?tab=`)
  * Vitality, Workbooks, Tasks: local `useState`
  * Profile: route param (`/profile/:tab`) via `useParams`/`navigate()`
* Related to, but does **not** resolve, the "Navigation consistency" question flagged ❓ in `docs/projects/45_ADAPTIVE_PERSONA_UI.md` — that question is about persona-*mode* navigation (David-mode UI vs. Ned-mode UI, a runtime engine PROJ-45 has not started building), which this project doesn't touch. This project settles the narrower, already-real question of in-page feature tab-bar styling: shared visual pattern, differentiated by feature color, not by persona mode. Cross-referenced from PROJ-45's open-questions table for future readers, without closing that row.

### Phase 2: UI/UX & Gamification
* Extract a shared tab-bar presentational component (candidate: `src/components/ui/TabBar.tsx`, alongside the existing `src/components/ui/GlassCard.tsx`) generalizing Journal's pattern (`src/pages/Journal.tsx:50-87`):
  * Container: `bg-white p-1.5 rounded-xl shadow-lg border border-{feature}-200 flex`
  * Overlap: wrapper `px-4 -mt-10 relative z-30` sitting on the `VibrantHeader`'s `pb-16` runway
  * Active tab: `bg-gradient-to-br {feature}-header-from {feature}-header-to text-white shadow-md scale-105`; inactive: `text-gray-500 hover:text-{feature}-600 hover:bg-gray-50`
  * Accept a `gradient` (or feature key) prop sourced from `THEME.<feature>.header`, plus a `tabs` array (id/label/icon/optional badge count) and controlled `activeTab`/`onChange` — keep it purely presentational, no internal routing/state assumptions, so it can wrap all five different state mechanisms from Phase 1.
* Migrate each page's inline tab markup to the shared component:
  * **Vitality** (`src/pages/Vitality.tsx:32-45`): change from non-overlapping `py-4` flow to the shared overlap pattern; replace the three unrelated sub-tab hues (orange/emerald/sky) with `THEME.vitality`-derived contrast.
  * **Workbooks** (`src/pages/Workbooks.tsx:44-81`): already overlaps and uses correct emerald tones — just needs to drop its divergent visual language (`uppercase tracking-wide`, `scale-[1.02]`, tinted container) in favor of the shared white-card component.
  * **Tasks** (`src/pages/Tasks.tsx:285-312`): replace generic `bg-slate-800` active state with `THEME.tasks`-derived cyan/teal/emerald contrast. Also fix the page root's hardcoded `bg-gray-50` to use `THEME.tasks.page` while touching this file (pre-existing drift noted during research, not a new requirement — confirm with user before including if it's considered out of scope).
  * **Profile** (`src/pages/Profile.tsx:390-417`): already closest to the target pattern; align active-tab state to the gradient treatment for visual consistency (its current `bg-slate-800` is thematically defensible since Profile's theme is slate/zinc, so this is the lowest-priority migration).
* **Somatic Check:** No red/failure-coded inactive states in any migrated tab bar — inactive tabs stay neutral gray, per David's "no shame" rule already respected by Journal's pattern.
* **Reward:** None — tab bars are structural navigation, not a gamification surface. Per Walt's constraint, do not introduce badges/confetti/XP visuals into the shared component.

### Phase 3: Edge Cases
* [x] `navigator.onLine` false: no behavior change — pure styling, no network dependency.
* [x] `isVaultUnlocked` false: tab bars only render on already-gated pages; no new exposure of encrypted content.
* [x] 320px wide screen (iPhone SE): verified via Playwright screenshots. Found and fixed a real bug during implementation — `flex-1` tab buttons default to `min-width: auto`, so long/many labels (Profile's 4 tabs, Tasks' 3 tabs at 320px) either overflowed their container or visually overlapped. Fixed in `TabBar.tsx` with `min-w-fit` per button (never shrink below content) + `overflow-x-auto` on the container (scroll instead of overlap/break), restoring the pattern the original pre-migration `Workbooks.tsx` already used (`min-w-[120px]` + `overflow-x-auto`). Regression-guarded by `TabBar.test.tsx`'s "never lets tabs shrink below their content width" test.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `src/__tests__/TabBar.test.tsx` — render, onChange, active-gradient targeting, badge visibility, and the min-width overflow regression guard. `npx vitest run` — 5/5 pass.
* [x] **The Subway Test:** All five pages render their tab bars with no network dependency (mock-data smoke check via `?mockUser=`).
* [x] **The "Lost PIN" Test:** N/A — no encrypted data touched.
* [x] **Manual visual QA:** All 5 pages screenshotted at mobile (412px) and 320px via Playwright + `?mockUser=` mock-data bypass (view-only, no mutations — see limitations noted below). Confirmed overlap + feature-color contrast on Journal/Vitality/Workbooks/Tasks/Profile, including tab switches.
* [x] **Persona checks:** David — SOS button unaffected by tab-bar changes (its pre-existing position issue on Workbooks, found during this QA pass, is documented below as out-of-scope); no red inactive states anywhere. Walt — touch targets unchanged (`py-2.5`/`px-4`, same as original Journal pattern), no gamified visuals added.
* [x] `npm run lint` (zero warnings) and `npm run build` — both pass.
* [x] `npm run docs:check-specs` — passes (41/41 specs).

### Found during QA, explicitly out of scope
A pre-existing bug was found while visually verifying Workbooks at 412px width: the SOS button in `VibrantHeader.tsx` renders ~29px past the right edge of the viewport specifically on pages with a long subtitle (Workbooks' "Structured guides to process your journey." is the longest of the five). Root cause: the header's center title/subtitle column has `shrink-0`, which never yields width back to the right-side icon group. **Confirmed pre-existing** by reproducing it against the original, unmodified `Workbooks.tsx` (via `git stash`) before this project touched the file — this project's tab-bar changes do not cause or worsen it. Not fixed here since it's a `VibrantHeader` layout issue orthogonal to tab-bar unification; flagged to the user for a separate ticket.
