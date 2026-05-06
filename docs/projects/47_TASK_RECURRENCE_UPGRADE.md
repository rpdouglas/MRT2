# 📋 Project PROJ-47: The Ledger — Precision, Resilience & Tab Redesign

**Status:** ✅ Shipped (2026-05-06)
**Primary Persona:** David (safety anchor) · Ned (engagement driver) · Maya (precision driver)
**Objective:** Redesign the task tab structure from a time-horizon model (This Week / Later) to an actionability model (Today / Later), fix the monthly day-drift bug that causes Feb 28 trapping, add a timezone-aware grace window for David's late-night sessions, and accurately log historical miss data for Maya's pattern analysis — all without breaking the existing Smart Reset or PROJ-46 gesture interactions.

---

## 1. The Executive Summary

**User Stories:**

- **As David** (Day 3, 2 AM, high anxiety), I want a grace window around midnight so that completing my sobriety check-in at 1:55 AM counts for today and doesn't silently break my streak because my timezone reported yesterday's date to the server.
- **As Ned** (Day 45, Pink Cloud), I want to see my daily habits on a Today tab that shows everything I need to do right now — including anything I missed yesterday — so I always know exactly what needs my attention without scanning multiple tabs.
- **As Maya** (8 months sober, analytical), I want my monthly task on the 31st to accurately return to the 31st after shorter months, not drift to the 28th permanently, so my long-term data tracking remains mathematically precise.
- **As Maya**, I want to see how many times I've missed a recurring task over time so I can identify which habits have weak compliance and adjust my programme accordingly.
- **As Ned**, when I complete a recurring habit on the Today tab, I want it to move immediately to the Later tab (with its next due date) so Today only shows what still needs my attention today — not already-done items cluttering the view.

**Competitive Gap:**

Most recovery apps make one of two errors on calendar logic: they are too punitive (breaking streaks instantly at midnight regardless of timezone or grace), or they are mathematically imprecise (monthly tasks drift permanently when months are shorter). No competitor combines the compassionate somatic design MRT established in PROJ-46 with enterprise-grade calendar precision. This update closes both gaps simultaneously while making the task interface immediately intuitive — Today shows what you need to do, Later shows what's coming.

---

## 2. Security & Zero-Knowledge Audit 🛡️

*This section MUST be completed before any code is written.*

- [x] **Data Sensitivity:** Low-medium. This upgrade affects task timing metadata and adds a `missedCountHistory` array. No emotional content is touched. The `tasks` collection remains unencrypted (required for lazy evaluation without vault unlock).
- [x] **Encryption Strategy:** No new encryption required. `originalDayOfMonth` and `missedCountHistory` are operational metadata — not emotional data, not PII. Both fields are correctly stored plaintext on the `tasks` collection, consistent with the existing ZK boundary.
- [x] **Key Rotation:** Not required. Neither new field contains sensitive content that would need inclusion in `executePinRotation` or crypto-shredding.
- [x] **Grace Window:** The grace window is computed entirely client-side using the device's local timezone. No new Firestore fields are written for the grace window itself — it modifies the evaluation window in `getUserTasks()` only.
- [x] **Tab Redesign:** Pure UI change. No schema changes required. The Today/Later split is a client-side filter on the existing `dueDate` field.
- [x] **ZK Boundary Check:** `getUserTasks()` operates on the unencrypted `tasks` collection. The grace window modification, `originalDayOfMonth` write, and `missedCountHistory` append all happen within this boundary. No encrypted collection is touched.

---

## 3. Schema & Architecture 🗄️

*Define the exact Firestore paths and TypeScript interfaces.*

### Firestore Collections Impacted

**`tasks/{taskId}`** — two new optional fields:

| Field | Type | Nullable | Written By | Purpose |
|---|---|---|---|---|
| `originalDayOfMonth` | `number` | Yes | `addTask()` at creation | Stores the intended day (e.g. 31) for monthly tasks so `calculateNextDueDate()` can return to it after shorter months |
| `missedCountHistory` | `number[]` | Yes | `getUserTasks()` lazy evaluation | Each element is the count of days missed in a single lazy-evaluation fetch cycle. Appended, never overwritten. Used by Maya for compliance pattern analysis. |

