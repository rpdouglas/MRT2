# 📋 Project PROJ-46: The Ledger — Frictionless Task Module Upgrade

**Status:** ✅ Shipped (2026-05-05 · commits 69d45f4, 5972211 on `feature/task_update`)
**Primary Persona:** Ned (engagement driver) · David (safety anchor) · All five personas benefit
**Objective:** Reduce task completion to a single swipe gesture, surface AI Action Plan tasks in context rather than a ghost tab, and replace the silent Smart Reset with a psychologically safe Forgiveness Tap — all without any breaking schema changes.

---

## 1. The Executive Summary

**User Stories:**

- **As Ned** (30-90 days, Pink Cloud), I want to complete today's habits with a satisfying swipe so that each completion feels like a win, not a checkbox click — and I want to see a Rhythm Score that doesn't punish me for one missed day the way a streak counter does.
- **As David** (Day 1-30, acute crisis), I want to swipe past a task I can't face today and see it move without shame language so that I don't spiral into failure thinking when recovery is already hard enough.
- **As Maya** (analytical, 6-18 months), I want to see the Workbook insight that generated an AI task inline on the task card so that I understand *why* I'm being asked to do this action before I commit to it.
- **As Lisa** (sponsor, 7+ years), I want to add a task in one line of text rather than navigating a modal so that I can capture a sponsee action item in the 30 seconds I have between meetings.
- **As Walt** (long-term, analytical), I want to see a Rhythm Score that reflects my actual consistency over 14 days so that one busy week doesn't erase months of disciplined practice from my view of myself.

**Competitive Gap:**
Every task app with a rating above 4.5 stars uses swipe-to-complete as a primary interaction (Things 3, Todoist, Gmail). MRT currently requires tap-find-tap-wait for the same action. The Rhythm Score directly addresses the brittle streak counter problem that causes Ned-cohort churn at Day 90 — no competitor in the recovery space has implemented consistency-based scoring. The AI Action Plan context card makes the Workbook-to-action pipeline visible and traceable, which no recovery app currently does.

---

## 2. Security & Zero-Knowledge Audit 🛡️

- [x] **Data Sensitivity:** This upgrade adds two new fields to `tasks` documents: `sourceContext` (string — a brief AI-generated summary) and `sourceRef` (string — a reference ID to a workbook answer or journal entry). Neither field contains user-generated PII or emotional content. `sourceContext` is a one-sentence AI summary of the *type* of insight (e.g., "From your Step 4 workbook — isolation identified as a recurring trigger"). `sourceRef` is a document ID, not content.
- [x] **Rhythm Score:** Computed entirely client-side from existing `tasks` query data using a 14-day rolling window. No new Firestore writes. No new fields on any document. The score is derived, not stored.
- [x] **Encryption Strategy:** No new encryption required. `tasks` collection is already unencrypted plaintext (required for streak evaluation per the ZK architecture). `sourceContext` and `sourceRef` are metadata — not emotional content — and correctly remain unencrypted.
- [x] **Key Rotation:** No new fields require inclusion in `executePinRotation`. The two new task fields are metadata, not vault content.
- [x] **Forgiveness Tap:** Pure UI change to the existing Smart Reset flow. No schema change. The same `updateDoc` call that previously fired silently now fires after user interaction. The Firestore write is identical.
- [x] **Pull-to-Add Quick Capture:** Creates a standard task document with the same schema as the existing `addTask()` function. No new fields, no new permissions.

**ZK Boundary Assessment:** ✅ Unchanged. All five changes in this spec are either pure UI modifications or additive metadata fields on the already-plaintext `tasks` collection. No encrypted collection is touched. No vault content is read or written.

---

## 3. Schema & Architecture 🗄️

### Firestore Collections Impacted

**`tasks/{taskId}`** — two new optional fields added:

| Field | Type | Nullable | Description |
|---|---|---|---|
| `sourceContext` | `string` | Yes | One-sentence AI summary of the insight that generated this task. Only present when `source == 'ai'`. Written by the Workbook Compass or Journal Analysis Wizard at task creation time. Example: `"From your Step 4 workbook — you identified isolation as a trigger 3 times this week."` |
| `sourceRef` | `string` | Yes | Document ID of the workbook answer or journal entry that generated this task. Used to deep-link back to the source. Only present when `source == 'ai'`. |

