# 📁 Project 73: Test Suite Hardening — Vault-PIN Pepper Coverage

**Status:** ✅ Shipped — Phases 1-3 shipped; Phase 4 (stretch — Recovery Games coverage) component-test portion shipped 2026-07-22, Subway Test automated as a real Playwright e2e spec 2026-07-23. All QA checklist items closed — see §5.
**Primary Persona:** All (internal/architecture — no primary end-user persona)
**Objective:** Close the coverage gap left by PROJ-65 (Vault Key Hardening) so the peppered PIN-derivation scheme — the current production default for every new vault — is actually exercised by an automated test somewhere, at every layer (Cloud Function handler, client orchestration, browser e2e).

---

## 1. The Executive Summary
**User Story:** As the Lead Architect, I want the test suite to actually fail if the peppered vault-key derivation breaks, so a regression in the app's most security-critical code path is caught by CI instead of by an external security reviewer or a user locked out of their vault.

**Competitive Gap:** N/A — internal quality/safety net, same rationale as PROJ-40 and PROJ-61.

**Source:** A testing-suite review requested by the user (2026-07-21), tracing what shipped in PROJ-62 through PROJ-72 against existing test coverage. The headline finding: `e2e/golden-paths/vault.spec.ts` — documented in its own file header as "the single most important test in this suite" and the only automated, browser-level confirmation that the ZK boundary holds — does not currently exercise the peppered scheme at all.

**Root cause, traced end-to-end:**
1. `package.json`'s `test:e2e` script runs `firebase emulators:exec --project=mrt2-app-dev --only auth,firestore "playwright test"` — the Functions emulator is never started, in CI or locally.
2. `EncryptionContext.tsx`'s `setupVault()` (`src/contexts/EncryptionContext.tsx:200-211`) always attempts `fetchVaultPepper()` first, but on any failure — including "no Functions emulator listening on :5001" — silently falls back to the legacy, pre-PROJ-65 unpeppered `generateKey()` derivation:
   ```ts
   try {
     const pepper = await fetchVaultPepper(newVerifier);
     ...
     newUsesPepperV2 = true;
   } catch (pepperError) {
     console.warn("Vault pepper setup failed, falling back to legacy derivation:", pepperError);
     await generateKey(pin, newSalt);   // ← what actually runs today in every e2e run
   }
   ```
3. Because this fallback is silent (a `console.warn`, not a thrown error), `vault.spec.ts` passes every time — but it has been validating the deprecated derivation path, not the one PROJ-65 shipped and had externally reviewed.

Three further layers of the same feature have no direct automated coverage at all:
* `EncryptionContext.tsx` itself (`setupVault`/`performUnlock`/`changePin`, `usesPepperV2` migration detection, `mrt_vault_pepper` sessionStorage caching) — every consumer test (`VaultGate.test.tsx`, `Profile.test.tsx`, `UrgeSurfer.test.tsx`) mocks `useEncryption()` wholesale rather than exercising the real provider.
* `functions/src/index.ts`'s `verifyVaultPin` onCall handler — only its pure helper, `computeLockoutSeconds`, is unit tested (`functions/src/index.test.ts:269`). The handler's actual behavior (Firestore `pinAttempts` transaction, verifier match/mismatch, pending-rotation verifier acceptance, HMAC pepper generation) is untested.
* `src/lib/vaultAuth.ts` — the client wrapper (`fetchVaultPepper`, error mapping to `VaultPinLockedError`/`VaultPinIncorrectError`) has zero test coverage.

`rotation.ts`/`crypto.ts` are already well covered per PROJ-40/PROJ-61 — this project does not touch them.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Low-to-medium. This is test-only work, but Phase 1 adds a real (emulator-local) `VAULT_PEPPER` secret value to CI and local dev tooling — must never be the real `mrt2-app-dev`/`uat`/`prod` pepper value, and must be clearly documented as emulator-only.
* [x] **Encryption Strategy:** New tests will mock or exercise `fetchVaultPepper`/`verifyVaultPin` with synthetic PINs and hashes only — no real user data, matching PROJ-40/PROJ-61's precedent. The e2e change (Phase 1) makes the peppered path *observable* (assert `usesPepperV2 === true` after setup) rather than changing the derivation logic itself.
* [x] **Key Rotation:** Out of scope for new logic — `rotation.ts` already has coverage — but Phase 2's `EncryptionContext.test.tsx` should include `changePin`'s orchestration (it calls `executePinRotation` and updates the pepper cache), since that call site itself is untested even though the function it calls is.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. Test files, one CI/tooling change, and one small e2e assertion addition.

