# 📐 Feature Spec: Tasks & Habits (The Ledger)

**Status:** Live (v2.4 — updated PROJ-47)
**Context:** High-density professional task management with AI action routing.

## 1. Overview
A streamlined interface for managing one-time tasks and recurring habits. Rebranded from "Quests" to "Tasks" to align with a professional recovery ledger aesthetic.

## 2. Smart Tabs (Routing Logic)
The system segregates tasks into three actionability-based lanes (redesigned in PROJ-47):
1. **Today (default):** All pending tasks where `dueDate <= startOfDay(today)` — includes overdue tasks from any prior day. Sorted: overdue tasks oldest-first, then today's tasks by priority (High → Medium → Low). AI tasks (`source === 'ai'`) route here when their `dueDate <= today`. Badge shows pending count.
2. **Later:** All pending tasks where `dueDate > startOfDay(today)`. Sorted by `dueDate` ascending. AI tasks route here when `dueDate > today`. No badge.
3. **Log:** All tasks where `status === 'completed'` (one-time tasks), plus any recurring task whose `lastCompletedAt` is today. Grouped by Year/Month. No badge.

**Action Plan tab removed (PROJ-47):** AI tasks (`source === 'ai'`) no longer have a dedicated tab. They route by `dueDate` alongside manual tasks. The purple sparkle icon and AI Context Card (PROJ-46) continue to visually distinguish them. 

## 3. Data Structure
**Collection:** `tasks`
| Field | Type | Description |
| :--- | :--- | :--- |
| `source` | string | `'manual'` \| `'ai'` \| `'anchor_intent'` — determines tab routing |
| `category` | string | `'Recovery'`, `'Health'`, `'Work'`, `'Life'` |
| `priority` | string | `'High'`, `'Medium'`, `'Low'` |
| `currentStreak` | number | Cumulative consecutive completions |
| `dueDate` | Timestamp | Next scheduled deadline |
| `recurrence` | Map | The full `RecurrenceConfig` object governing repetition |
| `lastCompletedAt` | Timestamp \| null | Last completion time; used by Rhythm Score and Smart Reset |
| `sourceContext` | string? | **(PROJ-46)** AI one-sentence explanation of why the task was recommended. Only on `source === 'ai'`. Plaintext. |
| `sourceRef` | string? | **(PROJ-46)** Deep-link reference. Format: `workbook:{id}` or Firestore insight doc ID. Only on `source === 'ai'`. |
| `originalDayOfMonth` | number? | **(PROJ-47)** Stored inside `recurrence` Map for monthly tasks. Captures the intended day at creation so `calculateNextDueDate()` can restore it after shorter months (e.g. Jan 31 → Feb 28 → Mar 31). |
| `missedCountHistory` | number[]? | **(PROJ-47)** Append-only array. Each element is days missed in one lazy evaluation fetch cycle. Written via `arrayUnion` in `getUserTasks()`. Source data for long-term compliance analysis. |

## 4. Technical Logic
* **Optimistic UI:** Toggle actions use React Query `onMutate` for zero-latency feedback.
* **Smart Reset:** On background load (`getUserTasks()`), recurring tasks whose `dueDate` is in the past and were not completed within the grace window are silently moved to today with a streak penalty, preventing "schedule debt." This continues to fire on every load regardless of how the task was skipped.
* **Grace Window (PROJ-47):** The Smart Reset overdue check uses a 2-hour trailing grace window: `graceWindowStart = subHours(startOfDay(today), 2)`. A task is treated as "completed today" if `lastCompletedAt > graceWindowStart`. This prevents silent streak resets for users who complete tasks late at night (e.g. 11:45 PM) when the app evaluates after midnight.
* **`missedCountHistory` Append (PROJ-47):** When the Smart Reset fires, it appends the number of missed days (`differenceInDays(today, startOfDay(task.dueDate))`) to `missedCountHistory` via `arrayUnion`. The append piggybacks on the existing `updateDoc` call — no extra Firestore write.
* **Forgiveness Tap (PROJ-46):** When a user actively swipes left on a task, the silent Smart Reset is replaced by a bottom sheet — "Let today go" — offering "Move to Tomorrow" or "Keep for Today". The underlying `updateDoc` write is identical to the Smart Reset; only the UX differs. Copy is streak-aware: "Your streak is safe" (streak > 0) vs "Recovery continues tomorrow" (streak ≤ 0).
* **Future Task Safety:** If a user attempts to complete a task whose `dueDate` is strictly in the future (via tap or swipe), the action is intercepted by a confirmation modal before firing.