**No other collections are modified.** No new collections are created.

### Types (`src/lib/db.ts`)

Add to the existing `Task` interface:

```typescript
// Add to existing Task interface in src/lib/db.ts
interface Task {
  // ... all existing fields unchanged ...

  // New optional fields — only present on AI-generated tasks (source === 'ai')
  sourceContext?: string;    // One-sentence insight summary — plaintext, not sensitive
  sourceRef?: string;        // Reference doc ID for deep-link back to source workbook/journal
}
```

### Rhythm Score — Client-Side Computed Type

The Rhythm Score is **not stored in Firestore**. It is computed on the client from the existing task query data. Define the computation contract:

```typescript
// src/lib/rhythmScore.ts — new utility file

/**
 * Computes a 0–100 Rhythm Score from the last 14 days of task completion history.
 *
 * Rhythm is MORE forgiving than a streak:
 * - A 14-day perfect record = 100
 * - One missed day out of 14 = ~93 (not zero)
 * - A missed week = ~50 (still reflects real effort)
 *
 * Formula: (completedDays / 14) * 100, where completedDays = number of days in
 * the last 14 where at least one recurring task was completed.
 */
export function computeRhythmScore(tasks: Task[]): number {
  const today = startOfDay(new Date());
  const windowStart = subDays(today, 13); // 14-day window inclusive of today

  const completedDays = new Set<string>();

  for (const task of tasks) {
    if (!task.isRecurring) continue;
    if (!task.lastCompletedAt) continue;

    const completedDate = toDate(task.lastCompletedAt);
    if (!completedDate) continue;
    if (isBefore(completedDate, windowStart)) continue;

    // Record this day as a day with at least one completion
    completedDays.add(format(startOfDay(completedDate), 'yyyy-MM-dd'));
  }

  return Math.round((completedDays.size / 14) * 100);
}
```

### Workbook Compass / Journal Wizard — Write Contract Update

When the AI generates a task (i.e., when calling `addTask()` with `source: 'ai'`), the calling code in the Workbook Compass and Journal Analysis Wizard must now also pass `sourceContext` and `sourceRef`:

```typescript
// Updated call signature — addTask() is unchanged; callers pass additional fields
await TaskLib.addTask(
  user.uid,
  title,
  recurrence,
  priority,
  dueDate,
  'ai',               // source
  {                   // new optional metadata param — addTask() passes through to Firestore
    sourceContext: "From your Step 4 workbook — you identified isolation as a trigger.",
    sourceRef: workbookAnswerId,  // or journalEntryId
  }
);
```

Update `addTask()` in `src/lib/tasks.ts` to accept and pass through this optional metadata:

```typescript
export async function addTask(
  uid: string,
  title: string,
  recurrence: RecurrenceConfig,
  priority: Priority,
  startDate: Date,
  source: 'manual' | 'ai' = 'manual',
  aiMeta?: { sourceContext?: string; sourceRef?: string }  // NEW — optional
) {
  // ... existing logic unchanged ...
  await addDoc(collection(db, COLLECTION), {
    // ... all existing fields ...
    ...(aiMeta?.sourceContext && { sourceContext: aiMeta.sourceContext }),
    ...(aiMeta?.sourceRef && { sourceRef: aiMeta.sourceRef }),
  });
}
```

---

## 4. Implementation Phases 🏗️

> **Sprint 1 (4–6 engineering days, zero schema changes):**
> Phase 1 (Swipe Gestures) + Phase 2 (Pull-to-Add) + Phase 3 (Forgiveness Tap)
>
> **Sprint 2 (3–4 engineering days, 2 new fields):**
> Phase 4 (AI Context Cards + Rhythm Score)
>
> Ship Sprint 1 independently. Sprint 2 depends on Sprint 1 but not vice versa.

---

### Phase 1: Swipe Gesture Interactions

