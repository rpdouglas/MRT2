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

- **Smart Reset & grace window** — live as of 2026-09-03 (`TD-25`). See correction below for history.
- **Forgiveness Tap** — swiping left on a task (any pending-tab row) opens "Let today go" instead of a silent reset, with streak-aware copy. Live — verified in `ForgivenessTapSheet.tsx`/`SwipeableTaskRow.tsx`, independent of Smart Reset.
- **Future-task confirmation** — completing a task due strictly in the future (tap or swipe, from Today or Later) is intercepted by a shared confirmation dialog.
- **Rhythm Score** — a 14-day, non-punishing consistency metric shown above the list on Today/Later (hidden on Log). Computed client-side only, never stored.

Each of these is described in the tab doc where a reader would most naturally encounter it, with a cross-reference back here.

### Correction history: Smart Reset was dead code, now fixed (TD-25)

An earlier pass of this doc found Smart Reset was spec'd (`docs/specs/05_TASKS.md`) and fully implemented in `getUserTasks()` (`src/lib/tasks.ts` — 2-hour trailing-midnight grace window, silent streak reset, `missedCountHistory` append via `arrayUnion`, its own passing unit tests) but **never called by the live app** — `Tasks.tsx` rendered from `useTasksList()`'s plain `onSnapshot` listener instead, with zero reset logic. That was tracked as `TD-25` and **fixed the same day**: the reconciliation logic was extracted into a shared `reconcileOverdueTask()` and wired into `useTasksList()`'s snapshot handler (fire-and-forget, with an in-flight-task-ID guard against double-firing across rapid snapshots), alongside its original `getUserTasks()` caller. 2 new tests in `useTasksList.test.ts` cover the reconciliation firing/not-firing correctly.

**Current (live) behavior:** an overdue recurring task is silently rolled forward within the 2-hour trailing-midnight grace window, exactly as originally spec'd. `reconcileOverdueTask()` does apply a real streak penalty on a miss (resets `currentStreak` to 0, or decrements further if already 0) and appends to `missedCountHistory` — but neither of those is surfaced anywhere in user-facing UI (only visible via the admin-only `DebugTools.tsx`), so a user never sees "Streak: 0" or a negative streak rendered — the no-guilt design intent holds even though the underlying data does track misses.

## Related docs

- `docs/specs/05_TASKS.md` — existing spec is thorough and closely matches current code.
- `docs/projects/46_TASK_MODULE_UPGRADE.md`, `47_TASK_RECURRENCE_UPGRADE.md`.
