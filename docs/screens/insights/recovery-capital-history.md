# Insights → Recovery Capital → History — `/insights/rosc` (tab: history)

**Source:** `src/pages/RecoveryCapital.tsx` (tab: history) + `src/components/insights/ROSCAssessmentCard.tsx`
**Personas:** Maya — the "Based on N journal entries" transparency line and per-domain evidence on expansion are exactly her traceability/auditability need. Walt — secondary, for reading back individual past narratives rather than just the aggregate trend.
**Tier:** Free and premium both see every past assessment as a compact row. The expanded content differs by *what that specific assessment's `encryptedAIContext` contains*, not by the viewer's current tier — a free-tier user who was briefly premium still sees that period's full AI narrative on expansion; a lifetime-free user sees only the "Upgrade to Premium" prompt on every card, since none of their assessments ever populated `encryptedAIContext`.
**Zero-knowledge status:** Each card's collapsed state is fully plaintext (`totalScore`, `trajectory`, `createdAt`). Expanding a card triggers a client-side, on-demand decrypt of that one assessment's `encryptedAIContext` — never decrypted on list render, only on explicit tap, and only if `isVaultUnlocked`.

## What it does

A scrollable list of every past Recovery Capital assessment *except* the most recent one (which lives on the Snapshot tab) — `assessments.slice(1)`. Each row is collapsed by default (month/score/trajectory at a glance); tapping expands it in place into the same glassmorphic pill-capsule card style used on the Snapshot tab, with the AI narrative decrypted and shown if available.

## How it works

### List composition
`RecoveryCapital.tsx` passes `assessments.slice(1)` to this tab and, for each row `i`, passes `assessments[i + 2]` as that row's `previous` — i.e., pill-capsule deltas and the trajectory pill on each history card compare against the assessment immediately *before* it in time, not against the current-latest one. With fewer than 2 total assessments, the tab shows "History appears here after your next check-in" instead of an empty list.

### Expand-to-decrypt (`ROSCAssessmentCard.tsx`)
`handleExpand` toggles `expanded` and, only on the transition to expanded and only if `context` hasn't already been fetched this session, calls `decrypt(assessment.encryptedAIContext)` and `JSON.parse`s the result into `{narrative, strengths, growth_areas, evidence, actions}`. Three branches on re-expand:
- `encryptedAIContext` is empty (self-report-only assessment, i.e. was created on free tier or with a locked vault): shows "Upgrade to Premium for AI-powered insights on your recovery" instead of a narrative section.
- `encryptedAIContext` is present but `!isVaultUnlocked`: shows a locked-padlock placeholder ("Unlock vault to read your recovery story") — the pill-capsule scores above it still render normally, since those are plaintext.
- `encryptedAIContext` present and vault unlocked: shows the decrypted narrative, a Strengths block, a Growth Areas ("Areas to Nurture") block, and — if `actions` is present in the blob — a per-domain "Your Next Actions" section with one-tap "Add to Tasks" buttons (see below). A brief "Unlocking your recovery story…" loading state covers the decrypt call itself.

### Add to Tasks (per-domain actions)
`handleAddToTasks(domain, actionText)` calls `useTaskOperations().addTask()` with `source: 'ai'`, `priority: 'Medium'`, a 7-day due date, and `aiMeta: { sourceContext: "{Domain} · {date} Recovery Capital check-in" }` — note this passes `sourceContext` only, **not** `sourceRef` (contrast with the Insights Log's `handleAddToTasks`, which passes `sourceRef` only — see `docs/screens/tasks/today.md`'s note on inconsistent `aiMeta` shapes across AI-task callers). A toast confirms the add with a "View Tasks" action button; the per-domain button flips to a checkmark and disables for the rest of the session (`addedActions`, a local `Set<ROSCDomain>` — not persisted, resets on remount, same session-only pattern as the Insights Log's own add-to-tasks state).

### Journal entry count
"Based on N journal entries" renders whenever `journalEntriesAnalysed > 0` — the Maya-facing transparency line confirming how much journal history actually fed that assessment's AI scoring (0 for self-report-only assessments, since that field is only populated on the premium/AI path).

### Compact prop
Both the History tab's cards and (implicitly) any other embedding pass `compact` — when `true`, the expanded card hides its own `ROSCPillCapsules` render (`{!compact && <ROSCPillCapsules .../>}`), so History's expanded view shows the narrative/evidence sections without redundantly re-rendering the segmented bars a user just saw collapsed above it in the list.

## Data model

No writes on this tab (decryption is read-only). Reads the same `users/{uid}/rosc_assessments/{id}` documents as Snapshot and Trends — see `recovery-capital-snapshot.md`'s Data model table for the full field list, including the `scores.*.score`/`totalScore`/`trajectory`/`journalEntriesAnalysed` (plaintext) vs. `encryptedAIContext` (AES-GCM) split. This tab is the only one of the three that ever calls `decrypt()` on `encryptedAIContext`.

Decrypted `encryptedAIContext` shape (client-side only, never persisted in this form):

| Field | Notes |
|---|---|
| `narrative` | 2–3 sentence AI overview |
| `strengths[]` | Top domains with justification |
| `growth_areas[]` | Domains flagged for compassionate attention |
| `evidence` | Per-domain array of brief journal references (not verbatim entries, per the Gemini prompt's constraints) |
| `actions` | Per-domain (`health`/`home`/`purpose`/`community`) suggested next step — added in the PROJ-49 §9 addendum |

## Gating & limits

None on navigating or expanding cards — any user can open any of their own past assessments. The gate is *content-shaped*, not access-shaped: what's inside an expanded card depends on whether that assessment was created with AI analysis (premium + unlocked vault at the time) or not, and whether the vault is unlocked *right now* to read it.

## Known gaps / debt

- The `aiMeta` shape passed to `addTask()` here (`sourceContext` only) is inconsistent with the Insights Log's own add-to-tasks call (`sourceRef` only) — both produce valid but differently-linkable AI-sourced tasks. See `docs/screens/tasks/today.md`'s Known gaps for the full cross-caller inconsistency.
- `addedActions` (which per-domain action buttons show as already-added) is session-only, component-local state — reopening a collapsed-then-re-expanded card, or navigating away and back, loses the "already added" indication even though the underlying task still exists.
- A card's `previous` comparison (`assessments[i + 2]`) is always the chronologically-adjacent assessment, which is correct for the pill-capsule deltas, but there's no way from this tab alone to compare two arbitrary non-adjacent past assessments — that comparison only exists implicitly via the Trends tab's chart.

## Related docs

- `docs/screens/insights/README.md` — parent index.
- `docs/screens/insights/recovery-capital-snapshot.md` — full `rosc_assessments` schema table; the check-in flow that creates these documents.
- `docs/screens/insights/recovery-capital-trends.md` — the longitudinal chart view of the same data.
- `docs/screens/tasks/today.md` — where "Add to Tasks" actions land, and the cross-caller `aiMeta` inconsistency.
- `docs/projects/49_ROSC_MATRIC.md` Addendum §9 — the per-domain "Actions for This Month" feature this tab's expanded card renders.
