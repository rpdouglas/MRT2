# Tools → Lifestyle Balance — `/tools/lifestyle-balance`

**Source:** `src/components/smart_tools/LifestyleBalanceTool.tsx` (+ shared `SmartToolContainer.tsx` — see `docs/screens/tools/README.md`)
**Personas:** General self-assessment; `toolsRegistry.ts` tags it "Monthly review," phase `big-picture`.
**Tier:** Free — no AI call, no gating.
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM).

## What it does

An interactive "Wheel of Life" self-rating: six life categories, each scored 1–10 on a slider, rendered live as a `recharts` radar chart so an unbalanced life shows up visually as a jagged rather than round shape.

## How it works

- **Not** a guided flow — like Personify, this is `SmartToolContainer`-only (no `hasGuidedFlow` in the registry, no Hub "Resume" button), and also uses the container's **default header + default Save button** rather than hiding them.
- Six categories (`CATEGORIES` const), each `1–10`, defaulting to `5` (a "perfect, albeit small, circle to start," per the component's own comment): Physical, Mental, Relationships, Work/Purpose, Spiritual, Leisure. Each has a native `<input type="range">` slider (`accent-cyan-500`) wired directly to `updateData({ [cat.key]: parseInt(e.target.value, 10) })` — no debounce, every drag tick updates local state and the chart re-renders live.
- The radar chart (`Radar`/`RadarChart`/`PolarGrid`/`PolarAngleAxis`/`PolarRadiusAxis` from `recharts`) redraws from `formatChartData(data)` on every render — purely a derived view of `data`, not a separate persisted representation.
- No explicit `save()` call anywhere in this component besides the container's own default button — same upsert-the-whole-gallery pattern as Personify (whole 6-number payload saved/updated together, no `DRAFT` tag concept).

## Data model

`LifestyleBalancePayload` (`src/lib/types/smart.ts`):

```ts
{ physical: number; mental: number; relationships: number; work: number; spiritual: number; leisure: number }
```

All six default to `5`. No `HEADLINE_FIELD` entry exists — History rows fall back to date-only headlines; `QUESTION_LABELS.LIFESTYLE_BALANCE` supplies the fuller category descriptions (e.g. `physical` → "Physical (exercise, sleep, diet, medical care)") when expanded there.

## Gating & limits

None.

## Known gaps / debt

- Same upsert-whole-payload caveat as Personify: `SmartToolContainer`'s `resumeSession` rehydrates the last saved set of six scores on open, but there's no history of *intermediate* slider positions — only whatever was on screen at the moment "Save to Journal" was pressed.
- No client-side validation beyond the native slider's own `min="1" max="10"` bounds (unlike, say, Vitality's `moveDuration`, which has none at all) — this field is actually well-bounded by the HTML5 range input itself.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics.
- `docs/specs/18_CBT_ENGINE.md` §3 — "Single-page, `SmartToolContainer`-only" tools.
