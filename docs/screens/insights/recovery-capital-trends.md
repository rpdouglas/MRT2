# Insights → Recovery Capital → Trends — `/insights/rosc` (tab: trends)

**Source:** `src/pages/RecoveryCapital.tsx` (tab: trends) + `src/components/insights/ROSCTrendChart.tsx` + `src/lib/roscTrends.ts`
**Personas:** Walt — this tab is his primary reason to visit `/insights/rosc` at all (longitudinal shape-of-recovery-capital-over-time, per `docs/projects/49_ROSC_MATRIC.md`'s persona framing). Secondary: Maya (exact per-domain trend lines alongside the aggregate).
**Tier:** Free and premium both see this tab fully — it charts whatever assessments exist regardless of tier; a free-tier user just has fewer, monthly-cadence points instead of premium's weekly ones.
**Zero-knowledge status:** Reads only plaintext fields (`totalScore`, `scores.*.score`, `createdAt`, `trajectory`) from `users/{uid}/rosc_assessments`. No decryption, no new Firestore read — reuses the same `assessments` array `useROSCAssessments()` already fetched for the Snapshot tab. Renders correctly with the vault locked.

## What it does

Two stacked charts plotting every past Recovery Capital assessment (not just an adjacent pair): an area chart of `totalScore` (0–40) over time, and a line chart with one line per domain (Health/Home/Purpose/Community, 0–10 each). A 6/12/All range toggle controls how many recent points are shown.

## How it works

### Why two charts, not one
`totalScore` (0–40) and the four domain scores (0–10) are different scales — a single chart with a dual Y-axis would visually misrepresent one series relative to the other, so `ROSCTrendChart.tsx` renders a Recharts `AreaChart` for the total and a separate `LineChart` for the four domains, sharing the same X-axis labels.

### Data shaping (`buildROSCTrendSeries`, `src/lib/roscTrends.ts`)
Maps each `ROSCAssessment` to a flat `{ts, label, health, home, purpose, community, total, trajectory}` point, sorts ascending by `createdAt` (the source `assessments` array is fetched newest-first), then slices to the selected window size (6/12, or all when `range === 0`). The X-axis label format is cadence-aware: `'MMM d'` for weekly cadence, `'MMM yy'` for monthly.

### Range toggle
A local `range` state (`useState<number>(12)`, default 12) drives `RANGE_OPTIONS` (`6`, `12`, `All`→`0`). Recomputes `buildROSCTrendSeries` via `useMemo` on every change — no separate fetch, since all assessments are already in memory.

### Domain line colors
The four `LineChart` lines pull their stroke color from `ROSCPillCapsules.tsx`'s exported `PILLARS` const (`gradA` per domain), not a chart-local palette — deliberately, so a domain's color always matches between this chart and the pill-capsule bars on the Snapshot/History tabs.

### Empty and single-point states
- Zero assessments: a dashed-border empty state ("Your trend appears here... Complete your first check-in").
- Exactly one assessment: the chart still renders (a single dot/short area), with an explicit caption above it ("One snapshot so far — your trend line appears after your next check-in") rather than letting a one-point line chart look broken or empty.

### Accessibility
The whole chart container carries `role="img"` and an `aria-label` built by `summariseTrendForA11y()` (`src/lib/roscTrends.ts`) — a plain-language sentence describing point count, date range, total-score direction and magnitude of change, latest total, and latest trajectory. This satisfies the PROJ-49 spec's Open Question #4 (minimum bar: `aria-label` with a text summary) rather than a separate data-table view.

## Data model

No writes on this tab. Reads the same `users/{uid}/rosc_assessments/{id}` documents as the Snapshot and History tabs (see `recovery-capital-snapshot.md`'s Data model table for the full field list). Only the plaintext fields are used here: `createdAt`, `totalScore`, `scores.{health,home,purpose,community}.score`, `trajectory`. `encryptedAIContext` is never touched by this tab.

## Gating & limits

None specific to this tab — it's a pure read/render of already-fetched, already-plaintext data. The underlying assessment-creation cadence (monthly free / weekly premium) is documented in `recovery-capital-snapshot.md`; more frequent premium check-ins simply mean more points on this chart, not a different chart behavior.

## Known gaps / debt

- The PROJ-49 spec's stretch goal (Open Question #4, option b — a data-table view alongside the chart for Walt's data-dense preference) was not built; only the `aria-label` summary shipped. Not a bug, but a documented unshipped stretch item if Walt-specific feedback later asks for it.
- No visible axis unit reminder that domain-line values cap at 10 vs. the area chart's 40 — both charts do label their Y-axis ticks explicitly (`[0,10]` / `[0,40]`) so this is a minor legibility note, not a real gap, unlike the Snapshot tab's un-labeled "/ 40".

## Related docs

- `docs/screens/insights/README.md` — parent index.
- `docs/screens/insights/recovery-capital-snapshot.md`, `-history.md` — the other two tabs; Snapshot's Data model table documents the full `rosc_assessments` schema this tab reads a subset of.
- `docs/projects/49_ROSC_MATRIC.md` §10.2 — the trend-chart addendum, including why it supersedes the spec's original (never-shipped) radar chart and the never-actually-shipped `ROSCRadarChart.tsx`.
