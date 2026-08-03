# 📁 Project 99: Firestore & Backend Hardening

**Status:** ✅ Shipped
**Primary Persona:** Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing UI change; this protects data integrity, cost, and correctness as the user base grows.
**Objective:** Close the Firestore/Cloud-Functions-layer findings from `docs/reports/2026-08_full_production_readiness_audit.md`'s Medium-Effort bucket (§20) — document-shape validation, rules test coverage, index-file drift, Cloud Functions cost guardrails, and the three-way admin-definition split — none of which are urgent today, all of which get materially more expensive to retrofit after real user growth.

---

## 1. The Executive Summary
**User Story:** As the developer/operator, I want Firestore to reject malformed or oversized writes before they land, my Cloud Functions to have a cost ceiling before a traffic spike finds it for me, and exactly one way to determine "is this user an admin" — none of which changes what an end user sees or does.
**Source:** `docs/reports/2026-08_full_production_readiness_audit.md` §4 (Firebase Review), §6 (Security Review), §17 (Data Layer Review), §18 (Scalability Review), §20 (Technical Debt).

**Scope note:** `docs/projects/96_CI_DEPLOY_SAFETY_NET.md` already owns closing `scripts/sync_security_rules.sh`'s CI-bypass side door — not duplicated here, this ticket is about what the rules *say*, not how they deploy.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Yes — this ticket adds validation to the write path for `journals`, `game_saves`, and other sensitive collections. It does not change what's encrypted vs. plaintext (see `CLAUDE.md`'s boundary table, unchanged), only what shape/size Firestore will accept for a given field.
* [x] **Encryption Strategy:** No change — shape validation operates on ciphertext-shaped fields (e.g. confirming a `content` field is a bounded-length string matching the `IV:Ciphertext` pattern) without ever inspecting plaintext, since Firestore rules never see decrypted content.
* [x] **Key Rotation:** N/A — no schema change to key-derivation fields.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted (validation only, no field additions):**
* `journals` — add `request.resource.data` shape checks (bounded `content` length, required `uid`/`createdAt` types) to `firestore.rules`.
* `game_saves` — same, second-highest-value target per the audit (largest per-document payload of the partially/fully-encrypted collections).
* Other collections (`tasks`, `insights`, `service`, `game_progress`) — same pattern, lower priority; can follow in a fast-follow pass once the `journals`/`game_saves` approach is proven.

**Files impacted:**
* `firestore.rules` — add `.hasAll()`/type/length checks per collection, starting with `journals` and `game_saves`.
* `firestore.indexes.json` — reconcile against real deployed indexes (see Phase 2).
* `functions/src/index.ts` — `maxInstances`/`concurrency` on `generateAIInsights` (~line 1079) and `dailyBeacon` (~line 386); chunk `dailyBeacon`'s `sendEach()` call (~line 455) to respect the SDK's 500-message-per-call limit.
* `src/contexts/AuthContext.tsx` (~line 90), `firestore.rules`, any Cloud Function checking admin — converge on the custom claim as the sole source of truth.
* New: `src/hooks/__tests__/firestore.rules.test.ts` (or similar, emulator-based) — the first rules unit test in the repo.

---

## 4. Implementation Phases 🏗️

### Phase 1: Document-shape validation — ✅ Shipped
* [x] Added `firestore.rules` shape/size checks for `journals` and `game_saves`. **Deviation from the plan**, found during implementation: split each collection's validation into a *shape* function (types/required fields — `uid`/`content`/`createdAt` for journals, `uid`/`gameId`/`encryptedState`/`updatedAt` for game_saves) enforced on **both** create and update, and a separate *size* function enforced on **create only**. Reasoning: `updateDoc` calls (PIN rotation re-encrypting `content`, a user editing an old entry) produce a `request.resource.data` that's the full post-write document, including untouched fields carried over from before this rule existed — enforcing a byte ceiling on update risks retroactively locking a user out of updating their own pre-existing document if it happens to already exceed today's chosen number. Shape checks carry no such risk (every existing document was already written with these types by client code). Ceilings chosen: **50KB** for `journals.content`, **200KB** for `game_saves.encryptedState` — both well under Firestore's 1MiB document limit, not derived from real byte-size telemetry (none exists yet). `tasks`/`insights`/`service`/`game_progress` remain ownership-only, as planned.

### Phase 2: Firestore rules unit tests — ✅ Shipped
* [x] Added `@firebase/rules-unit-testing`. New file: `src/__tests__/firestore.rules.test.ts` (not the originally-suggested `src/hooks/__tests__/` path — this tests `firestore.rules` directly via the emulator, no hook/React involvement, so it lives with the other top-level tests instead). 22 tests covering ownership (including the unauthenticated-request case), Phase 1's shape/size checks (including the legacy-oversized-document update scenario Phase 1's split was designed for), and the `users/{userId}` tier/role/pinAttempts self-escalation blocks, which had zero prior coverage despite being security-critical.
* **Real gotcha found and fixed during implementation:** `RulesTestEnvironment.withSecurityRulesDisabled()`'s bypass only applies *inside* the callback's own execution — a Firestore instance extracted from the callback and used afterward is back to enforcing rules normally. All seed/setup writes had to move inside the callback itself.
* Needs its own Vitest config (`vitest.rules.config.ts`) rather than just an `exclude` entry in `vite.config.ts`: Vitest's config-level `exclude` still applies even to an explicit CLI file argument, so a separate config was the only way to let `test:rules` target this one file without it being excluded by the main suite's config it would otherwise inherit.
* Reads `firestore.rules` via Vite's `?raw` import rather than `node:fs` — this file lives under `src/`, governed by the browser-only `tsconfig.app.json` type scope (no Node types), and `?raw` is already typed via `vite/client` with no additional dependency.
* New script: `npm run test:rules` (`firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.ts"`), wired into `.github/workflows/deploy.yml`'s `verify` job right after the Java setup step it shares with the E2E gate, running *before* the slower Playwright suite so it fails fast first.

