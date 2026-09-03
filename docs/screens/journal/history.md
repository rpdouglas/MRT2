# Journal → History — `/journal?tab=history`

**Source:** `src/components/journal/JournalHistory.tsx`
**Personas:** Walt (traceable long-term record), Maya (completion tracking), anyone reviewing past entries.
**Tier:** Free to browse; launches the tier-limited Analysis Wizard (see `analysis-wizard.md`).
**Zero-knowledge status:** Fetches the full `journals` collection for the user (`where('uid', '==', uid), orderBy('createdAt', 'asc')`) and decrypts every entry's `content` client-side (`isEncrypted` → `decrypt()`) before rendering — this is the only journal screen that bulk-decrypts history in memory.

## What it does

A virtualized, chronologically grouped timeline of every past journal entry, with client-side search, edit/delete actions, and the entry point into AI pattern analysis (the Analysis Wizard).

## How it works

### Fetch & decrypt pipeline
- `mapJournalSnapshot()` is the shared decrypt/transform helper (used by both the per-year and full-history fetch paths, per PROJ-95, to avoid duplicating the logic). For each doc: decrypt if `isEncrypted`, and on decryption failure, render the entry as `"🔒 [Locked - Decryption Failed]"` with an `isError` flag rather than crashing the list — a locked/undecryptable entry doesn't take down the whole history view.
- Entries tagged with `DRAFT_TAG` (in-progress guided-tool drafts, e.g. an unfinished SMART tool session) are filtered out — they aren't a finished journal entry yet.
- Decrypted content is parsed for an embedded SMART-tool payload (`parseSmartToolPayload`) — if an entry was actually a saved CBT/DBT tool session rather than freeform text, it renders via `PayloadSummaryList`/`toolHistorySummary` helpers instead of raw text (see `docs/screens/tools/` docs for the tool side of this).

### Layout
- Grouped Year → Month, virtualized via `react-virtuoso`, matching the pattern used on Tasks' Log tab. Default expanded state: current year + current month only.
- **Search** is entirely client-side and post-decrypt — there is no server-side search of ciphertext (by design; the server never sees plaintext to index).

### Actions per entry
- Edit — routes back to `Journal.tsx`'s `handleEdit`, which switches to the Write tab with the entry preloaded.
- Delete.
- Share (`ShareIcon`) — see the component for the exact share payload; typically a text export of the single entry.

### Analysis Wizard entry point
`JournalAnalysisWizard` is imported and rendered **here**, not in the Insights tab — `isWizardOpen = wizardOpenRequested && wizardDataReady`, gated on the full decrypted entry set being ready. This is a deliberate placement worth knowing if you're looking for the AI-analysis trigger and don't find it under Insights.

## Data model

| Collection | Encrypted? | What this screen does |
|---|---|---|
| `journals/{id}` | ✅ Content yes | Full read + client-side decrypt of every entry for the user; writes only via edit (delegates to the same save path as Write) or delete. |

## Gating & limits

None on browsing/search/edit/delete itself. The Analysis Wizard launched from here carries its own limits — see `analysis-wizard.md`.

## Known gaps / debt

None specific to this screen currently flagged in CLAUDE.md.

## Related docs

- `docs/screens/journal/README.md` — parent index.
- `docs/screens/journal/analysis-wizard.md` — the AI flow triggered from this tab.
- `docs/specs/01_JOURNAL.md` §2B ("History — The Timeline").
- PROJ-95 (`docs/projects/95_JOURNAL_HISTORY_PAGINATION.md`) — the shared decrypt-mapping refactor.
