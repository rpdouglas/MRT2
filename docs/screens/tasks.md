# Tasks — `/tasks`

**Source:** `src/pages/Tasks.tsx` + `hooks/useTaskOperations.ts`, `hooks/useTasksList.ts`, `lib/rhythmScore.ts`, `lib/grouping.ts`, `components/tasks/{TaskRow,SwipeableTaskRow,QuickCaptureSheet,RhythmScoreRing,TaskFormModal}.tsx`
**Personas:** Ned (streaks/gamification — but see Rhythm Score design note below), Maya (structured routine), David (needs this to stay low-friction — no punitive streak-break UX)
**Tier:** Free. No gating anywhere on this screen.
**Zero-knowledge status:** `tasks/{id}` is entirely unencrypted (per CLAUDE.md's schema table — needed server-side for streak/reset evaluation). Nothing on this screen touches the vault key.

## What it does

Manages one-time tasks and recurring habits ("Tasks", rebranded from "Quests"). Three tabs by actionability, not by category: **Today** (due today or overdue), **Later** (due in the future), **Log** (completed history, grouped by year/month). A 14-day "Rhythm Score" ring summarizes recent consistency without using a punishing streak metric.

## How it works

### Tab routing logic
- **Today:** pending tasks where `dueDate <= startOfDay(now)`, sorted overdue-oldest-first then by priority (High→Medium→Low). Badge shows this count regardless of active tab.
- **Later:** pending tasks where `dueDate > startOfDay(now)`, sorted by `dueDate` ascending.
- **Log:** tasks with `status === 'completed'`, plus any recurring task completed today (`lastCompletedAt` is today). Rendered via a virtualized (`react-virtuoso`), collapsible year→month tree (`groupItemsByYearAndMonth`), state kept in `expandedYears`/`expandedMonths` Sets.

AI-sourced tasks (`source === 'ai'`) have no dedicated tab (removed in PROJ-47) — they route into Today/Later purely by `dueDate` like manual tasks, distinguished visually by a purple sparkle icon and an expandable "AI Context Card" (`sourceContext` + a `sourceRef` deep-link to the originating workbook or insight).

### Smart Reset & grace window
On background load (`useTasksList` → `getUserTasks()`), overdue recurring tasks not completed within a grace window are silently rolled forward to today with a streak penalty — this runs on every load. The grace window is 2 hours trailing midnight (`subHours(startOfDay(today), 2)`), so a task finished at 11:45 PM still counts as "completed today" rather than triggering a false reset. Each Smart Reset appends the missed-day count to `missedCountHistory` via `arrayUnion`, piggybacked on the existing update (no extra write).

### Forgiveness Tap
Swiping left on a task opens a bottom sheet ("Let today go" → "Move to Tomorrow" / "Keep for Today") instead of a silent reset — same underlying write as Smart Reset, but explicit and streak-aware in its copy ("Your streak is safe" vs. "Recovery continues tomorrow"). This is the deliberate anti-punitive design the Ned persona note in CLAUDE.md calls for.

### Gestures (`SwipeableTaskRow`, `@use-gesture/react`)
- Swipe right (≥80px, ≥0.3px/ms, 60px threshold under 360px screens): completes the task, green reveal layer, `navigator.vibrate([40])`.
- Swipe left: opens Forgiveness Tap sheet (doesn't complete).
- Direction-locked (`axis: 'x'`, 10px threshold) so vertical scroll isn't hijacked.
- Disabled entirely in the Log tab.

### Quick Capture
Pull-to-add gesture (native `touchstart`/`touchend` listeners on the list container, not a library) when scrolled to top and pulled ≥60px, on non-Log tabs. Opens a lightweight sheet (title + 3 priority chips + 3 date chips) rather than the full `TaskFormModal`; "More options" escalates to the full modal. The floating `+` FAB always opens the full modal directly.

### Future-task safety
Completing a task whose `dueDate` is strictly in the future (via tap or swipe) is intercepted by a confirmation dialog ("Complete Future Task?") rather than silently allowed.

### Rhythm Score
Computed client-side only, **never stored in Firestore**: `round((completedDays / 14) * 100)`, where `completedDays` counts distinct days in the trailing 14 with at least one recurring-task completion. One missed day out of 14 scores ~93, not 0 — explicitly more forgiving than a streak. Shown via `RhythmScoreRing` above the list (green ≥70, amber 40–69, muted below 40; hidden entirely at 0).

## Data model

| Field (on `tasks/{id}`) | Type | Purpose |
|---|---|---|
| `source` | `'manual' \| 'ai' \| 'anchor_intent'` | Drives tab routing and the AI context card |
| `category` / `priority` | string | `Recovery/Health/Work/Life`, `High/Medium/Low` |
| `dueDate` | Timestamp | Next scheduled deadline |
| `recurrence` | Map | Full `RecurrenceConfig`, incl. `originalDayOfMonth` for month-length-safe recurrence |
| `lastCompletedAt` | Timestamp \| null | Drives Rhythm Score + Smart Reset |
| `currentStreak` | number | Cumulative consecutive completions |
| `sourceContext` / `sourceRef` | string? | AI-task explanation + deep-link (only when `source === 'ai'`) |
| `missedCountHistory` | number[]? | Append-only, one entry per Smart Reset evaluation |

The whole collection is plaintext (CLAUDE.md: `tasks/{id}` — "Needed for streak evaluation").

## Gating & limits

None. Tasks is explicitly kept free and low-friction — consistent with the crisis-first design floor (CLAUDE.md: "Never gate crisis/safety features... core journaling/task tracking must stay free and frictionless").

## Known gaps / debt

None currently flagged in CLAUDE.md for this screen specifically. The write-contract for AI-sourced tasks (`aiMeta: { sourceContext, sourceRef }`) is inconsistently populated by its three callers (`JournalAnalysisWizard` passes `sourceContext` only, `InsightsLog` passes `sourceRef` only, `WorkbookDetail` passes both) — not a bug, but worth knowing before extending a fourth caller.

## Related docs

- `docs/specs/05_TASKS.md` — existing spec is thorough and closely matches current code; this doc is a condensed cross-check, not a correction.
- `docs/projects/46_TASK_MODULE_UPGRADE.md`, `47_TASK_RECURRENCE_UPGRADE.md` — the gesture/Quick-Capture/Rhythm-Score work and the grace-window/recurrence fixes, respectively.