### Types (`src/lib/db.ts`)

Add to the existing `RecurrenceConfig` interface:

```typescript
export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  dayOfWeek?: number;
  originalDayOfMonth?: number;  // NEW — stores intended day for monthly tasks
                                  // e.g. 31, even when Feb forces it to 28
}
```

Add to the existing `Task` interface:

```typescript
export interface Task {
  // ... all existing fields unchanged ...
  missedCountHistory?: number[];  // NEW — array of missed-day counts per fetch cycle
                                   // e.g. [0, 0, 3, 0, 1] — Maya sees this as compliance data
}
```

### Tab Routing Logic (Client-Side Filter — No Schema Change)

The current four-tab system (This Week / Later / Action Plan / Log) is redesigned to a three-tab system:

| Tab | Filter Condition | What the User Sees |
|---|---|---|
| **Today** | `dueDate <= end of today` AND `status !== 'completed'` (or `source === 'ai'` with same dueDate rule) | All overdue tasks + all tasks due today. The full actionable universe. |
| **Later** | `dueDate > end of today` | Tasks due tomorrow or beyond. Recurring tasks move here immediately on completion. |
| **Log** | `status === 'completed'` AND `!isRecurring` | Completed one-time tasks. Grouped by Year/Month. Unchanged from current behaviour. |

**Action Plan tab removal:** AI tasks (`source === 'ai'`) are no longer routed to a separate tab. They follow the same `dueDate`-based routing as manual tasks. A task with `source === 'ai'` and `dueDate <= today` appears in Today; with `dueDate > today` it appears in Later. The purple sparkle icon and AI Context Card (from PROJ-46) remain — the source indicator is visual, not structural.

### The `calculateNextDueDate()` Fix — Monthly Day Preservation

**Current bug (confirmed in `src/lib/dateUtils.ts` lines 988-1057):**

```typescript
// CURRENT (broken for Feb 28 drift):
case 'monthly': {
  const currentDay = nextDate.getDate();
  nextDate.setMonth(nextDate.getMonth() + 1);
  if (nextDate.getDate() !== currentDay) {
    nextDate.setDate(0); // Sets to last day of previous month — WRONG
                         // Jan 31 + 1 month = Mar 2, setDate(0) = Feb 28
                         // Feb 28 + 1 month = Mar 28 — never returns to 31
  }
  break;
}
```

**Fixed logic — uses `originalDayOfMonth` to remember intent:**

```typescript
// NEW (correct, with originalDayOfMonth):
case 'monthly': {
  const targetDay = config.originalDayOfMonth ?? nextDate.getDate();
  nextDate.setDate(1); // Move to 1st to prevent overflow during month increment
  nextDate.setMonth(nextDate.getMonth() + 1);
  // Clamp to last valid day of the new month
  const daysInNewMonth = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth() + 1,
    0
  ).getDate();
  nextDate.setDate(Math.min(targetDay, daysInNewMonth));
  break;
}
```

**Migration:** Existing monthly tasks without `originalDayOfMonth` fall back gracefully — `config.originalDayOfMonth ?? nextDate.getDate()` — using the current `dayOfMonth` or the task's current due date day. No migration script required. New monthly tasks written by `addTask()` will always include `originalDayOfMonth`.

### The `addTask()` Write — `originalDayOfMonth`

When a monthly task is created, `addTask()` must write `originalDayOfMonth` into the `recurrence` object:

```typescript
// In addTask(), when building the document to write:
const recurrenceToStore: RecurrenceConfig = { ...recurrence };

if (recurrence.type === 'monthly' && startDate) {
  recurrenceToStore.originalDayOfMonth = startDate.getDate();
  // e.g. task created on Jan 31 → originalDayOfMonth = 31
}

await addDoc(collection(db, COLLECTION), {
  // ... existing fields ...
  recurrence: recurrenceToStore,
});
```

### The Grace Window — Timezone-Safe Midnight

