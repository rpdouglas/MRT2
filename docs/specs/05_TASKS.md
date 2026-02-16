# 📐 Feature Spec: Quests (Tasks)

**Status:** Live (v1.0)
**Context:** Gamified habit tracking.

## 1. Overview
A list of one-time or recurring tasks. Completion awards XP and updates "Habit Fire" streaks.

## 2. Logic: Recurrence
* **Daily:** Resets at 00:00 local time.
* **Weekly:** Resets 7 days after completion.
* **Logic Location:** `src/lib/tasks.ts` -> `getUserTasks` (Lazy Evaluation).

## 3. Verification Checklist
* [ ] Create a "Daily" task. Mark done. Change system time to tomorrow. Does it un-check?
* [ ] Verify "Habit Fire" streak increments correctly.
