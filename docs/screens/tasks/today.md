# Tasks → Today — `/tasks` (default tab)

**Source:** `src/pages/Tasks.tsx` (Today filter/sort logic) + `components/tasks/{SwipeableTaskRow,TaskRow,QuickCaptureSheet,TaskFormModal,RhythmScoreRing}.tsx`

## What it does

The default, highest-priority lane: everything pending that's due today or already overdue. This is also where new tasks get created — via a floating `+` button, or a pull-to-add gesture.

## How it works

### Filter & sort
Pending tasks (`status !== 'completed'`) where `startOfDay(dueDate) <= startOfDay(today)` — this includes overdue tasks from any prior day, not just today's. Sort: overdue tasks first (oldest overdue first), then today's tasks by priority (High → Medium → Low). The tab's badge count reflects this same filter regardless of which tab is currently active.

AI-sourced tasks (`source === 'ai'`, created by the Journal Analysis Wizard, Insights Log, or Workbook AI insights) route here purely by `dueDate` like manual tasks — there's no separate "AI tasks" tab (removed in PROJ-47). They're visually distinguished by a purple sparkle icon and an expandable **AI Context Card**: collapsed shows a one-line `sourceContext` preview; expanded shows the full sentence plus a "See insight →" deep-link (`sourceRef` starting with `workbook:` routes to `/workbooks/{id}`, other values route to `/insights`; a missing `sourceRef` shows "Source no longer available" rather than a broken link).

### Adding a task
Two entry points, both ending in the same `addTask()` call:
1. **Floating `+` FAB** (bottom-right) → opens `TaskFormModal` — full editing (title, category, priority, recurrence, due date).
2. **Quick Capture** — a pull-to-add gesture: pulling down ≥60px while scrolled to the top of the list (native `touchstart`/`touchend` listeners, not a library) opens `QuickCaptureSheet`, a lightweight single-input sheet (title, 3 priority chips defaulting to Medium, 3 date chips defaulting to Today). "More options →" escalates to the full `TaskFormModal`. Disabled on the Log tab.

### Completing a task
- Tap the row's checkbox, or swipe right (≥80px + ≥0.3px/ms velocity, 60px threshold under 360px-wide screens) via `SwipeableTaskRow` (`@use-gesture/react`). Swipe right shows a green reveal layer + checkmark during drag; on threshold, the card animates off and `navigator.vibrate([40])` fires.
- If the task's `dueDate` is strictly in the future (shouldn't normally appear in Today, but can via a recurrence edge case), completion is intercepted by the shared future-task confirmation dialog rather than allowed silently.
- Swipe left instead of right opens the **Forgiveness Tap** bottom sheet ("Let today go" → "Move to Tomorrow" / "Keep for Today") — copy is streak-aware ("Your streak is safe" vs. "Recovery continues tomorrow").

### Rhythm Score
Shown above the list whenever score > 0: `RhythmScoreRing`, computed as `round((completedDays / 14) * 100)` where `completedDays` counts distinct days in the trailing 14 with ≥1 recurring-task completion. Green ≥70, amber 40–69, muted below 40. One missed day out of 14 scores ~93, not 0 — deliberately more forgiving than a raw streak, per the Ned "Pink Cloud Crash" persona note in CLAUDE.md (streak breaks must never feel punishing).

## Data model

See `docs/screens/tasks/README.md` for the full `tasks/{id}` field list. Fields most relevant to this tab: `dueDate`, `priority`, `status`, `source`, `sourceContext`/`sourceRef` (AI tasks), `lastCompletedAt`, `missedCountHistory`.

## Gating & limits

None.

## Known gaps / debt

- Write-contract for `aiMeta` on AI-sourced tasks is inconsistently populated by its three callers (Journal Analysis Wizard passes `sourceContext` only, Insights Log passes `sourceRef` only, Workbook Detail passes both) — not a bug, but relevant if you're adding a fourth caller.

## Related docs

- `docs/screens/tasks/README.md` — shared mechanics (Smart Reset, grace window).
- `docs/screens/tasks/later.md`, `log.md` — the other two lanes.
- `docs/specs/05_TASKS.md` §2, §5–8 (Smart Tabs, Gestures, Quick Capture, Rhythm Score, AI Context Cards).
