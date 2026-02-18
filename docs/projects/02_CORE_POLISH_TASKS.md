# ⚡ Project 02: Task List Revamp (The Quest Engine)

**Objective:** Modernize the "Quests" interface to increase user engagement (dopamine) and reduce friction.
**Status:** 🟡 Active
**Tech Stack:** React Query (Optimistic Updates), Tailwind v4, Framer Motion (optional).

## 🏗️ Phase 1: UX & Interaction (The Feel)
* [ ] **Optimistic UI:** Implement `onMutate` in `useMutation` so checkboxes toggle *instantly* without waiting for Firestore.
* [ ] **Visual Redesign:** Move from "Bulky Cards" to "Compact Rows" for better density.
* [ ] **Micro-Interactions:** Add subtle animations/confetti on completion.

## 🧠 Phase 2: Logic & Architecture
* [ ] **Sorting Engine:** Sort by: `Status (Pending > Done)` -> `Priority` -> `Due Date`.
* [ ] **Filtering:** Add tabs/pills for "Today", "Overdue", "High Priority".
* [ ] **Sub-Quests:** (Stretch Goal) Allow a Task to have an array of sub-checkboxes.

## 🎨 Phase 3: Gamification
* [ ] **Streak Visualizer:** Show a mini "Heatmap" or "Chain" icon next to recurring tasks.
* [ ] **Completion Sound:** Optional "Ding" sound (using `useSound` or native Audio API).
