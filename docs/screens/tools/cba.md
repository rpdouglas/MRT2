# Tools → Cost Benefit Analysis — `/tools/cba`

**Source:** `src/components/smart_tools/CBATool.tsx` (+ shared `SmartToolContainer.tsx`, `GuidedWorkflowEngine.tsx` — see `docs/screens/tools/README.md`)
**Personas:** Maya — `docs/PERSONAS.md` names CBA by name as one of the "rigorous CBT toolsets" she prefers over "vague advice." `toolsRegistry.ts` tags it "Before a decision," phase `before`.
**Tier:** Free to complete the full exercise. The AI reflection step is premium-gated.
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM, see README). **This is one of the nine approved Gemini flows in CLAUDE.md's Zero-Knowledge Encryption Boundary section** — `generateCBAReflection` sends the user's decrypted behavior name + all four quadrant lists to the `generateAIInsights` proxy.

## What it does

A guided Cost-Benefit Analysis: name a behavior, then work through four quadrants (Advantages/Disadvantages of Doing/Stopping it) in a clinically-mandated order, ending on the classic 2×2 grid with an optional AI-generated one-sentence reflection.

## How it works

Three phases, all local `useState<Phase>` inside `CBAToolInner` (`'intro' | 'guided' | 'summary'`):

1. **`intro`** — a single text field: "What behavior are we analyzing?" On "Continue," the trimmed behavior is saved immediately as a `DRAFT`-tagged doc (`save(merged, [DRAFT_TAG])`) before advancing — so even abandoning the flow at this point leaves a resumable draft.
2. **`guided`** — `GuidedWorkflowEngine` runs four `list`-type steps (`ListInput` widget, chip-style free-form list entry), one per quadrant, each dynamically worded around the named behavior (e.g. "What does {behavior} actually give you?"). None of the four steps has `aiPromptEnabled` — CBA's only AI touchpoint is the summary-phase reflection, not the per-step coaching prompt other guided tools use. Reaching "Finish" here still saves `DRAFT`-tagged (`onComplete` explicitly re-tags `[DRAFT_TAG]`, with a code comment: "still DRAFT — summary is the true completion gate").
3. **`summary`** — the traditional editable 2×2 grid (`ListInput` per quadrant, freely re-editable), the AI reflection block, and the real "Save to Journal" button that finally drops the `DRAFT` tag (`save(data, [])`).

### The AI reflection — double-gated

```ts
const handleReflect = async () => {
    if (userTier !== 'premium') return; // gate the call itself, not just the rendered button
    ...
    const sentence = await generateCBAReflection(data.behavior, { ...four quadrant arrays });
```

Unlike the other guided tools' AI coaching prompt (gated only by not rendering the button for free users), CBA re-checks `userTier` *inside* the handler too — the code comment calls this out explicitly ("gate the call itself, not just the rendered button"). The rendered UI itself is also tier-branched: premium sees the "What does this tell you?" button; free sees static copy ("Upgrade to Premium for an AI reflection on your completed analysis.") instead of a disabled button.

Despite the double client-side gate, **the server-side proxy applies no tier check or rate limit to `cba_reflection`** — see `docs/screens/tools/README.md`'s "AI coaching" section for the same gap shared with `generateCBTCoachingPrompt`. A direct call to `generateAIInsights` with `analysisType: 'cba_reflection'` bypasses both client checks entirely.

## Data model

`CBAPayload` (`src/lib/types/smart.ts`):

| Field | Type | Notes |
|---|---|---|
| `behavior` | `string` | Captured in the `intro` phase |
| `advantagesDoing` | `string[]` | Quadrant 1 |
| `disadvantagesDoing` | `string[]` | Quadrant 2 |
| `advantagesStopping` | `string[]` | Quadrant 3 |
| `disadvantagesStopping` | `string[]` | Quadrant 4 |

Wrapped in the standard SMART Tool envelope and saved to `journals/{id}` — see `docs/screens/tools/README.md`'s "Storage" section for the full mechanism. `HEADLINE_FIELD.CBA = 'behavior'` in the History view.

## Gating & limits

- Core exercise (intro + 4 quadrants + editable summary grid): free, no limit.
- AI reflection (`generateCBAReflection`): gated `userTier === 'premium'` client-side (both the render and the handler); **no server-side tier check or rate limit** — live gap, see `README.md`.

## Known gaps / debt

- The `cba_reflection` analysisType has no server-side enforcement despite the client's unusually careful double-gate — the double client-side check protects against a UI bug, not against someone calling the Cloud Function directly.
- Reaching "Finish" in the guided phase still writes a `DRAFT`-tagged doc even though the user has answered every quadrant — by design (summary is the real gate, and the grid stays editable there), but worth knowing if debugging "why does this still show as a draft."

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics, the AI-coaching server-side gap in full.
- `docs/projects/50_GUIDED_CBT.md` Phase 3 — guided CBA flow.
- CLAUDE.md — nine approved Gemini flows list (`CBATool.tsx` → `generateCBAReflection`, PROJ-50 Phase 3).
