# 📁 Project 90: Security, Dependency & Compliance Hardening

**Status:** ✅ Shipped
**Primary Persona:** David (medical disclaimer trust, app stability), All (dependency hygiene)
**Objective:** Close the "should fix before release" findings from the Production Readiness Audit (2026-07-28) that PROJ-89 didn't cover — SEC-02 (dependency vulnerabilities), PL-01 (medical disclaimer), CODE-01 (`console.log` pollution), and Action #10 (a real regression test proving SEC-01 stays fixed) — without absorbing the two genuinely higher-risk items (CSP headers, an ESLint major bump) that the audit under-scoped.

---

## 1. The Executive Summary
**User Story:** As any user, I want the production build free of debug noise and dependency risk, and to see a clear peer-support disclaimer before I sign up, so the app meets Google Play's health-app policy and ships a clean console.
**Source:** `docs/reports/PRODUCTION_READINESS_AUDIT.md` §3.1 (SEC-02), §4.1 (PL-01), §2.2/§2.3 (CODE-01), §6.3 Top 25 Action #10.

**Scope correction vs. the audit:** SEC-02 was estimated at "1 hr, run `npm audit fix`." Investigation found this incomplete — see §3 below. CSP headers (audit Action #23) and an ESLint 9→10 major bump (needed to clear the last direct-dependency "high") are **explicitly out of scope** for this ticket; both carry a blast radius (silent production auth/Firestore breakage for CSP; repo-wide lint churn for ESLint) that doesn't belong in a "hardening" sprint. Tracked as separate future tickets instead of being rushed in here.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None of this ticket's scope touches PII or emotional/recovery data — dependency bumps, debug-log deletion, and static disclaimer text only.
* [x] **Encryption Strategy:** N/A — no encrypted fields touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` interface changes.

**SEC-02 — actual dependency audit (49 reported):**
- Safe, non-breaking fixes available via plain `npm audit fix` (no `--force`): `ws` (high), `react-router-dom` (high — **a production dependency**, the one item here that actually ships to users), `postcss` (high).
- `eslint` (high) — fix requires a semver-major bump (9→10). Deferred; needs its own regression pass against the flat-config setup and `@typescript-eslint` peers.
- `eslint-plugin-react`, `firebase-admin`, `firebase-tools` (high/moderate) — npm's suggested "fix" for each is a downgrade to an ancient major (`firebase-tools@3.18.2` vs. current `^15.24.0`; similarly for the other two). **Rejected** — would break the Firebase CLI/emulator toolchain the e2e suite and deploys depend on, to "fix" vulnerabilities in a dev-only CLI tool that never ships to users. Documented as an accepted, tracked risk (dev-tooling-only exposure), not force-fixed.
- `vite`, `vitepress` (high/moderate) — no fix published yet (`fixAvailable: false`). Dev-only build tooling, zero production exposure. Nothing actionable until upstream ships a patch.

**Files impacted:**
* `package.json` / `package-lock.json` — `npm audit fix` (non-force).
* `src/hooks/useWakeLock.ts` — remove 2 debug `console.log`s ("Wake Lock active"/"released").
* `src/lib/messaging.ts` — remove 3 branch-marker `console.log`s (permission-denied, success, no-token branches); keep the surrounding guard-clause logic and `console.error`/`console.warn` calls untouched.
* `src/components/AppShell.tsx` — remove 1 `console.log` ("Background Auto-Backup Successful") from the success branch; keep the `patchProfileFields` call.
* `src/components/journal/TemplateEditor.tsx` — remove the `useEffect` that exists solely to log "Template Editor V2 Loaded" (dead code beyond the log itself).
* `src/components/journal/JournalHistory.tsx` — remove 1 `console.log` from the native-share-dismissal `catch` block; leave a one-line comment explaining why the catch is intentionally silent (dismissing a share sheet isn't a real error).
* `src/components/PWAUpdateBeacon.tsx` — **no change**. Already gated behind `import.meta.env.DEV`; the audit's count of "9 active console.log statements" was off by one.
* `vite.config.ts` — add `esbuild.pure: ['console.log']` as a systemic guard so any future stray `console.log` tree-shakes out of production builds automatically.
* `src/pages/Login.tsx` — add a one-line medical disclaimer next to the existing Privacy Policy / Terms of Service footer links.
* `src/pages/Welcome.tsx` — add a footer with the same disclaimer (currently has **no** legal-links footer of any kind — a real gap, not just a missing sentence).
* `e2e/auth.spec.ts` (new) — regression test asserting `?mockUser=admin` does not authenticate against a **production build**.
* `playwright.config.ts` — needs a second `webServer` entry (`vite build && vite preview`), since the existing suite's `webServer` runs `npm run dev`, where `import.meta.env.DEV` is always `true` — a test reusing that server would pass even if SEC-01 were reverted.

---

## 4. Implementation Phases 🏗️

### Phase 1: SEC-02 — safe dependency fixes
* Run `npm audit fix` (no `--force`).
* Verify `npm run check` clean, including `test:e2e` against local emulators (confirms `firebase-tools` still functions post-bump).

### Phase 2: CODE-01 — console.log cleanup + systemic guard
* Remove the 8 genuine debug `console.log` call sites (see file list above).
* Add `esbuild.pure: ['console.log']` to `vite.config.ts` (not `drop: ['console']` — that would also strip legitimate `console.error`/`console.warn` calls used for real error visibility).

### Phase 3: PL-01 — medical disclaimer
* Add to `Login.tsx` and `Welcome.tsx`: *"My Recovery Toolkit is a self-help peer support tool and is not a medical device, diagnostic tool, or replacement for professional clinical addiction treatment."*
* Somatic check: small, muted footer text — not a modal, not a blocking interstitial. Must not add friction to David's sign-up flow.

### Phase 4: Action #10 — mockUser regression test
* Add a `webServer` entry to `playwright.config.ts` that builds and previews production output.
* Add `e2e/auth.spec.ts`: navigate to `/?mockUser=admin` against the prod-preview server, assert no admin/authenticated state is reached.

### Phase 5: Edge Cases
* [x] Confirmed no existing unit test spies on/asserts against any of the removed `console.log` calls (grepped `src/__tests__/` and co-located test dirs for the exact log strings).
* [x] The new Playwright config (`playwright.security.config.ts`) uses a distinct port (5176) and its own `testDir` (`e2e/security/`), so it can't collide with the golden-path suite's dev-server-backed config (port 5175, `e2e/golden-paths/`).
* [ ] Disclaimer layout at a 320px viewport (iPhone SE) not visually verified in a real browser — uses the same `max-w-sm`/small-text pattern as the existing Privacy/ToS footer line, which already works at that width, so risk is low but this is a code-review-only confirmation, not a manual/visual one.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing after console.log removals.
* [x] **Build:** `npm run build` clean; `esbuild.pure: ['console.log']` added no bytes and changed no chunk sizes (max chunk still 867KB, matching PROJ-89's baseline).
* [x] **Lint/Typecheck:** `npm run lint` and `npm run docs:check-specs` clean (57 specs pass).
* [x] **Security/E2E:** `e2e/security/mockuser-prod.spec.ts` passes against a real `vite build && vite preview` server — confirms `?mockUser=admin` on `/admin` redirects to `/login` with no "Admin Tools" content rendered, in the actual production artifact rather than the dev server.
* [ ] **Manual:** disclaimer visual check at 320px width — not performed in a real browser (see Phase 5 note above).

---

## Out of Scope (deferred to future tickets)
* **CSP headers** (`firebase.json`, audit Action #23) — needs its own ticket with a real staging verification pass (Google Auth popup, Firestore realtime listeners, Cloud Functions calls, dynamic PostHog host, Google Fonts, PWA service worker) before touching production.
* **ESLint 9→10 major bump** — needed to clear the last direct-dependency "high," but is a repo-wide lint-config change deserving its own dedicated pass, not a rider on this ticket.