**The problem:** David completes his 2 AM sobriety check-in. His device reports the local date correctly, but the `isSameDay()` check in `getUserTasks()` compares against `startOfDay(new Date())` — which, depending on how the Date is handled relative to Firestore Timestamps stored in UTC, can produce an off-by-one error that silently resets his streak.

**The fix — a 2-hour grace window on the trailing edge of the previous day:**

```typescript
// In getUserTasks(), replace the current completedToday check:

// CURRENT:
const completedToday = task.lastCompletedAt && isSameDay(task.lastCompletedAt as Date, today);

// NEW (grace window):
const GRACE_WINDOW_HOURS = 2;
const graceWindowStart = subHours(startOfDay(today), GRACE_WINDOW_HOURS);
// "today" now means: from 10 PM yesterday to now
const completedInWindow = task.lastCompletedAt &&
  isAfter(task.lastCompletedAt as Date, graceWindowStart);
```

This means a user who completes a daily task at 11:58 PM and then the app evaluates at 12:01 AM still has their completion recognised. The window is 2 hours trailing only — not leading. It cannot be used to complete tomorrow's task early.

**Import additions required in `tasks.ts`:** `subHours`, `isAfter` from `date-fns`.

### The `missedCountHistory` Append — Maya's Compliance Data

During the lazy evaluation pass in `getUserTasks()`, when a task is found to be overdue and not completed, the current code resets the streak and advances `dueDate`. PROJ-47 adds a single additional write to append to `missedCountHistory`:

```typescript
// In getUserTasks(), inside the overdue task branch:

// Calculate how many days were actually missed
const daysMissed = differenceInDays(today, task.dueDate as Date);

await updateDoc(taskRef, {
  currentStreak: newStreak,
  dueDate: Timestamp.fromDate(today),
  missedCountHistory: arrayUnion(daysMissed),  // Firestore arrayUnion — append only
});
```

**`arrayUnion` import:** from `firebase/firestore` — already imported in `tasks.ts`. No new imports needed for this change.

**Cost:** One additional field written in the existing `updateDoc` call. Not a new write — it piggybacks on the lazy evaluation write that already fires.

---

## 4. Implementation Phases 🏗️

> **Sprint structure:** All phases ship together in a single sprint. The schema changes are additive and non-breaking. The tab redesign is a UI-only change with no Firestore impact. Total estimated effort: 5–7 engineering days.

---

### Phase 1: Fix `calculateNextDueDate()` — Monthly Day Preservation

**Files:** `src/lib/dateUtils.ts`

**Logic:**
- Update the `monthly` case in `calculateNextDueDate()` to use `config.originalDayOfMonth` as the target day
- Move to the 1st before incrementing the month (prevents overflow)
- Clamp to the last valid day of the new month using `daysInNewMonth`
- No change to any other recurrence type

**Update `addTask()` in `src/lib/tasks.ts`:**
- When `recurrence.type === 'monthly'`, write `originalDayOfMonth: startDate.getDate()` into the stored `recurrence` object
- No change to the existing document structure for non-monthly tasks

**Somatic Check:** This fix is invisible to users — a correction to background math. No UI change, no messaging change.

**Reward:** Not applicable — this is a precision fix.

**Edge Cases:**
- [ ] Task created on Feb 28 with `type: 'monthly'` — `originalDayOfMonth = 28`. In March, correctly schedules for March 28. In April, March 28. No drift. ✅
- [ ] Task created on Jan 31 — `originalDayOfMonth = 31`. Feb clamps to 28 (or 29 in leap year). March returns to 31. April clamps to 30. May returns to 31. ✅
- [ ] Existing monthly tasks without `originalDayOfMonth` — fallback `config.originalDayOfMonth ?? nextDate.getDate()` uses the current due day. No migration needed, no errors. ✅
- [ ] `navigator.onLine` is false — `calculateNextDueDate()` is a pure function with no network dependency. Works offline. ✅
- [ ] `isVaultUnlocked` is false — `tasks` is unencrypted. This fix is independent of vault state. ✅

---

### Phase 2: Grace Window in `getUserTasks()`

**Files:** `src/lib/tasks.ts`

