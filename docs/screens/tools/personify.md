# Tools → Personify & Disarm — `/tools/personify`

**Source:** `src/components/smart_tools/PersonifyTool.tsx` (+ shared `SmartToolContainer.tsx` — see `docs/screens/tools/README.md`)
**Personas:** General; `toolsRegistry.ts` tags it "Reflection," phase `after`. No dedicated persona targeting in `docs/PERSONAS.md`.
**Tier:** Free — no AI call, no gating.
**Zero-knowledge status:** Standard SMART Tool save (`journals/{id}`, `content` AES-GCM).

## What it does

A Narrative Therapy exercise: externalize the "addictive voice" as a named character (a "Rogue"), record the lie it tells and the true-self response that disarms it, and build up a card gallery of these over time. Not a guided/step-locked flow — a single open page, add-as-many-as-you-like.

## How it works

- **Not** wrapped in `GuidedWorkflowEngine` — `toolsRegistry.ts` has no `hasGuidedFlow` for this entry, so the Hub card never shows a "Resume" button for it (see `hub.md`), even though `SmartToolContainer`'s own `resumeSession={true}` still rehydrates the last saved gallery on open.
- `SmartToolContainer` is used with its **default header and default "Save to Journal" button** (neither `hideHeader` nor `hideDefaultSaveButton` is passed) — unlike every guided tool, which hides both in favor of its own `VibrantHeader` and save flow. Personify is the only tool that shows the container's generic "CBT Tool / Personify & Disarm" header bar with the shared Save button.
- The gallery is an array (`PersonifyPayload.personas`), each a `{ id: number (Date.now()), name, action, result }`. "Identify New Voice" opens an add form (name, "The Lie It Tells," "The Truth (Disarm)"); each card in the gallery is independently editable in place (`PersonaCard`'s own `isEditing` local state) or deletable.
- Nothing in this component calls `save()` explicitly with `extraTags` — every add/edit/delete just calls `updateData()` (local state only) until the user presses the container's default Save button, which writes with tags `['SMART Tool', 'PERSONIFY']` (no `DRAFT` — this tool has no draft concept; every save is a "complete" save of the current gallery state).

## Data model

`PersonifyPayload` (`src/lib/types/smart.ts`):

```ts
{ personas: Array<{ id: number; name: string; action: string; result: string }> }
```

No `HEADLINE_FIELD` entry exists for `PERSONIFY` — History rows fall back to date-only headlines. `PayloadSummaryList`'s object-array renderer (`isObjectArray`) shows each persona as its own mini-card of `name`/`action`/`result`, using `QUESTION_LABELS.PERSONIFY` ("Rogue's Name" / "The Lie It Tells" / "The Truth (Disarm)") for the sub-labels.

## Gating & limits

None.

## Known gaps / debt

- Every Save writes the *entire current gallery* as a new/updated single journal doc (via `SmartToolContainer`'s `currentDocId`-based upsert) — a user with many personas accumulated over one open+edit session before their first save has no incremental save; losing the tab before pressing Save loses everything added since the last save (or ever, if never saved).
- No completion-count semantics really apply here (unlike CBA/DENTS where "1 completion = 1 finished worksheet") — the Hub's "Completed N times" badge for Personify actually means "saved N times," which could be one save of a 10-persona gallery or ten separate single-persona saves; the badge doesn't distinguish.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared mechanics; note Personify is one of only two tools (with Lifestyle Balance) that are `SmartToolContainer`-only, not guided/step-locked.
- `docs/specs/18_CBT_ENGINE.md` §3 — "Single-page, `SmartToolContainer`-only" tools.
