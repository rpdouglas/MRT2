# ⚡ Project 02: Professional Task List (The Engine)

**Objective:** Transform the Tasks module into a high-performance, minimalist to-do list.
**Constraint:** STRICTLY AVOID "Quest" or RPG terminology.
**Status:** 🟡 Active

## 🏗️ Phase 1: Logic & Optimistic UI (The Feel)
* [ ] **Optimistic Toggle:** Implement `onMutate` in React Query. Clicking a checkbox must feel instant.
* [ ] **Refactor Hook:** Create `useTaskOperations` to handle add/edit/delete/toggle.
* [ ] **Schema Update:** Add `source` field ('manual' | 'ai') to differentiate user tasks from Insight Actions.

## 🧠 Phase 2: Visual Rebranding (The Look)
* [ ] **List Layout:** Replace "Cards" with "Compact Rows" (High density).
* [ ] **Terminology:** Rename "New Quest" -> "New Task".
* [ ] **Smart Tabs:**
    1. **Today:** Due <= Today (includes Overdue).
    2. **Upcoming:** Due > Today.
    3. **Action Plan:** Tasks where `source == 'ai'`. (Keeps growth goals separate from chores).
    4. **History:** Completed tasks.

## 🎨 Phase 3: "Invisible" Gamification
* [ ] **Subtle Rewards:** Completion triggers a subtle "ding" or micro-animation (no confetti).
* [ ] **Streak Display:** Show a small "Fire" icon next to recurring habits, but keep it minimal.
