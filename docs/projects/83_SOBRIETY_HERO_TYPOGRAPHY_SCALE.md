# 📁 Project 83: Sobriety Hero Typography Scale-Up

**Status:** ⚪ Planned
**Primary Persona:** Ned (streak/gamification-focused, benefits most from a bolder counter), David (must not add visual noise/stress)
**Objective:** Increase the font size of the Years/Months/Days labels, Total Days label+value, and Saved label+value in `SobrietyHero.tsx` by 10%, with no layout regressions at any breakpoint.

---

## 1. The Executive Summary
**User Story:** As Ned, I want the sobriety hero's key stats to be a little more visually prominent so my streak feels like the headline achievement it is.
**Competitive Gap:** N/A — pure visual polish, not a competitive differentiator. Lightweight spec per protocol; no new data, schema, or AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Purely presentational (Tailwind className changes only). No new data read/written.
* [x] **Encryption Strategy:** N/A — no data touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes. Styling-only change confined to `src/components/SobrietyHero.tsx`.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
N/A — no state or query changes.

### Phase 2: UI/UX
* **File:** `src/components/SobrietyHero.tsx`
* Increase by ~10% (nearest usable Tailwind arbitrary value):
  * Years/Months/Days **value** — `text-3xl sm:text-5xl` → `text-[33px] sm:text-[52.8px]`
  * Years/Months/Days **label** — `text-[10px] sm:text-xs` → `text-[11px] sm:text-[13.2px]`
  * Total Days + Saved row (label and value share one wrapping class) — `text-xs sm:text-sm` → `text-[13.2px] sm:text-[15.4px]`
* **Somatic Check:** Larger numerals reinforce accomplishment; no red/alarm color introduced. Low risk for David — hero is passive display, not an interactive/decision surface.
* **Reward:** Reinforces the existing streak-as-trophy pattern; no new XP/leveling hook needed.

### Phase 3: Edge Cases
* [ ] 320px width (iPhone SE): confirm the 3-column grid (Years/Months/Days) doesn't wrap or clip with larger type.
* [ ] Long currency values (e.g., 6-figure "Saved" amount) still fit the flex row without wrapping awkwardly at `sm:text-[15.4px]`.
* [ ] Milestone banner state (`activeMilestone` truthy) is unaffected — it uses separate, unrelated size classes.

---

## 5. QA & Verification 🧪
* [ ] **Visual/manual check:** Dashboard hero at mobile (375px) and desktop widths, both milestone and non-milestone states.
* [ ] **The Subway Test:** N/A (no network/data dependency).
* [ ] **The "Lost PIN" Test:** N/A (no encrypted data involved).
