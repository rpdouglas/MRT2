# Tools → Morning Intent — `/tools/morning-intent`

**Source:** `src/components/smart_tools/MorningIntentTool.tsx` (+ shared `SmartToolContainer.tsx`, `GuidedWorkflowEngine.tsx` — see `docs/screens/tools/README.md`)
**Personas:** General; `toolsRegistry.ts` tags it "Start of day," phase `before`, `~5 minutes`. Shipped as part of PROJ-72 (Recovery Games).
**Tier:** Free to complete. Steps 2 and 3 offer the shared AI coaching prompt (premium, see README).
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM).

## What it does

A forward-looking REBT-style flow — the newest of the six guided tools, and structurally the mirror image of ABCDE: instead of examining a belief about something that already happened, it anticipates today's likely challenges and sets one concrete intention before they arrive.

## How it works

The simplest guided tool in the set: no `intro` phase, no custom `summary` phase, no phase state at all in the component — it's a single `GuidedWorkflowEngine` call directly inside `SmartToolContainer`'s render-prop children, using the engine's own generic completion screen ("You just did some serious cognitive work.") since `suppressCompletionScreen` is not set.

Four steps, all `textarea`:

- **Today's Terrain** (`minLength: 15`): "What situations, people, or moments today are most likely to challenge you?" — no AI prompt.
- **The Automatic Story** (`minLength: 15`, `aiPromptEnabled: true`): the automatic thought expected to show up if that moment goes badly.
- **A More Useful Belief** (`minLength: 15`, `aiPromptEnabled: true`): the reframe.
- **Today's Intention** (`minLength: 10`): one small, concrete action for the day — no AI prompt.

`onComplete` calls `save(payload, [])` directly, same as ABC — no separate summary-phase completion gate.

## Data model

`MorningIntentPayload` (`src/lib/types/smart.ts`):

| Field | Notes |
|---|---|
| `terrain` | What's likely to challenge me today |
| `story` | The automatic thought/belief expected to show up |
| `reframe` | A more useful, realistic belief |
| `intention` | One concrete intention for today |

No `HEADLINE_FIELD` entry exists for `MORNING_INTENT` — History rows fall back to date-only headlines (same as Personify/Lifestyle Balance, despite Morning Intent being a guided tool — the four fields are all narrative text, none singled out as the "one line that summarizes this entry").

## Gating & limits

- Core 4-step flow: free, no limit.
- The Automatic Story and A More Useful Belief steps' AI coaching prompt: gated `userTier === 'premium'` client-side only; no server-side enforcement — see `docs/screens/tools/README.md`.

## Known gaps / debt

- Shared AI-coaching server-side gap (README.md).
- Missing `HEADLINE_FIELD` entry means this guided tool's History list reads identically to the two non-guided tools' (date-only) despite having plenty of narrative content that could headline a row — a plausible small polish gap, not a functional bug.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics.
- `docs/projects/72_RECOVERY_GAMES.md` Part A.