**Logic & State:**
- Add touch event handlers to `TaskRow.tsx` for horizontal swipe detection.
- Swipe threshold: minimum 80px horizontal delta + velocity > 0.3px/ms before triggering. This prevents accidental swipes during vertical scroll.
- Swipe right (≥80px delta): calls `toggleTask({ task, isCompleting: true })` — existing mutation, no change.
- Swipe left (≥80px delta): calls the updated Smart Reset / Forgiveness Tap (Phase 3).
- During swipe: translate the card horizontally using CSS `transform: translateX()`. Show a green reveal layer (right swipe) or amber reveal layer (left swipe) beneath the card as it slides.
- On release below threshold: spring the card back to position (CSS transition: `transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)`).
- No new React Query hooks. No Firestore rule changes.

**UI/UX:**
- **Swipe Right — Complete:**
  - Green reveal layer shows a checkmark icon as the card slides right.
  - On threshold met: card slides fully off screen to the right, then the task disappears from the list with a height-collapse animation (200ms).
  - Haptic: `navigator.vibrate([40])` — single short pulse on completion.
  - Streak counter increments with a pop animation (`transform: scale(1.3) → 1.0`, 150ms).
  - XP award toast appears for 1.5 seconds (same as existing completion flow, now triggered by gesture).

- **Swipe Left — Skip Today (leads to Phase 3 Forgiveness Tap):**
  - Amber reveal layer shows a forward-arrow icon as the card slides left.
  - On threshold met: card snaps back to position (does not slide off screen — user must confirm via the Forgiveness Tap overlay).

- **Somatic Check:** The green/amber colour coding is deliberate — green = positive action, amber = compassionate deferral. Never red. The swipe-left amber matches the Service Module's warmth-and-connection palette and carries the same psychological intent: no shame, just tomorrow.

- **Reward:** Swipe-right completion triggers the same XP award as the existing toggle — no change to the XP economy. The satisfaction comes from the gesture itself, not additional points.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Swipe-complete fires the optimistic UI update immediately (existing behaviour via React Query `onMutate`). The Firestore write queues. Task card disappears optimistically. Behaviour is unchanged from tap-to-complete.
- [ ] `isVaultUnlocked` is false → `tasks` collection is unencrypted; swipe gestures work regardless of vault state.
- [ ] 320px screen (iPhone SE) → Swipe threshold reduced to 60px delta on narrow screens. Reveal layer still shows icon. Card still animates correctly.
- [ ] Simultaneous vertical scroll and horizontal swipe → Detect primary gesture direction in the first 10px of movement. If vertical-primary: pass event to scroll handler. If horizontal-primary: lock to swipe handler. Standard iOS/Android touch handling pattern.

---

### Phase 2: Pull-to-Add Quick Capture

**Logic & State:**
- Pull-down gesture on the task list container (≥60px vertical pull from top of list when already scrolled to top) reveals the Quick Capture input.
- Quick Capture renders as a bottom sheet that slides up from the bottom of the screen — more accessible than a top-anchored pull (avoids status bar interference on iOS).
- The gesture triggers the bottom sheet; the pull itself is the affordance, not the entry point.
- On submit (Enter key / "Add" button): calls existing `addTask()` with `source: 'manual'`, `dueDate: today`, `priority: 'Medium'` as defaults. User can edit all fields from the full TaskFormModal if needed.
- No new React Query hooks. No schema changes.

**UI/UX:**
- Quick Capture input: single text field, full width, auto-focused on sheet open.
- Placeholder: `"Add a recovery task for today…"` — recovery-framed language, not productivity-framed.
- Below the input: three tap targets for quick priority setting (🔴 High · 🟡 Medium · 🟢 Low). Default: Medium pre-selected.
- Below priority: due date shortcut chips: `Today` (pre-selected) · `Tomorrow` · `This week` — tap to change. No date picker on quick capture; full date picker accessible via `More options →` link that opens TaskFormModal.
- Submit button: `"Add to Today"` — specific and recovery-anchored, not generic "Save".
- On submit: sheet dismisses, task appears at top of the This Week list with a brief highlight pulse (200ms, cyan).
- FAB (`+` button) remains — it opens TaskFormModal directly for users who prefer it. Pull-to-add is an additive interaction, not a replacement.

