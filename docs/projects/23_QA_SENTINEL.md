# 📁 Project 23: The QA Sentinel

**Status:** ✅ Shipped — all three golden paths passing locally and wired into CI as a blocking `verify` gate, 2026-07-20.
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
- **Playwright itself** — the raw `playwright` browser-automation library (`^1.61.1`) was already a project dependency, installed for `PROJ-63`'s screenshot generator, which already drives headless Chromium against this same app. Confirmed working in this environment (Chromium + its dependencies install and launch cleanly). `@playwright/test` — the actual test-runner package (`defineConfig`/`test`/`expect`) — was not installed and was added fresh for this project.
- **Java 21** — present in the dev container this project was built in (masking the gap the same way a globally-installed `firebase-tools` did, see §3), but not on GitHub Actions' `ubuntu-latest` runners. The Firestore emulator requires it and fails with `firebase-tools no longer supports Java version before 21` without it. Fixed by adding an `actions/setup-java@v4` step (`temurin`, `21`) to the CI workflow, ahead of the E2E step.
- **Firebase client env vars** — the dev container has a gitignored `.env` supplying `VITE_FIREBASE_*` (populated for local dev), so this gap was invisible locally. CI's `verify` job never ran the `deploy` job's "Set Env" steps that inject these, so `npm run dev`'s Firebase SDK had no `apiKey`/`projectId`, `initializeApp()` never completed, and every golden path hung identically on the signup step's `waitForURL` until timeout — even after Java was fixed. Fixed by adding the `mrt2-app-dev` values already committed in `.env.example` directly to the E2E step's `env:` block. These are Firebase Web SDK config, not secrets (access control is Firestore rules, not obscurity), and `VITE_USE_EMULATORS=true` means none of it reaches the real project regardless — only the local emulators this job starts. Reproduced and confirmed fixed locally by temporarily removing `.env`/`.env.local` and re-running with only these values set.

**What's actually left, and the only real scope of this project now:** Phase 3 (the three golden-path E2E tests) and the CI/QA wiring in §5 — nothing else.

