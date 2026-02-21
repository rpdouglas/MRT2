# 🧠 Feature Spec: AI Integration & Intelligence Layer

**Status:** Live (v4.0)
**Stack:** Google Gemini 2.5 (Flash/Pro)
**Context:** The architecture governing how MRT generates coaching, pattern recognition, and system health checks without compromising zero-knowledge security.

## 1. The Privacy Boundary
**Rule:** AI analysis is strictly "Opt-In" and "Stateless".
* Data is decrypted **in-browser**.
* The plain text is sent to the Gemini API via a secure HTTPS request.
* Gemini processes the data, returns the payload, and discards the prompt.
* User data is **never** stored by Google to train public models.

## 2. The Cascade Engine
**Location:** `src/lib/gemini.ts`
To balance speed, cost, and reliability, the app utilizes a `MODEL_CASCADE`.
* **Default Flow:** Attempts `gemini-2.5-flash` first for speed. If the API fails or rate-limits, it automatically catches the error and retries with `gemini-2.5-pro`, followed by `gemini-2.0-flash`.
* **Exception:** Certain complex tasks (like `generateComparativeAnalysis` and `generateDeepPatternAnalysis`) explicitly force `gemini-2.5-pro` for deeper reasoning capabilities.

## 3. Strict JSON Enforcement
To ensure the React UI can parse the AI's response predictably:
* **Prompting:** Every system prompt explicitly outlines the required JSON schema and includes the directive: `Return ONLY raw JSON. No Markdown.`
* **Sanitization:** All responses pass through a `cleanJSON()` helper function to strip any rogue markdown code blocks (e.g., ````json`) before passing to `JSON.parse()`.

## 4. Chunked Processing (Deep Pattern Analysis)
**Location:** `src/hooks/useDeepPatternAnalysis.ts`
* **Problem:** Decrypting 90 days of journal entries simultaneously freezes the React UI thread.
* **Solution:** The app uses `processInChunks` (from `src/lib/utils.ts`) to decrypt entries in batches of 5, yielding to the main thread in between. This allows the progress bar to update smoothly from 20% to 70%.

## 5. Telemetry & Auditing
**Location:** `src/lib/analytics.ts`
* Every successful AI call asynchronously triggers `logAIUsage`.
* This writes a record to the `ai_logs` Firestore collection containing the user ID, model used, feature context (e.g., 'journal_analysis'), and token counts (prompt, candidate, total).
* Admins monitor this via the Admin Dashboard.
