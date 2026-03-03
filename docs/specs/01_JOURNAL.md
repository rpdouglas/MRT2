# 📖 Feature Specification: The Journal (The Vault)

**Status:** Live (v2.2)
**Security Level:** Zero-Knowledge (Client-Side AES-GCM)
**Primary Persona:** David (The Crisis User), Walt (The Zen Master), Ned (Pink Cloud)

---

## 1. Overview
The Journal is the central "Input" mechanism of My Recovery Toolkit. It allows users to document their daily inventory, process emotions, and receive AI-driven recovery coaching. Crucially, it is a **secure, encrypted vault**; plain text data is never stored on the server.

## 2. The Three Modes (Tabs)
The Journal functionality is split into three distinct views via `JournalTabs.tsx`:

### A. Write (The Editor - "Sticky Studio")
* **Layout:** A flexible column layout with a persistent **Command Toolbar** at the bottom.
    * **Header:** Contextual info (Date, Weather).
    * **Body:** Scrollable textarea for distraction-free writing.
    * **Toolbar (Sticky):** Houses the Mood Slider, Tag Input, Voice Mic, and Save Checkmark. This ensures controls never overlap text or require scrolling to access.
* **Smart Defaults:**
    * **Mood:** Initializes to the average of the user's last 7 entries (via `getSmartMood`) rather than a static "5".
* **Input Methods:**
    * **Text:** Rich-text inputs.
    * **Voice-to-Vault:** `AudioRecorder.tsx` captures audio, sends it to Gemini 2.5 Flash for transcription + sentiment analysis, and auto-fills the editor.
* **Templates:**
    * Standard: Morning Check-in, Nightly Review, Urge Log, Meeting Reflection.
    * Custom: Users can define their own prompts via `TemplateEditor.tsx`.

### B. History (The Timeline)
* **Structure:** A virtualized list (`Virtuoso`) optimized for long-term recovery tracking.
* **Grouping:** Hierarchical grouping by **Year** -> **Month** (e.g., 2026 -> March).
    * **Defaults:** The Current Year and Current Month are expanded by default. All past periods are collapsed to reduce cognitive load.
    * **Interaction:** Tapping a Year or Month header toggles visibility of its contents.
* **The Memory Engine (Search):**
    * **Mechanism:** A client-side search bar filters entries *after* they are decrypted in memory.
    * **Behavior:** Searching automatically expands all groups to show matching results.
* **Visuals:** Each card displays Mood Badge, Weather Icon, and Encryption Status.
* **Actions:** Edit, Delete, and Share (decrypts to clipboard/native share sheet).

### C. Insights (The Dashboard)
* **Source:** `JournalInsights.tsx`
* **Data Scope:** Rolling 90-day window from local IndexedDB/Firestore cache.
* **Visualizations:**
    1.  **Weekly Rhythm:** A Bar Chart comparing "Average Mood" of the *Last 30 Days* vs the *Previous 30 Days*.
    2.  **Trend Indicator:** A calculated "Trend Arrow" (↗️/↘️) showing if the user's 30-day average mood is improving or declining compared to the previous period.
    3.  **Interactive Word Cloud:** Frequency analysis of entry content. 
        * *Interaction:* Clicking a word routes the user to the History tab and auto-populates the search filter with that word.
    4.  **Top Stats:** Total Entries, Active Streak, and Average Mood Score.

---

## 3. Advanced AI Features

### 🧠 The Analysis Wizard
* **Component:** `JournalAnalysisWizard.tsx`
* **Concept:** A "on-demand" recovery coach that reads decrypted history to find patterns.
* **Scopes:**
    * **Weekly:** Last 7 days vs Previous 7 days.
    * **Monthly:** Last 30 days vs Previous 30 days.
    * **Deep Dive:** All-time / 90-day pattern recognition.
* **Usage Limits:** Controlled via `UserProfile.usage_limits` to manage API costs (e.g., 1 Deep Dive per month).
* **Output:** Generates a `ComparativeAnalysisResult` which is saved to the `insights` collection.
* **Actionable:** Users can click suggested actions to add them directly to their **Tasks/Quests**.

### 🎙️ Voice-to-Vault
* **Component:** `AudioRecorder.tsx`
* **Flow:**
    1.  User records audio (MediaRecorder API).
    2.  Audio Blob converted to Base64.
    3.  Sent to Gemini 2.5 Flash (Multimodal).
    4.  **Result:** Returns Transcription + Mood Score + Smart Tags.
    5.  **Populates:** The Editor state.

---

## 4. Technical Architecture

### Data Flow & Encryption
```~mermaid
sequenceDiagram
    participant User
    participant App (React)
    participant Hook (useJournalOperations)
    participant Crypto (Lib)
    participant Firestore

    Note over App, Firestore: WRITE FLOW
    User->>App: Types "I feel anxious" and clicks Save
    App->>Hook: addJournal(plainText)
    Hook->>Crypto: encrypt(plainText, Key)
    Crypto-->>Hook: Returns "IV:Ciphertext"
    Hook->>Firestore: addDoc({ content: "IV:Ciphertext", isEncrypted: true })
    Firestore-->>Hook: Success
    Hook->>App: Invalidates Query Cache (Refetch History)
```~

### Database Schema (Journal Specific)
**Collection:** `journals`
| Field | Type | Description | Encryption |
| :--- | :--- | :--- | :--- |
| `uid` | String | Owner ID | No |
| `content` | String | The body text | **YES (AES-GCM)** |
| `moodScore` | Number | 1-10 Integer | No (For Stats) |
| `tags` | Array | e.g. `["Anxiety", "Work"]` | No (For Filtering) |
| `weather` | Map | `{ temp: 22, condition: "Rain" }` | No |
| `isEncrypted` | Bool | Flag for legacy data handling | No |
| `createdAt` | Timestamp | Creation Time | No |

---

## 5. Verification (QA)
* [x] **Unit Test:** `src/hooks/__tests__/useJournalOperations.test.ts` verifies cache invalidation signals.
* [x] **UX Polish:** Verified "Sticky Studio" layout handles overflow correctly and mic button does not block text.
* [x] **Navigation:** Verified Month/Year grouping allows easy access to old entries without infinite scrolling.