**A real bug the Vault Test caught (exactly what this project is for):** `JournalEditor.tsx`'s entry-initialization `useEffect` listed `handleTemplateSelect` in its dependency array. That callback's identity changes whenever its own `customTemplates` state updates (i.e. whenever the async custom-templates fetch resolves) — and since the effect was still watching it, that unrelated resolution re-ran the effect and called `setNewEntry(initialContent || '')`, silently wiping out anything the user had already typed if the fetch resolved after they started writing. Fixed by dropping `handleTemplateSelect`/`fetchLocalWeather` from the dependency array (both `eslint-disable-next-line react-hooks/exhaustive-deps`'d, with a comment explaining why) so the effect only re-runs when the entry actually being edited changes. This was invisible to the existing unit tests (nothing exercises the real async timing of a Firestore-backed hook racing against user input) and only surfaced once the Vault Test ran back-to-back with other tests against a shared, already-warm Firestore emulator connection, slowing that fetch down enough to lose the race consistently.

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** Low. Tests run against the local Firebase Emulator Suite (`firebase emulators:start`), never the real `mrt2-app-dev`/`uat`/`prod` projects. No real user PII or vault content is ever touched.
* [x] **Encryption Strategy:** The Vault Test (Phase 3, test 2) is the one test in this project that actively exercises `src/lib/crypto.ts` in a live browser — setting a PIN, writing a journal entry, locking, confirming ciphertext is unreadable, unlocking, confirming plaintext is restored. This is the first automated (non-manual) confirmation of the ZK boundary holding end-to-end in a real browser context, complementing the unit-level crypto tests that already exist.
* [x] **Key Rotation:** N/A — not exercised by any of the three golden paths in scope.

---

## 3. Schema & Architecture 🗄️

No Firestore schema changes. **One correction to §1's claim:** `playwright` (the raw browser-automation library, `^1.61.1`) was already installed for PROJ-63's screenshot generator, but `@playwright/test` — the actual test-runner package providing `defineConfig`/`test`/`expect` — was not. Added as a new devDependency 2026-07-19.

**A second dependency gap found only in CI:** `test:e2e` shells out to the bare `firebase` command (`firebase emulators:exec ...`). Locally this resolved against a globally-installed `firebase-tools`, which masked that the project itself didn't depend on it — the first CI run failed immediately with `firebase: not found`, since GitHub Actions runners don't have it preinstalled and `npm ci` had nothing to install. Fixed by adding `firebase-tools` (`^15.24.0`) as a devDependency, so `firebase` resolves via `node_modules/.bin` the same way `playwright` already does, in CI and locally alike.

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
* `.github/workflows/deploy.yml` — three new steps in the `verify` job (install Java 21 via `actions/setup-java@v4`, install Chromium via `playwright install --with-deps`, then `npm run test:e2e` with `mrt2-app-dev`'s public Firebase client config in its `env:` block), after the existing unit-test gates and before `deploy`.
* `package.json` — new `"test:e2e"` script. Actual command is `firebase emulators:exec --project=mrt2-app-dev --only auth,firestore "playwright test"`, not the bare `playwright test` originally sketched here — `emulators:exec` is what starts/tears down the Auth+Firestore emulators around the run and gives CI a non-zero exit if they fail to start.
* `vite.config.ts` — added `e2e/**` to the Vitest `exclude` list; without it, Vitest's `*.spec.ts` default pattern also picks up the Playwright specs and fails trying to run them as unit tests.
* `eslint.config.js` — scoped `react-hooks/rules-of-hooks` and `react-refresh/only-export-components` off for `e2e/**` and `playwright.config.ts`; Playwright fixtures' `use()` callback parameter name false-positives the React Hook naming heuristic.
* `src/components/journal/JournalEditor.tsx` — one-line dependency-array fix, found *by* the Vault Test, not written for it (see below).

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
* [x] What if the emulator fails to start in CI? `firebase emulators:exec` exits non-zero if the emulators fail to start, and never runs the wrapped `playwright test` command in that case — CI fails on emulator startup, not a downstream test timeout.
* [x] Flakiness: `playwright.config.ts` sets `retries: 1` for CI runs only (`retries: 0` locally), matching the reasoning above. In practice, the one real flake found during implementation (see the `JournalEditor.tsx` bug above) was a genuine bug, not test flakiness — retries would have masked it rather than caught it, which is exactly the failure mode this edge case warns about.

---

## 5. QA & Verification 🧪 (this project's own definition of done)

* [x] **CI/CD Pipeline:** `.github/workflows/deploy.yml`'s `verify` job installs Chromium and runs `npm run test:e2e` as Gate 5, after unit tests and before `deploy`. A failing golden path blocks deploy.
* [x] **Local dev command:** `npm run test:e2e` works against the emulators it starts itself via `firebase emulators:exec` — no separately-running `firebase emulators:start` required.
* [x] **All three golden paths passing** — verified locally across multiple consecutive full-suite runs (`gate.spec.ts`, `ledger.spec.ts`, `vault.spec.ts`, ~35-45s total). Not yet observed passing in CI itself (that only happens on the next push through the `verify` job).
* [x] **Runtime budget:** ~35-45s locally for all three tests plus emulator startup — small relative to the existing `verify` job's other gates (lint, unit tests, functions tests, build). No need for a separate parallel CI job at this scope.

---

## 6. Out of Scope

* Expanding beyond the three original golden paths (e.g. AI analysis flows, Service Module, export) — this project is scoped to exactly the three paths in the original spec. Additional E2E coverage is a future ticket.
* Cross-browser testing (Firefox/Safari via Playwright) — Chromium-only for this pass, matching PROJ-63's existing screenshot-generator convention.
* Visual regression testing — this is behavioral E2E only, not pixel-diffing.
