# ⚡ Project 02: Professional Task List (The Engine)

**Objective:** Transform the Tasks module into a high-performance, minimalist to-do list.
**Status:** 🟢 Done
**Personas Involved:** Ned (The Pink Cloud)

## 🏗️ Phase 1: Logic & Optimistic UI (The Feel)
* [x] **Optimistic Toggle:** Implement `onMutate` in React Query. Clicking a checkbox must feel instant.
* [x] **Refactor Hook:** Create `useTaskOperations` to handle add/edit/delete/toggle.
* [x] **Schema Update:** Add `source` field ('manual' | 'ai') to differentiate user tasks from Insight Actions.

## 🧠 Phase 2: Visual Rebranding (The Look)
* [x] **List Layout:** Replace "Cards" with "Compact Rows" (High density).
* [x] **Terminology:** Rename "New Quest" -> "New Task".
* [x] **Smart Tabs:** Implement Today, Upcoming, Action Plan, and History log.

## 🎨 Phase 3: "Invisible" Gamification
* [x] **Subtle Rewards:** Completion triggers a subtle UI update.
* [x] **Streak Display:** Show recurrence label and visual overdue indicators.
