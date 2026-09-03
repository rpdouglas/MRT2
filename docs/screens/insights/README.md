# Insights — `/insights`

**Parent page:** `src/pages/InsightsLog.tsx` is the landing screen at `/insights` — a single flat timeline with a client-side filter chip row (`all` / `journal` / `workbook`), not a tabbed screen. `src/pages/RecoveryCapital.tsx` (`/insights/rosc`) is a genuinely separate route with its own three internal tabs (`snapshot` / `trends` / `history`, a local `Tab` type), reached from a "View trends & history" link and a "Start check-in" CTA embedded in the Log via `ROSCSummaryCard.tsx`.

This folder covers both: the Log is one file, ROSC's three tabs are one file each — ROSC has enough distinct reading modes (a live snapshot, a longitudinal chart, a scrollable past-assessments list) to warrant separate docs, matching the Journal/Vitality folder pattern.

| Screen | File | Component(s) |
|---|---|---|
| Insights Log | [`log.md`](./log.md) | `InsightsLog.tsx`, `ROSCSummaryCard.tsx` |
| Recovery Capital — Snapshot | [`recovery-capital-snapshot.md`](./recovery-capital-snapshot.md) | `RecoveryCapital.tsx` (tab: snapshot), `ROSCLatestCard.tsx`, `ROSCPillCapsules.tsx`, `ROSCCheckIn.tsx` |
| Recovery Capital — Trends | [`recovery-capital-trends.md`](./recovery-capital-trends.md) | `RecoveryCapital.tsx` (tab: trends), `ROSCTrendChart.tsx` |
| Recovery Capital — History | [`recovery-capital-history.md`](./recovery-capital-history.md) | `RecoveryCapital.tsx` (tab: history), `ROSCAssessmentCard.tsx` |

**Shared data layer:** `useROSCAssessments()` (`src/hooks/useROSCAssessments.ts`) is the single read/write path for all three ROSC tabs and `ROSCSummaryCard.tsx` — one `useQuery` (`['rosc_assessments', uid]`, reading `users/{uid}/rosc_assessments`) and one `useMutation` that both tiers share, branching internally on `userTier`. The Insights Log itself reads a separate, unrelated collection (`insights`, root-level) via `getInsightHistory()` in `src/lib/insights.ts`.

**Personas:** Walt (long-horizon trend reading, traceable AI evidence, zero interest in gamification) and Maya (auditable scores, `journalEntriesAnalysed` transparency, completion-style tracking) are ROSC's primary designed-for personas per `docs/projects/49_ROSC_MATRIC.md`. Lisa is a secondary persona (the monthly/weekly check-in as a self-care practice). The Insights Log itself is persona-neutral — it's the landing point for AI output from Journal Analysis Wizard, Deep Pattern Analysis, and Workbook analysis, so it's relevant to whichever persona generated the underlying insight.

**Tier:** Mixed, and split differently across the two screens:
- **Insights Log:** free — no gate on the screen itself; it only *displays* insights, and gating already happened at the point each insight was generated (see `docs/screens/journal/` for those flows).
- **Recovery Capital:** free tier gets self-report-only scores on a monthly cadence; premium gets AI-augmented scores (reading decrypted journal history) plus a full AI narrative, on a weekly cadence. Both tiers reach all three tabs — there's no route-level `<PremiumGate>`; the tier branch lives inside `useROSCAssessments`' mutation and `RecoveryCapital.tsx`'s conditional narrative rendering (see `recovery-capital-snapshot.md` and `-history.md`).

**Zero-knowledge status:**
- `insights/{id}` (root collection): **fully unencrypted**, matching CLAUDE.md's schema table — `summary`, `pillars`, `suggested_actions`, etc. are all plaintext. This is by design: an insight is already AI-generated commentary saved *after* the sensitive source content (journal/workbook) was decrypted and sent through one of the nine approved Gemini flows: the insight's plaintext-on-write is a deliberate re-derivation, not a leak of the original encrypted content.
- `users/{uid}/rosc_assessments/{id}` (subcollection, confirmed against `firestore.rules` and `src/lib/rosc.ts` — CLAUDE.md's table lists it by collection name only): **partially encrypted**, and the code confirms CLAUDE.md's split exactly — `scores.*.score` (and `.selfReportedScore`/`.evidenceCount`), `totalScore`, `trajectory`, and `journalEntriesAnalysed` are plaintext fields on the document; `encryptedAIContext` (narrative, strengths, growth_areas, per-domain evidence and actions, JSON-stringified) is the sole AES-GCM field. `useROSCAssessments.ts`'s premium branch is one of the nine approved Gemini flows (`generateROSCAnalysis`, called from `useROSCAssessments.ts` per CLAUDE.md's list). `rosc_assessments` is included in the PIN-rotation/crypto-shredding sweep (`src/lib/rotation.ts`).

## Related docs

- `docs/specs/10_INSIGHTS.md` — Insights Log spec; broadly accurate at the schema level (see `log.md` for drift notes).
- `docs/projects/49_ROSC_MATRIC.md` — the ROSC feature's founding spec (research grounding, schema, ZK audit) plus two shipped addenda (§9 Monthly Action Items, §10 full-screen route + trend charts + premium weekly cadence) that supersede several of the original spec's body sections. Read the addenda, not just §1–8.
- `docs/projects/53_ROSC_PILL_CAPSULE.md` — the pill-capsule visual replacement for the original (never-shipped) radar chart.
- CLAUDE.md's Zero-Knowledge Encryption Boundary table and its nine approved Gemini flows.
