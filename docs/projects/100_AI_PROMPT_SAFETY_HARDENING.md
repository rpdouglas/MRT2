# 📁 Project 100: AI Prompt Safety Hardening

**Status:** ✅ Shipped
**Primary Persona:** All (every persona using any of the nine approved AI-analysis flows — Walt's Deep Pattern Analysis, Ned's CBT coaching, Lisa's error-log admin panel, etc.) — this hardens a shared backend path, not any one persona's feature.
**Objective:** Close the AI-safety gaps from `docs/reports/2026-08_full_production_readiness_audit.md` §7 (AI Review) and §20 (Technical Debt): zero prompt-injection mitigation and no payload validation across all nine `generateAIInsights` flows.

---

## 1. The Executive Summary
**User Story:** As a user of any AI-analysis feature, I want my own journal/workbook text to be treated as data, not as instructions the model might follow — and as the developer, I want a malformed or hostile payload rejected before it's interpolated into a prompt, not silently accepted.
**Source:** `docs/reports/2026-08_full_production_readiness_audit.md` §7 (AI Review), §6 (Security Review, generateAIInsights validation finding), §20.

**Scope note:** This ticket does **not** revisit the Phase 3 governance decision from `PROJ-98` (which of the nine flows are approved to exist) — that's settled. This is about hardening the shared proxy path all nine already use, and is scoped to `functions/src/index.ts`'s `generateAIInsights` function and `getPromptForType` — no client-side changes to `src/lib/gemini.ts`'s call signatures.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Yes — this ticket changes how decrypted user content (already permitted to reach Gemini per the nine approved flows) is packaged before it's sent, not whether it's sent.
* [x] **Encryption Strategy:** No change to `src/lib/crypto.ts` or the encryption boundary. This is entirely server-side, inside the already-proxy-routed `generateAIInsights` function — content is already decrypted client-side before it reaches this function, per the existing approved-flow design.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes.

**Files impacted:**
* `functions/src/index.ts` — `generateAIInsights` (~line 1077) input validation; `getPromptForType` (~lines 881-1075) prompt construction for all nine `analysisType` cases; `model.generateContent()` calls (~line 1176, plus `checkBufferHealth`/`generateDailyCrossword`'s own calls) — add `safetySettings`.
* Possibly `functions/src/index.ts`'s payload types (`JournalAnalysisPayload`, `DeepPatternPayload`, `CBAPayload`, etc., ~lines 870-879) if a schema-validation library is introduced.

---

## 4. Implementation Phases 🏗️

### Phase 1: Payload schema validation — ✅ Shipped
* [x] Added `validateAIProxyPayload()` (`functions/src/index.ts`), called immediately after `generateAIInsights`' existing presence check and, critically, **before** the rate-limit branch that already read `(dataPayload as ComparativePayload).scope` with zero validation of its own — that latent blind-cast bug is now closed as a side effect, not left for a future ticket. **Went with the hand-rolled switch**, per the spec's own steer (only nine shapes; `zod` stays a non-dependency). Per-field length ceilings are documented judgment calls, not derived from telemetry (same posture as PROJ-99's 50KB/200KB Firestore ceilings) — sized generously above real observed usage: 40,000 chars for a single journal entry, 1,000,000 chars for the two flows that combine up to 90 decrypted entries (`deep_pattern_analysis`, `comparative_analysis`), smaller ceilings (300–20,000 chars) for the shorter live-coaching/reflection flows, 20MB for `audio_analysis`'s base64 payload. Array-shaped fields (`workbook_analysis`'s Q&A pairs, `cba_reflection`'s four quadrants) get both an item-count ceiling and a per-item length ceiling.

### Phase 2: Prompt-injection mitigation — ✅ Shipped
* [x] Added `delimitUserContent()` wrapping every interpolated user/decrypted-content field in `<user_content>...</user_content>` tags across all nine `getPromptForType` branches, plus a shared `PROMPT_INJECTION_GUARD` sentence appended to every one of the nine `systemPrompt`s instructing the model to treat the delimited block as data, never as instructions. `audio_analysis` has no textual field to delimit (its "user content" is the audio itself) — added an equivalent guard sentence to its `systemInstruction` instead, telling the model not to follow instructions spoken within the audio.
* [x] `getPromptForType` is now exported (matching this file's existing convention — `validateCrosswordCandidates`, `evaluateVaultPinAttempt`, etc. — of exporting pure logic for direct unit testing) rather than tested only indirectly.

### Phase 3: Safety settings — ✅ Shipped
* [x] Added `safetySettings` to all three `model.generateContent()` call sites in `functions/src/index.ts`. **Two profiles, not one**, since this app's core subject matter (addiction, relapse, self-harm ideation, trauma) routinely trips a generic harm classifier on legitimate crisis journaling: `USER_CONTENT_SAFETY_SETTINGS` (`BLOCK_ONLY_HIGH` across dangerous-content/harassment/hate-speech/sexually-explicit) for the nine `generateAIInsights` flows, vs. the stricter `EDITORIAL_SAFETY_SETTINGS` (`BLOCK_MEDIUM_AND_ABOVE`) for the two AI-authored editorial-content calls (`generateForModality`'s daily readings, `generateCrosswordForDate`'s word/clue generation) — those write shared copy for every user, not one person's private crisis text, so they keep a more conservative default. Neither threshold is derived from real abuse/false-positive data, same documented-judgment-call posture as the length ceilings above.

### Phase 4: Edge Cases
* [x] Length ceilings verified against a realistic worst case, not just a unit-test assertion: a new test constructs a synthetic 90-entry `journalHistory` (matching `useDeepPatternAnalysis.ts`'s real 90-entry window) and confirms it stays under the 1,000,000-char ceiling and passes validation.
* [x] `getMockAIResponse` (`src/lib/gemini.ts`) needed no changes and was confirmed unaffected — it switches purely on the `analysisType` string and returns canned JSON, never touching `getPromptForType` or the delimiter/guard text this ticket added.
* [ ] **Not verified — needs a human with live Gemini access.** Confirming Phase 3's `BLOCK_ONLY_HIGH` thresholds don't block a real, sensitive-but-legitimate recovery journal entry requires an actual Gemini API call; this sandbox has no way to exercise that end-to-end. Flagged here rather than assumed — see QA section below.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `functions/src/index.test.ts` — 17 new tests. `validateAIProxyPayload`: accepts a valid payload for each of the nine `analysisType`s, rejects a non-object payload, an unknown `analysisType`, a missing required field, an oversized field, an invalid `comparative_analysis.scope`, an empty/oversized `workbook_analysis.questionsAndAnswers`, a non-array/oversized `cba_reflection` quadrant, a malformed `audio_analysis.mimeType`, and confirms the 90-entry realistic-worst-case `journalHistory` is accepted, not rejected. `getPromptForType`: confirms every text-based `analysisType`'s prompt is delimited and its `systemPrompt` carries the injection guard, confirms semantic content survives delimiting unchanged, confirms `audio_analysis`'s spoken-content guard, confirms the unknown-`analysisType` throw is unchanged.
* [ ] **Manual:** Not run against a live Functions emulator + real Gemini API key in this environment (no credentials available) — the unit tests above exercise the same validation/prompt-construction logic directly instead, consistent with this file's existing pattern for `verifyVaultPin`'s extracted decision logic.
* [ ] **Manual (safety settings) — residual, needs a human with prod/live Gemini access:** test at least one of the nine flows with realistic sensitive-but-legitimate recovery content (e.g. a journal entry discussing a past relapse or crisis) to confirm `BLOCK_ONLY_HIGH` doesn't block legitimate use. This is the one item in this ticket that most needs a human judgment call, and it's the one this sandbox genuinely cannot perform.
* [x] **Regression:** `functions/`'s own `npm run build` + 80/80 tests (63 original + 17 new) clean. Root `npm run check` (lint + spec-quality + test + build) re-verified clean — this ticket touches only `functions/src/index.ts` and its test file, no `src/` changes.