**Logic:**
- Replace `isSameDay(task.lastCompletedAt, today)` with the grace window check `isAfter(task.lastCompletedAt, graceWindowStart)` where `graceWindowStart = subHours(startOfDay(today), 2)`
- Add `subHours`, `isAfter` to the `date-fns` import in `tasks.ts`
- The grace window applies only to the lazy evaluation pass (overdue detection). It does not change how completion timestamps are written or how streaks are calculated.

**Somatic Check:** This change is invisible to users. It prevents a silent, punishing streak reset that David would never understand ("I did it last night, why did my streak break?"). The compassion is in the absence of an unjust penalty.

**Reward:** Streak preservation — the existing XP and streak system benefits automatically.

**Edge Cases:**
- [ ] User completes a task at 11:30 PM, evaluates at 12:15 AM — grace window (10 PM to now) covers 11:30 PM. Streak preserved. ✅
- [ ] User completes a task at 9:45 PM, evaluates at 12:15 AM — 9:45 PM is before 10 PM grace window start. Streak correctly treated as missed. This is correct behaviour — 9:45 PM is well within the previous day's normal window. ✅
- [ ] User deliberately completes a daily task at 11:59 PM intending it for tomorrow — the grace window is trailing only (not leading). The task completion counts for today. Tomorrow's instance is still due. ✅
- [ ] Two timezone boundary crossings in one session — `subHours(startOfDay(today), 2)` is re-evaluated on each `getUserTasks()` call using `new Date()`. Always reflects current local time. ✅
- [ ] `navigator.onLine` is false — grace window is computed locally from device time. No network dependency. ✅
- [ ] `isVaultUnlocked` is false — `tasks` collection is unencrypted. Grace window evaluation works regardless. ✅

---

### Phase 3: `missedCountHistory` Append in Lazy Evaluation

**Files:** `src/lib/tasks.ts`

**Logic:**
- In `getUserTasks()`, inside the overdue branch (after `!completedInWindow` check), compute `daysMissed = differenceInDays(today, task.dueDate as Date)`
- Add `daysMissed` to the existing `updateDoc` call using `arrayUnion(daysMissed)`
- Add `differenceInDays` to `date-fns` import and `arrayUnion` to `firebase/firestore` import in `tasks.ts`
- Also update the local `task` object in memory: `task.missedCountHistory = [...(task.missedCountHistory ?? []), daysMissed]`

**Somatic Check:** `missedCountHistory` is a data field only — it is never displayed to the user in the task list or in any streak/reward UI. It is Maya's analytical data, surfaced only in the Insights module when she explicitly requests pattern analysis. It must never appear as a "failure count" in the primary task UI.

**Reward:** Not applicable in the task list. The data feeds Maya's AI pattern analysis — her reward is the insight, not the data collection itself.

**Edge Cases:**
- [ ] Task overdue by 5 days — `daysMissed = 5`. `arrayUnion(5)` appends 5 to the array. The array now records that this fetch cycle saw 5 missed days. ✅
- [ ] Task overdue by 0 days (due today, evaluated today, not yet completed) — this branch does NOT fire (the condition is `isBefore(task.dueDate, today)`, not `<=`). No append. ✅
- [ ] `missedCountHistory` grows indefinitely — this is intentional for long-term compliance analysis. For a daily task over 1 year with occasional misses, the array would have at most 365 elements (one per lazy evaluation cycle). At ~8 bytes per number, this is ~3KB per task — acceptable for Firestore document limits. ✅
- [ ] `navigator.onLine` is false — `getUserTasks()` requires a Firestore connection. If offline, TanStack Query returns cached data and lazy evaluation does not run. No append occurs offline. This is correct — we can only append an accurate miss when we can confirm the current date from a live query. ✅
- [ ] `isVaultUnlocked` is false — `tasks` collection is unencrypted. Append works regardless. ✅
- [ ] 320px screen — `missedCountHistory` is a data field with no UI rendering in the task list. No layout impact. ✅

---

### Phase 4: Tab Redesign — Today / Later / Log