- **Somatic Check:** The Quick Capture sheet must close cleanly if the user pulls it down again or taps outside — no sticky modals. Escape routes are always present.
- **Reward:** The task appears immediately in the list (optimistic UI). The user sees their addition without waiting for Firestore confirmation.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Quick Capture still works; `addTask()` optimistic UI adds to cache immediately, queues Firestore write.
- [ ] `isVaultUnlocked` is false → Tasks are unencrypted; Quick Capture works regardless of vault state.
- [ ] 320px screen → Bottom sheet occupies 85vh, input and priority chips stack vertically. Full keyboard-visible layout tested.
- [ ] Pull gesture conflicts with browser pull-to-refresh → Use `touch-action: pan-y` and detect the list's `scrollTop === 0` before activating the sheet trigger. Disable browser pull-to-refresh on the tasks page (already done in PWA manifest).

---

### Phase 3: Forgiveness Tap (Smart Reset Replacement)

**Logic & State:**
- The existing `getUserTasks()` function in `src/lib/tasks.ts` currently performs a silent Smart Reset: when a recurring task's `dueDate` is in the past and it was not completed today, it silently updates `dueDate` to today and adjusts `currentStreak`.
- **This silent behaviour is preserved for the background load** — it still runs on `getUserTasks()` so that David never sees a pile of overdue tasks from last week.
- **The Forgiveness Tap adds a UI layer for the swipe-left interaction only.** When a user actively swipes left on a task (choosing to skip today), instead of the silent update firing immediately:
  1. The amber swipe reveal layer is shown.
  2. A bottom sheet slides up with the Forgiveness Tap UI.
  3. User confirms → silent Smart Reset fires.
  4. User dismisses → task snaps back to position, no changes made.

**The Forgiveness Tap bottom sheet content:**

```
┌─────────────────────────────────────┐
│  🍂  Let today go                   │
│                                     │
│  "Morning Meditation" will be       │
│  waiting for you tomorrow.          │
│  Your streak is safe — this is      │
│  just one day.                      │
│                                     │
│  [  Move to Tomorrow  ]  ← primary  │
│  [  Keep for Today    ]  ← ghost    │
└─────────────────────────────────────┘
```

- **Language notes:** "Let today go" is tested recovery language — present in multiple NA and Recovery Dharma texts. "Your streak is safe" is a deliberate inversion of the shame spiral. If streak IS broken (consecutive missed days), use "Recovery continues tomorrow" instead. Never use the word "missed" or "failed".
- **If streak was already at 0 or negative** (chronic avoidance pattern): the sheet still shows compassionate language but quietly notes: "You've skipped this a few times. Want to make it easier?" with a link to edit the recurrence frequency. This is the only gentle nudge toward reducing cognitive load — never pressure.

**UI/UX — Amber palette throughout:** consistent with the Service Module's warmth-and-connection colour system. No red. No failure iconography.

**Somatic Check:** This is the most clinically sensitive interaction in the spec. The language requires review against SAMHSA safe messaging guidelines before Sprint 1 ships. The specific phrase "Let today go" should be validated with at least one clinical advisor. The "your streak is safe" copy requires verification that the streak IS in fact safe in that moment (streak penalty on Smart Reset is -1 from 0, not a full reset — confirm this against `useTaskOperations.ts` line ~210 before writing the copy).

**Reward:** There is no XP reward for skipping. The reward is the absence of punishment — the compassionate framing is the feature.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Forgiveness Tap confirms → Smart Reset fires optimistically via cache update. Firestore write queues. Task date updates in cache immediately.
- [ ] `isVaultUnlocked` is false → Forgiveness Tap is available; tasks are unencrypted.
- [ ] 320px screen → Bottom sheet is full-width. Button targets are 56px height minimum. Task title truncates with ellipsis at 2 lines.
- [ ] User swipes left on a task that is NOT recurring → Forgiveness Tap still shows, but copy changes to: "Move this to tomorrow?" (no streak language — one-time tasks have no streak). "Move to Tomorrow" updates `dueDate` only.

