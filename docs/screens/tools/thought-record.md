# Tools → Thought Record — `/tools/thought-record`

**Source:** `src/components/smart_tools/ThoughtRecordTool.tsx` (+ shared `SmartToolContainer.tsx`, `GuidedWorkflowEngine.tsx` — see `docs/screens/tools/README.md`)
**Personas:** General CBT audience; `toolsRegistry.ts` tags it "After distress," phase `after`, `~10 minutes` (the longest time estimate of the nine tools).
**Tier:** Free to complete. The Balanced Thought step offers the shared AI coaching prompt (premium, see README).
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM).

## What it does

The classic 7-column CBT thought record, digitized: situation → automatic thought → emotions (before) → evidence for → evidence against → balanced thought → emotions (after) — with an explicit before/after emotion-intensity comparison as the payoff.

## How it works

`Phase = 'guided' | 'summary'` — no `intro` phase (starts directly on Column 1, like ABC).

- **Situation** / **Automatic Thought** (`minLength: 10` each): plain textareas, the facts-then-thought pair.
- **Emotions (Before)** (`inputType: 'emotion'`, `minLength: 1`): `EmotionIntensitySelector` — pick up to three emotions, rate each 0–100.
- **Evidence For** / **Evidence Against** (`minLength: 10`): Evidence Against also carries a `renderExtra` — a `CognitiveDistortionPicker`, writing to the sibling key `distortionType` via `setStepValue` (unlike ABC's Step D picker, **this selection is persisted** — it's a real field on `ThoughtRecordPayload`, not ephemeral).
- **Balanced Thought** (`minLength: 15`, `aiPromptEnabled: true`): the tool's one AI coaching touchpoint.
- **Emotions (After)** (`inputType: 'emotion'`, `emotionSourceStepId: 'emotions'`): re-rates the *same* emotion set chosen in the "before" step rather than offering a free picker — `GuidedWorkflowEngine`'s emotion-source-seeding effect copies the before-step's emotion names in automatically the first time this step is reached (never overwriting an already-answered/resumed value).
- `suppressCompletionScreen` is set; `onComplete` does `{ ...payload, distortionType: payload.distortionType || undefined }` (normalizes an empty-string pick to `undefined`) and saves `DRAFT`-tagged before flipping to `summary` — same "summary is the true completion gate" pattern as CBA/DENTS/Five Questions.
- **`summary`** shows the balanced thought, the noticed distortion pattern (if any), and "The Shift" — a per-emotion before→after sentence computed client-side: `deltas = data.emotions.map(before => { const after = data.outcomeEmotions.find(o => o.emotion === before.emotion); return {emotion, before: before.intensity, after: after?.intensity ?? before.intensity} })`. The real "Save to Journal" button here drops `DRAFT`.

## Data model

`ThoughtRecordPayload` (`src/lib/types/smart.ts`):

| Field | Notes |
|---|---|
| `situation` | Column 1 |
| `automaticThoughts` | Column 2 |
| `emotions` | Column 3 — `Array<{ emotion: string; intensity: number }>` |
| `evidenceFor` | Column 4 |
| `evidenceAgainst` | Column 5 |
| `balancedThought` | Column 6 |
| `outcomeEmotions` | Column 7 — same shape as `emotions`, re-rated |
| `distortionType` | Optional — persisted, unlike ABC's ephemeral distortion pick |

`HEADLINE_FIELD.THOUGHT_RECORD = 'situation'` in History.

## Gating & limits

- Core 7-column flow: free, no limit.
- Balanced Thought step's AI coaching prompt: gated `userTier === 'premium'` client-side only; no server-side enforcement — see `docs/screens/tools/README.md`.

## Known gaps / debt

- Shared AI-coaching server-side gap (README.md).
- If a user changes an emotion's name in the "before" step after the "after" step has already been auto-seeded, the delta calculation in `summary` falls back to `before.intensity` (no change shown) for any emotion that no longer has a matching name in `outcomeEmotions` — an edge case, not observed to be handled specially.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics.
- `docs/projects/50_GUIDED_CBT.md` Phase 4.