**Files:** Tasks page component, `useTaskOperations.ts` (optimistic UI update), `src/lib/grouping.ts` (if tab filter logic is extracted there)

**Logic — New Tab Filter:**

```typescript
// src/lib/grouping.ts — add or update task tab filters

const endOfToday = endOfDay(new Date());

export function getTodayTasks(tasks: Task[]): Task[] {
  return tasks.filter(t =>
    t.status !== 'completed' &&                          // Not one-time completed
    t.dueDate &&
    !isAfter(toDate(t.dueDate)!, endOfToday)             // Due today or overdue
  );
}

export function getLaterTasks(tasks: Task[]): Task[] {
  return tasks.filter(t =>
    t.status !== 'completed' &&
    t.dueDate &&
    isAfter(toDate(t.dueDate)!, endOfToday)              // Due tomorrow or beyond
  );
}

export function getLogTasks(tasks: Task[]): Task[] {
  return tasks.filter(t =>
    t.status === 'completed' && !t.isRecurring           // Completed one-time tasks only
  );
}
```

**Optimistic UI on swipe-complete (PROJ-46 gesture integration):**

When `toggleTask({ task, isCompleting: true })` fires for a recurring task, the optimistic update in `useTaskOperations.ts` already calculates `nextDue` from `calculateNextDueDate()`. With the new tab structure, the optimistic update must also move the task from the Today list to the Later list immediately — before the Firestore write resolves.

This happens automatically: the optimistic update sets `dueDate` to `nextDue` (which is always in the future for a correctly-configured recurring task). The `getTodayTasks()` filter then excludes it because `isAfter(nextDue, endOfToday)` is true. No additional optimistic logic is needed — the existing PROJ-46 optimistic update already does the right thing.

**Action Plan tab migration:**

AI tasks (`source === 'ai'`) now appear in Today or Later based on their `dueDate`, alongside manual tasks. The purple sparkle icon and AI Context Card (PROJ-46) continue to visually distinguish them. The label "Action Plan" is removed from the navigation. No data migration required — AI tasks already have `dueDate` values. The only change is the filter that previously routed them to a separate tab.

**Tab labels and ordering:**
- Tab 1: **Today** (default, opens first)
- Tab 2: **Later**
- Tab 3: **Log**

**UI/UX:**

- **Today tab:** Shows overdue tasks first (sorted by oldest `dueDate` ascending), then today's tasks (sorted by priority High → Medium → Low). A subtle amber label "Overdue" appears inline on cards where `dueDate < startOfDay(today)` — never red, never the word "missed" or "failed". Consistent with the PROJ-46 Forgiveness Tap palette.
- **Later tab:** Sorted by `dueDate` ascending (nearest first). Grouped by date label ("Tomorrow", "This Week", "Next Week", "Later") for scannability.
- **Log tab:** Unchanged from current behaviour. Grouped by Year/Month, most recent first.
- **Empty state — Today tab:** If Today is empty, show a single warm message: "You're all caught up. Check back tomorrow." No task count, no streaks, no pressure.
- **Empty state — Later tab:** "Nothing scheduled yet. Tasks you complete today will appear here with their next due date."

**Badge counts:** The Today tab shows a badge with the count of pending Today tasks (including overdue). The Later tab shows no badge. The Log tab shows no badge.

**Somatic Check — David:**
- Overdue tasks appearing in Today (not a separate shame-inducing "overdue" section) is explicitly compassionate design: David sees what needs attention, not a record of failures.
- The amber "Overdue" label is the minimum necessary signal — it helps David understand why a task is showing up without inducing shame.
- The word "overdue" is acceptable here (it is factual, not judgmental). The words "missed", "failed", "broken" are prohibited.

**Somatic Check — Ned:**
- Completing a task on Today and watching it disappear to Later provides the instant visual reward Ned needs. The task list shortening is the reward.
- The Later tab being accessible one tap away prevents the "where did my task go?" confusion.

**Reward:** The tab badge count on Today decreases with each completion — a visible, satisfying progress indicator that requires zero gamification infrastructure beyond what PROJ-46 already ships.

