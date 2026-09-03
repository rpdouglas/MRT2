# Journal → Analysis Wizard (modal) — launched from History

**Source:** `src/components/journal/JournalAnalysisWizard.tsx`, `hooks/useDeepPatternAnalysis.ts`, `hooks/useRateLimits.ts`
**Personas:** All, but the depth options map to different personas — Weekly for Ned's momentum check-ins, Deep Dive (90-day) for Walt/Maya's pattern analysis.
**Tier:** The core rate-limiting surface for free-tier AI cost control in the app.
**Zero-knowledge status:** One of the nine approved flows sending decrypted journal content to Gemini (`generateComparativeAnalysis` for weekly/monthly, `useDeepPatternAnalysis` for the 90-day deep dive) via the `generateAIInsights` Cloud Functions proxy — never directly from the client.

## What it does

An on-demand AI coach that reads the user's decrypted journal history (already decrypted by the parent History tab) and produces a comparative or deep-pattern analysis: themes, wins, risk factors, and suggested next actions the user can push straight into Tasks.

**Note on location:** despite the name suggesting an "Insights" feature, this modal is rendered and triggered from `JournalHistory.tsx`, not `JournalInsights.tsx`. If you're tracing "where does the AI analysis button live," look at the History tab.

## How it works

### Three-step wizard state machine
`step: 'select' | 'analyzing' | 'results'`, reset to `'select'` each time the modal reopens (handled via the React "adjust state during render on prop change" pattern, not an effect — avoids an extra render pass).

### Scope selection (`select` step)
Three cards, each independently gated by `checkEligibility(scope)`:
- **Weekly Check-in** — last 7 days vs. previous 7. Requires ≥7 analyzable entries.
- **Monthly Review** — last 30 vs. previous 30. Requires ≥30 entries.
- **Deep Dive (90 Days)** — requires ≥30 entries; uses `useDeepPatternAnalysis` instead of the standard comparative call.

`analyzableEntries` excludes any entry tagged `DRAFT_TAG` (in-progress guided-tool drafts) — they don't count toward the entry-count floor and aren't fed to the AI. Entry-count checks are bypassed entirely in `import.meta.env.DEV` (for local testing/screenshots), a detail worth knowing if a dev build's eligibility behavior looks inconsistent with docs written from prod behavior.

### Rate limiting (`useRateLimits.checkEligibility`)
After the entry-count floor, a second check against `UserProfile.usage_limits`:
- **Free tier:** 1 weekly analysis per 7 days, 1 monthly per 30 days, 1 deep-dive per 30 days.
- **Premium tier:** unlimited — bypasses the timestamp checks entirely.
- A card that fails the rate check (not the entry-count check) shows a "Limit Reached" overlay with an upgrade CTA routing to `/premium`; a card that fails only the entry-count check shows a progress bar toward the floor instead — the UI visibly distinguishes "you haven't journaled enough yet" from "you're rate-limited."
- This client-side check is defense-in-depth only — CLAUDE.md notes the authoritative enforcement is server-side in the `generateAIInsights` proxy.

### Analysis (`analyzing` step)
- Weekly/Monthly: builds two formatted text blocks (current period, previous period) from the decrypted entries — including a special case that renders embedded SMART-tool payloads (e.g. a saved ABC/CBA tool entry) as a labeled field list rather than raw JSON — then calls `generateComparativeAnalysis(currentTxt, prevTxt, scope)`.
- Deep Dive: delegates entirely to `useDeepPatternAnalysis()`'s own `analyze()`, which reports a `deepProgress` percentage shown in the spinner.

### Results (`results` step)
- Deep Dive results: `pattern_summary`, `relapse_risk_level` (Low/Moderate/High/color-coded), `core_triggers`, `emotional_velocity`, `hidden_correlations`, `long_term_advice`.
- Standard results: `trajectory` (Improving/other), `comparison_summary`, `key_themes`, `wins`, `blind_spots`, `actionable_advice`.
- Each suggested action has an "add to tasks" button (`handleAddToTasks`) — creates a `tasks/{id}` doc with `source: 'ai'`, `dueDate` = today+7, and `aiMeta: { sourceContext }` when available (see the Tasks docs' "AI Context Cards" section for how that renders downstream).
- "Save to Insights Log" persists the full result to the `insights` collection (unencrypted — plaintext AI-generated analysis, not raw journal content) via `saveInsight()`.

## Data model

| Collection | Encrypted? | What this flow writes |
|---|---|---|
| `insights/{id}` | ❌ No | AI-generated summary/themes/risk assessment — not the source journal content itself. |
| `tasks/{id}` | ❌ No | Optional — one doc per "add to tasks" click, `source: 'ai'`. |

Reads decrypted `journals` content in memory only (already decrypted by the parent History tab) — never re-persisted in plaintext.

## Gating & limits

The rate-limiting scheme described above **is** the gating mechanism for this screen — see "How it works." Summary:

| Scope | Free tier | Premium |
|---|---|---|
| Weekly | 1 per 7 days, needs ≥7 entries | Unlimited |
| Monthly | 1 per 30 days, needs ≥30 entries | Unlimited |
| Deep Dive (90-day) | 1 per 30 days, needs ≥30 entries | Unlimited |

## Known gaps / debt

None specific to this flow currently flagged in CLAUDE.md — this is actually the reference implementation for how AI rate limiting is *supposed* to work elsewhere (contrast with `AudioRecorder.tsx`'s Voice-to-Vault, which has none of this).

## Related docs

- `docs/screens/journal/history.md` — where this modal is actually launched from.
- `docs/specs/01_JOURNAL.md` §3 ("The Analysis Wizard").
- `docs/screens/tasks/today.md` / `tasks/later.md` — where AI-sourced tasks created here end up.
