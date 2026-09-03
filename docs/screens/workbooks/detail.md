# Workbooks → Detail — `/workbooks/:workbookId`

**Source:** `src/pages/WorkbookDetail.tsx` + `src/hooks/useWorkbookAnswers.ts` + `analyzeWorkbookContent` (`src/lib/gemini.ts`) + `addTask` (`src/lib/tasks.ts`) + `saveInsight` (`src/lib/insights.ts`)
**Personas:** Maya (progress-per-section, completion %), Walt (Global Review scope for cross-workbook reflection). No persona-specific branching in code.
**Tier:** Free, unrestricted feature access. The AI analysis action (`analyzeWorkbookContent`) is one of CLAUDE.md's nine approved decrypted-content-to-Gemini flows, and has **no client-side tier check** — see Gating & limits.
**Zero-knowledge status:** Reads/decrypts `users/{uid}/workbook_answers/{id}` (client-side, via `useWorkbookAnswers()`) to render section progress and to build the AI analysis payload. Writes plaintext `insights/{id}` (Wisdom Log) and plaintext `tasks/{id}` (AI-sourced action items) — neither collection is encrypted per CLAUDE.md's table, consistent with how the Journal Analysis Wizard and other approved flows already save their output.

## What it does

Shows one workbook's section list with per-section progress, links each section into the Session screen, and hosts "Consult the Recovery Compass" — an on-demand AI analysis of the user's answers at a chosen scope (one section, the whole workbook, or every workbook), presented with a summary, three "pillar" reflections, and suggested action steps the user can push straight into Tasks or save to their Wisdom Log (Insights).

## How it works

