# 📁 Project 114: Close the Server-Side Tier Enforcement Gap on CBT Coaching / CBA Reflection

**Status:** 🟢 Done
**Primary Persona:** All (cost-control/paywall-integrity infrastructure — no persona-specific UX beyond an error message that should never surface to a legitimate user)
**Objective:** Close a live paywall-bypass gap on 2 of the 9 approved AI flows — `cbt_coaching_prompt` and `cba_reflection` are enforced as premium-only entirely client-side, with zero server-side check in `generateAIInsights`, so a scripted or devtools-forged callable request can use both for free, unlimited.

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want every premium-exclusive Gemini flow to also be rejected server-side for a free-tier account, so the client-side gate is a UX convenience, not the actual security boundary.
**Source:** Surfaced during a `/planning` session 2026-09-05 while scoping `ACTIVE_CYCLE.md`'s "Close Remaining Uncapped AI Cost Gap" backlog item (itself found 2026-09-03 during `PROJ-106`'s scoping pass, which explicitly covered 3 *other* flows and left these two out). Confirmed by direct code reading, not assumed: `GuidedWorkflowEngine.tsx:133` (`aiEnabled = step.aiPromptEnabled && userTier === 'premium'`) and `CBATool.tsx:108` (`if (userTier !== 'premium') return;`) both gate `generateCBTCoachingPrompt`/`generateCBAReflection` client-side only. `functions/src/index.ts`'s `generateAIInsights` callable has a `if (userTier === "free") { ... }` block (line ~1712) with explicit branches for `deep_pattern_analysis`/`rosc_assessment`/`workbook_analysis`/`audio_analysis`/`comparative_analysis` — `cbt_coaching_prompt` and `cba_reflection` match none of them and fall straight through untouched, even though both already have real `getModelForType`/`validateAIProxyPayload`/`getPromptForType` branches (lines 1248, 1418, 1631) that happily construct and run the prompt for any caller.
**Competitive Gap:** N/A — paywall-integrity/cost-control hardening, not a feature.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No new sensitive data. `dataPayload` for both flows is already validated by `validateAIProxyPayload` (PROJ-100) and unchanged by this fix — this only adds a tier check *before* that payload is used to call Gemini.
* [x] **Encryption Strategy:** N/A — no new persisted fields (see §3; unlike `PROJ-106`'s cooldown fields, an outright tier rejection needs no timestamp bookkeeping).
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
**No schema changes.** Unlike `PROJ-106` (which added `usage_limits.lastWorkbookAnalysis`/`lastAudioAnalysis` for free-tier cooldowns), these two flows have no free-tier access tier to cool down — the fix is a flat rejection, not a cooldown, so nothing needs to be persisted.

**`functions/src/index.ts`** — implemented as a small pure helper (mirroring `checkCooldown`/`checkFloor`'s pattern, added right after them) plus one new `else if` branch inside the existing `if (userTier === "free")` block, rather than an inline condition — `generateAIInsights`'s live-Firestore `onCall` body isn't unit-tested anywhere in this repo (no emulator-backed Functions harness exists yet), so extracting the actual tier decision into its own pure function is what makes it directly testable, same reasoning PROJ-106 used for `checkCooldown`/`checkFloor`:
```typescript
const PREMIUM_ONLY_ANALYSIS_TYPES = new Set(["cbt_coaching_prompt", "cba_reflection"]);
export function isPremiumOnlyAnalysisType(analysisType: string): boolean {
    return PREMIUM_ONLY_ANALYSIS_TYPES.has(analysisType);
}
// ...inside the free-tier block:
} else if (isPremiumOnlyAnalysisType(analysisType)) {
    throw new HttpsError("permission-denied", "This feature requires My Recovery Toolkit Premium.");
}
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Server-side enforcement (the actual fix)
Add the branch above. No new helper functions needed (unlike `PROJ-106`'s `checkCooldown`/`checkFloor` — those exist for time-window logic this fix doesn't need).

### Phase 2: Client-side error UX (defense-in-depth only — should never fire in normal use)
`GuidedWorkflowEngine.tsx`/`CBATool.tsx` already gate the call client-side, so a legitimate user's request never reaches this new server branch. **Deliberately not touched** — both callers' existing `console.error`-only catch blocks stay as-is; fixing their silent-failure UX is the same shape of issue as the daily-image share bug fixed earlier this session, but is out of scope here since this branch is a backstop no real user should ever hit, not an active user-facing bug. Flagged for a future pass if it ever turns out to matter in practice.

### Phase 3: Edge Cases
* [x] `navigator.onLine` false — unaffected, already-online-only AI calls.
* [x] `isVaultUnlocked` false — N/A, both routes are already `VaultGate`-wrapped upstream.
* [x] A `manual`/VIP-grant premium user (`tierSource: 'manual'`) — unaffected, `userData.tier` is what's checked, not `tierSource`.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `functions/src/index.test.ts` — 4 new tests for `isPremiumOnlyAnalysisType`: flags `cbt_coaching_prompt`, flags `cba_reflection`, does not flag the other 7 approved `analysisType` values (explicit list, not a wildcard), does not flag an unknown type. 104/104 functions tests passing, `tsc --noEmit` clean.
* [ ] **The Subway Test:** N/A — no offline-specific behavior changed.
* [ ] **The "Lost PIN" Test:** N/A — no crypto/PIN logic touched.
* [x] **Regression:** `functions/` build + full existing `index.test.ts` suite stays green (104/104); root `npm run check` unaffected (no `src/` schema change) — verified.

**Strategy C (central declarative tier-gate table), considered during planning and explicitly deferred, not abandoned:** logged as its own item in `docs/ACTIVE_CYCLE.md`'s Chores & Tech Debt section for future pickup via `/planning` — see that entry for the reasoning (regression risk of refactoring 7 existing branches at once vs. this ticket's narrow, additive fix).
