# Admin → Health — `/admin` (tab: health)

**Source:** `src/components/admin/ErrorLogViewer.tsx` + `analyzeSystemHealth` (`src/lib/gemini.ts`)
**Personas:** Taylor (Support & Moderation — the primary day-to-day operator of this tab per `docs/governance/INTERNAL_PERSONAS.md` §1, cited in the README), Dev.
**Tier:** N/A — not tier-gated; admin-only (see `docs/screens/admin/README.md`).
**Zero-knowledge status:** `client_errors` is unencrypted operational telemetry — it was never encrypted user content in the first place, so there is nothing to decrypt here. **This tab makes one of CLAUDE.md's nine approved Gemini flows** (`ErrorLogViewer.tsx` → `analyzeSystemHealth`, PROJ-98, admin-only) — verified below that its payload is aggregated crash metadata, not personal recovery content.

## What it does

A crash-monitoring tab: shows the 100 most recent client-side error reports, lets an admin delete individual entries, and — on demand — sends an aggregated summary of the currently-loaded errors to Gemini for a structured triage report (status, root-cause guesses, suggested fixes).

## How it works

- **Fetch:** `useQuery({ queryKey: ['client_errors'], ... })` (TanStack Query) runs `query(collection(db, 'client_errors'), orderBy('timestamp', 'desc'), limit(100))` → `getDocs`. Despite using `useQuery`, this is still a capped one-shot fetch per the query — no realtime `onSnapshot`, but TanStack's default refetch-on-window-focus behavior is not disabled here, so revisiting/refocusing the tab can silently re-run it (unlike Analytics's genuinely single `useEffect`-gated fetch).
- **Empty state:** `errors.length === 0` renders a green "System Healthy" card instead of the list.
- **List:** virtualized (`react-virtuoso`, `Virtuoso`) — each row shows `timestamp` (formatted), `message`, the first line of `stack`, `url`, and `userAgent`, plus a per-row delete button behind a `confirm()` dialog.
- **Delete:** `useFirestoreMutation<string>(['client_errors'], { mutationFn: (_uid, id) => deleteDoc(doc(db, 'client_errors', id)) })`. The hook's generic contract passes a `uid` (normally used to scope a user's own data), but a code comment notes explicitly: *"Global admin collection, not uid-scoped — the factory's uid param is unused here."* The mutation still requires an authenticated user to run at all (the hook throws `'Not authenticated'` otherwise); the real authorization boundary is `firestore.rules`' `allow read, delete: if isAdmin()` on `client_errors`.
- **"Analyze Health" → `handleAnalyze`:** client-side, aggregates the up-to-100 loaded `ErrorLog` docs by exact `message` string match into an `AggregatedError` record per distinct message: `{ count, sampleStack (first occurrence's stack), browsers (a Set) }`. Browser identity is truncated hard: `curr.userAgent.split(')')[0]` — keeps only the token up through the first `)` in the UA string, not the full string. `sampleStack` is truncated to its first 300 characters when building the summary text. These aggregates are formatted into a plain-text block per distinct error (`ERROR:`/`COUNT:`/`BROWSERS:`/`STACK_SNIPPET:`) and joined with `---` separators into one `logSummary` string.
- **Gemini call:** `analyzeSystemHealth(logSummary)` → `callAIProxy('system_health_analysis', { errorLogs: logSummary })` → the `generateAIInsights` Cloud Functions proxy (`functions/src/index.ts`) → Gemini. The Cloud Function's prompt for this `analysisType` (`functions/src/index.ts`, `getPromptForType`) is: *"Analyze these raw client-side error logs: {errorLogs}"* with a system prompt instructing a JSON `SystemHealthAnalysis` shape. The proxy's payload validation for this type is just `assertNonEmptyString(payload.errorLogs, ...)` — no PII/content-shape check beyond that, but there's nothing to check: the string this component builds never contains journal/workbook/service content to begin with.
- **Result rendering:** `SystemHealthAnalysis` (`status: 'Critical'|'Warning'|'Stable'`, `summary`, `top_issues[]` with `error_signature`/`suspected_root_cause`/`suggested_fix`, `environment_patterns`) is rendered as a card above the raw log list. A failed analysis call `alert()`s "Failed to generate AI analysis."; `handleAnalyze` is a no-op if `errors.length === 0`.

