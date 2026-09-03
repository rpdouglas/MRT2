# Tools — `/tools`

**Parent page:** `src/pages/ToolsHub.tsx` — a directory of 11 sub-screens grouped into four collapsible, moment-based accordion sections (`right-now` / `before` / `after` / `big-picture`, defined in `src/lib/toolsRegistry.ts`). Two tools (Urge Surfer, Resentment Burner) are simple standalone experiences; nine are SMART Recovery / CBT worksheets digitized as interactive tools, six of those step-locked guided flows.

This screen has enough distinct sub-experiences to warrant its own folder — each file below is independently readable. Individual tool files are deliberately short: everything shared across the 9 CBT tools (save format, draft/resume, history) is described once here.

| Sub-screen | File | Route | Component(s) |
|---|---|---|---|
| Tools Hub | [`hub.md`](./hub.md) | `/tools` | `ToolsHub.tsx`, `toolsRegistry.ts` |
| Urge Surfer | [`urge-surfer.md`](./urge-surfer.md) | `/tools/urge-surfer` | `UrgeSurfer.tsx` |
| Resentment Burner | [`resentment-burner.md`](./resentment-burner.md) | `/tools/resentment-burner` | `ResentmentBurner.tsx` |
| Cost Benefit Analysis | [`cba.md`](./cba.md) | `/tools/cba` | `CBATool.tsx` |
| ABC Coping | [`abc.md`](./abc.md) | `/tools/abc` | `ABCTool.tsx` |
| D.E.N.T.S. Strategy | [`dents.md`](./dents.md) | `/tools/dents` | `DentsTool.tsx` |
| Personify & Disarm | [`personify.md`](./personify.md) | `/tools/personify` | `PersonifyTool.tsx` |
| Lifestyle Balance | [`lifestyle-balance.md`](./lifestyle-balance.md) | `/tools/lifestyle-balance` | `LifestyleBalanceTool.tsx` |
| Thought Record | [`thought-record.md`](./thought-record.md) | `/tools/thought-record` | `ThoughtRecordTool.tsx` |
| Five Questions | [`five-questions.md`](./five-questions.md) | `/tools/five-questions` | `FiveQuestionsTool.tsx` |
| Morning Intent | [`morning-intent.md`](./morning-intent.md) | `/tools/morning-intent` | `MorningIntentTool.tsx` |
| Tool History (shared) | [`history.md`](./history.md) | `/tools/:toolType/history` | `ToolHistory.tsx` |

A 12th card, **SMART Goal** (`toolType: 'SMART_GOAL'`), shows in the registry as a disabled "Coming Soon" card at `/tools/smart-goal` — no route and no component exist yet, so it has no doc file here.

**Personas:** Not one persona's tool — the CBT/SMART Recovery toolset as a whole is Maya's primary engagement surface (`docs/PERSONAS.md`: "Frustrated by vague advice... Prefers rigorous CBT toolsets like CBA and DENTS"; "Core user for SMART Recovery, CBT... workbooks. Linear completion is her primary engagement pattern"). It's also the designed response to Ned's Day 90 Pink Cloud Crash (`docs/PERSONAS.md` §Ned: "Surface CBT tools and deeper AI analysis" as streak-count prominence fades). Urge Surfer is explicitly David's immediate-crisis de-escalation tool. Walt and Jordan aren't named against specific tools in `docs/PERSONAS.md`, but the guided flows' traceable AI-coaching-prompt pattern and structured worksheet format fit Walt's "traceable AI insights" preference and Jordan's need for "non-spiritual, science-backed behavioral tools."

**Tier:** Free to open and complete every tool, including all nine journal-persisted ones and both crisis tools. Two Gemini-powered extras are premium-gated **client-side only** — see "AI coaching (guided tools)" and CBA's file for the one exception with a visible upgrade prompt. See each file's Gating & limits section.

**Zero-knowledge status:** The 9 SMART Tools write to the shared `journals/{id}` collection (not a dedicated collection) with `content` AES-GCM encrypted and `moodScore`/`tags`/`isEncrypted`/`sentiment` plaintext — same collection and boundary Journal and Vitality use. Urge Surfer writes to the same collection but has a documented **plaintext fallback** when the vault is locked (see `urge-surfer.md`) — a deliberate, commented exception to the "encryption is mandatory" rule everywhere else in the app. Resentment Burner writes nothing to Firestore at all — the only truly ephemeral tool in the app.

---

## Shared mechanics (all 9 SMART Tools)

Everything below is common to CBA, ABC, DENTS, Personify, Lifestyle Balance, Thought Record, Five Questions, and Morning Intent. Individual tool files only describe what's genuinely different about that tool (its specific fields, its exercise structure, any AI call).