---

### Phase 4: AI Context Cards + Rhythm Score

> **Prerequisite:** Sprint 1 (Phases 1-3) must be shipped and stable before Sprint 2 begins.

**Logic & State:**

**Rhythm Score:**
- Add `computeRhythmScore(tasks: Task[]): number` to `src/lib/rhythmScore.ts` (see schema section for full implementation).
- Call in the Tasks page component after the existing `useQuery` for tasks resolves: `const rhythmScore = useMemo(() => computeRhythmScore(tasks ?? []), [tasks]);`
- No new hook. No new Firestore read. Derived from the existing task query.
- Display: shown alongside (not replacing) the existing streak counter for the first 30 days after shipping. After 30 days, Rhythm Score becomes the primary display; streak counter moves to a secondary position (tap to expand).

**AI Context Cards:**
- `sourceContext` and `sourceRef` are now written at task creation time by the Workbook Compass and Journal Analysis Wizard (see schema section).
- On the existing `TaskRow.tsx`: detect `task.source === 'ai' && task.sourceContext`. If present, render the context card expansion below the task title.
- Context card is collapsed by default (just the task title + purple sparkle shows). Tap the sparkle or task to expand.
- Expanded state shows: `sourceContext` text (one sentence) + a `"See insight →"` link that deep-links to the source via `sourceRef`.

**UI/UX — Rhythm Score:**
- Position: replaces the streak number display in the task module header.
- Visual: a circular progress ring (0-100) with the number inside. Colour: green (≥70) → amber (40-69) → muted (0-39). Never red.
- Label: "14-Day Rhythm" — specific and data-honest, not a vague wellness term.
- Tooltip / tap: shows the calculation breakdown — "X of the last 14 days included a completed habit."

**UI/UX — AI Context Cards:**
- Purple sparkle icon (existing) remains on AI task cards.
- Below the task title, collapsed: a subtle one-line preview of `sourceContext` in 11px muted text. Not hidden — just de-emphasised.
- Tap the card: expands to full `sourceContext` sentence + `"See insight →"` deep link.
- The `"See insight →"` link navigates to the specific workbook section or journal entry identified by `sourceRef`. If the source document no longer exists (deleted journal entry), the link shows "Source no longer available" gracefully — no broken navigation.

**Workbook Compass & Journal Analysis Wizard updates:**
- Both already call `addTask()` when generating AI actions. Update those call sites to pass `aiMeta: { sourceContext, sourceRef }`.
- `sourceContext` must be generated by Gemini as part of the task generation prompt — add to the existing prompt: "Also provide a one-sentence explanation of why this action is recommended, referencing the user's specific pattern. Maximum 120 characters. No jargon."
- `sourceRef` is the document ID of the workbook answer document or journal entry that triggered the analysis. Already available at the call site.

**Somatic Check:** The Rhythm Score must never make a user feel surveilled or judged. The tooltip "X of the last 14 days" is factual — it does not editorialize. The colour transitions are gradual and non-alarming. No "you're slipping" language anywhere.

**Reward:** The Rhythm Score at 70+ triggers a subtle ambient glow on the tasks header (not an animation or celebration — just a warm visual state). This rewards consistency without gamifying it in the Ned-specific sense.

**Edge Cases:**
- [ ] `navigator.onLine` is false → Rhythm Score computes from cached task data. Displays based on whatever is in TanStack Query cache. Shows "Based on cached data" if cache is more than 24h old.
- [ ] `isVaultUnlocked` is false → Rhythm Score computes from unencrypted `tasks` data; displays normally. AI Context Cards display `sourceContext` (plaintext) normally. `sourceRef` deep-link is blocked until vault is unlocked (the destination is encrypted content).
- [ ] 320px screen → Rhythm Score ring shrinks to 40px diameter. Context card collapses to title-only on narrow screens; tap to expand.
- [ ] `sourceRef` doc deleted → "See insight →" replaced with "Source no longer available" (muted text, no link).
- [ ] Task with `source === 'ai'` but no `sourceContext` (legacy AI tasks created before this spec) → No context card rendered. Purple sparkle still shows. Graceful degradation — no empty card state.