### Phase 3: Index reconciliation — ✅ Shipped (fully, as of 2026-08-03)
* [x] Added 2 composite indexes to `firestore.indexes.json`, not 3: `useToolHistory.ts`'s query (`journals`: uid ASC + tags CONTAINS + createdAt DESC) and `insights.ts`'s query (`insights`: uid ASC + createdAt DESC). `useSmartToolCompletions.ts`'s query (uid ASC + tags CONTAINS, no orderBy) needed **no separate index** — it's exactly a prefix of the `useToolHistory` index's fields, and Firestore serves a query on any prefix of a composite index for free.
* [x] **Residual step closed (2026-08-03):** a later sandbox had live Firebase CLI auth against `mrt2-app-prod`, so ran `firebase firestore:indexes --project=mrt2-app-prod` for real and diffed the output against `firestore.indexes.json`. Found the static-analysis pass above had missed two indexes that were **already deployed on prod and actively required by live queries, but absent from the file** — meaning a fresh `firebase deploy --only firestore:indexes` from this file to a rebuilt environment would have silently broken both queries:
  * `tasks`: uid ASC + createdAt DESC — used by `useTasksList.ts`.
  * `journals`: uid ASC + createdAt ASC — used by `JournalInsights.tsx`'s `fetchJournalsForInsights`.

  Both added to `firestore.indexes.json`. Also found one orphaned index live on prod (`journals`: tags CONTAINS + uid ASC + createdAt DESC — note the field order, tags first) with no matching call site anywhere in current `src/`/`functions/src/`; left alone rather than deleted (no urgent cost, and deleting a live prod index is a one-way action not worth taking speculatively — revisit if `journals` read costs ever get audited).

