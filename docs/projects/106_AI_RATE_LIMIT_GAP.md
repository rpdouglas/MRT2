# 📁 Project 106: Close the Uncapped AI Cost Gap (3 Ungated Gemini Flows)

**Status:** 🟡 In Progress
**Primary Persona:** All (cost-control infrastructure — no persona-specific UX beyond error messaging)
**Objective:** Close a live, uncapped Gemini API cost exposure on 3 of the 9 approved AI flows, found during `docs/reports/2026-09_premium_gating_audit.md` while scoping `PROJ-105` (Play Billing).

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want every Gemini-calling flow to have some bound on call frequency, so a buggy client retry loop or a scripted abuse attempt can't run up unbounded API cost on one account.
**Source:** `docs/reports/2026-09_premium_gating_audit.md` §3 — `WorkbookDetail.tsx` (`workbook_analysis`), `WorkbookSession.tsx` (`workbook_coach`), and `AudioRecorder.tsx` (`audio_analysis`) have zero tier check and zero rate limit in `functions/src/index.ts`'s `generateAIInsights` callable, unlike the other 6 approved flows which all have some form of `usage_limits`-based cooldown.
**Competitive Gap:** N/A — cost-control/reliability hardening, not a feature.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No new sensitive data — this only adds timestamp bookkeeping to the already-unencrypted `users/{uid}.usage_limits` field (same field 6 other flows already write to).
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A — `usage_limits` is already outside `executePinRotation`/`executeCryptoShredding`'s scope (unencrypted metadata), unchanged by this fix.

---

## 3. Schema & Architecture 🗄️

**`src/lib/db.ts`** — `usage_limits` gains two new optional `Timestamp` fields: `lastWorkbookAnalysis`, `lastAudioAnalysis`. (`workbook_coach` uses a separate, all-tier, short-lived floor — see §4 — not a `usage_limits` field, since day-granularity timestamps aren't the right shape for a 15-second check and there's no value in persisting something that stale-reads as "ages ago" the instant it's checked again.)

**`functions/src/index.ts`** — two new pure, exported, unit-testable helpers (mirroring the existing `computeLockoutSeconds` pattern — this file already prefers extracting pure logic out of the callable body for testability, and none of `generateAIInsights`'s existing inline rate-limit branches follow that convention yet; not refactoring those in this pass, just not repeating the untested-inline pattern for new code):
```typescript
function checkCooldown(now: Date, lastRun: Date | null, cooldownDays: number): { allowed: boolean; daysRemaining?: number };
function checkFloor(now: Date, lastRun: Date | null, floorSeconds: number): { allowed: boolean; secondsRemaining?: number };
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Design — three different shapes for three different usage patterns
Not a uniform "just add the existing 30-day pattern to all three" — that would break `workbook_coach` (called once per question, multiple times per normal session; a day-scale cooldown would lock out a free user after their first coached question, a real product regression, not just a cost fix):

- **`workbook_analysis`** — a deliberate, occasional user action (analyze a section/workbook/global review), genuinely comparable to `deep_pattern_analysis`. **Free-tier: 7-day cooldown** (`usage_limits.lastWorkbookAnalysis`). Premium: unlimited, consistent with every other periodic-scan flow.
- **`audio_analysis`** — roughly journal-entry-frequency, not per-question. **Free-tier: 24-hour cooldown** (`usage_limits.lastAudioAnalysis`) — one free AI-analyzed voice journal per day. Premium: unlimited.
- **`workbook_coach`** — fine-grained, interactive, legitimately called many times in one normal workbook session. **No free-tier day-scale cooldown** (would break the feature for its intended use). Instead: an **all-tier 15-second floor** between calls — invisible to any real user (reading a question, writing an answer, and requesting coaching takes far longer than 15 seconds) but caps a scripted/automated loop's worst case to ~4 calls/minute instead of unbounded. This is a pure anti-abuse floor, not a monetization lever — deliberately not tier-gated, matching the existing all-tier ROSC 24-hour floor precedent (`functions/src/index.ts:1405-1418`, "defense-in-depth... caps a scripted/devtools bypass — no legitimate ... user gets close").

**Explicitly out of scope for this ticket:** whether `workbook_coach` *should* become premium-only for product-consistency reasons (its sibling flow, `GuidedWorkflowEngine.tsx`'s `cbt_coaching_prompt`, already is premium-gated) — that's a monetization/product decision, not a cost-control one, and conflating the two here would risk shipping a product change under a "just closing a cost gap" banner. Flagged in `docs/reports/2026-09_premium_gating_audit.md` for a separate decision if wanted.

### Phase 2: Server-side enforcement (the actual fix)
- Add `checkCooldown`/`checkFloor` helpers.
- In `generateAIInsights`, extend the existing `if (userTier === "free")` block with `workbook_analysis`/`audio_analysis` branches (mirroring the existing `deep_pattern_analysis` branch shape exactly).
- Add the all-tier `workbook_coach` floor check alongside the existing all-tier ROSC floor check (same "defense-in-depth, every tier" section).
- Extend the stamp-writing logic (§4 of the callable) to write `lastWorkbookAnalysis`/`lastAudioAnalysis` after a successful free-tier call, and to track `workbook_coach`'s last-call time for the floor check (a new lightweight all-tier field, not part of `usage_limits` — see below).

**`workbook_coach`'s floor needs its own timestamp storage independent of `usage_limits`** (which is free-tier-only bookkeeping today) since this floor applies to premium too. Simplest option, avoiding new Firestore reads: piggyback on the same `users/{uid}` doc with a small new top-level field, e.g. `lastWorkbookCoachCall` (`Timestamp`), written on every successful call regardless of tier.

### Phase 3: Client-side error UX
- `WorkbookDetail.tsx`, `WorkbookSession.tsx`, `AudioRecorder.tsx` currently catch AI-proxy errors with a generic `alert("An error occurred...")` — this now needs to distinguish a `resource-exhausted` rejection (a real, expected state) from an actual failure. Check the `HttpsError` code and show the specific "come back in N days/seconds" message instead of the generic error.
- **Explicitly out of scope:** proactive client-side pre-checking (disabling the button before the user even taps it, matching `useRateLimits.ts`'s pattern for the other flows) — real UX polish, but not required to close the cost gap itself, since the server-side check is authoritative either way. Worth a fast-follow if the current session-ending error-toast UX feels too abrupt in practice.

### Phase 4: Edge Cases
* [x] `navigator.onLine` false — unaffected, these are all already-online-only AI calls.
* [x] `isVaultUnlocked` false — N/A, none of these three routes are reachable without an unlocked vault already (Workbooks/Journal are `VaultGate`-wrapped).
* [ ] 320px screen — the new error message text needs to fit the same alert/toast surface the existing generic error uses; not separately re-verified at this width, low risk since it's replacing a same-shape string.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `checkCooldown`/`checkFloor` — boundary cases (exactly at the limit, just under, just over, no prior timestamp) mirroring `computeLockoutSeconds`'s existing test style in `functions/src/index.test.ts`.
* [ ] **The Subway Test:** N/A — no offline-specific behavior changed.
* [ ] **The "Lost PIN" Test:** N/A — no crypto/PIN logic touched.
* [x] **Regression:** `functions/` build + full existing `index.test.ts` suite must stay green; root `npm run test:once`/`lint`/`build` unaffected (no `src/` schema-breaking change — new fields are optional, additive).
