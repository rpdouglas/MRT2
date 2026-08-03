# 🧠 Feature Spec: AI Integration & Intelligence Layer

**Status:** Live (v4.5)
**Stack:** Google Gemini 2.5
**Context:** The architecture governing how MRT generates coaching, pattern recognition, and system health checks without compromising zero-knowledge security.

## 1. The Privacy Boundary
**Rule:** AI analysis is strictly "Opt-In" and "Stateless".
* Data is decrypted **in-browser**.
* The plain text is sent to the Gemini API proxy via a secure Firebase Cloud Function (`generateAIInsights`).
* Gemini processes the data, returns the payload, and discards the prompt. User data is **never** stored by Google to train public models.

## 2. Model Selection Engine
**Location:** Client-side proxy requests originate from `src/lib/gemini.ts` and are resolved server-side inside `functions/src/index.ts` via `getModelForType(analysisType)` — a single switch statement, not a cascade or fallback chain.

* **gemini-2.5-flash (default):** Used for high-context, deep-reasoning tasks.
    * Analysis types: `deep_pattern_analysis` (90-day scans), `comparative_analysis`, `system_health_analysis`, `workbook_analysis`, `rosc_assessment`.
* **gemini-3.5-flash-lite:** Used for instantaneous, low-complexity parsing to save API costs and reduce UI latency.
    * Analysis types: `journal_analysis`, `workbook_coach`, `cbt_coaching_prompt`, `cba_reflection`, `audio_analysis`.

There is no automatic fallback if a model call fails (e.g. quota exhaustion) — the error propagates to the client, which surfaces it via a toast rather than retrying against a different model.

## 3. Strict JSON Enforcement
* **Prompting:** Every system prompt explicitly outlines the required JSON schema (e.g. `Return a JSON object with this EXACT structure: {...}`) — the literal string this section previously claimed (`Return ONLY raw JSON. No Markdown.`) doesn't appear anywhere in `getPromptForType`; corrected during PROJ-100's ticket-close, pre-existing drift unrelated to that ticket's own changes.
* **Sanitization:** All responses pass through a `cleanJSON()` helper function to strip rogue markdown code blocks.

## 4. Chunked Processing (Deep Pattern Analysis)
* **Problem:** Decrypting 90 days of journal entries simultaneously freezes the React UI thread on mobile devices.
* **Solution:** The app uses `processInChunks` to decrypt entries in batches of 5, yielding to the main thread in between, driving a smooth UI progress bar.

## 5. Payload Validation, Prompt-Injection Guarding & Safety Settings (PROJ-100)
* **Validation:** `generateAIInsights` validates `dataPayload`'s shape/types/length against a per-`analysisType` hand-rolled schema (`validateAIProxyPayload`) before any prompt construction or rate-limit check reads it — replacing a prior presence-only check and closing a latent bug where the rate-limit branch read `(dataPayload as ComparativePayload).scope` with no validation at all. Length ceilings (300 chars–1,000,000 chars depending on the flow) are documented judgment calls, not derived from usage telemetry.
* **Prompt-injection guarding:** Every `getPromptForType` branch wraps interpolated user/decrypted content in `<user_content>...</user_content>` tags, and every `systemPrompt` carries an explicit instruction to treat that delimited block as data, never as instructions. This is prompt-engineering insurance, not a hard security boundary — the worst case without it is a manipulated response shown back to the same user who wrote the input.
* **Safety settings:** `model.generateContent()` calls use one of two `safetySettings` profiles (`HarmCategory`/`HarmBlockThreshold`, `functions/src/index.ts`). The nine `generateAIInsights` flows use `BLOCK_ONLY_HIGH` — deliberately permissive, since this app's core subject matter (addiction, relapse, self-harm ideation, trauma) routinely trips a generic harm classifier on legitimate crisis journaling. The two AI-authored editorial-content calls (daily readings, crossword word/clue generation) use the stricter `BLOCK_MEDIUM_AND_ABOVE`, since they write shared copy for every user rather than analyzing one person's private crisis text. Neither threshold is derived from real abuse/false-positive data.
