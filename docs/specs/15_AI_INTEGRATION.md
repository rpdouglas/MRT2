# 🧠 Feature Spec: AI Integration & Intelligence Layer

**Status:** Live (v4.5)
**Stack:** Google Gemini 3.1 & 2.5
**Context:** The architecture governing how MRT generates coaching, pattern recognition, and system health checks without compromising zero-knowledge security.

## 1. The Privacy Boundary
**Rule:** AI analysis is strictly "Opt-In" and "Stateless".
* Data is decrypted **in-browser**.
* The plain text is sent to the Gemini API proxy via a secure Firebase Cloud Function (`generateAIInsights`).
* Gemini processes the data, returns the payload, and discards the prompt. User data is **never** stored by Google to train public models.

## 2. The Cascade & Model Optimization Engine
**Location:** Client-side proxy requests originate from `src/lib/gemini.ts` and run securely server-side inside `functions/src/index.ts`.
To balance speed, cost, and advanced reasoning, MRT maps specific tasks to optimal models:

* **The Heavy Lifter (gemini-3.1-pro-preview):** Used exclusively for high-context, deep-reasoning tasks. 
    * Functions: `generateDeepPatternAnalysis` (90-day scans), `generateComparativeAnalysis`, `analyzeFullWorkbook`, and `analyzeSystemHealth`.
* **The Speed Demon (gemini-2.5-flash-lite):** Used for instantaneous, low-complexity parsing to save API costs and reduce UI latency.
    * Functions: `getGeminiCoaching` (2-sentence feedback) and `generateJournalAnalysis` (Sentiment/Tag extraction).
* **The Multimodal Anchor (gemini-2.5-flash):** Hardcoded for `generateAudioAnalysis` (Voice-to-Vault) to ensure stable transcription.

* **The Fallback Cascade:** If a specific model is not provided or fails due to rate limits, the system falls back through: `['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']`.

## 3. Strict JSON Enforcement
* **Prompting:** Every system prompt explicitly outlines the required JSON schema and includes the directive: `Return ONLY raw JSON. No Markdown.`
* **Sanitization:** All responses pass through a `cleanJSON()` helper function to strip rogue markdown code blocks.

## 4. Chunked Processing (Deep Pattern Analysis)
* **Problem:** Decrypting 90 days of journal entries simultaneously freezes the React UI thread on mobile devices.
* **Solution:** The app uses `processInChunks` to decrypt entries in batches of 5, yielding to the main thread in between, driving a smooth UI progress bar.