**Edge Cases:**
- [ ] `navigator.onLine` is false — tab filters are client-side computations on TanStack Query cache. Today/Later/Log all work offline using cached task data. ✅
- [ ] `isVaultUnlocked` is false — `tasks` collection is unencrypted. All tab filters work regardless of vault state. ✅
- [ ] 320px screen — three tabs fit at 320px (Today, Later, Log are short labels). Each tab is approximately 106px wide at full width. No truncation needed. ✅
- [ ] Recurring task completed; next due is today (e.g. a task due at 8 AM completed at 9 AM, recurs daily, next due = today end-of-day) — `isAfter(endOfDay(today), endOfToday)` is false. Task remains in Today. This is correct — Ned completed his morning task and there's a new instance due today. The existing PROJ-46 Smart Reset prevents double-completion. ✅
- [ ] One-time task completed — `status === 'completed'` routes it to Log. It disappears from Today immediately via optimistic update. ✅
- [ ] AI task with `dueDate > today` — appears in Later with purple sparkle. ✅
- [ ] AI task with `dueDate <= today` — appears in Today with purple sparkle and AI Context Card. ✅
- [ ] All tasks completed (Today is empty) — empty state message renders. No layout breaks. ✅

---

## 5. QA & Verification 🧪

### Unit Tests — `src/lib/__tests__/dateUtils.test.ts` (expand existing)

```typescript
// Add to the existing calculateNextDueDate describe block:

it('monthly: Jan 31 with originalDayOfMonth=31 → Feb 28 (clamp) → Mar 31 (restore)', () => {
  const jan31 = new Date(2026, 0, 31); // Jan 31
  const config: RecurrenceConfig = { type: 'monthly', originalDayOfMonth: 31 };

  const feb = calculateNextDueDate(jan31, config);
  expect(feb!.getDate()).toBe(28); // Feb 2026 has 28 days

  const mar = calculateNextDueDate(feb!, config);
  expect(mar!.getDate()).toBe(31); // March has 31 — restores to original
});

it('monthly: Feb 28 drift fix — does not stay on 28 in March', () => {
  const feb28 = new Date(2026, 1, 28); // Feb 28
  const config: RecurrenceConfig = { type: 'monthly', originalDayOfMonth: 31 };
  const mar = calculateNextDueDate(feb28, config);
  expect(mar!.getDate()).toBe(31); // Must restore, not stay at 28
});

it('monthly: no originalDayOfMonth → falls back to current date day', () => {
  const jan15 = new Date(2026, 0, 15);
  const config: RecurrenceConfig = { type: 'monthly' };
  const feb = calculateNextDueDate(jan15, config);
  expect(feb!.getDate()).toBe(15); // No drift, no originalDayOfMonth needed
});

it('monthly: leap year Feb 29 → Mar 29 (exact) → Apr 29 (exact)', () => {
  const feb29 = new Date(2028, 1, 29); // 2028 is a leap year
  const config: RecurrenceConfig = { type: 'monthly', originalDayOfMonth: 29 };
  const mar = calculateNextDueDate(feb29, config);
  expect(mar!.getDate()).toBe(29);
  const apr = calculateNextDueDate(mar!, config);
  expect(apr!.getDate()).toBe(29);
});
```

### Unit Tests — `src/lib/__tests__/tasks.test.ts` (expand existing)

```typescript
it('grace window: task completed at 11:30 PM yesterday evaluates as completed today', async () => {
  const yesterday1130pm = subHours(startOfDay(new Date()), 0.5); // 11:30 PM yesterday
  // Mock task with lastCompletedAt = yesterday 11:30 PM, dueDate = yesterday
  // Assert: getUserTasks() does NOT reset streak
  // Assert: updateDoc is NOT called for this task
});

it('grace window: task completed at 9:45 PM yesterday is correctly missed', async () => {
  const yesterday945pm = subHours(startOfDay(new Date()), 2.25); // Before grace window
  // Assert: getUserTasks() DOES reset streak (outside the 2-hour grace window)
});

it('missedCountHistory: overdue by 3 days appends 3 to array', async () => {
  // Mock task with dueDate = 3 days ago, missedCountHistory = [1]
  // Assert: after getUserTasks(), missedCountHistory = [1, 3]
  // Assert: arrayUnion was called with 3
});

it('missedCountHistory: task due today (not yet past) does not append', async () => {
  // Mock task with dueDate = today, not yet completed
  // Assert: missedCountHistory unchanged (overdue branch does not fire)
});

it('addTask: monthly task writes originalDayOfMonth from startDate', async () => {
  const jan31 = new Date(2026, 0, 31);
  await addTask(uid, 'Monthly task', { type: 'monthly' }, 'Medium', jan31);
  // Assert: Firestore document has recurrence.originalDayOfMonth === 31
});
```

