# 📁 Project 100: AI Prompt Safety Hardening

**Status:** ⚪ Planned
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

### Phase 1: Payload schema validation
* Add real shape/type/length validation for `dataPayload` in `generateAIInsights`, replacing the current presence-only check (`if (!analysisType || !dataPayload) throw ...`) and the blind `as` casts in `getPromptForType`.
* Pick an approach proportionate to the codebase (a lightweight hand-rolled validator per `analysisType`, or a schema library like `zod` if the team wants one — note `zod` isn't currently a dependency anywhere in this codebase, so this would be a new addition; weigh against a simpler hand-rolled switch given there are only nine shapes).
* Add a sane per-field length ceiling matched to what each flow actually needs (e.g. `useDeepPatternAnalysis.ts` sends up to 90 days of journal text today with no cap — decide a ceiling here or explicitly defer input-length capping to a follow-up if it's judged out of this ticket's scope).

### Phase 2: Prompt-injection mitigation
* For each of the nine `analysisType` prompt-construction blocks in `getPromptForType`, wrap the untrusted user content in a clear structural delimiter (e.g. XML-style tags like `<user_content>...</user_content>`, or a fenced block) separating it from the instruction/system portion of the prompt — currently all nine interpolate raw strings directly (e.g. `` `Analyze this journal entry: "${payload.content}"` ``) with no separation beyond a literal quote character.
* Update the `systemInstruction` for each flow (where present) to explicitly instruct the model to treat the delimited block as data to analyze, not as instructions to follow.
* This is a prompt-engineering change, not a security boundary in the strict sense (worst case today is a manipulated response shown back to the same user who wrote the input) — scope expectations accordingly, but it's cheap insurance against genuinely broken output.

### Phase 3: Safety settings
* Add explicit `safetySettings` (`HarmCategory`/`HarmBlockThreshold`) to every `model.generateContent()` call across `functions/src/index.ts` — currently none are set anywhere, so the Gemini SDK's defaults apply silently. Decide and document the chosen thresholds per call type (the crossword/readings generation calls have different risk profiles than the nine user-content-analysis flows and may warrant different settings).

### Phase 4: Edge Cases
* [ ] Confirm Phase 1's length ceilings don't reject a real, legitimate long entry (test against the longest known journal/workbook content in practice, same caution as `PROJ-99`'s Phase 1).
* [ ] Confirm Phase 2's delimiter change doesn't break `getMockAIResponse`'s parallel mock-mode prompt shapes in `src/lib/gemini.ts` — mock mode should still match real-mode behavior for tests relying on it.
* [ ] Confirm Phase 3's safety thresholds don't cause a legitimate recovery-content analysis (e.g. discussing self-harm ideation in a crisis journal entry — a realistic and important use case for this app) to be blocked by an overly aggressive threshold. This needs real judgment, not a default "strict" setting, given the app's subject matter.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** `functions/src/__tests__/` (or wherever functions tests live) — payload validation rejects malformed/oversized input for each of the nine `analysisType`s; prompt construction still produces the same semantic content post-delimiting.
* [ ] **Manual:** Run each of the nine flows against the Functions emulator with a deliberately malformed payload and confirm graceful rejection, not a 500 or a corrupted prompt.
* [ ] **Manual (safety settings):** Test at least one flow with realistic sensitive-but-legitimate recovery content (e.g. a journal entry discussing a past relapse or crisis) end-to-end to confirm Phase 3 doesn't block legitimate use — this is the one item in this ticket that most needs a human judgment call, not just an automated check.
* [ ] **Regression:** Full `npm run check` plus `functions/`'s build+test pass.