**Files touched:**
* `package.json` — `test:e2e` script gains `functions` to its `--only` emulator list.
* `functions/.secret.local` (new, gitignored) — dummy `VAULT_PEPPER` value so `defineSecret("VAULT_PEPPER")` resolves inside the Functions emulator without touching the real secret. Confirm `.gitignore` already excludes `*.secret.local` (it does not currently list this pattern — add it if missing).
* `.github/workflows/deploy.yml` — `verify` job's e2e step needs the same dummy secret available before `test:e2e` runs (write `functions/.secret.local` in a step, not a `secrets.*` reference — this must stay a fixed non-production placeholder, not pull from the real `VAULT_PEPPER` secret).
* `e2e/golden-paths/vault.spec.ts` — add an assertion that setup actually used the peppered path.
* `src/contexts/__tests__/EncryptionContext.test.tsx` (new)
* `functions/src/__tests__/verifyVaultPin.test.ts` (new — or extend `functions/src/index.test.ts` if that breaks the existing co-located convention; match whichever the codebase already does for other `onCall` handlers)
* `src/lib/__tests__/vaultAuth.test.ts` (new)

---

## 4. Implementation Phases 🏗️

### Phase 1: Make the e2e Vault Test exercise the real production path — ✅ Shipped
* **Goal:** `vault.spec.ts` fails loudly if the peppered derivation breaks, instead of silently passing via fallback.
* Add `functions` to `test:e2e`'s `--only` emulator list.
* Create `functions/.secret.local` with a placeholder `VAULT_PEPPER` value for local/CI emulator use; document in a comment that this is never the real secret and is emulator-only (the Functions emulator reads `defineSecret` values from this file automatically — no other wiring needed).
* Add the same placeholder-secret step to `.github/workflows/deploy.yml`'s `verify` job, before the `test:e2e` step.
* In `vault.spec.ts`, after "Secure My Journal" setup, assert the peppered path was actually taken — e.g. read the seeded user doc via the Firestore emulator's REST API (`http://127.0.0.1:8080/...`) and assert `usesPepperV2 === true`, or add a `page.on('console')` listener asserting the `"Vault pepper setup failed"` warning never fires during the test. Prefer the Firestore-doc assertion — it verifies the actual persisted state, not just the absence of a log line.
* **Edge case:** if the Functions emulator fails to start (e.g. Java/secret misconfiguration), `firebase emulators:exec` should still fail closed (non-zero exit) rather than the test silently falling back and passing — confirm this is the existing behavior (PROJ-23 already established this for auth/firestore) and doesn't regress with `functions` added.
* **Verified this session:** lint, unit suite (562/562 at the time), functions unit tests (37/37), production build, and a `--debug` emulator trace all confirmed `verifyVaultPin` loads with its `.secret.local`-supplied secret resolved correctly (no interactive-prompt hang). A full Playwright browser run could not complete in the sandbox this was built in — an unrelated, pre-existing Firestore-triggered function (`syncStripeSubscription`, PROJ-68) fails to self-register with the Firestore emulator because that sandbox's network proxy intercepts loopback HTTP between the two emulators. Not present on GitHub Actions runners or normal local dev; confirm the actual browser run passes in CI on the next push.
* **Resolved 2026-07-22, from a VS Code CLI session:** the sandbox-only network-proxy limitation above does not reproduce here. `syncStripeSubscription` self-registers cleanly and the full `npm run test:e2e` run passes for real (3/3, ~39s) — see §5 for the full confirmation, including the "actual regression check" this Phase originally deferred.