### Section list & mastery ring
`completedCounts` tallies `workbookAnswers` (this workbook's saved answers, from `useWorkbookAnswers(workbook.id)`) by `sectionId`. For each section, `answeredCount >= totalQuestions` (where `totalQuestions` excludes `read_only` questions) marks it complete — swaps the row's icon from a blue `PlayCircleIcon` ("Start") to a green `ArrowPathIcon` ("Redo") and shows a green progress bar instead of blue. The header's percentage ring (`VibrantHeader`'s `percentage` prop) is workbook-wide `mastery = round(totalAnswered / totalWorkbookQuestions * 100)`, computed inline in this component (a separate calculation from the Dashboard's global Wisdom Score, though both ultimately sum the same per-question `read_only` exclusion rule). Tapping a section's icon navigates to `/workbooks/{workbookId}/session/{section.id}` regardless of completion state — "Redo" just re-enters the same session with existing answers pre-loaded.

### Consult the Recovery Compass (AI analysis)
A floating action button opens a scope-selection modal (`showWizard`, Headless UI `Dialog`/`RadioGroup`):
- **Specific Section** — analyzes only `workbookAnswers` matching the selected `selectedSectionId` (a `<select>` of this workbook's sections, defaulting to the first).
- **Full Workbook** — analyzes all of `workbookAnswers` (every saved answer in this workbook, any section).
- **Global Review** — analyzes `globalAnswers`, a **second, separate** `useWorkbookAnswers()` call made with no `workbookId` argument, at the top of the component, unconditionally on every mount — i.e. every saved answer across every workbook the user has ever touched (installed or not) is fetched and decrypted into component state as soon as this page loads, regardless of whether the user ever opens the wizard or picks Global scope. A code comment on this branch itself flags the concern: `// Global (already decrypted by useWorkbookAnswers; careful with large datasets in production)`.

`handleAnalyze` guards on `docsToAnalyze.length === 0` (alerts "No entries found…"), then flattens the selected answers into one string — `Question: {questionId}\nAnswer: {answer}` per entry, joined with blank lines — and calls `analyzeWorkbookContent(contextTitle, [{ question: "Combined Context", answer: textContent }])`. That function (`analyzeFullWorkbook` internally) calls the shared `callAIProxy('workbook_analysis', { workbookTitle, questionsAndAnswers })`, which hits the `generateAIInsights` Cloud Function — the decrypted answer text leaves the client only inside that one HTTPS call, per CLAUDE.md's approved-flow carve-out. `posthog.capture('workbook_analysis_requested', { workbook_id, analysis_scope })` fires before the call; no answer content in that payload.

### Result modal
On success (`WorkbookAnalysisResult`: `scope_context`, `summary`, `pillars: { understanding, blind_spots, emotional_resonance }`, `suggested_actions: string[]`, optional `action_contexts: string[]`), a modal shows the summary and three colored pillar cards — note the UI labels don't literally match the field names: `pillars.understanding` → "Understanding" (blue), `pillars.blind_spots` → "Blind Spots" (orange), `pillars.emotional_resonance` → **"Growth"** (green) (the same field/label mismatch the `insights.ts` code comments call out for the parallel `journal`-type insight shape). Each suggested action has an add-to-tasks button (`handleAddToHabits`): calls `addTask(uid, action, {type:'once'}, 'High', dueDatePlus3Days, 'ai', { sourceContext: action_contexts?.[actionIndex], sourceRef: `workbook:${workbookId}` })` — the `workbook:` prefix is what lets the Tasks screen's AI Context Card deep-link back here (see `docs/screens/tasks/today.md`). Adding is one-way (no undo/remove) and each action tracks its own `addedActions` set so a repeat tap is a no-op once added. Separately, "Save to Wisdom Log" (`handleSaveLog`) calls `saveInsight(uid, { type: 'workbook', ...insight })`, persisting the entire AI response (summary, pillars, suggested actions) as a new plaintext `insights/{id}` document.

### Error handling
`handleAnalyze`'s catch block special-cases a `functions/resource-exhausted` error code — see Gating & limits — surfacing the server's own message (already phrased as "Available in N days. Upgrade to unlock.") instead of a generic "An error occurred during analysis." alert.

## Data model

| Collection | Encrypted? | Touched how |
|---|---|---|
| `users/{uid}/workbook_answers/{id}` | ✅ Yes (`answer` field) | Read-only here, via two `useWorkbookAnswers()` calls (scoped + global) — decrypted client-side before being flattened into the AI request text |
| `insights/{id}` | ❌ No | Written by "Save to Wisdom Log" — `{ type: 'workbook', scope_context, summary, pillars, suggested_actions, action_contexts?, uid, createdAt }`, plaintext, one doc per save |
| `tasks/{id}` | ❌ No | Written by "add to habits" — a normal task doc with `source: 'ai'`, `sourceContext`, `sourceRef: 'workbook:{workbookId}'` |
| `users/{uid}.installedWorkbookIds` | ❌ No | Read only indirectly (via `getWorkbook`/routing), not written on this screen |

## Gating & limits

No `<PremiumGate>`, no `useRateLimits()` call, and no tier branching anywhere in `WorkbookDetail.tsx` — confirmed by direct inspection, not just CLAUDE.md's note. Every tier can open the wizard and run any scope at will from the client's perspective.

**Server-side enforcement does exist**, added by `docs/projects/106_AI_RATE_LIMIT_GAP.md` (status "In Progress" as of this doc): in `functions/src/index.ts`'s `generateAIInsights` callable, the `workbook_analysis` branch (~line 1636) gives free-tier users a **7-day cooldown** (`usage_limits.lastWorkbookAnalysis`, checked via `checkCooldown()`) — premium is explicitly unlimited, "consistent with every other periodic-scan flow" per that project's own design note. This is authoritative (the client cannot bypass it) but entirely invisible until the user hits it — there is no client-side pre-check or button-disable (PROJ-106 Phase 3 explicitly deferred that: "not required to close the cost gap itself, since the server-side check is authoritative either way").

## Known gaps / debt

- **CLAUDE.md's flagged gap is now partly stale.** CLAUDE.md's "Known live gap, not yet fixed" section currently states this flow has "no tier check and no rate limit at all." As of `docs/projects/106_AI_RATE_LIMIT_GAP.md`, that's no longer accurate — the server now enforces a 7-day free-tier cooldown (above). What **is** still true and still worth flagging: (1) there is genuinely no tier check — a free user and a premium user get identical unlimited-scope access to Compass, only a cooldown separates them, which may or may not be the intended product posture (PROJ-106 explicitly scoped that decision out); (2) the client still has zero proactive rate-limit UX — a free user only discovers the cooldown by tripping the server error, unlike `useRateLimits.ts`'s pattern for the weekly/monthly/deep-dive scans elsewhere in the app, which disables the button in advance. CLAUDE.md's wording should be updated to reflect PROJ-106 rather than describing the pre-fix state as current.
- **Global Review scope decrypts every workbook answer the user has, unconditionally, on every page load** — not lazily on wizard-open, and not scoped to just this workbook. It's still client-side-only state (never logged, never sent anywhere until/unless the user explicitly picks Global and taps Analyze), so it isn't a zero-knowledge boundary violation, but it is more decrypted content sitting in memory/React state than the common case (viewing one workbook's section list) needs — flagged by the code's own comment on that line.
- The `pillars.emotional_resonance` → "Growth" label mismatch (noted above) isn't a bug, but it's the kind of naming drift worth knowing before adding a fourth pillar or reusing this type elsewhere.

## Related docs

- `docs/screens/workbooks/README.md` — parent index, tier/ZK summary.
- `docs/screens/workbooks/session.md` — the other approved-flow, other-known-gap screen (`workbook_coach`).
- `docs/screens/tasks/today.md` — where `sourceRef: 'workbook:{id}'` AI tasks surface.
- `docs/specs/04_WORKBOOKS.md` §4 ("AI Integration") — calls this function `analyzeFullWorkbook`; the actually-imported export is the `analyzeWorkbookContent` alias.
- `docs/projects/106_AI_RATE_LIMIT_GAP.md` — the server-side cooldown fix; read this before treating CLAUDE.md's gap note as current.