### Storage: the "Virtual Module" pattern

None of these tools has its own Firestore collection. `SmartToolContainer.tsx` (`src/components/smart_tools/SmartToolContainer.tsx`) is the shared save path used by every one of them:

1. The tool's in-progress state (`data: T`) is wrapped in an envelope: `{ metadata: { type: toolType, version: '2.0', lastSaved: ISOString }, data }`.
2. `JSON.stringify()`'d, then encrypted via `encrypt()` (`EncryptionContext`) — AES-GCM, same as a Journal entry.
3. Saved to `journals/{id}` via `addJournal()` (first save) or `updateJournal()` (subsequent saves to the same session — `SmartToolContainer` tracks `currentDocId` locally after the first write so a second save updates in place instead of creating a duplicate doc).
4. Tagged `['SMART Tool', toolType, ...extraTags]` — `toolType` is one of the `SmartToolType` union values (`CBA`, `ABC`, `DENTS`, `PERSONIFY`, `LIFESTYLE_BALANCE`, `THOUGHT_RECORD`, `FIVE_QUESTIONS`, `MORNING_INTENT`, plus unshipped `SMART_GOAL`/`SELF_COMPASSION`/`BOUNDARIES` types with no UI yet).
5. `moodScore` is hardcoded to `5` (neutral) on every SMART Tool save — none of these tools asks the user for a mood rating.

Parsing back out is one shared helper: `parseSmartToolPayload()` (`src/lib/smartToolPayload.ts`) — a best-effort `JSON.parse` that checks for `parsed.metadata?.type` and `parsed.data`, returning `null` (never throwing) for a freeform/legacy entry. It's reused by `useToolHistory`, `JournalHistory.tsx`'s main timeline, `JournalAnalysisWizard.tsx`, and `useDeepPatternAnalysis.ts` — so a decrypted journal entry is identified as "this is a SMART Tool save, not freeform text" in exactly one place in the codebase.

This means: **a SMART Tool completion is a `journals/{id}` document**, indistinguishable from a Journal entry at the Firestore/rules level, and it shows up in the main Journal History timeline and in Journal Analysis Wizard / Deep Pattern Analysis's AI context alongside ordinary journal entries.

### Vault gating

Every SMART Tool route is wrapped in `<VaultGate>` at the router level (`src/App.tsx`) — `VaultGate` renders nothing but its own PIN-entry/setup UI until `isVaultUnlocked` is true, so a locked vault never reaches these components at all. `SmartToolContainer` *also* checks `isVaultUnlocked` and renders its own "Vault Locked" empty state if false — for these nine routes that check is effectively dead code (VaultGate already blocked the render), though it's a defensive guard that would matter if `SmartToolContainer` were ever reused somewhere not wrapped in `VaultGate`.

### Draft / resume — two independent mechanisms, at two different layers

1. **`SmartToolContainer`'s own resume** (`resumeSession` prop, set on every tool except Personify/Lifestyle Balance which pass it as `true` too — in practice all nine pass `resumeSession`). On mount, queries Firestore for the most recent `journals` doc tagged with this `toolType` (any tag state, draft or complete), decrypts it, and hydrates `data` from it. This is what lets Personify and Lifestyle Balance (which have no guided-flow draft layer at all) pick up where a previous session left off.
2. **`GuidedWorkflowEngine`'s step draft** (the six guided tools only: CBA, ABC, DENTS, Thought Record, Five Questions, Morning Intent) — a separate, `sessionStorage`-only autosave (`useGuidedDraft`, key `guidedDraft_${toolType}`), saved every 30 seconds and on step navigation. This is plaintext, device-local, and session-scoped — **never sent to Firestore.** On mount, if a same-session draft exists, a "Resume your session?" dialog offers Resume or Start Fresh.
3. A guided tool's in-progress steps are *also* periodically pushed to Firestore as a `DRAFT`-tagged `journals` doc via `onSaveProgress` (the engine's "Save Progress" button, and automatically on "Exit & save draft") — tagged `['SMART Tool', toolType, 'DRAFT']` (`DRAFT_TAG` constant, `src/lib/types/smart.ts`). This is the cross-session/cross-device resume signal: `useSmartToolCompletions` (used by the Hub) checks for a `DRAFT`-tagged doc via `hasDraftDoc[toolType]`, independent of the same-browser `sessionStorage` check.
4. A guided tool's completion is a distinct event from reaching the last step: CBA, DENTS, Five Questions all show a **`summary` phase** after the guided steps where the "true" completion save (no `DRAFT` tag) happens — reaching the engine's last step and clicking "Finish" still saves with `DRAFT_TAG` in those three tools. ABC, Thought Record, and Morning Intent's `onComplete` drops the `DRAFT` tag immediately (ABC and Morning Intent skip a summary phase entirely; Thought Record has its own summary screen but saves clean on `onComplete`, not on a further button).
5. `?fresh=1` on any tool's route (the Hub's "Start Fresh" button) sets `forceFresh`, which skips both resume mechanisms and any `intro`-phase prefill, starting the tool completely blank.

