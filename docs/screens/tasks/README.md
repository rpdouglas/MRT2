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

- **Smart Reset & grace window — ⚠️ NOT CURRENTLY LIVE, see correction below.**
- **Forgiveness Tap** — swiping left on a task (any pending-tab row) opens "Let today go" instead of a silent reset, with streak-aware copy. This one **is** live — verified in `ForgivenessTapSheet.tsx`/`SwipeableTaskRow.tsx`, independent of the dead code below.
- **Future-task confirmation** — completing a task due strictly in the future (tap or swipe, from Today or Later) is intercepted by a shared confirmation dialog.
- **Rhythm Score** — a 14-day, non-punishing consistency metric shown above the list on Today/Later (hidden on Log). Computed client-side only, never stored.

Each of these is described in the tab doc where a reader would most naturally encounter it, with a cross-reference back here.

### ⚠️ Correction (this pass): Smart Reset is dead code, not a live feature

An earlier version of this doc — following `docs/specs/05_TASKS.md` — described Smart Reset as running "on every background load (`useTasksList` → `getUserTasks()`)." That's wrong, and worth stating plainly: it doesn't run in the live app at all.

- `getUserTasks()` (`src/lib/tasks.ts`) contains exactly the described logic — a 2-hour trailing-midnight grace window, silent streak reset, `missedCountHistory` append via `arrayUnion` — and it's real, correct-looking code with its own passing unit tests (`src/lib/__tests__/tasks.test.ts`).
- But **nothing in the live app calls it.** The actual screen renders from `useTasksList()` (`src/hooks/useTasksList.ts`), a plain `onSnapshot` listener with zero reset logic — confirmed by that hook's own code and, independently, by `useTaskOperations.ts`'s header comment, which states outright that `Tasks.tsx` "renders from `useTasksList.ts`'s own `onSnapshot` subscription... by deliberate design." Grepping `functions/src` for the same logic (in case it moved server-side) turned up nothing either.
- **Practical effect:** an overdue recurring task is never silently rolled forward. It just sits overdue in the Today tab indefinitely — `dueDate` and `currentStreak` are never touched unless the user actively completes or edits it. `missedCountHistory` never gets a new entry from this path (a user editing the task manually is the only other write path, and that doesn't touch this field either).
- **This is a real product bug, not just a stale doc** — worth a ticket independent of anything documentation-related. The intended behavior (silent reset with a grace window, protecting late-night completions) is exactly the kind of anti-punishing design the Ned/Pink-Cloud persona work calls for; right now it simply doesn't fire.

## Related docs

- `docs/specs/05_TASKS.md` — existing spec is thorough and closely matches current code.
- `docs/projects/46_TASK_MODULE_UPGRADE.md`, `47_TASK_RECURRENCE_UPGRADE.md`.
