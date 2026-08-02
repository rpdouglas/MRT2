# 📁 Project 99: Firestore & Backend Hardening

**Status:** ⚪ Planned
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

### Phase 1: Document-shape validation
* Add `request.resource.data` shape/size checks to `firestore.rules` for `journals` first (bounded `content` string length — pick a ceiling generous enough for a long journal entry's ciphertext, e.g. based on the largest real entry observed in practice — plus required-field/type checks), then `game_saves`.
* Explicitly out of scope for this phase: the other four collections sharing the same "ownership-only" rule shape (`tasks`, `insights`, `service`, `game_progress`) — note them as a fast-follow once the pattern is validated on the two highest-value targets, rather than risk a broad simultaneous change to every collection's rules at once.

### Phase 2: Firestore rules unit tests
* Add `@firebase/rules-unit-testing` as a dev dependency.
* Write emulator-based tests covering: ownership enforcement (existing behavior, to guard against regression), the new Phase 1 shape/size checks, and the existing tier/role self-escalation blocks (`firestore.rules:38-42, 52-55`) that currently have no automated test at all despite being security-critical.
* Wire into the same CI `verify` job that already runs lint/spec-quality/unit tests (`.github/workflows/deploy.yml`), not a separate optional job.

### Phase 3: Index reconciliation
* Pull the actual deployed composite indexes for `mrt2-app-prod` (via Firebase console or `firebase firestore:indexes`) and diff against `firestore.indexes.json`.
* Add the missing entries for `useToolHistory.ts` (uid + array-contains + orderBy on `journals`), `useSmartToolCompletions.ts` (similar shape), and `src/lib/insights.ts` (uid + orderBy on `insights`) — confirmed via the audit to be live query shapes with no matching declared index.
* Verify a fresh environment (e.g. `mrt2-app-uat`, already known to be behind on its own Secret Manager setup per `docs/BACKLOG.md`) could deploy from this file alone and have every real query work without a first-run `FAILED_PRECONDITION` error.

### Phase 4: Cloud Functions cost guardrails
* Add `maxInstances` (and `concurrency` if warranted) to `generateAIInsights` and `dailyBeacon` — the two functions with no code-level ceiling today.
* Add a GCP budget alert on the production project (console-side, document the threshold chosen and why in this spec once decided).
* Fix `dailyBeacon`'s `sendEach()` call to chunk at ≤500 messages per call — currently accumulates every batch's push messages into one array and sends in a single call, which will throw or silently drop the excess past the SDK's hard limit. This is a correctness bug, not just a hardening item — flag its priority accordingly during implementation.

### Phase 5: Admin-definition convergence
* Converge `AuthContext.tsx`'s `isAdmin` computation (currently `!!idTokenResult.claims.admin || profile.role === 'admin'`) onto the custom claim alone.
* Decide the migration path for any account currently relying on the `role: 'admin'` Firestore field without the matching claim (audit found none currently causes a real privilege-escalation risk, but confirm this is still true before removing the fallback — a real admin losing UI access because only the `role` field was ever set would be a regression, not just a cleanup).

### Phase 6: Edge Cases
* [ ] Confirm the Phase 1 shape/size limits don't reject any real, legitimate existing document (test against production-shaped data, e.g. the longest known journal entry, before enforcing on write).
* [ ] Confirm Phase 4's `maxInstances` value doesn't create a new failure mode (requests rejected under normal peak load) — size it against realistic concurrent usage, not an arbitrary round number.
* [ ] Confirm Phase 5's admin convergence doesn't lock out the real admin account during the transition — verify the custom claim is actually set for every account that currently relies on the `role` fallback before removing it.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** New Firestore rules test suite (Phase 2) — ownership, shape/size validation, tier/role escalation blocks.
* [ ] **Manual:** Trigger a deliberate oversized/malformed write against the emulator post-Phase-1 and confirm it's rejected, not just documented as rejected.
* [ ] **The Subway Test:** N/A — no offline-behavior change.
* [ ] **The "Lost PIN" Test:** N/A — no key-derivation change.
* [ ] **Cost:** Confirm `dailyBeacon`'s `sendEach()` fix against a synthetic batch of >500 pending notifications in the emulator, not just code review.
* [ ] **Regression:** Full `npm run check` plus `functions/`'s own build+test pass after every phase.
