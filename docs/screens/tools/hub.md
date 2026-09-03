# Tools → Hub — `/tools`

**Source:** `src/pages/ToolsHub.tsx` + `src/lib/toolsRegistry.ts` (shared metadata registry, also used by `ToolHistory.tsx`) + `src/hooks/useSmartToolCompletions.ts` + `src/hooks/useGuidedDraft.ts` (`hasGuidedDraft`)
**Personas:** Maya (primary — "core user for SMART Recovery, CBT... workbooks," per `docs/PERSONAS.md`); Ned at his Day 90 Pink Cloud Crash ("surface CBT tools" as gamification recedes).
**Tier:** Free — the Hub itself has no gating; individual tools' AI extras are gated (see `README.md`).
**Zero-knowledge status:** No direct Firestore reads of content — `useSmartToolCompletions` reads only plaintext `tags` off `journals` docs (no decryption) to compute per-tool completion counts and draft existence.

## What it does

The central directory for all 11 tool routes plus the not-yet-built "SMART Goal" placeholder. Groups tools into four collapsible sections by "recovery moment" rather than by clinical category, and — for the 9 real, journal-persisted tools — surfaces per-tool progress (completion count, resumability) so the user doesn't have to remember where they left off.

## How it works

### Four moment-based sections

`PHASE_ORDER = ['right-now', 'before', 'after', 'big-picture']`, each with its own header color/icon/subtitle from `PHASE_META` (`toolsRegistry.ts`) — reusing the ROSC Matrix's 4 pillar hues (rose/orange/violet/emerald) rather than a single Tools color:

| Phase | Label | Tools |
|---|---|---|
| `right-now` | Right Now — "In the moment, for cravings and crisis" | Urge Surfer, Resentment Burner |
| `before` | Before It Happens — "Plan ahead of a risky moment" | D.E.N.T.S., Cost Benefit Analysis, Morning Intent |
| `after` | After a Hard Moment — "Process what just happened" | ABC Coping, Personify & Disarm, Thought Record, Five Questions, plus the non-Tools-Hub-route "Thought Challenge" game card (`/games/thought-challenge`) |
| `big-picture` | Big Picture — "Step back and plan" | Lifestyle Balance, SMART Goal (Coming Soon) |

**All four sections start collapsed.** `const [expanded, setExpanded] = useState<Record<ToolPhase, boolean>>({ 'right-now': false, before: false, after: false, 'big-picture': false })` — every section requires a tap to open, including Right Now. `docs/specs/18_CBT_ENGINE.md` states Right Now is "expanded by default so crisis tools are always visible with no interaction" — that does not match the current code (confirmed by `ToolsHub.tsx`'s own header comment: "all collapsed by default"). Treat the spec line as stale; follow the code.

Tapping a section header toggles `expanded[phase]`; the count badge next to each header's title shows `tools.length` for that phase regardless of expand state.

### Card variants (`ToolCard`)

Three distinct card shapes, chosen by the tool's registry entry:

1. **`status: 'coming_soon'`** — greyed out, `cursor-not-allowed`, a "Coming Soon" pill. Currently only SMART Goal.
2. **`tool.toolType` set** (the 9 real SMART Tools) — the richer card: icon, title, optional "Best for" pill (`tool.bestFor`, e.g. "Before a decision"), description, optional time estimate (`tool.timeEstimate`, e.g. "~8 minutes"), and a completion badge ("Completed N times") once `count > 0`. Below that, up to three buttons:
   - **Start Fresh** (`${tool.path}?fresh=1`) — always shown.
   - **Resume** — shown only when `canResume` is true: `Boolean(tool.hasGuidedFlow) && (hasGuidedDraft(tool.toolType) || hasDraftDoc[tool.toolType])` — i.e. only for the six guided-flow tools, and only when either a same-session `sessionStorage` draft or a cross-session Firestore `DRAFT`-tagged doc exists. Personify and Lifestyle Balance (no `hasGuidedFlow`) never show a Resume button here even though `SmartToolContainer`'s own `resumeSession` will still silently rehydrate their last saved state when opened directly.
   - **History** — shown once `count > 0`, links to `/tools/${tool.toolType}/history`.
3. **No `toolType`** (Urge Surfer, Resentment Burner) — the original simple card: icon, title, description, the whole card is one big `<Link>` to `tool.path`. No entry-mode buttons, no completion badge — neither tool has a completion count that means anything (Resentment Burner never persists; Urge Surfer isn't tracked as a SMART Tool completion).

### Data backing the cards

One shared query, `useSmartToolCompletions()` — a single `journals` query (`where tags array-contains 'SMART Tool'`), scanned client-side into `counts: Partial<Record<SmartToolType, number>>` (non-`DRAFT` docs) and `hasDraftDoc: Partial<Record<SmartToolType, boolean>>` (`DRAFT`-tagged docs) — no decryption, since tags are plaintext. Backs every card's completion badge and (combined with `hasGuidedDraft`'s `sessionStorage` check) the Resume button's cross-session half.

### Intro banner

A static, non-dismissible info strip above the sections: "SMART Recovery & CBT: These tools are designed to help you interrupt the cycle of addiction by applying logic and planning to emotional urges."

## Data model

The Hub itself writes nothing. It reads:

| Source | Encrypted? | Notes |
|---|---|---|
| `journals` (`tags array-contains 'SMART Tool'`) | N/A — only `tags` read | Drives completion counts + draft-existence per tool, via `useSmartToolCompletions` |
| `sessionStorage` (`guidedDraft_${toolType}`) | Plaintext, device-local | `hasGuidedDraft()` — same-session Resume signal for guided tools only |

## Gating & limits

None at the Hub level — every card is reachable by every tier. (Individual tools' AI extras are gated; see `README.md`'s "AI coaching" section and `cba.md`.)

## Known gaps / debt

- Spec/code drift on the Right Now section's default-expanded state (see above) — worth a spec fix, not a code fix, since the collapsed-by-default behavior appears deliberate (matches every other section) rather than an oversight.
- Resume is guided-flow-only by card design; Personify/Lifestyle Balance's own `SmartToolContainer`-level resume (silently rehydrating on open) has no visible affordance on the Hub card telling the user a previous session exists.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared save/draft/history mechanics.
- `docs/specs/18_CBT_ENGINE.md` §4 (Routing & Discovery).
- `docs/projects/71_TOOLS_HUB_REGROUPING.md` — the four-phase accordion redesign.
