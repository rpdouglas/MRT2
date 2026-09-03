# Workbooks → Session — `/workbooks/:workbookId/session/:sectionId`

**Source:** `src/pages/WorkbookSession.tsx` + `src/hooks/useAutoSave.ts` + `src/hooks/useWorkbookAnswers.ts` + `getGeminiCoaching` (`src/lib/gemini.ts`)
**Personas:** Maya (linear, one-question-at-a-time completion), Walt (per-question reflective depth). No persona-specific branching in code.
**Tier:** Free, unrestricted feature access. `getGeminiCoaching` is one of CLAUDE.md's nine approved decrypted-content-to-Gemini flows and, per PROJ-98, is distinct from `WorkbookDetail.tsx`'s flow because it sends **live, unsaved** answer text (whatever's currently in the textarea) rather than saved-and-committed content. **No client-side tier check** — see Gating & limits.
**Zero-knowledge status:** Writes `users/{uid}/workbook_answers/{workbookId}_{questionId}` — `answer` AES-GCM encrypted client-side (`encrypt()`, via `useWorkbookAnswers().saveAnswer`) before every autosave. The AI coaching call sends the current in-progress plaintext answer to Gemini via the approved proxy hop (see below) but never persists it server-side outside that one request/response.

## What it does

A full-screen ("Zen Mode") guided writing flow: one question at a time from a section, with autosave, back/forward navigation, and an on-demand "AI Insight" coaching button per question. This is where actual answer content gets written and saved — the Detail screen only shows progress and triggers analysis of what's already here.

## How it works

### Loading & layout
On mount, `getWorkbook(workbookId)` + `.sections.find(sectionId)` resolve the static content; a missing workbook or section redirects back to `/workbooks` or `/workbooks/{workbookId}` respectively rather than erroring. A `sectionStartedRef` guard fires `posthog.capture('workbook_section_started', { workbook_id, section_id, question_count })` exactly once per mount. The container is a `fixed inset-0 z-50` overlay that covers `AppShell` entirely — no sidebar/nav visible while in a session.

### Answer state: saved + local-edit overlay
`answers` is `{ ...savedAnswersById, ...localEdits }` — saved answers come from `useWorkbookAnswers(workbookId)` (decrypted), and `localEdits` is an in-memory `Record<questionId, string>` updated on every keystroke (`handleAnswerChange`). This overlay exists so that switching between questions inside the 2-second autosave debounce window (see below) still shows the latest keystrokes rather than a stale saved value or a blank field. Switching `activeQuestionIndex` re-reads `currentAnswer` from this merged `answers` map and clears any `aiFeedback` from the previous question.

### Navigation
Previous/Next move `activeQuestionIndex` by one; there's no jump-to-question control. "Next" on the last question becomes "Finish" and navigates to `/workbooks/{workbookId}` — **unconditionally**, whether or not `currentAnswer` has any content (only the `posthog.capture('workbook_answer_saved', …)` telemetry call is gated on `currentAnswer.trim()` being non-empty; navigation itself is not). A `read_only` question (`isIntroSlide`) renders as a centered title + body text with a single "Begin" button in place of the textarea/toolbar — no answer to save for that slide.

### Autosave
`useAutoSave({ sectionId, questionId, value: currentAnswer, saveAnswer })` debounces 2 seconds after the value stops changing, skips saving if the value is empty or identical to the last saved value, and delegates to `useWorkbookAnswers(workbookId).saveAnswer` — which encrypts (`encrypt()`) and upserts (`setDoc(..., { merge: true })`) the doc `users/{uid}/workbook_answers/{workbookId}_{questionId}`. `saveStatus` (`idle`/`saving`/`saved`/`error`) drives the top-bar indicator; a caught save error sets `'error'` but doesn't retry or alert — it's a small red "Save Failed" label only, easy to miss if the user isn't looking at the top bar.

### AI Insight (per-question coaching)
`handleGetCoaching` requires `currentAnswer.length >= 10` (else `alert("Write a bit more first.")`), then calls `getGeminiCoaching(context, currentAnswer)` where `context = currentQuestion.context || currentQuestion.text` (the literature-grounded blockquote shown under the question, falling back to the question text itself for the rare question with no `context`). This is a `callAIProxy('workbook_coach', { context, userAnswer })` call to the same `generateAIInsights` Cloud Function `WorkbookDetail.tsx` uses, just a different `analysisType`. The result is free-text feedback (not structured JSON, unlike `workbook_analysis`) shown in a purple panel above the textarea; it's cleared whenever the active question changes and is never persisted anywhere — a page refresh or navigating away loses it.

### Error handling
Same pattern as Detail: catches a `functions/resource-exhausted` code and surfaces the server's message directly (phrased as "Please wait Ns before requesting coaching again") instead of a generic "Coach unavailable." alert.

## Data model

| Field on `users/{uid}/workbook_answers/{workbookId}_{questionId}` | Encrypted? | Notes |
|---|---|---|
| `answer` | ✅ AES-GCM | The saved plaintext, encrypted client-side before every autosave write |
| `isEncrypted` | ❌ Plaintext | Always `true` from this write path |
| `uid`, `workbookId`, `sectionId`, `questionId` | ❌ Plaintext | Identify/route the doc; `questionId` + `workbookId` form the doc ID |
| `updatedAt` | ❌ Plaintext | Server `Timestamp.now()`, set on every write (`merge: true`) |

The AI coaching request/response (`context`, `userAnswer`, feedback text) is never written to Firestore by this screen — it exists only in component state (`aiFeedback`) for as long as the user stays on that question.

## Gating & limits

No `<PremiumGate>`, no `useRateLimits()` call, and no tier branching anywhere in `WorkbookSession.tsx` — confirmed by direct inspection. Every tier can request coaching on any question, any number of times, from the client's perspective.

**Server-side enforcement does exist**, added by `docs/projects/106_AI_RATE_LIMIT_GAP.md`: the `workbook_coach` branch in `generateAIInsights` (`functions/src/index.ts` ~line 1699) applies an **all-tier 15-second floor** between calls (`checkFloor()`, tracked via a dedicated `users/{uid}.lastWorkbookCoachCall` timestamp — deliberately *not* part of `usage_limits`, since that store is free-tier-only bookkeeping and this floor applies to premium too). This is a pure anti-abuse throttle, not a monetization lever, by explicit design: a day-scale cooldown (like `workbook_analysis`'s) would break the feature, since coaching is meant to be called once per question, many times per normal session. 15 seconds is invisible to a real user reading a question and writing ≥10 characters, but caps a scripted loop to ~4 calls/minute.

## Known gaps / debt

- **CLAUDE.md's flagged gap is now partly stale**, same as the Detail screen's note. CLAUDE.md currently says this flow has "no tier check and no rate limit at all" — the 15-second all-tier floor above means it's no longer literally uncapped. What's still true: (1) genuinely no tier differentiation at all — premium and free get byte-for-byte the same access, the floor doesn't even vary by tier; (2) no client-side proactive UX (no button-disable/countdown), same deferred-scope decision as `workbook_analysis`.
- **This is flagged as a live product inconsistency in PROJ-106 itself**, not just by this doc: `docs/projects/106_AI_RATE_LIMIT_GAP.md` notes that `workbook_coach`'s sibling flow, `GuidedWorkflowEngine.tsx`'s `cbt_coaching_prompt` (PROJ-50), is *already* premium-gated, while `workbook_coach` deliberately isn't — PROJ-106 explicitly scoped "should this become premium-only" out of its own ticket as a separate product decision, so it remains open.
- "Finish" navigates away unconditionally on the last question, even with an empty/never-saved answer on that question — no confirmation, no nudge. Likely fine given autosave already covers prior questions, but worth knowing if adding a "review before finishing" step later.
- A failed autosave surfaces only as a small "Save Failed" label in the top bar — no retry, no toast, easy to miss, meaning a lost answer could go unnoticed until the user re-opens the section and finds it blank.

## Related docs

- `docs/screens/workbooks/README.md` — parent index, tier/ZK summary.
- `docs/screens/workbooks/detail.md` — the other approved-flow screen (`workbook_analysis`), where sections are launched from and where Compass results (built from what's saved here) are reviewed.
- `docs/specs/04_WORKBOOKS.md` §3 ("Reading Experience & Mobile UX") — Zen Mode / keyboard-safe layout, confirmed accurate against code.
- `docs/projects/106_AI_RATE_LIMIT_GAP.md` — the server-side floor fix and the open premium-gating question for `workbook_coach`.
- `docs/projects/50_GUIDED_CBT.md` — for `GuidedWorkflowEngine.tsx`'s already-premium-gated sibling flow referenced above.