**Approved Gemini flow — verified:** this is the exact flow named on CLAUDE.md's nine-flow approved list ("`ErrorLogViewer.tsx` (→ `analyzeSystemHealth`, PROJ-98 — admin-only surface; sends aggregated client error logs/stack traces, not personal recovery content)"). Confirmed in code: the only data reaching Gemini is `logSummary`, built exclusively from `client_errors` fields (`message`, a derived `count`, a truncated `userAgent` token, a 300-char `stack` slice) — this component never reads `journals`, `workbook_answers`, `service`, or any other encrypted collection, so there is no decrypted user content anywhere in its data flow, let alone in this one Gemini call.

## Data model

| Field on `client_errors/{id}` (as read by `ErrorLog`) | Notes |
|---|---|
| `message` | String. The aggregation key for the AI-analysis grouping. |
| `stack` | Full stack trace string; list view shows only its first line (`.split('\n')[0]`), AI payload truncates to 300 chars. |
| `url` | `window.location.href` at time of crash (written by `ErrorBoundary.tsx`). |
| `userAgent` | Full `navigator.userAgent`; AI payload uses only the substring before the first `)`. |
| `timestamp` | Firestore `Timestamp`, written via `Timestamp.now()` (client clock) by `ErrorBoundary.tsx`, not `serverTimestamp()`. |

Not typed/read by this component but present on the underlying doc (written by `ErrorBoundary.tsx`): `uid` (the crashing user, for potential correlation — never surfaced in this UI) and `componentStack` (React's component-tree trace, separate from `stack`).

Per `firestore.rules`: `client_errors` allows `create: if isCreatingOwnedResource()` (any authenticated user, via `ErrorBoundary.tsx`) and `read, delete: if isAdmin()` — this tab is the only in-app reader/deleter.

## Gating & limits

Page-level admin gate only (`docs/screens/admin/README.md`). The Gemini call itself has **no rate limit or cooldown** in the Cloud Function proxy — `functions/src/index.ts`'s free-tier cooldown logic (`usage_limits`, the `rosc_assessment`/`workbook_coach` timestamp floors) is keyed off other `analysisType` values only; `system_health_analysis` is not covered by any of those branches. This differs from CLAUDE.md's "Known live gap" framing for `WorkbookDetail`/`WorkbookSession`/`AudioRecorder` (those are user-facing, uncapped-cost exposures reachable by any free user); this call is admin-only, so the exposure surface is the small admin population, not the general user base — worth noting as a factual difference, not treating it as equivalently urgent.

## Known gaps / debt

- No rate limit on the Gemini call (see above) — bounded in practice only by how many admins have access and how often they click "Analyze Health."
- No pagination past the first 100 error docs — a high-volume crash period can roll the window past before an admin looks, same shape as Analytics's known gap.
- `sampleStack` for the AI summary is always the *first-seen* occurrence's stack for a given message, not necessarily the most representative one.
- Browser-identity truncation (`split(')')[0]`) is a crude heuristic — depending on UA string shape it can either over- or under-distinguish real browser/OS differences in the "Pattern" analysis.

## Related docs

- `docs/screens/admin/README.md` — parent index, access control, and the ZK-status summary this file's Gemini verification backs up.
- `docs/specs/08_ADMIN.md` §2A ("Telemetry (Health)") — current spec for this tab.
- `docs/specs/03_ADMIN.md` §2C ("System Health") — superseded, same feature described at a coarser level.
- CLAUDE.md's "Approved Gemini exception" list — the nine-flow carve-out this tab is one of.
