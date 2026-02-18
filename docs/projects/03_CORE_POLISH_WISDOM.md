# 📖 Project 03: Wisdom Polish (Interactive Workbooks)

**Objective:** Transform the Workbook experience from a "Data Entry Form" to a "Premium Interactive Book" (Headspace/MasterClass style).
**Status:** ⚪ Planned

## 🏗️ Phase 1: Typography & Layout
* [ ] **Tailwind Typography:** Implement `@tailwindcss/typography` (`prose` classes) for rich text rendering in questions.
* [ ] **Reading Mode:** Focus mode that hides the sidebar/header for deep work.

## 🧠 Phase 2: Data Safety
* [ ] **Auto-Save:** Implement `useDebounce` to save answers to `localStorage` (and Firestore) while typing. Prevent data loss if the browser closes.
* [ ] **Draft Indicator:** Visual "Saving..." / "Saved" status in the corner.

## 🎨 Phase 3: Interactive Inputs
* [ ] **Polymorphic Inputs:** Support non-text answers:
    * Sliders (1-10 Scales).
    * Multi-Select Chips ("What emotions are you feeling?").
    * Likert Scales (Strongly Agree <-> Strongly Disagree).
