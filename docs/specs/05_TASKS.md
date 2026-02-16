# 📐 Feature Spec: Quests (Tasks)

**Status:** Live (v1.0)
**Context:** Gamified habit tracking with recurrence engines.

## 1. Overview
A list of one-time or recurring tasks. Completion awards XP and updates "Habit Fire" streaks.

## 2. The Recurrence Engine (Lazy Evaluation)
The system does not run a nightly cron job to reset tasks. Instead, it uses **Lazy Evaluation** when the user loads the app.

### A. The "Check-in" Logic
Located in: `src/lib/tasks.ts` -> `getUserTasks()`
1.  **Trigger:** User opens the Task list or Dashboard.
2.  **Check:** Is the task `isRecurring`? AND Is `dueDate` < `today`?
3.  **Logic:**
    * If NOT completed yesterday/today:
        * **Punishment:** Reset `currentStreak` to 0 (or decrement).
        * **Reset:** Move `dueDate` to **Today** (The "Smart Reset").
    * *Why?* This allows a user who missed a day to pick up right where they left off without manually rescheduling.

### B. Completion Logic
Located in: `src/lib/tasks.ts` -> `toggleTask()`
1.  **Mark Done:**
    * `currentStreak` += 1.
    * `lastCompletedAt` = Now.
    * `dueDate` = Next Interval (Tomorrow/Next Week).
2.  **Uncheck (Undo):**
    * `currentStreak` -= 1.
    * `dueDate` = Today.

## 3. Data Structure
**Collection:** `tasks`
| Field | Type | Notes |
| :--- | :--- | :--- |
| `isRecurring` | Boolean | Determines if reset logic applies |
| `frequency` | String | 'daily' \| 'weekly' \| 'monthly' |
| `currentStreak` | Number | The "Fire" score |
| `lastCompletedAt` | Timestamp | Used to validate streaks |
| `dueDate` | Timestamp | The target for the streak |

## 4. Verification Checklist
* [ ] **Lazy Reset:** Miss a daily task yesterday. Open app today. Does date move to today and streak reset?
* [ ] **Completion:** Mark done. Does date move to tomorrow?
* [ ] **Undo:** Uncheck. Does date move back to today?
