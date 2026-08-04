# 📁 Project 96: CI/Deploy Operational Safety Net

**Status:** ✅ Shipped
**Primary Persona:** Dev / AI Partner (CI/CD speed and deploy safety; see `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing impact; this protects the team's ability to notice and respond to a bad deploy or a newly-introduced production vulnerability.
**Objective:** Close `OBSERVABILITY_AUDIT.md`'s GAP-04 (no deploy-failure alerting) and GAP-08 (no documented rollback procedure), plus `DEPENDENCY_AUDIT.md`'s CI vulnerability-gate recommendation — kept as its own project because it touches the deployment pipeline itself, a different risk profile than application code changes (PROJ-94/95).

---

## 1. The Executive Summary
**User Story:** As the developer/operator, when a deploy fails or a new high-severity production-dependency vulnerability lands, I want to know immediately instead of finding out from a user report or a manual check.
**Source:** `OBSERVABILITY_AUDIT.md` (2026-07-29) Phase 5, GAP-04/GAP-08, Quick Win #3; `DEPENDENCY_AUDIT.md` (2026-07-29) Capability Gap Analysis, Rank #2.

**Scope correction — planning surfaced a materially worse, previously-undiscovered gap than either source audit described:**
- Both audits' "38 known vulnerabilities" framing (from PROJ-90) only ever covered the **root** workspace. `functions/` — the actual deployed Cloud Functions runtime — had **never been audited by any prior ticket**. It carried 27 known vulnerabilities, **2 critical and 8 high**, 20 of them in production dependencies (`protobufjs` arbitrary code execution, `websocket-driver` resource-limit bypass among them).
- Decision (approved): fold the functions/ remediation into this ticket rather than defer it, since a "CI vulnerability gate" ships an empty promise if the workspace it's supposed to protect has known-critical vulnerabilities sitting live in prod the day the gate turns on.
- Root also turned out not to be fully clean at `--audit-level=high`: `react-router`/`react-router-dom` carry a high-severity CSRF advisory (`GHSA-qwww-vcr4-c8h2`) scoped to React Router's RSC/framework mode — confirmed via `npm audit fix` (non-force) that no in-range fix actually resolves it (only a v7→v8 major bump does), and confirmed via grep that this app doesn't use RSC/framework-mode APIs (`createBrowserRouter`/`RouterProvider`) anywhere — just component-based `<Routes>`. Documented as an accepted, tracked, non-applicable risk (same category as PROJ-90's `firebase-tools` call) rather than force-bumped.
- Notification channel: per product decision, this ships relying on **GitHub's built-in failure email** rather than a new Slack/Discord webhook integration — no webhook secret existed in the repo for any channel, and building one out was judged not worth the effort versus the existing (if unverified) GitHub default.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** N/A — this ticket touches CI/CD pipeline configuration, dependency lockfiles, and documentation only, no application data.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes. No Cloud Functions logic changes (dependency version bumps only).

**Files impacted:**
* `.github/workflows/deploy.yml` — added two hard-fail `npm audit --omit=dev` steps to the `verify` job: root at `--audit-level=critical`, `functions/` at `--audit-level=high`. `--omit=dev` scopes both to production dependencies only, so eslint/jest-style dev-tooling advisories (their own long, mostly non-forceable tail — see PROJ-90) never redline the build. `npm audit` still prints everything it finds regardless of `--audit-level`, so accepted risks stay visible in every CI log even though they don't block.
* `functions/package-lock.json` — non-force `npm audit fix`, resolving both critical and all 4 production-dependency high-severity findings. 9 moderate-severity findings remain, all tracing to a single `uuid` transitive dependency (via `gaxios`/`google-gax`/`@google-cloud/firestore`/`firebase-admin`) whose only fix is downgrading `firebase-admin` to `10.3.0` — rejected as a breaking major downgrade from the current `^13.8.0`, same call PROJ-90 made for `firebase-tools`.
* `docs/RUNBOOK.md` (new) — Firebase Hosting rollback (Console release-history rollback as the primary path; `firebase hosting:clone` as a scriptable CLI alternative once a version ID is known), Cloud Functions/Firestore-rules rollback (git revert + full CI re-run — confirmed no atomic rollback exists for either), the CI audit gate's documented exceptions, and an incident-communication checklist.
* `docs/DEPLOYMENT.md` — added a §5 cross-link to the new Runbook.

---

## 4. Implementation Phases 🏗️

### Phase 1: functions/ dependency remediation (done first, since the gate can't ship honestly without it)
* Ran non-force `npm audit fix` in `functions/`. Critical count: 2 → 0. Production-dependency high count: 4 → 0. Verified via `functions/`'s own unit test suite (58/58) and the full e2e golden-path suite (11/11) against real Firebase emulators — including `vault.spec.ts`, which exercises `verifyVaultPin` end-to-end through the bumped `protobufjs`/`grpc-js`/`google-gax` chain.

### Phase 2: CI vulnerability gate
* Added the two audit steps described in §3. Threshold is asymmetric by design: `functions/` at `high` (genuinely clean after Phase 1); root at `critical` (one documented, non-applicable, non-forceable `react-router` exception prevents a clean `high` threshold today — see §1).
* Verified locally with the exact CI commands before merging: both exit `0` against the current dependency tree.

### Phase 3: Rollback runbook
* Documented in `docs/RUNBOOK.md` (see §3 above for what's in it). Verified the actual `firebase-tools` CLI surface (v15.22.4) rather than assuming command syntax — confirmed there is no `hosting:rollback` or `hosting:versions:list` command, so the Console's release-history rollback is documented as the primary path, not a CLI-first one.

### Phase 4: Notification
* No new code — relies on GitHub's built-in per-push failure email. Documented in the Runbook, including the caveat that this depends on the account's personal GitHub notification settings (Settings → Notifications → Actions), which this repo has no way to verify or enforce.

### Phase 5: Edge Cases
* [x] Confirmed the `npm audit` CI gates don't fail on the current, already-triaged vulnerability baseline (verified by running the exact CI command locally post-fix).
* [x] No webhook step exists, so no webhook secret-leakage surface to check.
* [x] Confirmed via grep that this app doesn't use React Router's RSC/framework-mode APIs, so the accepted `react-router` exception's threat model doesn't apply to how this app actually uses the library.

---

## 5. QA & Verification 🧪
* [x] **functions/ Unit Tests:** 58/58 passing post-dependency-bump.
* [x] **E2E Golden Paths:** 11/11 passing against real Firebase emulators, including `vault.spec.ts` (exercises `verifyVaultPin`, the Cloud Function most directly downstream of the bumped `grpc-js`/`protobufjs`/`google-gax` chain).
* [x] **CI gate dry-run:** ran both new `npm audit` commands locally with the exact flags used in `deploy.yml` — both exit 0 against the current, real dependency tree.
* [x] **Full `npm run check`:** lint, spec-quality, unit tests (662/662), production build all clean.
* [ ] **Manual:** not yet verified against a real GitHub Actions run (only reproduced locally) — first real CI run on this branch's PR is the actual end-to-end confirmation that the gate behaves as expected in the GitHub Actions environment, not just locally.
