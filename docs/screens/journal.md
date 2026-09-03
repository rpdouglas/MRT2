# Journal — `/journal`

**Source:** `src/pages/Journal.tsx` + `components/journal/JournalEditor.tsx`, `JournalHistory.tsx`, `JournalInsights.tsx`, `JournalAnalysisWizard.tsx`, `AudioRecorder.tsx`
**Personas:** David (crisis processing), Walt (deep reflection/export), Ned (Pink Cloud momentum), Maya (structured tracking) — the app's primary "input" surface, relevant to every persona.
**Tier:** Mixed — see Gating & limits below. Base journaling is free; AI analysis is rate-limited on free tier; custom templates are premium (but not fully enforced — see gap below).
**Zero-knowledge status:** `journals/{id}` content is AES-GCM encrypted client-side (`IV:Ciphertext`); `mood`/`tags`/`timestamps` on the same doc are plaintext by design (needed for unencrypted charting in Insights without a full decrypt pass). This screen is one of the nine approved flows allowed to send decrypted content to Gemini (see CLAUDE.md's Zero-Knowledge Encryption Boundary section).

## What it does

The central place users write recovery journal entries (text or voice), browse their history, and get AI-generated pattern analysis across past entries. Three tabs, driven by a URL search param so tab state survives refresh/deep-links: `?tab=write|history|insights`.

## How it works

`Journal.tsx` itself is a thin shell — `useSearchParams` drives `activeTab`, and it hands off entirely to one of three components per tab. It also owns `editingEntry` state so History → "edit" can hand a `JournalEntry` back to the Write tab, and reads a `?template=` param to preselect a template when arriving from a deep link (e.g. a Dashboard/Anchor shortcut).

### Write tab — `JournalEditor.tsx`
- Text entry, plus voice-to-text via `AudioRecorder.tsx`: records audio, base64-encodes it, and sends it to Gemini 2.5 Flash (via the `generateAIInsights` Cloud Functions proxy — never directly from the client) for transcription + mood score + smart tags. This is one of the nine approved Gemini flows, and per CLAUDE.md it currently has **no tier check and no rate limit** — a live, uncapped cost exposure, not a design decision.
- Templates come from `src/data/journalTemplates.ts` (built-in) or user-authored custom templates (`users/{uid}/templates/{id}` — unencrypted structural prompt text, not personal disclosure, per the CLAUDE.md schema table).
- On save, calls `onEntrySaved` → clears the `template` param and switches to the History tab.

### History tab — `JournalHistory.tsx`
- Virtualized list (`react-virtuoso`), grouped by year/month, matching the pattern used on the Tasks Log tab.
- Search is client-side, over already-decrypted-in-memory entries — there is no server-side search of ciphertext (there couldn't be, by design).
- "Edit" on an entry routes back to the Write tab via `handleEdit` in `Journal.tsx`.

### Insights tab — `JournalInsights.tsx`
- Charts (mood over time, weekly rhythm) built from the plaintext `mood`/`tags`/`timestamps` fields — no decryption needed for the charts themselves.
- Surfaces `JournalAnalysisWizard.tsx` — the on-demand AI pattern-analysis flow. Reads decrypted journal history, calls `generateComparativeAnalysis`/deep-pattern analysis via Gemini (approved flow), and writes results to the `insights` collection.

## Data model

| Collection | Encrypted? | Notes |
|---|---|---|
| `journals/{id}` | ✅ Content yes | `mood`, `tags`, timestamps are plaintext (chartable without decrypting); entry body is `IV:Ciphertext` AES-GCM. |
| `users/{uid}/templates/{id}` | ❌ No | Custom journal templates — structural prompt text only. |
| `insights/{id}` | ❌ No | Written by `JournalAnalysisWizard`'s AI analysis output. |

## Gating & limits

- **AI Analysis Wizard** (`useDeepPatternAnalysis`/comparative analysis): rate-limited via `useRateLimits.ts` reading `UserProfile.usage_limits`, enforced server-side too in the `generateAIInsights` proxy. Free tier: 1 weekly analysis per 7 days, 1 monthly per 30 days, 1 deep-dive per 30 days — each with a minimum entry-count floor (7/30/30 respectively). Premium: unlimited, bypasses the timestamp checks.
- **Custom templates**: UI-gated behind `<PremiumGate>` on the "create template" button in `JournalEditor.tsx`, but per CLAUDE.md this is a known, live enforcement gap — the underlying `/templates` route and `TemplateEditor.tsx` have no tier check at all, so any authenticated free user can reach template creation directly by URL.
- **Voice-to-Vault (`AudioRecorder.tsx`)**: no tier check, no rate limit at all (live gap, flagged in CLAUDE.md).

## Known gaps / debt

- `AudioRecorder.tsx`'s Gemini call has no cost control — flag if you touch this file.
- Custom-template tier gating is enforced only at the button, not the route (`/templates`, `TemplateEditor.tsx`) — a free user can bypass by URL.

## Related docs

- `docs/specs/01_JOURNAL.md` — existing spec, broadly accurate; written pre-URL-param-tab-state and doesn't call out the two gating gaps above.
- `docs/specs/12_USER_GUIDE.md` — end-user-facing "My Journal" guide content lives in `docs-site/guide/03-journal-and-ai.md`.
- `docs/projects/50_GUIDED_CBT.md` — related but distinct AI-coaching flow (not on this screen; lives in the Workbooks/Tools surfaces).
- CLAUDE.md → "Known live gap, not yet fixed" — the three uncapped Gemini call sites, two of which touch this screen (`AudioRecorder.tsx`; `WorkbookSession.tsx`'s `getGeminiCoaching` is a different screen).
