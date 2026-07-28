# 📁 Project 89: Play Store Release Blockers

**Status:** 🟢 Done
**Primary Persona:** All (release gate — no single persona owns this, it protects the whole product)
**Objective:** Remediate the two findings the Production Readiness Audit (2026-07-28) flagged as hard blockers to Google Play submission — the `mockUser` auth bypass (SEC-01) and the 1.83MB monolithic vendor bundle (PERF-01) — so the app can ship.

---

## 1. The Executive Summary
**User Story:** As any user, I want the production build to never expose a client-side admin bypass and to load quickly on mobile networks, so that the app is safe to submit to Google Play.
**Source:** `docs/reports/PRODUCTION_READINESS_AUDIT.md` §3.1 (SEC-01), §2.1/§2.3 (PERF-01), §6.1 Risk Register, §6.4 Final Verdict.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** SEC-01 is an auth/authorization bypass, not a data-encryption issue — no ZK boundary crossed, no Firestore writes involved.
* [x] **Encryption Strategy:** N/A — no encrypted fields touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` interface changes.

**Files Impacted:**
* `src/contexts/AuthContext.tsx` — the `mockUser` bypass block (previously lines 37-70) is now wrapped in `if (import.meta.env.DEV)`, so it compiles out of production builds entirely (Vite replaces `import.meta.env.DEV` with a literal `false` and dead-code-eliminates the branch). Confirmed still reachable in dev: `scripts/generate_screenshots.js` drives the app via `npx vite` (the dev server), never a production build, so the screenshot pipeline (PROJ-63) is unaffected.
* `vite.config.ts` — `build.rollupOptions.output.manualChunks` extended to split the former single `vendor` bucket (1.83MB) into `react-vendor`, `react-router`, `tanstack-query`, `icons`, `pdf-export` (`jspdf`/`jspdf-autotable`), and `posthog`, alongside the pre-existing `firebase`/`recharts`/`gemini` splits. Final `vendor` catch-all: 867KB — under the 1MB threshold the audit flagged, with no chunk over 1MB. First pass (react-vendor matched on a broad `/react/` path substring) caused a `react-vendor <-> vendor` circular-chunk warning because it also swept up `@use-gesture/react`'s subpath, which itself depends on `@use-gesture/core` (bucketed as `vendor`); tightened to match only the literal top-level `react`/`react-dom`/`scheduler` packages under `node_modules/`, which resolved it.

---

## 4. Implementation Phases 🏗️

### Phase 1: SEC-01 — mockUser bypass
* Gated the entire mock-user localStorage/URL-param block behind `import.meta.env.DEV`.
* Left the mock/dev behavior otherwise unchanged (still keyed by persona name, still admin-capable in dev) since it's a legitimate, actively-used dev/screenshot tool — the fix is scoping it out of prod, not removing it.

### Phase 2: PERF-01 — vendor chunking
* Added targeted `manualChunks` buckets by package so React/Router/TanStack Query/icon libraries no longer fall into one catch-all chunk.
* No lazy-route or Suspense boundary changes — this is a build-output split only, not a code-splitting-at-import-site change.

### Phase 3: Edge Cases
* [x] Confirmed screenshot pipeline (`npm run screenshots:generate`) still works against `?mockUser=` — it only ever runs against `vite` dev server.
* [x] Confirmed no other call site reads `mrt_mock_user` outside `AuthContext.tsx` (would silently break under the new guard).

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — full suite must stay green (no test relies on the mockUser path executing outside dev, since Vitest's `import.meta.env.DEV` defaults true under `vite/config` test mode).
* [x] **Build:** `npm run build` — verify `vendor-*.js` chunk is no longer the single largest chunk; confirm total precache size doesn't regress.
* [x] **Lint/Typecheck:** `npm run check` full pipeline clean.
* [ ] **Manual/E2E:** Verify `https://<prod-domain>/?mockUser=admin` no longer sets admin state on a real production deploy (tracked as a follow-up regression test under the security/compliance hardening work, not required to close this spec).