### History view

`/tools/:toolType/history` (`ToolHistory.tsx`) lists every **completed** (non-`DRAFT`) entry for one `toolType`, via `useToolHistory` — queries `journals` where `tags array-contains toolType`, decrypts each doc, parses it with `parseSmartToolPayload`, and skips anything still `DRAFT`-tagged or that fails to parse as a SMART Tool envelope. Decryption only happens in this view (and the Hub's completion-count query, `useSmartToolCompletions`, deliberately avoids it — tags are plaintext, so counts/draft-existence don't need a decrypt).

Each entry renders via the generic `PayloadSummaryList` (`src/components/tools/PayloadSummaryList.tsx`) — a label + value row per field, using `getFieldLabel()` (`src/lib/toolHistorySummary.ts`) to show the tool's actual question text (e.g. CBA's `advantagesDoing` renders as "What does {behavior} actually give you?") rather than a raw field name, falling back to a humanized key (`activatingEvent` → "Activating Event") for anything unmapped. No per-tool renderer exists or is needed — a new tool type needs no new history UI, just an optional `QUESTION_LABELS` entry. A `HEADLINE_FIELD` map picks one field per tool (e.g. CBA → `behavior`, ABC → `activatingEvent`) to show as the collapsed-row headline; tools with no natural single-string field (Personify, Lifestyle Balance, Morning Intent) fall back to the entry's date.

### AI coaching (guided tools)

Two Gemini call sites exist across the guided tools, both routed through the `generateAIInsights` Cloud Function proxy (per CLAUDE.md's zero-knowledge boundary):

- **`generateCBTCoachingPrompt`** (`cbt_coaching_prompt` analysisType) — `GuidedWorkflowEngine`'s per-step debounced (5s after typing pauses) "AI Suggestion" follow-up question, on any step with `aiPromptEnabled: true`. Gated `userTier === 'premium'` **client-side only** (`aiEnabled = step.aiPromptEnabled && userTier === 'premium'` in `GuidedWorkflowEngine.tsx`).
- **`generateCBAReflection`** (`cba_reflection` analysisType) — CBA's summary-phase "What does this tell you?" one-sentence reflection. Also gated `userTier === 'premium'` client-side, and additionally re-checked inside the handler itself (`if (userTier !== 'premium') return;`) — see `cba.md`.

**Neither call site has any server-side tier check or rate limit.** In `functions/src/index.ts`'s `generateAIInsights`, the free-tier cooldown branch only checks `deep_pattern_analysis`, `rosc_assessment`, `workbook_analysis`, `audio_analysis`, and `comparative_analysis` — `cbt_coaching_prompt` and `cba_reflection` fall through with no tier gate and no cooldown at all. This is a gap CLAUDE.md doesn't currently name (its "Known live gap" section lists `WorkbookDetail.tsx`/`WorkbookSession.tsx`/`AudioRecorder.tsx` specifically): a free user calling `generateAIInsights` directly with `analysisType: 'cbt_coaching_prompt'` or `'cba_reflection'` — bypassing the client's own `userTier` check — would get an uncapped, un-gated Gemini call. Flag this if you touch `GuidedWorkflowEngine.tsx`, `CBATool.tsx`, or the proxy's rate-limit branch.

## Related docs

- `docs/specs/18_CBT_ENGINE.md` — the existing spec; broadly accurate on architecture, though it states the "Right Now" section (Urge Surfer, Resentment Burner) is "expanded by default" — the current code (`ToolsHub.tsx`) initializes **all four** sections collapsed (`useState({ 'right-now': false, before: false, after: false, 'big-picture': false })`). Follow the code — see `hub.md`.
- `docs/projects/50_GUIDED_CBT.md` — `GuidedWorkflowEngine` history.
- `docs/projects/71_TOOLS_HUB_REGROUPING.md` — the four-phase accordion regrouping.
- `docs/projects/72_RECOVERY_GAMES.md` Part A — Morning Intent's origin.
- `docs/projects/archive/27_SMART_TOOLS.md` — original CBT Engine ticket.
- `docs/PERSONAS.md` — Maya's CBA/DENTS preference, Ned's Day-90 CBT surfacing rule, the Urge Surfer psychiatric-crisis risk note (§ risk register).
