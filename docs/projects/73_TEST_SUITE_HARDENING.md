# 📁 Project 73: Test Suite Hardening — Vault-PIN Pepper Coverage

**Status:** ⚪ Planned
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

### Phase 1: Make the e2e Vault Test exercise the real production path
* **Goal:** `vault.spec.ts` fails loudly if the peppered derivation breaks, instead of silently passing via fallback.
* Add `functions` to `test:e2e`'s `--only` emulator list.
* Create `functions/.secret.local` with a placeholder `VAULT_PEPPER` value for local/CI emulator use; document in a comment that this is never the real secret and is emulator-only (the Functions emulator reads `defineSecret` values from this file automatically — no other wiring needed).
* Add the same placeholder-secret step to `.github/workflows/deploy.yml`'s `verify` job, before the `test:e2e` step.
* In `vault.spec.ts`, after "Secure My Journal" setup, assert the peppered path was actually taken — e.g. read the seeded user doc via the Firestore emulator's REST API (`http://127.0.0.1:8080/...`) and assert `usesPepperV2 === true`, or add a `page.on('console')` listener asserting the `"Vault pepper setup failed"` warning never fires during the test. Prefer the Firestore-doc assertion — it verifies the actual persisted state, not just the absence of a log line.
* **Edge case:** if the Functions emulator fails to start (e.g. Java/secret misconfiguration), `firebase emulators:exec` should still fail closed (non-zero exit) rather than the test silently falling back and passing — confirm this is the existing behavior (PROJ-23 already established this for auth/firestore) and doesn't regress with `functions` added.

### Phase 2: Direct unit coverage of `EncryptionContext.tsx`
* **Goal:** Verify the orchestration logic itself, not just its downstream dependencies.
* Mock `vaultAuth.ts`'s `fetchVaultPepper` and `src/lib/crypto.ts`'s primitives (matching `rotation.test.ts`'s existing mocking approach).
* Test: `setupVault` — successful pepper fetch sets `usesPepperV2: true` and persists it to the user doc.
* Test: `setupVault` — pepper fetch failure falls back to legacy `generateKey` and sets `usesPepperV2: false` (this is intended, documented behavior — the test should pin it down explicitly rather than leave it implicit).
* Test: `performUnlock` — reuses a cached `mrt_vault_pepper` from `sessionStorage` without a second network call; a cleared/absent cache triggers a fresh `fetchVaultPepper`.
* Test: `changePin` — calls `executePinRotation` with the correct current `usesPepperV2` state and updates the session pepper cache on success.

### Phase 3: `verifyVaultPin` Cloud Function handler + `vaultAuth.ts` client wrapper
* **Goal:** Cover the actual security boundary logic, not just its pure helper.
* Mock Firestore (`db.runTransaction`, matching the existing `functions/src` test conventions) and `vaultPepperSecret.value()`.
* Test: correct `pinHash` against `pinVerifier` resets `pinAttempts.count` to 0 and returns a pepper (assert the HMAC is deterministic for a fixed pepper+pinHash, without asserting a live secret value).
* Test: incorrect `pinHash` increments `pinAttempts.count` and sets `lockedUntil` once `computeLockoutSeconds` returns non-null.
* Test: a request during an active lockout window is rejected with `resource-exhausted` and does *not* further increment the counter.
* Test: `pendingVerifier` (mid-PIN-rotation) is accepted alongside `pinVerifier`, per the documented rationale in `functions/src/index.ts`.
* Test: missing/malformed `pinHash` (not 64 hex chars) is rejected with `invalid-argument` before touching Firestore.
* `src/lib/vaultAuth.ts`: test `fetchVaultPepper`'s error mapping — `functions/resource-exhausted` → `VaultPinLockedError`, `functions/permission-denied` → `VaultPinIncorrectError`, anything else rethrown as-is.

### Phase 4 (stretch, not blocking): Recovery Games e2e/component gap
* Noted in the review but lower priority than Phases 1-3 — PROJ-72's own spec already flags "Subway Test / browser QA still needs a human pass," and 18 of 19 game components have no component test (only `CravingBuster` does), though the underlying game-logic libs are well covered.
* If picked up in this project rather than a separate ticket: at minimum, one component test per game confirming it renders and calls `useGameProgress`/`useGameSave` correctly on completion — not full e2e.

---

## 5. QA & Verification 🧪
* [ ] **Run Suite:** `npm run test:once` (unit) and `npm run test:e2e` (e2e, now with Functions emulator) — all suites pass.
* [ ] **The actual regression check:** temporarily break `verifyVaultPin` (e.g. return a wrong pepper) and confirm `vault.spec.ts` now fails instead of silently passing via fallback — then revert. This is the concrete proof this project achieved its objective.
* [ ] **Console Hygiene:** no real PIN, pepper, or derived key ever logged; synthetic test fixtures only, matching PROJ-40/PROJ-61 precedent.
* [ ] **Secret hygiene:** confirm `functions/.secret.local` is gitignored and contains only a placeholder value, in both the local dev instructions and the CI step that writes it.
* [ ] **CI runtime budget:** confirm adding the Functions emulator to `test:e2e` doesn't materially regress the `verify` job's ~35-45s e2e budget established in PROJ-23.
