# Tasks → Later — `/tasks?` (tab: Later)

**Source:** `src/pages/Tasks.tsx` (Later filter/sort logic) + shared components with the Today tab (`SwipeableTaskRow`, `TaskRow`)

## What it does

Everything pending that isn't actionable yet — tasks scheduled for tomorrow or beyond. Exists to keep Today uncluttered without losing visibility of what's coming.

## How it works

### Filter & sort
Pending tasks where `startOfDay(dueDate) > startOfDay(today)`, sorted by `dueDate` ascending (soonest first). No badge count on this tab (only Today shows a badge).

AI-sourced tasks route here the same way as Today — purely by `dueDate`, with the same purple-sparkle + AI Context Card treatment.

### Interactions
Identical gesture set to Today: swipe right to complete (via `SwipeableTaskRow`), swipe left for Forgiveness Tap, tap-to-edit, tap checkbox to complete. Because everything in this tab is future-dated by definition, completing a task here **always** triggers the shared future-task confirmation dialog ("Complete Future Task? This task isn't scheduled until later...") — there's no such thing as an un-intercepted completion on this tab.

### Rhythm Score
Same ring/formula as Today — it's a single 14-day metric shared across both non-Log tabs, not tab-specific.

### Empty state
"All Clear" / "Nothing scheduled yet. Tasks you complete today will appear here with their next due date." — a hint that recurring tasks reappear here immediately after completion, with their next occurrence's due date.

## Data model

Same `tasks/{id}` schema as Today — see `docs/screens/tasks/README.md`.

## Gating & limits

None.

## Known gaps / debt

None specific to this tab beyond what's noted in `today.md`.

## Related docs

- `docs/screens/tasks/README.md` — shared mechanics.
- `docs/screens/tasks/today.md` — the future-task confirmation dialog is described there in full; this tab is where it fires unconditionally.
