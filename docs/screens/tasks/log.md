# Tasks → Log — `/tasks?` (tab: Log)

**Source:** `src/pages/Tasks.tsx` (Log data-transform + rendering) + `lib/grouping.ts` (`groupItemsByYearAndMonth`), `react-virtuoso`

## What it does

A completed-task history, grouped by year and month, mirroring the pattern used in Journal's History tab. No badge, no gestures — a read-mostly archive.

## How it works

### What counts as "in the log"
Tasks where `status === 'completed'` (one-time tasks that are permanently done), **plus** any recurring task whose `lastCompletedAt` is today (so a daily habit shows in today's log entry even though its `status` stays active for the next occurrence).

### Grouping & virtualization
`historyFlatData` builds a flat list for `Virtuoso`: year headers → month headers → task rows, using each task's `lastCompletedAt` (falling back to `createdAt`) as the grouping date. Years/months default to collapsed except the current year/month, tracked in `expandedYears`/`expandedMonths` `Set` state, toggled by tapping the header rows (which show a count badge and a chevron).

### Row rendering
Uses plain `TaskRow` (not `SwipeableTaskRow`) with `isLogView={true}` — **gestures are disabled entirely in this tab** (swipe-to-complete/Forgiveness-Tap don't make sense for something already completed). Edit and delete remain available via tap.

## Data model

Same `tasks/{id}` schema as the other tabs — this tab is a filtered/re-sorted view of the same collection, not a separate one.

## Gating & limits

None.

## Known gaps / debt

None specific to this tab.

## Related docs

- `docs/screens/tasks/README.md` — shared mechanics.
- `docs/screens/journal/history.md` — the equivalent grouped/virtualized pattern on the Journal side.
