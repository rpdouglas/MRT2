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
* **Prompting:** Every system prompt explicitly outlines the required JSON schema and includes the directive: `Return ONLY raw JSON. No Markdown.`
* **Sanitization:** All responses pass through a `cleanJSON()` helper function to strip rogue markdown code blocks.

## 4. Chunked Processing (Deep Pattern Analysis)
* **Problem:** Decrypting 90 days of journal entries simultaneously freezes the React UI thread on mobile devices.
* **Solution:** The app uses `processInChunks` to decrypt entries in batches of 5, yielding to the main thread in between, driving a smooth UI progress bar.
