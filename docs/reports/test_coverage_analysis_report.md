# MRT Test Coverage Analysis Report

*   **Audit Date**: July 2026
*   **Target Scope**: `src/` (components, hooks, lib, contexts, pages) and `functions/src/`
*   **Objective**: Identify under-tested areas of the codebase and prioritize where new test coverage would reduce the most risk.

---

## 1. Current State Assessment

The repository has ~65 Vitest test files covering 151 source files in `src/`, plus 1 test file in `functions/src/`. Coverage is solid for pure business logic (`src/lib/*.ts` scoring/formatting helpers) and for hooks that wrap TanStack Query, but thin-to-absent in a few places that matter a lot given this app's zero-knowledge threat model.

| Area | Files | Tested | Notes |
|---|---|---|---|
| `src/lib/*.ts` | 30 | 13 | Scoring/formatting logic well covered; security & data-mutation modules are not |
| `src/hooks/*.ts` | 22 | 15 | Query-wrapper hooks well covered; a few standalone hooks (breath engine, wake lock, time-of-day) are not |
| `src/components/**` | 65 | 23 | Several whole domains (tasks, vitality, insights, readings) have zero component tests |
| `src/pages/*.tsx` | 18 | 6 | Most route-level pages untested, including one of the six approved Gemini AI-analysis flows |
| `functions/src/index.ts` | 6 exported Cloud Functions | 0 handler-level tests | Only extracted pure helpers are tested, not the functions themselves |

---

## 2. Highest-Priority Gap: Vault Key Derivation / Pepper Scheme

`src/lib/crypto.test.ts` only exercises the base PBKDF2 `generateKey`/encrypt/decrypt round trip. It never touches `usesPepperV2` — the HMAC-SHA256 combination of the local PBKDF2 bits with the server pepper that `CLAUDE.md` flags as the critical security boundary (PROJ-65). Specifically untested:

*   **`src/lib/vaultAuth.ts`** (`fetchVaultPepper`) — zero tests, not even a happy-path mock of the `verifyVaultPin` call.
*   **`src/contexts/EncryptionContext.tsx`** (300 lines — orchestrates PIN entry, pepper fetch/cache in `sessionStorage`, legacy-vs-peppered branching) — no direct unit test; only indirectly touched via `VaultGate.test.tsx`.
*   **`verifyVaultPin` Cloud Function** (`functions/src/index.ts:1009`) — no handler-level test. `functions/src/index.test.ts` only tests the extracted pure helper `computeLockoutSeconds`, not the actual rate-limit/lockout integration against Firestore state or the HMAC pepper combination.

Given a PIN-rotation migration is live in production (`usesPepperV2` branches two different derivation paths for new vs. legacy vaults), this is the area where a regression could most easily produce wrong keys or a silent bypass — and it is currently the least tested code in the app.

---

## 3. Cloud Functions With Real Side Effects

`functions/src/index.ts` (1103 lines) exports 6 functions:

```
dailyBeacon              (onSchedule)
checkBufferHealth        (onSchedule)
generateReadingsAdmin    (onCall)
syncStripeSubscription   (onDocumentWritten)
generateAIInsights       (onCall)
verifyVaultPin           (onCall)
```

Only pure helper functions extracted from these (`processUserBatch`, `identifyStaleTokensByUser`, `computeLockoutSeconds`, `buildBatchPrompt`) are unit-tested — none of the exported handlers themselves have integration-level tests.

*   **`syncStripeSubscription`** (`index.ts:596`) has **no coverage at all**. It writes billing/entitlement state from Stripe webhooks — a bug here silently breaks premium access.
*   **`dailyBeacon`** / **`checkBufferHealth`** are tested only through their extracted logic, not the scheduled-function wrappers (trigger config, error isolation at the top level).
*   **`verifyVaultPin`** — see Section 2.

---

## 4. Untested `src/lib/` Modules

| Module | Risk | Notes |
|---|---|---|
| `deletion.ts` | High | Account/data deletion — destructive, must be idempotent per `CLAUDE.md` mutation rules; zero tests |
| `importer.ts` | Medium | Data import path; counterpart `exporter.ts` is tested but import is not |
| `workbookAnswers.ts` | Medium | Sits directly in the encrypted-collection write path; only the hook wrapper (`useWorkbookAnswers`) is tested, not this module |
| `rhythmScore.ts` | Medium | Streak/rhythm scoring feeding `RhythmScoreRing`; untested |
| `versioning.ts`, `theme.ts`, `toolsRegistry.ts`, `haptics.ts`, `heroColors.ts`, `mockData.ts`, `weather.ts` | Low | Mostly config/presentational; lower priority |

---

## 5. Component Directories With Zero Tests

*   **`components/tasks/`** (6 components incl. `SwipeableTaskRow`, `TaskFormModal`, `ForgivenessTapSheet`) — task CRUD UI is a core daily-use flow for all four personas; untested.
*   **`components/vitality/`** (`MoveTab`, `FuelTab`, `BreathTab`) — despite `useVitalityEntries` and `vitalityScoring.ts` being tested at the logic layer, the UI that renders/mutates that data is not.
*   **`components/insights/`** (`ROSCCheckIn`, `ROSCAssessmentCard`, `ROSCHistoryPanel`, `ROSCPillCapsules`) — renders the partially-encrypted `rosc_assessments` collection; worth testing that plaintext-score fields vs. `encryptedAIContext` are handled correctly at render time.
*   **`components/readings/ModalitySelector.tsx`** — untested (sibling components `ReadingModal`/`ReadingShareButton` are tested).
*   **`components/ui/GlassCard.tsx`** — low risk, purely presentational.

---

## 6. Pages

6 of 18 pages are tested (`Dashboard`, `Login`, `Profile`, `ToolHistory`, `ToolsHub`, `UrgeSurfer`). Missing: `AdminDashboard`, `DebugTools` (acceptable to skip), `InsightsLog`, `Journal`, `Links`, `PremiumUpgrade`, `Tasks`, `Vitality`, `WorkbookDetail`, `WorkbookSession`, `Workbooks`.

`WorkbookDetail.tsx` is notable since it is one of the six approved Gemini AI-analysis flows listed in `CLAUDE.md` (`analyzeWorkbookContent`) — worth a test asserting it only sends sanitized/approved content to the AI proxy.

---

## 7. Recommended Priority Order

1. **`EncryptionContext.tsx` + `vaultAuth.ts` peppered-derivation path** — unit tests for both `usesPepperV2` branches, pepper caching in `sessionStorage`, and failure/fallback behavior.
2. **`verifyVaultPin` handler** — integration-style test (Firestore emulator/mocks) covering lockout escalation and rejection of malformed pin hashes.
3. **`syncStripeSubscription`** — webhook handler test covering entitlement state transitions.
4. **`deletion.ts`** — destructive, must be idempotent/rollback-safe per `CLAUDE.md`.
5. **`components/tasks/`** — highest-traffic UI currently untested.
6. Backfill `rhythmScore.ts`, `importer.ts`, `workbookAnswers.ts`.
