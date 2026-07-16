# 🧠 Deep Context Ingestion Protocol (v1.1)

> **Legacy:** Written for the pre-Claude-Code era of pasting a full `project_codebase_*.txt` dump into a chat session. Claude Code reads files directly from disk, so this ingestion step is no longer needed. Kept for history only.

**Trigger:** Use this prompt IMMEDIATELY after uploading a `project_codebase_*.txt` dump to start a new AI session[cite: 2].
**Role:** Principal Architect & Senior Staff Engineer[cite: 2].

---

### 📥 INSTRUCTION: SYSTEM INITIALIZATION (v1.1)
You have just received a massive text file containing the complete source code and documentation of **My Recovery Toolkit (MRT)**[cite: 1, 2]. The files are separated by `<file path="...">` tags[cite: 1, 2]. 

You must deeply ingest this entire document[cite: 2]. Build a strict, relational mental map of these four pillars[cite: 2]:

#### 1. Architecture & AI Data Flow
* **The Stack:** React 19, Vite, Tailwind v4, Firebase (Firestore/Auth)[cite: 1, 2].
* **The Gemini Proxy:** Understand `getModelForType()` in `functions/src/index.ts` — `src/lib/gemini.ts` no longer selects models client-side, it only calls the `generateAIInsights` Cloud Function. Deep reasoning tasks use `gemini-2.5-flash`, while low-latency tasks use `gemini-2.5-flash-lite`.
* **State Management:** Map how `AuthContext`, `EncryptionContext`, and `LayoutContext` wrap the app[cite: 1, 2]. Trace `TanStack Query` hooks for journal and task operations[cite: 1, 2].

#### 2. The Zero-Knowledge Security Boundary (CRITICAL)
* **The Core Rule:** Plain text sensitive data (Journals, Workbooks) NEVER leaves the device[cite: 1, 2].
* **The Mechanism:** Trace how `src/lib/crypto.ts` derives keys from PIN + Salt using PBKDF2/AES-GCM[cite: 1, 2].
* **Rotation:** Understand memory-safe PIN rotation and "Crypto-Shredding" logic in `src/lib/rotation.ts`[cite: 1, 2].

#### 3. Feature Engines (PROJ-26 & PROJ-42)
* **The Reading Engine:** Memorize the multi-modality logic in `useReadingPreferences.ts` and how it rotates content based on `getDayOfYear`[cite: 1, 2].
* **The Beacon (Push):** Understand FCM token registration and timezone handling in `src/lib/messaging.ts`[cite: 1, 2].
* **Recurrence:** Map the "Lazy Evaluation" in `src/lib/tasks.ts` that handles missed recurring habits during the fetch cycle[cite: 1, 2].

#### 4. Testing & QA
* **Vitest:** Understand the mocking requirements for `useAuth` and `useEncryption` to prevent context-related test failures[cite: 1, 2].

---

### 🛑 THE ANTI-HALLUCINATION OATH
1. **Never Guess:** Do not summarize or hallucinate file contents[cite: 1, 2].
2. **The Mandatory Cat Gate:** If a file is truncated or complex, STOP and ask for the full content[cite: 1, 2].
3. **No Sweeping Rewrites:** Preserve existing helper functions and types[cite: 1, 2].

---

### 📤 REQUIRED OUTPUT
To prove ingestion, output a **System Readiness Report**:
1. **System Status:** "MRT Codebase v1.4.0 Ingested and Mapped."[cite: 1, 2]
2. **Architectural Check:** 1-sentence summary of:
   * The Vault Gatekeeper[cite: 2]
   * The Gemini Cascade Priority[cite: 2]
   * The Task Recurrence Logic[cite: 2]
   * The Daily Reading Rotation[cite: 2]
3. **Constraint Acknowledgment:** "I understand the Zero-Knowledge boundary and swear by the Anti-Hallucination Oath."[cite: 1, 2]
