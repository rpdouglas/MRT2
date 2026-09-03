# Tools → ABC Coping — `/tools/abc`

**Source:** `src/components/smart_tools/ABCTool.tsx` (+ shared `SmartToolContainer.tsx`, `GuidedWorkflowEngine.tsx` — see `docs/screens/tools/README.md`)
**Personas:** General CBT/REBT audience; `toolsRegistry.ts` tags it "Anytime," phase `after`.
**Tier:** Free to complete. Step D and Step B offer the shared AI coaching prompt (premium, see README).
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM). Not one of the nine approved-Gemini-flow *call sites* itself (the AI call lives inside the shared `GuidedWorkflowEngine`, documented once in CLAUDE.md via `GuidedWorkflowEngine.tsx` → `generateCBTCoachingPrompt`, PROJ-50).

## What it does

The classic REBT ABCDE model, adapted for recovery: Activating Event → Belief → Consequence → Dispute → Effective Belief, five guided steps with no `intro` phase (unlike CBA/DENTS/Five Questions, ABC starts directly on Step A).

## How it works

Thin wrapper — `ABCTool.tsx` is almost entirely a `Step[]` config, no custom phase logic of its own (no `intro`/`summary` split; `GuidedWorkflowEngine`'s own generic completion screen is used, since `suppressCompletionScreen` is not set).

- **A — Activating Event** (`minLength: 20`): just the facts, no AI prompt.
- **B — Your Belief** (`minLength: 20`, `aiPromptEnabled: true`): the automatic-thought step.
- **C — Consequence** (`minLength: 20`): feelings/behavior that followed; coaching text includes a compassionate aside pointing to Urge Surfer/breathwork if the user's affect is very intense right now.
- **D — Dispute** (`minLength: 30`, `aiPromptEnabled: true`): the step with the most scaffolding — `renderExtra` shows both a `SocraticPromptCard` (4 fixed Socratic questions, static, non-persisted) and a `CognitiveDistortionPicker`. The distortion selection is **ephemeral** — held in local `useState<string | null>` in `ABCTool.tsx`, never written into `ABCPayload`, and only used to enrich the AI coaching prompt's context via `getAiContext`: `step.id === 'dispute' && distortion ? \`${value}\n(Possible cognitive distortion: ${distortion})\` : value`.
- **E — Effective Belief** (`minLength: 20`): the reframe; no AI prompt.

Every step's `onSaveProgress` tags the intermediate save `DRAFT`; `onComplete` calls `save(payload, [])` directly — ABC has no separate summary phase gating the "real" save, so reaching the last step and clicking "Finish" is itself the completion.

## Data model

`ABCPayload` (`src/lib/types/smart.ts`):

| Field | Notes |
|---|---|
| `activatingEvent` | Step A |
| `beliefs` | Step B |
| `consequences` | Step C |
| `dispute` | Step D |
| `effectiveBelief` | Step E |

The cognitive distortion picked at Step D is **not** part of this payload and is not persisted anywhere — it exists only for the duration of the AI prompt request. `HEADLINE_FIELD.ABC = 'activatingEvent'` in the History view.

## Gating & limits

- Core 5-step flow: free, no limit.
- Steps B and D's AI coaching prompt (`generateCBTCoachingPrompt`): gated `userTier === 'premium'` client-side only inside `GuidedWorkflowEngine`; no server-side tier check or rate limit — see `docs/screens/tools/README.md`.

## Known gaps / debt

- Same shared gap as every guided tool: the AI coaching prompt has no server-side enforcement (`README.md`).
- The Step D cognitive distortion selection being ephemeral (never saved) means History/Journal Analysis can't later show "you identified this as catastrophizing" for a past ABC entry — it only ever shaped that one AI prompt in the moment.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics, AI coaching gap.
- `docs/projects/50_GUIDED_CBT.md`.
