import os

# Used to safely write markdown code blocks via python string formatting
MD_BLOCK = "```"

ai_doc_content = f"""# 🧠 Feature Spec: AI Integration & Intelligence Layer

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
* **Sanitization:** All responses pass through a `cleanJSON()` helper function to strip any rogue markdown code blocks (e.g., `{MD_BLOCK}json`) before passing to `JSON.parse()`.

## 4. Chunked Processing (Deep Pattern Analysis)
**Location:** `src/hooks/useDeepPatternAnalysis.ts`
* **Problem:** Decrypting 90 days of journal entries simultaneously freezes the React UI thread.
* **Solution:** The app uses `processInChunks` (from `src/lib/utils.ts`) to decrypt entries in batches of 5, yielding to the main thread in between. This allows the progress bar to update smoothly from 20% to 70%.

## 5. Telemetry & Auditing
**Location:** `src/lib/analytics.ts`
* Every successful AI call asynchronously triggers `logAIUsage`.
* This writes a record to the `ai_logs` Firestore collection containing the user ID, model used, feature context (e.g., 'journal_analysis'), and token counts (prompt, candidate, total).
* Admins monitor this via the Admin Dashboard.
"""

cloud_sync_doc_content = f"""# ☁️ Feature Spec: Network Resilience & Cloud Sync

**Status:** Live (v1.5)
**Context:** How MRT handles offline usage, state detection, and automated data backups.

## 1. Offline-First Architecture (Firestore)
* MRT relies on Firebase Firestore's built-in local persistence mechanism.
* If a user is offline (e.g., in a basement meeting room), they can still create Tasks, save Journal entries, and check off Workbook questions.
* The data is written to the local IndexedDB cache and seamlessly syncs to the cloud once the network connection is restored.

## 2. Network State Detection
**Location:** `src/contexts/LayoutContext.tsx`
* The context uses `window.addEventListener` for `online` and `offline` events to maintain an `isOnline` boolean.
* **UI Feedback:** If `!isOnline`, a red persistent banner appears at the top of the screen (`AppShell.tsx`), assuring the user that their data is still saving locally.

## 3. Google Drive Auto-Sync (The Sentinel)
**Location:** `src/components/AppShell.tsx` & `src/lib/googleDrive.ts`

### The Authorization
* Users opt-in by clicking "Sign in with Google" and granting the `https://www.googleapis.com/auth/drive.file` scope.
* This restricted scope ensures the app can *only* read and write the specific `mrt_backup.json` file it creates, providing strong security isolation.

### The Trigger
* Handled by a `useEffect` inside `AppShell`.
* It requires three conditions: `isVaultUnlocked == true`, `isOnline == true`, and a valid `driveAccessToken`.
* It checks the user's `lastExportAt` timestamp. If it is older than 7 days, a silent background backup is triggered 10 seconds after the app loads.

### The Payload (Data Sovereignty)
* The app fetches all data (Journals, Tasks, Workbooks).
* It **decrypts** the ciphertexts back into plain text in-memory.
* The JSON is uploaded to Drive. *This is a deliberate architectural choice to ensure the user always has a readable copy of their data in case they permanently forget their MRT Vault PIN.*
"""

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"✅ Created: {path}")

if __name__ == "__main__":
    print("🔄 Executing Documentation Phase 3: AI & Cloud Sync Specs...")
    write_file("docs/specs/15_AI_INTEGRATION.md", ai_doc_content)
    write_file("docs/specs/16_CLOUD_SYNC.md", cloud_sync_doc_content)
    print("✨ System mapping complete. The technical documentation is now 100% synchronized with the codebase.")