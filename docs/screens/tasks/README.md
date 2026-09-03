# Tasks — `/tasks`

**Parent page:** `src/pages/Tasks.tsx` — a single-page shell (not URL-param-driven like Journal; tab state is local `useState`) that filters one shared `tasks` list into three lanes by actionability, plus owns the Add/Edit modal, Quick Capture sheet, and the future-task confirmation dialog shared across lanes.

| Sub-screen | File | What it shows |
|---|---|---|
| Today | [`today.md`](./today.md) | Pending tasks due today or overdue — the default tab, and where Quick Capture/the `+` FAB live |
| Later | [`later.md`](./later.md) | Pending tasks due in the future |
| Log | [`log.md`](./log.md) | Completed tasks, virtualized and grouped by year/month |

**Personas:** Ned (streaks/momentum, but see the Rhythm Score design note in `today.md` — deliberately *not* a punishing streak), Maya (structured routine), David (must stay low-friction — crisis-first design floor, never punitive).

**Tier:** Free. No gating anywhere in this screen — explicit per CLAUDE.md: "core journaling/task tracking must stay free and frictionless."

**Zero-knowledge status:** `tasks/{id}` is entirely unencrypted (CLAUDE.md: "Needed for streak evaluation") — nothing here touches the vault key.

## Shared mechanics (apply across all three tabs)

- **Smart Reset & grace window** — on every background load (`useTasksList` → `getUserTasks()`), overdue recurring tasks not completed within a 2-hour trailing-midnight grace window are silently rolled forward to today with a streak penalty, and the missed-day count is appended to `missedCountHistory`.
- **Forgiveness Tap** — swiping left on a task (any pending-tab row) opens "Let today go" instead of a silent reset, with streak-aware copy.
- **Future-task confirmation** — completing a task due strictly in the future (tap or swipe, from Today or Later) is intercepted by a shared confirmation dialog.
- **Rhythm Score** — a 14-day, non-punishing consistency metric shown above the list on Today/Later (hidden on Log). Computed client-side only, never stored.

Each of these is described in the tab doc where a reader would most naturally encounter it, with a cross-reference back here.

## Related docs

- `docs/specs/05_TASKS.md` — existing spec is thorough and closely matches current code.
- `docs/projects/46_TASK_MODULE_UPGRADE.md`, `47_TASK_RECURRENCE_UPGRADE.md`.
