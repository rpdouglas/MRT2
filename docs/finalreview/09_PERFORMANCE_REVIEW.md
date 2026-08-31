# MRT2 — Performance Review

*Based on a real `npm run build` executed during this audit session (not simulated), the Vite manual-chunking configuration, and Workbox/PWA config. Live runtime metrics (Lighthouse scores, actual Core Web Vitals, memory/CPU profiles) were **not** captured in this pass — see §6 for exactly what would be needed to close that gap, and note that the app already instruments `web-vitals` reporting to PostHog, meaning real data almost certainly already exists and simply wasn't accessible to this audit.*

---

## 1. Build Output — Real Numbers

From the actual `npm run build` output captured in this session:

| Chunk | Raw size | Gzip |
|---|---|---|
| `pdf-export` | 705.39 KB | 209.37 KB |
| `vendor` (catch-all) | 519.64 KB | 176.12 KB |
| `firebase` | 322.82 KB | 100.37 KB |
| `recharts` | 293.08 KB | 73.92 KB |
| `index` (app code) | 418.61 KB | 118.18 KB |
| `posthog` | 226.60 KB | 75.50 KB |
| `react-vendor` | 193.08 KB | 60.58 KB |
| `icons` (@heroicons) | 85.48 KB | 14.95 KB |
| `tanstack-query` | 38.83 KB | 11.48 KB |
| `react-router` | 37.99 KB | 13.74 KB |
| CSS (`index-*.css`) | 157.09 KB | 21.79 KB |
| All lazy-loaded feature chunks (games, tools, pages) | 0.2–29.9 KB each | mostly sub-10KB gzip |

**Total precache footprint** (per the PWA plugin's own report): 66 entries, 3,431.83 KB.

## 2. Analysis

- **The critical-path bundle for an unauthenticated first load** is dominated by `react-vendor` + `react-router` + `tanstack-query` + `firebase` (Auth SDK at minimum) + `index` + CSS — roughly **~430KB gzip** before any route-specific code, by rough addition of the eager chunks. This is on the higher end for a "fast" PWA but not unreasonable for an app with this much functional surface area; a genuinely fast target would be closer to 150-250KB gzip for the shell.
- **`pdf-export` at 705KB raw / 209KB gzip is the single largest chunk in the app** — larger than `vendor`. This is explained (jsPDF's dynamic dependency graph pulls in html2canvas/canvg/dompurify/pako together), and the manual-chunking comments suggest this was a deliberate, understood trade-off, not an oversight. **The open question this audit could not verify:** whether this chunk is genuinely only loaded on-demand (when a user actually exports a PDF) or whether some import path accidentally pulls it into the initial bundle graph. Given the codebase's consistent use of `React.lazy` elsewhere, on-demand loading is *likely* but was not independently confirmed by tracing the actual import graph for `DataExportPanel.tsx`.
- **A circular-chunk warning was emitted at build time** (`pdf-export -> vendor -> pdf-export`) — cosmetic today (the build still succeeds and Vite handles it), but it signals the chunk graph has at least one dependency edge that doesn't cleanly separate, which is worth resolving before the chunking strategy grows more complex.
- **`posthog` at 226KB gzip 75KB is a meaningfully large chunk for an analytics library** — reasonable to keep it a separate lazy-loadable chunk (which it already is, per the manual-chunks config) so it doesn't block first paint, but worth periodically checking for a lighter-weight PostHog build/config if available.
- **Globally excluding `Marketing/**` and `raw_assets/**` from the PWA precache manifest** (confirmed in `vite.config.ts`) is a smart, deliberate ~16MB reduction to the install payload — exactly the kind of PWA-specific performance discipline that's easy to miss.

## 3. Lazy Loading / Code Splitting

- 24 of ~45 routes/heavy components are `React.lazy`-loaded, confirmed via the App.tsx route table.
- Crisis-path routes (Login, Dashboard, Tasks, Journal) are deliberately kept eager — a correct trade-off prioritizing speed-to-interactive for David's crisis-first persona floor over marginal initial-bundle-size savings.
- Manual chunking (firebase/recharts/gemini/react-router/react-vendor/tanstack-query/icons/pdf-export/posthog/vendor) is unusually fine-grained and well-reasoned for a project at this scale — most teams either leave chunking entirely to Vite's defaults or over-engineer it without documented rationale; MRT2 does neither.

## 4. Offline Performance

- Firestore's `persistentLocalCache` with `persistentMultipleTabManager` provides genuine offline read/write queuing using the current (non-deprecated) Firebase v12 API.
- Workbox `generateSW` strategy with `StaleWhileRevalidate` for Firebase Storage assets — appropriate for images/media that change infrequently.
- **Not independently verified:** actual behavior under a real network-partition test (e.g., writing a journal entry fully offline, then reconnecting and confirming sync) — the `e2e/golden-paths/subway.spec.ts` test name strongly suggests this exact scenario is automated and tested, but this audit did not execute that specific test in isolation to confirm its assertions.

## 5. Database/Query Performance

- Composite Firestore indexes were reconciled against real production drift during PROJ-99 (2 indexes found live in prod but missing from the tracked `firestore.indexes.json` — a real gap that would have broken queries on a fresh deploy, now fixed).
- Query patterns observed in hooks (`uid`-scoped, `orderBy(createdAt)`) are standard, index-friendly Firestore access patterns — no evidence of N+1-style query fan-out was found in the sampled hooks.

## 6. What a Full Performance Audit Still Needs

1. **Pull the existing `web-vitals` → PostHog data.** The instrumentation already exists in production; this audit simply didn't have access to view the resulting dashboard. This is the single highest-value, lowest-effort next step — the data collection cost has already been paid.
2. **A real Lighthouse run against the deployed `mrt2-app-prod` (or `-dev`) URL** — static bundle-size analysis is a reasonable proxy for performance but is not the same as measured LCP/INP/CLS on real hardware.
3. **Confirm the `pdf-export` chunk's actual load timing** via a browser Network-tab trace during a real export action, to close the "is it really lazy" question definitively.
4. **A cold-start latency measurement for Cloud Functions** (`verifyVaultPin` and `generateAIInsights` specifically, since these sit on the critical path for vault unlock and AI features respectively) — Cloud Functions Gen 2 cold starts can be a meaningful part of perceived latency and were not measurable from source code alone.

## Performance Rating: 7/10 (partial — see caveats above)

The build-time engineering (chunking strategy, PWA precache exclusions, lazy-loading discipline) is genuinely above-average and evidences real performance-conscious decision-making. The score is capped at 7 rather than higher specifically because this audit could not access the real runtime data (Lighthouse, actual Web Vitals) that would be needed to confirm those good build-time decisions are translating into a genuinely fast experience for real users on real devices — that data very likely already exists in PostHog and is a same-day follow-up, not a new engineering effort.
