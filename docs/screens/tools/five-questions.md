# Tools → Five Questions — `/tools/five-questions`

**Source:** `src/components/smart_tools/FiveQuestionsTool.tsx` (+ shared `SmartToolContainer.tsx`, `GuidedWorkflowEngine.tsx` — see `docs/screens/tools/README.md`)
**Personas:** General; `toolsRegistry.ts` tags it "Deep reflection," phase `after`, `~8 minutes`.
**Tier:** Free to complete. Q5 (the turnaround) offers the shared AI coaching prompt (premium, see README).
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM).

## What it does

Byron Katie's "The Work," adapted for recovery — a self-enquiry method that questions a difficult thought rather than arguing with it: is it true, can you know that for certain, how do you react when you believe it, who would you be without it, and what's the turnaround.

## How it works

Same `intro` → `guided` → `summary` shape as CBA/DENTS:

1. **`intro`** — "What's the thought or belief you want to examine?" (`thought`). Saved `DRAFT`-tagged before advancing.
2. **`guided`** — 5 dynamically-worded steps, each interpolating the named thought:
   - **Q1 — Is It True?** and **Q2 — Can You Know For Certain?**: each pairs a `textarea` explanation with a `YesNoToggle` (`renderExtra`) writing to a sibling key (`q1IsTrue`/`q2CanKnow`). `canAdvanceExtra` requires the toggle be answered (`'yes'` or `'no'`) on top of the textarea's own `minLength: 10` — the user can't advance on the explanation alone.
   - **Q3 — How You React** and **Q4 — Who Without It**: plain `minLength: 10` textareas, no extras.
   - **Q5 — The Turnaround** (`aiPromptEnabled: true`): pairs the turnaround textarea with a `StarRating` (1–5, `renderExtra`) writing to `turnaroundRating`. `canAdvanceExtra` requires `turnaroundRating > 0`.
   `suppressCompletionScreen` is set; `onComplete` saves `DRAFT`-tagged before flipping to `summary` — the same "summary is the true completion gate" pattern as CBA/DENTS.
3. **`summary`** — all five Q&A pairs shown read-only (Q1/Q2's Yes/No answer displayed as "Yes"/"No"/"—", Q5's rating shown via `<StarRating value={...} readOnly />`), with the real "Save to Journal" button dropping `DRAFT`.

## Data model

`FiveQuestionsPayload` (`src/lib/types/smart.ts`):

| Field | Notes |
|---|---|
| `thought` | Captured in `intro` |
| `q1Explanation` / `q1IsTrue` | `'yes' \| 'no' \| ''` |
| `q2Explanation` / `q2CanKnow` | `'yes' \| 'no' \| ''` |
| `q3Reaction` | |
| `q4WithoutThought` | |
| `turnaround` / `turnaroundRating` | `number`, `0` = unrated |

`HEADLINE_FIELD.FIVE_QUESTIONS = 'thought'` in History; `QUESTION_LABELS.FIVE_QUESTIONS` maps `q1IsTrue`/`q2CanKnow`/`turnaroundRating` to their own short labels ("Is It True?", "Can You Know For Certain?", "How True Does the Turnaround Feel? (1-5)") separately from the fuller dynamic question text used for the explanation fields.

## Gating & limits

- Core 5-question flow: free, no limit.
- Q5's AI coaching prompt: gated `userTier === 'premium'` client-side only; no server-side enforcement — see `docs/screens/tools/README.md`.

## Known gaps / debt

- Shared AI-coaching server-side gap (README.md).
- `isFiveQuestionsComplete()` (the intro-vs-guided-vs-summary phase decision on remount) checks `d.turnaroundRating > 0` alongside the text fields — consistent with the `canAdvanceExtra` gate, so a resumed session correctly lands back in `guided` rather than `summary` if only the rating is missing.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics.
- `docs/projects/50_GUIDED_CBT.md` Phase 5.