## 5. Gesture Interactions (PROJ-46)
Implemented via `SwipeableTaskRow` wrapping `TaskRow`, using `@use-gesture/react` v10.

* **Swipe right (≥80px + ≥0.3px/ms velocity):** Completes the task. Green reveal layer + checkmark visible beneath the card during drag. On threshold: card slides off screen, `navigator.vibrate([40])` fires, `toggleTask` called. Threshold reduced to 60px on screens ≤360px wide.
* **Swipe left (≥80px + ≥0.3px/ms velocity):** Opens the Forgiveness Tap bottom sheet. Amber reveal layer + forward-arrow visible during drag. Card snaps back on release (does not slide off screen).
* **Direction lock:** `axis: 'x'` with a 10px threshold — vertical scroll is not intercepted until horizontal movement is confirmed as primary direction.
* **Log view:** Gestures disabled in the history tab (`isLogView === true` cancels the drag handler).

## 6. Quick Capture (PROJ-46)
Pull-to-add gesture on the task list container (detected via `touchstart`/`touchend` on the scrollable div):
* Activates only when `scrollTop === 0` and pull distance ≥ 60px.
* Opens `QuickCaptureSheet`: single text input (auto-focused), three priority chips (High/Medium/Low, Medium default), three date chips (Today/Tomorrow/This week, Today default).
* On submit: calls `addTask({ source: 'manual', recurrence: { type: 'once' }, priority, dueDate })`.
* "More options →" link closes the sheet and opens `TaskFormModal` for full editing.
* FAB `+` button continues to open `TaskFormModal` directly — Quick Capture is additive.

## 7. Rhythm Score (PROJ-46)
Client-side computed metric. **Not stored in Firestore.**

* **Formula:** `Math.round((completedDays / 14) * 100)` where `completedDays` = count of distinct days in the last 14 where at least one recurring task was completed (`lastCompletedAt` in window).
* **Implementation:** `src/lib/rhythmScore.ts` → `computeRhythmScore(tasks: Task[]): number`
* **Display:** `RhythmScoreRing` SVG component above the task list (non-history tabs). Colour: green (≥70) / amber (40–69) / muted (below 40). Only shown when score > 0.
* **Key property:** One missed day out of 14 scores ~93, not 0. Designed to be more forgiving than a streak counter.

## 8. AI Context Cards (PROJ-46)
Rendered in `TaskRow` when `task.source === 'ai' && task.sourceContext`:
* **Collapsed:** One-line preview of `sourceContext` in 11px muted text below the task metadata row.
* **Expanded (tap):** Full `sourceContext` sentence + `"See insight →"` deep-link.
* **Deep-link routing:** `sourceRef` starting with `workbook:` → `/workbooks/{id}`; other values → `/insights`. Missing `sourceRef` → "Source no longer available" (no broken navigation).
* **Legacy AI tasks** (no `sourceContext`): No context card rendered; purple sparkle icon still shows.

### Write Contract
When `addTask()` is called with `source: 'ai'`, callers must pass `aiMeta: { sourceContext, sourceRef }`:
* `JournalAnalysisWizard`: passes `sourceContext` from `result.action_contexts[i]`; no `sourceRef` (multi-entry source, no single doc ID).
* `InsightsLog`: passes `sourceRef: insight.id`; no `sourceContext` (actions from saved insights, context not stored).
* `WorkbookDetail`: passes `sourceContext` from `insight.action_contexts[i]` and `sourceRef: 'workbook:{workbookId}'`.