### Phase 2: Direct unit coverage of `EncryptionContext.tsx` — ✅ Shipped
* **Goal:** Verify the orchestration logic itself, not just its downstream dependencies.
* Mock `vaultAuth.ts`'s `fetchVaultPepper` and `src/lib/crypto.ts`'s primitives (matching `rotation.test.ts`'s existing mocking approach).
* Test: `setupVault` — successful pepper fetch sets `usesPepperV2: true` and persists it to the user doc.
* Test: `setupVault` — pepper fetch failure falls back to legacy `generateKey` and sets `usesPepperV2: false` (this is intended, documented behavior — the test should pin it down explicitly rather than leave it implicit).
* Test: `performUnlock` — reuses a cached `mrt_vault_pepper` from `sessionStorage` without a second network call; a cleared/absent cache triggers a fresh `fetchVaultPepper`.
* Test: `changePin` — calls `executePinRotation` with the correct current `usesPepperV2` state and updates the session pepper cache on success.
* **Delivered:** `src/contexts/__tests__/EncryptionContext.test.tsx` (12 tests, real `EncryptionProvider` rendered via `renderHook`, `crypto.ts` left un-mocked for real WebCrypto round-trips — only Auth/Firestore/`vaultAuth`/`rotation.ts` mocked). Covers both `setupVault` branches, five `performUnlock`/`unlockVault` scenarios (peppered fetch-and-cache, cached-pepper reuse, legacy no-fetch, wrong PIN fails closed, `VaultPinLockedError` propagation), all three legacy pre-verifier discovery branches (including one that pins down a real existing quirk — a decrypt mismatch against the sampled journal entry resolves `true` from `performUnlock` without ever actually flipping `isVaultUnlocked`, since the catch block at `EncryptionContext.tsx`'s legacy-discovery branch returns early, before the state-setting code below it — documented as-is, not fixed, per this project's test-only scope), `changePin`'s delegation to `executePinRotation`, and `lockVault`. 574/574 suite-wide, lint clean, build clean.

### Phase 3: `verifyVaultPin` Cloud Function handler + `vaultAuth.ts` client wrapper — ✅ Shipped
* **Goal:** Cover the actual security boundary logic, not just its pure helper.
* **Delivered approach (refined during `/planning`, supersedes this bullet's original "mock `db.runTransaction`" sketch):** extracted the transaction's decision logic into two plain, exported functions — `evaluateVaultPinAttempt` (rate-limit + verifier/pendingVerifier matching) and `deriveVaultPepper` (the HMAC formula) — in `functions/src/index.ts`, visibility-only, zero behavior change, mirroring this same file's existing `buildBatchPrompt`/`processUserBatch` precedent. The `onCall` wrapper (and the `pinHash` format regex check that still lives inline in it) stays a thin, untested shell around them — matching how `dailyBeacon`'s `onSchedule` wrapper delegates to `processUserBatch`. This avoids mocking `firebase-admin`'s `runTransaction`/`DocumentSnapshot` entirely (evaluated and rejected as Strategy B during planning: no precedent anywhere in this codebase, higher ongoing maintenance risk).
* Test: correct `pinHash` against `pinVerifier` resets `pinAttempts.count` to 0 and returns `ok: true`.
* Test: incorrect `pinHash` increments `pinAttempts.count`, and sets `lockedUntil` once `computeLockoutSeconds` crosses its threshold (asserted against the exact millisecond value, not just presence).
* Test: an active lockout window rejects with `reason: "locked"` and carries no `attemptsUpdate` — so the (untested) wrapper naturally can't write anything for it; also confirms an *expired* lockout window is correctly no longer treated as locked.
* Test: `pendingVerifier` (mid-PIN-rotation) is accepted alongside `pinVerifier`, and alone with no committed `pinVerifier` yet.
* Test: `deriveVaultPepper` matches `HMAC-SHA256(pepper, pinHash)` base64-encoded — against both an independently-computed value in the test and a pinned literal, is deterministic for repeated calls (rotation-resumability depends on this), and differs for a different `pinHash`.
* **Deliberately not covered directly:** the `pinHash` format regex (`invalid-argument`) and `unauthenticated` checks remain inline in the untested `onCall` wrapper per the extraction boundary above — consistent with Strategy A's scope, not an oversight. Phase 1's e2e `vault.spec.ts` already exercises the wrapper end-to-end against a real request.
* `src/lib/vaultAuth.ts`: `fetchVaultPepper`'s error mapping — `functions/resource-exhausted` → `VaultPinLockedError`, `functions/permission-denied` → `VaultPinIncorrectError`, any other `FunctionsError` code or non-`FunctionsError` rethrown unmapped, success path resolves the pepper. `FunctionsError` left as the real SDK class (not mocked) so `instanceof` checks behave exactly as they would against a genuine failure.
* **Delivered:** `functions/src/index.test.ts` (+12 tests, 49/49 total) and `src/lib/__tests__/vaultAuth.test.ts` (new, 5 tests). 579/579 suite-wide (root) + 49/49 (functions), lint clean on both, build clean on both.

### Phase 4 (stretch, not blocking): Recovery Games e2e/component gap
* Noted in the review but lower priority than Phases 1-3 — PROJ-72's own spec already flags "Subway Test / browser QA still needs a human pass," and 18 of 19 game components have no component test (only `CravingBuster` does), though the underlying game-logic libs are well covered.
* If picked up in this project rather than a separate ticket: at minimum, one component test per game confirming it renders and calls `useGameProgress`/`useGameSave` correctly on completion — not full e2e.
* **Component-test portion — ✅ Shipped 2026-07-22.** One test file per remaining game (the "minimum bar" above), each confirming the game renders its idle screen and calls `useGameProgress`/`useGameSave` with the correct `gameId`/`personaTarget`/stats shape on completion:
  * `src/components/games/goalLadder/__tests__/GoalLadder.test.tsx` (2 tests) — climbs every rung via the real `GOAL_LADDER_RUNGS` data, asserts the full rung count on completion.
  * `src/components/games/thoughtChallenge/__tests__/ThoughtChallenge.test.tsx` (3 tests) — plays through the real `buildThoughtChallengeItems()` bank via `ScenarioMatchQuiz`, covers the optional reflection save as a second `recordProgress` call.
  * `src/components/games/triggerMatch/__tests__/TriggerMatch.test.tsx` (2 tests) — same `ScenarioMatchQuiz` pattern against `buildTriggerMatchItems()`.
  * `src/components/games/knowledgeQuests/__tests__/KnowledgeQuests.test.tsx` (3 tests) — pack picker → quiz → "Try Another Pack" loop, confirms `stats.packId` is set correctly and no double-recording on replay.
  * `src/components/games/jeopardy/__tests__/RecoveryJeopardy.test.tsx` (2 tests) — stubs `JeopardyBoard`/`QuestionModal`/`FinalJeopardy` to deterministic controls (their own content/wagering logic already has dedicated coverage in `jeopardyData.test.ts`/`scoring.test.ts`) and drives the *real* `RecoveryJeopardyGame` round state machine (setup → jeopardy → double → final, 60 real state transitions) to confirm the winner-determination and `recordProgress` wiring.
  * `src/components/games/fastLane/__tests__/FastLane.test.tsx` (3 tests) — real `createNewGameState`/`applyWork` etc. from `turnEngine.ts`, with only `resolveWeekEnd`/`runRivalTurn` stubbed to force an immediate win (their real week-by-week math is `turnEngine.test.ts`'s job, not this component test's). Confirms `saveGame` fires on difficulty selection and `recordProgress`/`clearSave` fire together on reaching the win screen.
  * All 15 new tests pass; full suite is 594/594 (`npm run check` clean — lint, 38/38 specs, build). `CravingBuster.test.tsx` (pre-existing, 3 tests) was left untouched.
* **Subway Test browser pass — ✅ Shipped 2026-07-23**, from a VS Code CLI session where a real Playwright browser run is available (the sandbox limitation Phase 1 hit for `vault.spec.ts` does not reproduce here). New `e2e/golden-paths/subway.spec.ts` drives the actual offline-cache/reconnect-sync behavior and Fast Lane's close-tab-and-resume flow through `game_saves` in a real browser against real emulators — see §5 for what it proves and its one documented dev-server-only limitation.

---

## 5. QA & Verification 🧪
* [x] **Run Suite:** `npm run test:once` — 594/594 passing as of the Phase 4 component-test addition (579/579 through Phases 1-3). `npm run test:e2e` — **observed passing end-to-end for real 2026-07-22**, from a VS Code CLI session (not the earlier sandbox that hit the loopback-network limitation described below): emulators (Auth/Firestore/Functions) boot cleanly, `syncStripeSubscription` self-registers with the Firestore emulator without error, and all 3 golden-path tests pass — `gate.spec.ts` (7.9s), `ledger.spec.ts` (7.8s), `vault.spec.ts` (21.3s), 3 passed in 39.4s total. The original sandbox-only network-proxy issue (loopback HTTP between emulators) does not reproduce in this environment.
* [x] **The actual regression check — performed 2026-07-22, from a VS Code CLI session.** Previously blocked on the same full-browser-run limitation; now unblocked. Two rounds, both reverted immediately after (confirmed via `git diff`/`git status` clean):
  * **Round 1 (deterministic wrong pepper):** `deriveVaultPepper` changed to append a fixed wrong suffix before hashing. Result: **all 3 tests still passed**, including `vault.spec.ts`. This is expected, not a bug — `verifyVaultPin` is called once at setup and once at unlock within the same test, and a deterministic wrong pepper is derived identically both times, so the (wrong) key is self-consistent and content still round-trips. This is a genuinely useful finding in its own right: a client-observable round-trip test structurally cannot detect "this pepper is the wrong constant" — only "the pepper changed between derivations."
  * **Round 2 (non-deterministic wrong pepper):** `deriveVaultPepper` changed to append `Math.random()` before hashing, forcing the setup-time and unlock-time derived peppers to differ. Result: **`vault.spec.ts` failed as expected** (`gate`/`ledger` still passed, unaffected). This is the concrete proof this project set out to establish — the e2e Vault Test genuinely depends on `verifyVaultPin`'s pepper being consistent/correct, not silently passing via the legacy fallback.
  * Both rounds' changes were confirmed reverted (`git diff functions/src/index.ts` empty) and the suite re-run clean (3 passed, 39.4s) before this checkbox was marked done.
* [x] **CI runtime budget — confirmed 2026-07-22.** Three full real runs (clean, round-1 break, round-2 break) all completed in the 39-65s range for the Playwright portion, consistent with Phase 1's original estimate. No material change to the existing `verify` job's runtime.
* [x] **Phase 4 component coverage:** `npm run check` clean (lint zero warnings, 38/38 specs, 594/594 tests, production build) — confirmed 2026-07-22.
* [x] **Phase 4 Subway Test (Recovery Games offline/resume) — authored and passing 2026-07-23**, from a VS Code CLI session. No Playwright spec existed for Recovery Games before this (`e2e/golden-paths/` only covered gate/vault/ledger, per PROJ-23's original scope) — closing this required authoring a new spec, not just re-running a previously-blocked one. New: `e2e/golden-paths/subway.spec.ts`, targeting Fast Lane (the only Recovery Game with genuine multi-session state worth resuming). Against real Auth/Firestore/Functions emulators with `context.setOffline(true)`, it proves: an offline in-game action updates state immediately via `persistentLocalCache` rather than erroring; exiting and re-entering the game while still offline (the close-tab-and-resume flow) resumes from the local cache alone; and the offline-queued write reaches the server once back online, verified from a second, storage-isolated browser context that never wrote anything locally. Passed 3/3 consecutive runs, and alongside gate/ledger/vault with no interference (4 passed, 56.3s). One documented, honest limitation: this runs against the Vite dev server (no service worker in dev mode), so the spec warms the GamesHub/FastLane lazy route chunks online first via the browser's ES-module cache rather than asserting a full page reload works offline — a built-PWA-only guarantee this spec doesn't cover.
* [x] **Console Hygiene:** confirmed — no real PIN, pepper, or derived key ever logged anywhere across the new tests; synthetic fixtures only (e.g. `'1234'`, `dGVzdC1wZXBwZXItdmFsdWU=`), matching PROJ-40/PROJ-61 precedent.
* [x] **Secret hygiene:** confirmed — `functions/.secret.local` is gitignored (via `functions/.gitignore`'s `*.local`), contains only placeholder values, documented in `README.md`'s new "E2E golden paths" section, and the CI step writes the same placeholders (never a `secrets.*` reference).