### Unit Tests — Tab Filter Logic (new file or expand `grouping.test.ts`)

```typescript
it('getTodayTasks: includes task due yesterday (overdue)', () => { ... });
it('getTodayTasks: includes task due today', () => { ... });
it('getTodayTasks: excludes task due tomorrow', () => { ... });
it('getTodayTasks: excludes completed one-time task', () => { ... });
it('getTodayTasks: includes AI task due today', () => { ... });
it('getLaterTasks: includes task due tomorrow', () => { ... });
it('getLaterTasks: excludes overdue task', () => { ... });
it('getLaterTasks: includes AI task due next week', () => { ... });
it('getLogTasks: includes completed one-time tasks only', () => { ... });
it('getLogTasks: excludes completed recurring tasks', () => { ... });
```

### Integration Tests — Swipe Complete → Tab Move (PROJ-46 regression)

- [ ] Swipe-right completes a recurring daily task due today → task disappears from Today → task appears in Later with tomorrow's date
- [ ] Swipe-right completes a recurring weekly task → task appears in Later with date 7 days from now
- [ ] Swipe-right completes a recurring monthly Jan 31 task → task appears in Later with correct date (Feb 28, not March 2)
- [ ] Swipe-left (Forgiveness Tap → "Move to Tomorrow") on a Today task → task moves to Later with tomorrow's date → Today count badge decrements

### The Subway Test (Offline Resilience)
- [ ] All three tabs render correctly from TanStack cache when `navigator.onLine` is false
- [ ] Swipe-right completion fires optimistic update — Today count decrements, task appears in Later — before Firestore write resolves
- [ ] Grace window computed from local device time — works offline without server clock

### The "Lost PIN" Test (Crypto-Shredding)
- [ ] `originalDayOfMonth` and `missedCountHistory` are plaintext fields on the unencrypted `tasks` collection — confirm they are NOT included in `executePinRotation` (they should be deleted as part of the task document deletion, not re-encrypted)
- [ ] After PIN reset and crypto-shred, task documents are deleted — both new fields are gone. ✅

### Persona-Specific QA

- [ ] **David Safety Test:** In Today tab with 2 overdue tasks, confirm: no red text, no "missed" or "failed" language, amber "Overdue" label only. Confirm swipe-left (Forgiveness Tap) still available on overdue tasks in Today tab.
- [ ] **David Grace Window Test:** Simulate `lastCompletedAt` set to 11:45 PM local time (last night). Evaluate `getUserTasks()` at 12:10 AM. Confirm streak NOT reset. Confirm updateDoc NOT called.
- [ ] **Ned Today-to-Later Test:** Complete a recurring task on the Today tab. Confirm it disappears from Today within 200ms (optimistic update). Confirm it appears in Later with the correct next due date. Confirm Today badge count decrements.
- [ ] **Maya Monthly Precision Test:** Create a monthly task on Jan 31. Advance date to Feb 28 (simulate). Confirm `calculateNextDueDate()` returns Feb 28. Advance to Mar 1. Confirm next due is Mar 31, not Mar 28.
- [ ] **Maya `missedCountHistory` Test:** Let a daily task be overdue for 2 days. Run `getUserTasks()`. Confirm `missedCountHistory` has one new element with value 2.
- [ ] **AI Task Routing Test:** Create an AI task (`source: 'ai'`) with `dueDate: today`. Confirm it appears in Today tab with purple sparkle. Complete it (swipe-right). Confirm it moves to Later with next due date.

