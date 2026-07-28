# 📁 Project 84: Dashboard Bento Tile Refresh & Tasks Contrast Fix

**Status:** ✅ Shipped
**Primary Persona:** Ned (Dashboard/bento grid is his primary navigation surface; benefits most from richer, more energetic visuals), David (must not add cognitive load or new taps)
**Objective:** Componentize the Dashboard's six hardcoded bento tile links into a reusable, `THEME`-driven component with a refreshed surface treatment, and fix a white-text legibility bug on the Tasks module's header/tab/tile gradient.

---

## 1. The Executive Summary
**User Story:** As Ned, I want the Dashboard's shortcut tiles to feel as polished and energetic as the rest of the app, and as any user of the Tasks section, I want the header text to actually be readable against its background.
**Competitive Gap:** N/A — visual polish and a genuine accessibility/legibility bug fix, not a competitive differentiator. Lightweight spec per protocol (written retroactively during ticket-close — see §6); no new data, schema, or AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Purely presentational (Tailwind className changes + one new UI component). No new data read/written.
* [x] **Encryption Strategy:** N/A — no data touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes. New file: `src/components/dashboard/BentoCard.tsx` (presentational component, props-driven from a `BENTO_TILES` array in `Dashboard.tsx`). Modified: `src/pages/Dashboard.tsx` (six inline `<Link>` blocks replaced by `BentoCard` + data array), `src/lib/theme.ts` (`THEME.tasks.header` stops darkened one shade: `cyan/teal/emerald 500→600`).

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
N/A — no state or query changes. Tile routes/copy/icons preserved byte-for-byte from the prior inline implementation.

### Phase 2: UI/UX
* **File:** `src/components/dashboard/BentoCard.tsx` (new)
  * Each tile now reads its gradient from `THEME[moduleKey].header` (three-stop `from/via/to`) instead of an ad-hoc two-stop literal, matching the pattern `VibrantHeader.tsx` already uses for every other page.
  * Added a subtle corner glow blob (borrowed technique from `GlassCard.tsx`, not its dark-glass structure) and extended the `group-hover` icon-rotate micro-interaction — previously only present on the Tools tile — to all six tiles for consistency.
* **File:** `src/lib/theme.ts`
  * `THEME.tasks.header.{from,via,to}` bumped `cyan-500/teal-500/emerald-500` → `cyan-600/teal-600/emerald-600` — the original shades scored under 3:1 contrast against the white title text in `VibrantHeader`, the Tasks page's active `TabBar` tab, and (once wired to `THEME`) the Dashboard's own "My Tasks" tile.
* **Somatic Check:** No red/alarm states introduced. Better contrast is a direct legibility win, not a stress-inducing change. Tap targets unchanged (still full-tile `<Link>`s).
* **Reward:** N/A — no XP/leveling hook.

### Phase 3: Edge Cases
* [x] Tailwind JIT purge: all new gradient/glow classes are complete literal strings in scanned `.tsx` files (no runtime string templating) — confirmed by successful `npm run build`.
* [x] Existing `Dashboard.test.tsx` assertions (tile text content only, no markup/class assertions) — confirmed unaffected, ran unmodified.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing, no test changes required.
* [x] **Visual/manual check:** No auth credentials available in this environment to reach the live app; verified instead by rendering the real components with the real compiled Tailwind CSS to static HTML and screenshotting with Playwright (all six bento tiles, and the darkened Tasks header/tab/tile across states).
* [x] **The Subway Test:** N/A (no network/data dependency).
* [x] **The "Lost PIN" Test:** N/A (no encrypted data involved).

---

## 6. Process Note
This spec was written retroactively during `ticket-close`, after implementation and merge — it should have been created before planning began per `CLAUDE.md`'s "no feature without a spec" rule. The work itself was scoped, planned, and user-confirmed via plan mode before any code was written; the gap was specifically the missing `docs/projects/` artifact, not missing review. Flagging so future presentational/polish tickets in this size class get a spec stub up front, matching the PROJ-83 precedent this file follows the format of.
