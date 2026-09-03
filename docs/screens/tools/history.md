# Tools → History (shared) — `/tools/:toolType/history`

**Source:** `src/pages/ToolHistory.tsx` + `src/hooks/useToolHistory.ts` + `src/lib/toolHistorySummary.ts` + `src/components/tools/PayloadSummaryList.tsx`
**Personas:** Walt (traceable history/exports mindset), Maya (completion tracking) — both fit this screen's read-only, auditable-past-sessions framing better than any gamified surface.
**Tier:** Free — no gating.
**Zero-knowledge status:** Decrypts on open. Queries `journals` where `tags array-contains :toolType`, decrypts every matching doc, and parses it with `parseSmartToolPayload` — the only tool-related screen besides the tools themselves that performs decryption (the Hub's completion counts deliberately don't, per `useSmartToolCompletions`'s own doc comment).

## What it does

One generic, tool-agnostic "past completions" list, reused for all 9 SMART Tools via the `:toolType` route param — not 9 separate history pages. Each entry expands into its full field list.

## How it works

### Resolving the route param

`findTool(toolTypeParam)` looks up `TOOLS.find(t => t.toolType === toolTypeParam)` in `toolsRegistry.ts`. If no match (an invalid or unmapped `toolType`, or a tool like Urge Surfer/Resentment Burner that has no `toolType` at all — neither has a History route reachable from the Hub), the page renders a "That tool doesn't have a history view" empty state with a link back to `/tools`, rather than a 404 or crash.

### Fetching entries

`useToolHistory(toolType)` — enabled only when `user && db && toolType && isVaultUnlocked`. Queries `journals` (`uid == current`, `tags array-contains toolType`, ordered `createdAt desc`), then for each doc:
1. Skips it if `tags` includes `DRAFT_TAG` — in-progress sessions never show up here, only true completions.
2. Skips it if `!raw.isEncrypted || !raw.content` (defensive — every SMART Tool save is encrypted, so this mainly guards against malformed data).
3. Decrypts `content`, parses via `parseSmartToolPayload()`; if parsing fails or returns `null` (e.g. a genuinely freeform entry that happens to share a tag, or corrupt data), the entry is silently dropped (logged via `console.error`, not shown to the user).

There's also a defensive short-circuit: `if (user?.email?.endsWith('.mock')) return [];` — returns no data for mock/test accounts rather than attempting a real query.

### Rendering

- **Loading:** a pulsing "Loading…" card.
- **Empty:** "No completions yet" + a "Start your first session →" link back to the tool's own route (`tool.path`).
- **List:** one collapsed row per entry — date (`format(entry.createdAt, 'MMM d, yyyy')`) plus a one-line headline. The headline comes from `HEADLINE_FIELD[toolType]` (e.g. CBA → `behavior`, ABC → `activatingEvent`, DENTS → `scenario`, Thought Record → `situation`, Five Questions → `thought`); tools with no natural single-string field (Personify, Lifestyle Balance, Morning Intent) have no `HEADLINE_FIELD` entry, so every row falls back to just the date.
- **Expanded:** `<PayloadSummaryList data={entry.data} toolType={toolType} />` — a label + value row per present field (empty/falsy fields are filtered out via `isPresent()`). Labels come from `getFieldLabel()`: a per-`(toolType, key)` lookup table (`QUESTION_LABELS` in `toolHistorySummary.ts`) reproducing each tool's actual question text (some are dynamic functions that interpolate the tool's own scenario/behavior/thought, e.g. DENTS's `deny` label reads "If {scenario} happens, how exactly will you Deny it?"), falling back to `humanizeKey()` (camelCase → "Title Case") for anything unmapped. Special-cased value renderers exist for emotion-intensity arrays (Thought Record's `emotions`/`outcomeEmotions`, shown as "Anxious 70%, Sad 40%") and generic object arrays (Personify's `personas[]`, each rendered as its own mini card of `name`/`action`/`result`).

## Data model

Reads only — writes nothing. See `docs/screens/tools/README.md`'s "Storage: the Virtual Module pattern" for the underlying `journals/{id}` shape every entry here comes from.

## Gating & limits

None beyond the implicit vault-unlock requirement (the query itself is `enabled: ... && isVaultUnlocked`, and the route is inside `<VaultGate>` in `App.tsx` regardless).

## Known gaps / debt

- Failed-to-parse entries are silently dropped with only a `console.error` — a user with a genuinely corrupted or legacy-format doc for a given tool would see fewer entries than actually exist, with no on-screen indication anything was skipped.
- `HEADLINE_FIELD` and `QUESTION_LABELS` are hand-maintained per `SmartToolType` — a new guided tool needs an entry added to both (`toolHistorySummary.ts`) to get a good headline/labels; omitting them degrades gracefully (date-only headline, humanized-key labels) rather than breaking, but it's an easy thing to forget when shipping tool #10.

## Related docs

- `docs/screens/tools/README.md` — parent index, shared save/draft/history mechanics.
- `docs/screens/tools/hub.md` — the "History" button that links here from each tool's card.
- `docs/specs/18_CBT_ENGINE.md` §4.