### Regression Tests (Must Not Break PROJ-46 Behaviour)

- [ ] Swipe-right gesture still fires on Today tab tasks ✓
- [ ] Forgiveness Tap (swipe-left) still fires on Today tab tasks ✓
- [ ] Pull-to-add Quick Capture still adds tasks to Today tab when due date is today ✓
- [ ] Rhythm Score computation unchanged (`computeRhythmScore` in `rhythmScore.ts` reads `lastCompletedAt` — unaffected by tab restructure) ✓
- [ ] AI Context Cards still render on AI tasks in both Today and Later tabs ✓
- [ ] XP award still fires on task completion in Today tab ✓
- [ ] `npm run check` — zero TypeScript errors ✓
- [ ] `npm run build` — clean build ✓

---

## 6. Open Questions

*Resolve before Sprint 1 begins.*

| # | Question | Options | Status |
|---|---|---|---|
| 1 | **Grace window duration** | (a) 2 hours — proposed in this spec · (b) 1 hour · (c) Configurable by user in settings | ❓ Unresolved — recommend option (a) as a non-configurable default. Configurable adds settings complexity without meaningful benefit for most users. |
| 2 | **Overdue label wording** | (a) "Overdue" (amber) · (b) "From yesterday" · (c) No label at all — just sorted to top | ❓ Unresolved — recommend option (b) "From yesterday" for tasks 1 day late, "Overdue" for 2+ days. More compassionate for David. |
| 3 | **Action Plan tab removal — existing deep links** | Any in-app deep links or onboarding flows that reference the Action Plan tab must be updated | ❓ Audit needed — check onboarding screens, the Workbook Compass "add to Action Plan" CTA, and the Journal Analysis Wizard before removing the tab. |
| 4 | **`missedCountHistory` display in Insights** | At what milestone does Maya see this data? | ❓ Out of scope for this spec — surfacing in Insights is a separate feature. Data collection starts now; display is PROJ-48+. |

---

## 7. Out of Scope

- Natural language parsing for Quick Capture (planned for a future Gemini-NLP enhancement)
- `missedCountHistory` display in the Insights module — data is collected here, surfaced elsewhere
- Timezone-aware server-side evaluation — the grace window is a client-side fix only. Server-side time normalisation is a Wave 4 concern
- Morning Pledge ritual — separate spec (Approach 3 from PROJ-46 analysis)
- Weekly-relative recurrence types (e.g. "every other Tuesday") — existing `weekly` type covers this; no changes needed
- Any changes to the `Log` tab structure or grouping

---

## 8. Definition of Done

- [ ] `calculateNextDueDate()` monthly case correctly restores to `originalDayOfMonth` after short months
- [ ] All new `calculateNextDueDate` unit tests passing (Jan 31 → Feb 28 → Mar 31, leap year Feb 29)
- [ ] `addTask()` writes `originalDayOfMonth` for all new monthly tasks
- [ ] Grace window in `getUserTasks()` uses `subHours(startOfDay(today), 2)` — confirmed via unit test
- [ ] `missedCountHistory` appends correctly in lazy evaluation — confirmed via unit test
- [ ] Today tab shows all overdue + today tasks; Later tab shows tomorrow+ tasks; Log tab unchanged
- [ ] AI tasks route to Today or Later by `dueDate` — Action Plan tab removed
- [ ] Completing a recurring task in Today moves it to Later immediately (optimistic update)
- [ ] Amber "Overdue" label on overdue tasks — no red, no "missed", no "failed" language
- [ ] PROJ-46 regression tests all passing (swipe gestures, Forgiveness Tap, Quick Capture, Rhythm Score, AI Context Cards)
- [ ] Open Question 3 resolved — all Action Plan deep links updated before tab is removed
- [ ] `npm run check` — zero TypeScript errors
- [ ] `npm run build` — clean build
- [ ] All persona-specific QA tests passing

---

*MRT · PROJ-47 The Ledger — Precision, Resilience & Tab Redesign · v1.0 · May 2026 · Status: ✅ Shipped*