---

## 5. QA & Verification 🧪

### Unit Tests (`src/__tests__/tasks/`)

- [ ] **Swipe gesture threshold:** Mock touch events — assert swipe-right fires `toggleTask` only when horizontal delta ≥ 80px AND velocity ≥ 0.3px/ms. Assert it does NOT fire at 79px delta.
- [ ] **Swipe-left → Forgiveness Tap:** Assert bottom sheet renders on left-swipe threshold met. Assert "Move to Tomorrow" calls `updateTask` with tomorrow's date. Assert "Keep for Today" dismisses sheet without any Firestore call.
- [ ] **Forgiveness Tap copy selection:** Assert "Your streak is safe" appears when `currentStreak > 0`. Assert "Recovery continues tomorrow" appears when `currentStreak <= 0`.
- [ ] **Forgiveness Tap — one-time task:** Assert "Move this to tomorrow?" copy (no streak language) when `isRecurring === false`.
- [ ] **Quick Capture submit:** Assert `addTask()` called with `source: 'manual'`, `dueDate: today`, `priority: 'Medium'` on default submit.
- [ ] **Quick Capture priority chips:** Assert priority changes when chip tapped. Assert selected chip has active state. Assert `addTask()` receives the selected priority.
- [ ] **`computeRhythmScore()`:** Test with 14 days of daily completions → score 100. Test with 7 completions in 14 days → score 50. Test with 0 completions → score 0. Test with completions outside the 14-day window → not counted.
- [ ] **Rhythm Score colour thresholds:** Assert green at score 70, amber at 69, muted (no special colour) at 39.
- [ ] **AI Context Card rendering:** Assert context card renders when `source === 'ai'` and `sourceContext` is present. Assert no context card when `sourceContext` is absent (legacy AI tasks). Assert "Source no longer available" when `sourceRef` points to a deleted document.
- [ ] **`addTask()` with `aiMeta`:** Assert `sourceContext` and `sourceRef` written to Firestore document when provided. Assert neither field is written when `aiMeta` is undefined (manual tasks).

### The Subway Test (Offline Resilience)
- [ ] With `navigator.onLine` mocked to `false`:
  - Swipe-right on a task → optimistic UI removes task from list. Assert task removed from TanStack cache. Assert `updateDoc` queued (not errored).
  - Quick Capture submit → task appears in list. Assert added to TanStack cache. Assert `addDoc` queued.
  - Forgiveness Tap confirm → task's `dueDate` updates in UI. Assert cache updated. Assert `updateDoc` queued.
  - Rhythm Score → displays (computed from cache). Assert displays "Based on cached data" label when cache age > 24h.

### The "Lost PIN" Test (Crypto-Shredding)
- [ ] Confirm `sourceContext` and `sourceRef` fields are **not** included in `executePinRotation` — they are plaintext metadata on an unencrypted collection and must not be shredded.
- [ ] Confirm Rhythm Score computation produces a score of 0 after crypto-shred (all completed task history is gone; the score correctly reflects the fresh start).

### Persona-Specific QA

- [ ] **David Safety Test:** Open the app in a simulated low-battery, low-brightness scenario. Swipe-left on a task. Verify Forgiveness Tap bottom sheet renders correctly. Verify no red states, no "failed" or "missed" language anywhere in the flow. Verify the sheet can be dismissed in ≤ 2 taps.
- [ ] **Ned Pink Cloud Crash Test:** Set all task `currentStreak` values to 0 (simulating Day 90 crash). Verify Rhythm Score still shows a meaningful value (reflecting the 90 days of prior completions in the 14-day window). Verify copy reads "Recovery continues tomorrow" not "Your streak is safe."
- [ ] **Maya Traceability Test:** Create an AI task with `sourceContext` and `sourceRef` populated. Verify the context card expands. Verify the "See insight →" link navigates to the correct workbook section. Verify that tapping a task with a valid `sourceRef` but a deleted source document shows "Source no longer available."
- [ ] **Walt Accessibility Test:** On iPad (tablet emulation), verify Rhythm Score ring is ≥48px. Verify all swipe gesture targets meet 44px minimum. Verify no gamification language (no "streak" in primary view after 30-day transition period).
- [ ] **Lisa Speed Test:** Time the Quick Capture flow from pull gesture to task appearing in the list. Target: ≤8 seconds end-to-end on a mid-range device with a cold TanStack cache.

