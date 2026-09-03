# Tools → D.E.N.T.S. Strategy — `/tools/dents`

**Source:** `src/components/smart_tools/DentsTool.tsx` (+ shared `SmartToolContainer.tsx`, `GuidedWorkflowEngine.tsx` — see `docs/screens/tools/README.md`)
**Personas:** Maya — named alongside CBA in `docs/PERSONAS.md` as one of the "rigorous CBT toolsets" she prefers. `toolsRegistry.ts` tags it "Before a risky situation," phase `before`.
**Tier:** Free — no AI call anywhere in this tool.
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM).

## What it does

A pre-planning worksheet for a specific upcoming high-risk situation (a party, a stressful family event), built around the SMART Recovery D.E.N.T.S. acronym: Deny/Delay, Escape, Neutralize, Tasks, Swap.

## How it works

Same three-phase shape as CBA (`intro` → `guided` → `summary`), and the only other guided tool besides CBA/Five Questions to use it:

1. **`intro`** — "What's the high-risk situation you're planning for?" (`scenario`). Saved immediately as `DRAFT` before advancing, same pattern as CBA.
2. **`guided`** — 5 `textarea` steps (`minLength: 10` each), every question dynamically interpolating the named scenario (e.g. "If {scenario} happens, how exactly will you Deny it?"). None has `aiPromptEnabled` — DENTS has no AI touchpoint at all, unlike CBA (summary reflection) or ABC/Thought Record/Five Questions/Morning Intent (per-step coaching prompt). `suppressCompletionScreen` is set, so finishing the guided steps goes straight to `summary` rather than showing the engine's own generic "nice work" screen — DENTS supplies its own summary UI instead. Reaching "Finish" still saves `DRAFT`-tagged (same "summary is the true completion gate" pattern as CBA).
3. **`summary`** — all five answers shown as color-coded `StrategyCard`s (rose/orange/amber/emerald/sky, one per D-E-N-T-S letter), each independently editable via its own textarea, plus the real "Save to Journal" button dropping `DRAFT`.

## Data model

`DENTSPayload` (`src/lib/types/smart.ts`):

| Field | Notes |
|---|---|
| `scenario` | Optional field — kept optional in the type "for backward compatibility with entries saved before this field existed" (PROJ-50 Phase 5 added Scenario Mode after DENTS already shipped without it) |
| `deny` | D |
| `escape` | E |
| `neutralize` | N |
| `tasks` | T |
| `swap` | S |

`HEADLINE_FIELD.DENTS = 'scenario'` in the History view — an entry saved before Scenario Mode shipped (no `scenario` value) falls back to date-only in that list.

## Gating & limits

None — the entire tool, including the guided flow, is free with no AI call to gate.

## Known gaps / debt

- The `scenario` field's optionality is a deliberate backward-compatibility accommodation, not an oversight — documented inline in `types/smart.ts`. Any code reading `data.scenario` elsewhere should still treat it as possibly absent.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics.
- `docs/projects/50_GUIDED_CBT.md` Phase 5 — Scenario Mode.
