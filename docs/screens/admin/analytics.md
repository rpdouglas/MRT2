# Admin → Analytics — `/admin` (tab: analytics)

**Source:** `src/pages/AdminDashboard.tsx` (`loadAnalytics`, `logs`/`metricsLoading` state) + `src/components/admin/AnalyticsCharts.tsx`
**Personas:** Alex (CEO/Product Owner — Gemini cost monitoring is explicitly one of his core objectives per `docs/governance/INTERNAL_PERSONAS.md`).
**Tier:** N/A — not tier-gated; admin-only (see `docs/screens/admin/README.md` for the access-control mechanism).
**Zero-knowledge status:** `ai_logs` is unencrypted per CLAUDE.md's collection table — nothing here decrypts anything. The docs carry token counts and model names only, not prompt/response content (see Data model).

## What it does

The default tab (loads first on `/admin`). A read-only cost/usage dashboard for the `generateAIInsights` Cloud Functions proxy — every approved Gemini call funnels through that proxy, and each one writes an `ai_logs` doc. This tab visualizes the most recent 100 of them: which models are being called and how many tokens they're burning.

## How it works

- `AdminDashboard.tsx` fetches on mount (gated by `isAdmin && user && db`, in a `useEffect`): `query(collection(db, 'ai_logs'), orderBy('timestamp', 'desc'), limit(100))`, then `getDocs`. This is a one-shot fetch, not a live listener — the tab does not update in real time and there's no manual refresh button; revisiting the tab does not re-fetch (`loadAnalytics` only runs once, keyed on `[isAdmin, user]`).
- `AnalyticsCharts.tsx` (a pure presentational component, takes `logs: AIUsageLog[]` as a prop) derives two views client-side, no further Firestore reads:
  1. **Request Distribution** (donut/pie, Recharts `PieChart`) — count of logs grouped by `log.model` (e.g. Gemini Flash vs. Pro), built via a simple `reduce`.
  2. **Recent Token Usage** (bar chart) — the most recent 20 logs (`logs.slice(0, 20).reverse()`), token count (`usage.totalTokens`) per call, x-axis labeled by `HH:MM` of `timestamp`. A header badge shows the sum of `totalTokens` across all 100 loaded logs (not just the 20 charted), labeled "Total".
- Empty state: if `logs.length === 0`, renders "No AI usage logs found yet. Use the app to generate some data." instead of empty charts.
- Chart colors are a fixed 4-color palette (`['#8884d8', '#82ca9d', '#ffc658', '#ff8042']`), cycled with modulo if there are more than 4 distinct models.

## Data model

| Field on `ai_logs/{id}` (as read by `AIUsageLog` interface) | Notes |
|---|---|
| `model` | String model identifier, e.g. a Gemini variant name. |
| `timestamp` | Firestore `Timestamp`. Guarded with `log.timestamp?.toDate` before formatting — falls back to `'N/A'` on the bar chart if missing/malformed. |
| `usage.totalTokens` | Number. |
| `usage.promptTokens` / `usage.candidatesTokens` | Typed on the interface but not currently plotted by this tab. |

Per `firestore.rules`, `ai_logs` allows `create` by the owning uid (`isCreatingOwnedResource()` — written by the client/proxy per call) and `read` only via `isAdmin()` (the custom-claim check). This tab is the only in-app reader of the collection.

## Gating & limits

None beyond the page-level admin gate described in `docs/screens/admin/README.md`. No pagination past the first 100 logs, no date-range filter, no per-user breakdown or cost-in-dollars conversion.

## Known gaps / debt

- One-shot fetch capped at 100 logs with no refresh control or pagination — for a busy period this window can roll past before an admin looks at it.
- No cost ($) conversion, only raw token counts — turning that into spend requires knowing current Gemini pricing out-of-band.
- No breakdown by which of the nine approved Gemini flows produced a given log (only `model` and token counts are surfaced), so this tab can show *that* usage spiked but not *which feature* caused it without cross-referencing elsewhere.

## Related docs

- `docs/screens/admin/README.md` — parent index, access control.
- `docs/specs/08_ADMIN.md` §2A ("Telemetry (Health)" covers Health, not Analytics directly — Analytics corresponds to the superseded `03_ADMIN.md` §2A "Analytics (Gemini Metrics)", still accurate at the feature level despite that file being marked superseded).