### Regression Tests (Existing Behaviour Must Not Break)

- [ ] Existing tap-to-complete still works (swipe is additive, not replacement).
- [ ] FAB `+` button still opens `TaskFormModal` directly.
- [ ] AI Action Plan tab still exists and shows AI tasks — context cards are additive, the tab is not removed.
- [ ] Smart Reset on `getUserTasks()` still fires silently on background load — Forgiveness Tap is only for active swipe-left, not background evaluation.
- [ ] XP awards still fire on task completion via both tap and swipe.
- [ ] `currentStreak` field still updates correctly on both completion and smart reset — Rhythm Score is a display layer, not a replacement for the underlying data.
- [ ] Future Task Safety modal still intercepts swipe-right on tasks with `dueDate` strictly in the future.

---

## 6. Out of Scope

- Natural language parsing (NLP) on the Quick Capture input — text is stored as-is. NLP via Gemini is a future enhancement on top of this foundation.
- Morning Pledge ritual (3-task daily selection) — this is Approach 3 and a separate spec.
- Rhythm Score replacing streak counter as the *only* metric — the 30-day parallel display period is required before primary promotion.
- Removing the Action Plan tab — the tab stays. Context cards are additive.
- Weekly Recovery Insight generated from evening inventory — separate spec.
- Any change to the XP economy — task completion XP values are unchanged.

---

## 7. Definition of Done

**Sprint 1:**
- [ ] Swipe-right completes a task with animation and haptic feedback
- [ ] Swipe-left surfaces the Forgiveness Tap bottom sheet
- [ ] Forgiveness Tap copy has been reviewed against SAMHSA safe messaging guidelines
- [ ] "Let today go" / "Recovery continues tomorrow" copy validated with a clinical advisor
- [ ] Pull-to-add Quick Capture opens, accepts input, and creates a task in ≤3 taps
- [ ] All three new interactions work identically with tap-to-complete (no regressions)
- [ ] Swipe gesture does not conflict with vertical scroll on any tested device
- [ ] All Sprint 1 unit tests passing
- [ ] Subway Test passing for all three new interactions
- [ ] `npm run check` — zero TypeScript errors
- [ ] `npm run build` — clean build
- [ ] David Safety Test passing — no shame language in any flow

**Sprint 2:**
- [ ] `sourceContext` and `sourceRef` written by Workbook Compass and Journal Analysis Wizard on all new AI tasks
- [ ] AI Context Cards expand correctly on tap; "See insight →" navigates to source
- [ ] Legacy AI tasks (no `sourceContext`) degrade gracefully — no empty card state
- [ ] Rhythm Score computes correctly from 14-day window (unit tests passing)
- [ ] Rhythm Score displays alongside streak for first 30 days
- [ ] Rhythm Score colour thresholds correct (green ≥70, amber 40-69, muted below)
- [ ] Maya Traceability Test passing
- [ ] Walt Accessibility Test passing
- [ ] All Sprint 2 unit tests passing
- [ ] `npm run check` — zero TypeScript errors
- [ ] `npm run build` — clean build

---

---

## 8. Shipped Notes

**`sourceRef` format:** The spec described `sourceRef` as a raw Firestore document ID. In practice, no individual workbook answer document IDs are available at the `addTask()` call site in `WorkbookDetail.tsx`. The implemented convention is:
- Workbook-derived tasks: `sourceRef = 'workbook:{workbookId}'` (e.g., `'workbook:step-4'`)
- Insight-derived tasks: `sourceRef = insight.id` (Firestore document ID, no prefix)

`TaskRow` routes deep-links by prefix: `workbook:` → `/workbooks/{id}`, all others → `/insights`.

---

*MRT · PROJ-46 The Ledger — Frictionless Task Module Upgrade · v1.0 · May 2026 · Status: ✅ Shipped*