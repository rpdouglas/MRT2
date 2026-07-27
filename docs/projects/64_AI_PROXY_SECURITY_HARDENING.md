# 📁 Project 64: Gemini AI Proxy & Platform Hardening (Cloud Functions Security Migration)

**Status:** ✅ Shipped (2026-07-13) — spec backfilled 2026-07-16 during a governance audit cross-referencing `docs/reports/archive/codebase_gaps_audit_report.md` against shipped code.
**Primary Persona:** All (internal/architecture — no primary end-user persona)
**Objective:** Remove the client-exposed Gemini API key, enforce AI usage rate limits server-side, restore Firestore offline resilience, and add telemetry for silent vault-decryption failures — closing four of the five gaps identified in the July 2026 codebase audit.

**Source:** `docs/reports/archive/codebase_gaps_audit_report.md` (Gaps A, C, D, E) and `docs/reports/archive/remediation_implementation_plan.md`. Shipped in commit `6748388` ("feat: Implement Firebase Cloud Functions proxy for Gemini API to secure API key and enhance rate limiting"). This spec is a backfill — the work shipped without a spec file, which is a violation of this repo's "no feature without a `docs/projects/XX_FEATURE.md` spec" rule; documented after the fact per the same precedent as `PROJ-17`/`PROJ-26`.

**Scope correction:** the shipping commit's message also claims *"refactor: Enhance key derivation process for AES-GCM Vault Key to improve security against brute-force attacks."* That claim is false — `src/lib/crypto.ts`'s `generateKey()`/`computePinHash()` are byte-for-byte unchanged in the diff; only PostHog telemetry was added to `decrypt()`. Gap B (the actual key-derivation hardening) was never implemented. It's tracked separately as `PROJ-65` since it still needs real design work, not a backfill.

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want the Gemini API key removed from the client bundle and AI usage limits enforced somewhere a user can't bypass by editing the JS bundle, so the app can scale past a trusted-beta userbase without quota-drain or billing-abuse risk.
**Competitive Gap:** N/A — internal security/infra hardening, not user-facing.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** High. `generateAIInsights` receives decrypted journal/workbook/ROSC content client-side and forwards it server-side to Gemini for the six approved AI flows in `CLAUDE.md`. Confirmed during this audit: the Cloud Function does **not** log or persist `dataPayload` anywhere (`functions/src/index.ts:980-983` logs only the error object on failure, never the payload) — no new ZK leak introduced by the proxy hop.
* [x] **Encryption Strategy:** N/A directly — this function receives already-decrypted plaintext from the client's six approved call sites and never touches `crypto.ts`.
* [ ] **Key Rotation:** N/A.

**CLAUDE.md drift found during backfill:** the "Approved Gemini exception" section still describes the six flows sending decrypted content "directly to Gemini over HTTPS" client-side. That's now inaccurate — content routes through this Cloud Function proxy first. CLAUDE.md needs a wording update (tracked as a follow-up below, not in this spec's scope).

---

## 3. Schema & Architecture 🗄️
**Firestore Collections Impacted:**
* `users/{uid}`: `usage_limits.*` timestamps (`lastWeeklyInsight`, `lastMonthlyInsight`, `lastDeepDive`, `lastROSCAssessment`) are now written server-side via `FieldValue.serverTimestamp()` inside `generateAIInsights`, instead of client-side via `useRateLimits.ts`'s `stampUsage()`.

**New Cloud Function (`functions/src/index.ts`):**
```typescript
export const generateAIInsights = onCall({
  secrets: [geminiApiKey],
  timeoutSeconds: 300,
  memory: "512MiB",
  region: "northamerica-northeast1",
}, async (request) => { /* auth check → server-side rate-limit check → Gemini call → server-side usage stamp */ });
```

**Client (`src/lib/gemini.ts`):** all six approved AI flows now route through `callAIProxy()` → `httpsCallable(functions, "generateAIInsights")` instead of instantiating `GoogleGenerativeAI` with a `VITE_`-prefixed key.

**Firestore init (`src/lib/firebase.ts`):** `getFirestore(app)` replaced with `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`.

---

## 4. Implementation Phases 🏗️ (all shipped in commit `6748388`, 2026-07-13)

### Phase 1: Cloud Functions AI Proxy (Gap A) — ✅ Shipped
* `generateAIInsights` onCall function added, pulling the key from Secret Manager via `defineSecret("GEMINI_API_KEY")`.
* `src/lib/gemini.ts` rewritten to call the proxy for all six approved flows; no client-bundle reference to the raw key remains (`VITE_GEMINI_API_KEY` grep returns zero hits in `src/lib/gemini.ts`).

### Phase 2: Server-side AI rate limiting (Gap E) — ✅ Shipped (folded into Phase 1's function)
* `generateAIInsights` re-validates `usage_limits` against `userTier` before calling Gemini, throwing `HttpsError("resource-exhausted", ...)` if the user is within the cooldown window.
* Usage timestamp is stamped server-side with `FieldValue.serverTimestamp()` after a successful generation.
* **Known gap in the shipped version:** the rate-limit check (read) and the post-generation stamp (write) aren't wrapped in a single Firestore transaction — a race is theoretically possible on two concurrent requests from the same user. Low severity (self-inflicted quota waste, not a security-boundary break) but worth a follow-up if abuse is observed.
* `src/hooks/useRateLimits.ts`'s `stampUsage()` is now dead code (zero call sites) since the server does the stamping — `checkEligibility()` is still used for pre-flight UX messaging in `JournalAnalysisWizard.tsx`.

### Phase 3: Firestore persistent local cache (Gap C) — ✅ Shipped
* `src/lib/firebase.ts` initializes Firestore with `persistentLocalCache` + `persistentMultipleTabManager`, per the remediation plan.

### Phase 4: Decryption failure telemetry (Gap D) — ✅ Shipped
* `src/lib/crypto.ts`'s `decrypt()` fires `posthog.capture("vault_decryption_failed", { error_name, error_message })` in both failure paths, wrapped in its own `try/catch` so a PostHog failure can't break decryption.

---

## 5. QA & Verification 🧪
* [x] **Code verification (backfill audit, 2026-07-16):** confirmed via direct file read that `functions/src/index.ts`, `src/lib/gemini.ts`, `src/lib/firebase.ts`, `src/lib/crypto.ts` all match the claims above.
* [ ] **Unit Tests:** no dedicated test file for `generateAIInsights`'s rate-limit branching was found during backfill — recommend adding one.
* [ ] **The Subway Test:** not documented at ship time — Firestore persistent cache (Phase 3) is exactly the offline-resilience mechanism the Subway Test checks, so this should be manually re-verified.
* [x] **The "Lost PIN" Test:** N/A — no change to key derivation or PIN verification in this spec's scope (see `PROJ-65`).

---

## 6. Follow-ups spun out of this backfill
* `PROJ-65` — the key-derivation hardening this commit's message claimed but didn't deliver.
* ~~CLAUDE.md's "Approved Gemini exception" wording needs updating to describe the Cloud Function proxy hop.~~ **✅ Done** — confirmed 2026-07-22 governance audit: CLAUDE.md's Zero-Knowledge Encryption Boundary section now documents the proxy hop explicitly.
* `useRateLimits.ts`'s dead `stampUsage()` — minor cleanup candidate for a future tech-debt pass.