### Phase 4: Cloud Functions cost guardrails — ✅ Shipped
* [x] `generateAIInsights`: `maxInstances: 20` — the real cost-exposure surface (scales per concurrent request, pays a Gemini API call per invocation). Not derived from real traffic data (this app has none at meaningful scale yet) — a documented judgment call, revisit once there's real usage to tune against.
* [x] `dailyBeacon`: `maxInstances: 1` — reasoned differently than `generateAIInsights`, since a `onSchedule` function isn't exposed to per-request concurrency cost the way an `onCall` function is (Cloud Scheduler fires it once per cron tick). The real value of capping at 1 here is an **idempotency guardrail**: a retry or manual re-trigger overlapping with an in-flight run could send duplicate notifications or race on the token-pruning batch write.
* [x] Fixed the `sendEach()` 500-message bug — extracted as `sendBeaconMessagesChunked()`, a standalone, injectable-dependency function (matching this file's existing pattern for `processUserBatch`'s injected callback) rather than an inline loop, so the chunking/aggregation/index-correlation logic is directly unit-testable without mocking the Admin SDK. 5 new tests in `functions/src/index.test.ts` cover: single-call-when-under-limit, multi-chunk-splitting-at-exactly-500, cross-chunk success/failure aggregation, index correlation surviving concatenation (verified by feeding the result straight into `identifyStaleTokensByUser`), and the empty-array case.
* [ ] **GCP budget alert — not done, console-only action outside this environment's reach.** Recommendation to whoever has GCP console access: set a monthly budget alert on the production project at a threshold that would catch a runaway `generateAIInsights` loop (each Gemini call has a real, small-but-nonzero cost) well before it becomes a surprise bill — a few multiples of whatever the current baseline monthly spend is, tightened once there's a real baseline to tighten against.

### Phase 5: Admin-definition convergence — ✅ Shipped (safe-migration path, not full convergence)
* **Decision (product owner, 2026-08-02):** not confident the custom claim is set on every account relying on the `role` fallback, and this sandbox has no way to check production Auth/Firestore directly — chose the non-destructive path over guessing.
* [x] Added `trackAdminRoleFallbackUsed()` (`src/lib/telemetry.ts`) — fires only when `profile.role === 'admin'` is the *sole* reason `isAdmin` resolved true (i.e. the custom claim was absent), wired into `AuthContext.tsx`'s auth-state-change handler. No PII (no uid, no email) — same discipline as every other telemetry call site in this file. **Both checks remain in place** — this does not converge onto the custom claim yet, it makes convergence safe to do later: once this event stops firing over some observation period, every real admin account already has the claim and the fallback can be removed with confidence instead of a guess.

### Phase 6: Edge Cases
* [x] Confirmed via the new rules test suite (Phase 2) that a pre-existing oversized document can still be updated — the split shape/size design was built specifically to avoid the rejection risk this edge case worried about.
* [x] `maxInstances` values are documented judgment calls (Phase 4), explicitly flagged as unverified against real traffic since none exists yet at this app's current scale.
* [x] Phase 5's safe-migration path directly addresses this — no convergence happened yet, so there is no lockout risk from this ticket. The telemetry it added is exactly the mechanism that will let a future ticket verify this safely instead of guessing.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** 22 new Firestore rules tests (`src/__tests__/firestore.rules.test.ts`, run via `npm run test:rules`) + 5 new `sendBeaconMessagesChunked` tests (`functions/src/index.test.ts`) — all passing.
* [x] **Manual:** Verified via the rules test suite itself (an assertion IS the deliberate malformed/oversized write, against a real local emulator, not a mock).
* [x] **The Subway Test:** N/A — no offline-behavior change, as planned.
* [x] **The "Lost PIN" Test:** N/A — no key-derivation change, as planned.
* [x] **Cost:** `sendBeaconMessagesChunked`'s test suite covers a synthetic 1,200-message batch split into 500/500/200 chunks — the exact scenario the bug fix targets — via unit tests rather than the emulator (Cloud Messaging has no local emulator in the Firebase Emulator Suite, unlike Firestore/Auth/Functions, so "in the emulator" per the original plan wasn't achievable; the injected-dependency unit test is the closest equivalent available).
* [x] **Regression:** `npm run check` (lint + spec-quality + 662 tests + build) and `functions/`'s own build + 63 tests (58 original + 5 new) both clean.
