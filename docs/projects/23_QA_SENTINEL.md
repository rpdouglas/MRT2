# 📁 Project 23: The QA Sentinel

**Status:** ⚪ Planned — pulled from `docs/BACKLOG.md` (Parked/Unscheduled) 2026-07-19 ahead of Play Store submission.
**Primary Persona:** All (internal/architecture — no primary end-user persona)
**Objective:** Establish an automated End-to-End (E2E) testing pipeline covering the three golden paths (onboarding, vault encrypt/decrypt, task/streak) so critical regressions are caught before deploy, not after.

---

## 1. The Executive Summary

**User Story:** As the System Architect, I want the app's three most critical user journeys automatically verified in a real browser against a real (emulated) backend, so a regression in the onboarding flow, the vault encryption boundary, or the streak engine is caught in CI, not discovered by a user in production.

**Competitive Gap:** N/A — internal quality/safety net.

**Source:** Originally scoped in `docs/projects/archive/23_QA_SENTINEL.md` (2026-03), parked since — it was an orphan spec referenced nowhere until the 2026-07-16 governance audit found it, then flagged again in the 2026-07-18 app-readiness review as a real scaling risk (zero browser-level regression coverage of golden paths ahead of Play Store submission). Pulled from `docs/BACKLOG.md` into active work 2026-07-19.

**What's changed since the original spec — read before implementing:** the original spec (Phases 1-2) is largely already satisfied by later, unrelated work:
- **Phase 1 (milestone logic unit tests)** — done. `src/lib/__tests__/milestones.test.ts` exists, shipped as part of `PROJ-40` (Test Suite Audit).
- **Phase 2 (Firebase emulator integration)** — done, in a more complete form than originally scoped. `firebase.json`'s `emulators` block (Auth `:9099`, Firestore `:8080`, Functions `:5001`, UI `:4000`) and the `VITE_USE_EMULATORS` dev-only gate in `src/lib/firebase.ts`/`vaultAuth.ts`/`gemini.ts` were built for `PROJ-65`'s manual verification pass, not for E2E testing — but they're the exact same harness this project needs. No new emulator wiring required.
- **Playwright itself** — already a project dependency (`^1.61.1`), installed for `PROJ-63`'s screenshot generator, which already drives headless Chromium against this same app. No new tooling install required, though a dedicated `playwright.config.ts` for E2E (distinct from the screenshot script's ad-hoc Playwright usage) does not yet exist.

**What's actually left, and the only real scope of this project now:** Phase 3 (the three golden-path E2E tests) and the CI/QA wiring in §5 — nothing else.

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** Low. Tests run against the local Firebase Emulator Suite (`firebase emulators:start`), never the real `mrt2-app-dev`/`uat`/`prod` projects. No real user PII or vault content is ever touched.
* [x] **Encryption Strategy:** The Vault Test (Phase 3, test 2) is the one test in this project that actively exercises `src/lib/crypto.ts` in a live browser — setting a PIN, writing a journal entry, locking, confirming ciphertext is unreadable, unlocking, confirming plaintext is restored. This is the first automated (non-manual) confirmation of the ZK boundary holding end-to-end in a real browser context, complementing the unit-level crypto tests that already exist.
* [x] **Key Rotation:** N/A — not exercised by any of the three golden paths in scope.

---

## 3. Schema & Architecture 🗄️

No Firestore schema changes. No new npm dependencies (Playwright already installed).

**New files:**
```
playwright.config.ts                    ← project root, E2E-specific config (baseURL, emulator startup, browser projects)
e2e/
  fixtures/
    emulator.ts                         ← starts/seeds/tears down firebase emulators for the test run
  golden-paths/
    gate.spec.ts                        ← Test 1: The Gate Test
    vault.spec.ts                       ← Test 2: The Vault Test
    ledger.spec.ts                      ← Test 3: The Ledger Test
```

**Modified files:**
* `.github/workflows/deploy.yml` — new step in the `verify` job (or a new job) running `npx playwright test` against emulators, before the existing `deploy` job.
* `package.json` — new `"test:e2e": "playwright test"` script.

---

## 4. Implementation Phases 🏗️

> Phases 1 and 2 from the original spec are already complete (see §1) — this project starts at Phase 3.

### Phase 3: The Playwright Golden Paths

Three resilient E2E tests, each running against a freshly-seeded Firebase Emulator Suite instance (not the real backend):

1. **The Gate Test** (`e2e/golden-paths/gate.spec.ts`): Sign up with a fresh emulator-only test account → complete onboarding (name + sobriety date) → land on the Dashboard. Verifies the entire auth + onboarding-redirect chain (`Login.tsx`'s `useEffect` redirect logic) works end-to-end in a real browser.
2. **The Vault Test** (`e2e/golden-paths/vault.spec.ts`): Set a vault PIN → write a journal entry → lock the vault → confirm the entry renders as unreadable/blurred (not plaintext) → unlock → confirm the original plaintext is restored. This is the project's single most important test — it's the only automated, browser-level confirmation that the ZK boundary actually holds, not just that the unit-level crypto functions work in isolation.
3. **The Ledger Test** (`e2e/golden-paths/ledger.spec.ts`): Create a high-priority task → complete it → confirm the Dashboard's streak/XP indicator increments. Verifies the task-completion → gamification pipeline end-to-end.

**Test data isolation:** each test creates its own fresh emulator-only user (e.g. `e2e-gate-{timestamp}@test.local`) — no shared fixtures or ordering dependencies between the three specs, so they can run in parallel and don't leave cross-test state.

**Edge Cases:**
* [ ] What if the emulator fails to start in CI? The Playwright config's `webServer`/global setup should fail loudly and fast, not hang — CI should show a clear "emulators failed to start" error, not a mysterious timeout.
* [ ] Flakiness: E2E tests are inherently more flake-prone than unit tests. Retry policy (Playwright's built-in `retries` config) should be set for CI runs, not for local dev runs, so a genuinely broken golden path doesn't get masked by a retry passing on the second attempt while also not failing CI on a one-off network blip.

---

## 5. QA & Verification 🧪 (this project's own definition of done)

* [ ] **CI/CD Pipeline:** New step in `.github/workflows/deploy.yml`'s `verify` job — start Firebase emulators, run `npm run test:e2e`, tear down — before the `deploy` job runs. A failing golden path must block deploy, the same way a failing unit test already does.
* [ ] **Local dev command:** `npm run test:e2e` documented and working against a locally-started `firebase emulators:start`.
* [ ] **All three golden paths passing** in both CI and local runs.
* [ ] **Runtime budget:** confirm the added CI time (emulator startup + 3 browser tests) doesn't meaningfully regress the existing `verify` job's runtime — if it does, consider running E2E as a separate, parallel CI job rather than serially inside `verify`.

---

## 6. Out of Scope

* Expanding beyond the three original golden paths (e.g. AI analysis flows, Service Module, export) — this project is scoped to exactly the three paths in the original spec. Additional E2E coverage is a future ticket.
* Cross-browser testing (Firefox/Safari via Playwright) — Chromium-only for this pass, matching PROJ-63's existing screenshot-generator convention.
* Visual regression testing — this is behavioral E2E only, not pixel-diffing.
