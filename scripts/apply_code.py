import os

# =============================================================================
# SAFE FILE WRITER
# =============================================================================
def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Replace the markdown safeguard '~~~' with standard triple backticks
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated: {path}")

# =============================================================================
# PHASE 3: TECHNICAL SPECS SYNC
# =============================================================================

spec_journal = r'''# 📖 Feature Specification: The Journal (The Vault)

**Status:** Live (v2.0)
**Security Level:** Zero-Knowledge (Client-Side AES-GCM)
**Primary Persona:** David (The Crisis User), Walt (The Zen Master), Ned (Pink Cloud)

---

## 1. Overview
The Journal is the central "Input" mechanism of My Recovery Toolkit. It allows users to document their daily inventory, process emotions, and receive AI-driven recovery coaching. Crucially, it is a **secure, encrypted vault**; plain text data is never stored on the server.

## 2. The Three Modes (Tabs)
The Journal functionality is split into three distinct views via `JournalTabs.tsx`:

### A. Write (The Editor)
* **Input Methods:**
    * **Text:** Rich-text inputs (via `JournalEditor.tsx`).
    * **Voice-to-Vault:** Integrated `AudioRecorder.tsx` captures audio, sends it to Gemini 2.5 Flash for transcription + sentiment analysis, and auto-fills the editor.
* **Metadata:**
    * **Mood Slider:** 1-10 scale (Struggling ↔ Thriving).
    * **Weather:** Auto-fetched local weather (Temp/Condition) via Open-Meteo.
    * **Tags:** Dynamic tagging system with auto-complete based on previous usage.
* **Templates:**
    * Standard: Morning Check-in, Nightly Review, Urge Log, Meeting Reflection.
    * Custom: Users can define their own prompts via `TemplateEditor.tsx`.

### B. History (The Timeline & Search)
* **View:** Virtualized list (`Virtuoso`) grouped by date headers (Today, Yesterday, etc.).
* **The Memory Engine (Search):** * **Mechanism:** A client-side search bar filters entries *after* they are decrypted in memory.
    * **Routing:** Uses URLSearchParams (`?search=xyz`) to allow deep-linking to specific query states.
    * **Scope:** Matches against Entry Content and Tags.
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
    5.  Populates the Editor state.

---

## 4. Technical Architecture

### Data Flow & Encryption
~~~mermaid
sequenceDiagram
    participant User
    participant App (React)
    participant Crypto (Lib)
    participant Gemini (AI)
    participant Firestore

    Note over App, Firestore: WRITE FLOW
    User->>App: Types "I feel anxious"
    App->>Crypto: encrypt("I feel anxious", Key)
    Crypto-->>App: Returns "IV:Ciphertext"
    App->>Firestore: Writes { content: "IV:Ciphertext", isEncrypted: true }

    Note over App, Gemini: AI ANALYSIS FLOW
    User->>App: Clicks "Analyze"
    App->>Firestore: Fetches Encrypted Docs
    App->>Crypto: decrypt(Docs, Key)
    App->>Gemini: Sends Plain Text (Stateless)
    Gemini-->>App: Returns Analysis JSON
    App->>App: Renders Result
    App->>Firestore: Saves Result (Optional)
~~~

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

## 5. Edge Cases & Constraints

1.  **Lost PIN:**
    * Since the encryption key is derived from the PIN, a lost PIN results in **permanent data loss** for journal content. Metadata (Mood/Tags) remains visible but content is unreadable.
    * *Mitigation:* `VaultGate.tsx` warns users clearly.

2.  **AI Privacy:**
    * Journal text is decrypted in browser memory *only* for the duration of the API call.
    * Gemini API calls are stateless (data is not stored by Google for model training).

3.  **API Failures:**
    * If `getCurrentWeather` fails (e.g., permissions denied), the entry saves with `weather: null`.
    * If Gemini fails (403/500), the user can still save the text manually.
'''

spec_profile = r'''# 📐 Feature Spec: Profile & Data Sovereignty

**Status:** Live (v1.5)
**Context:** User identity, settings, and data portability.

## 1. Support Network
* **Fields:** `sponsorName`, `sponsorPhone`.
* **Storage:** Stored unencrypted in `users/{uid}`.
* **Usage:** Populates the "SOS Modal" for one-tap calling or WhatsApp messaging.

## 2. Cloud Auto-Sync (Google Drive)
**Philosophy:** Automated resilience without vendor lock-in.
* **Authentication:** Uses Firebase GoogleAuthProvider with the restricted `https://www.googleapis.com/auth/drive.file` scope. This ensures MRT can only see and modify the specific backup file it creates, not the user's entire drive.
* **The Background Engine:** * Hosted in `AppShell.tsx`.
    * Checks if `isVaultUnlocked`, `isOnline`, and `driveAccessToken` are active.
    * Compares `userProfile.lastExportAt` to the current date. If > 7 days, it silently triggers a background export 10 seconds after the vault is unlocked.
    * It searches Google Drive for `mrt_backup.json`. If found, it issues a `PATCH` request to overwrite it; otherwise, a `POST` request to create it.
* **Security Note:** The synced JSON file contains **decrypted (plain text)** data. This ensures the user retains access to their history even if they permanently forget their MRT PIN.

## 3. The Manual Export Engine
**Philosophy:** The user owns their data.
* **JSON Export:**
    * Fetches ALL collections (`journals`, `tasks`, `workbooks`).
    * **Decryption:** Decrypts all content client-side before generation.
    * **Output:** Plain text JSON file. *User is warned in the UI to store this securely.*
* **PDF Export:**
    * Generates a formatted report of Journals and Tasks suitable for printing or sharing with a therapist, utilizing `jsPDF` and `jspdf-autotable`.

## 4. The Import Engine
* **Logic:** Parses JSON backups (both legacy formats and new full-schema formats).
* **Legacy Support:** Maps older data structures to the current schema automatically.
* **Safety:** Flags imported entries as `isEncrypted: false` (since they come from a plain text file). The next time the user edits and saves them, they are encrypted with the active vault key.

## 5. Verification
* [ ] **Export:** Unlock vault -> Export JSON. Is the content readable (not ciphertext)?
* [ ] **Auto-Sync:** Sign in with Google, manually change `lastExportAt` in Firestore to 8 days ago, refresh, unlock vault. Does the file appear in Google Drive?
'''

spec_insights = r'''# 📐 Feature Spec: Insights Log

**Status:** Live (v1.2)
**Context:** A timeline of AI-generated coaching and pattern analysis.

## 1. Data Structure
**Collection:** `insights`
The log handles polymorphic data types:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | 'journal' \| 'workbook' |
| `summary` | String | AI narrative |
| `pillars` | Map | Structured analysis (Growth, Blind Spots) |
| `suggested_actions` | Array | List of 3 recommended habits |

## 2. Features
* **Polymorphic UI:** Renders different cards based on `type`.
    * *Journal:* Shows Mood/Sentiment badges.
    * *Workbook:* Shows Pillars (Understanding/Growth/Blind Spots).
* **Action Integration:** "Add to Quest" buttons allow users to convert AI advice into tracked `Tasks` with a 7-day due date.
* **Trend Indicators:** * `JournalInsights.tsx` calculates a rolling 30-day average mood.
    * It compares [Day 0-30] vs [Day 31-60] to determine a trend direction (Improving, Declining, Stable).
    * Displayed as a colored arrow on the Dashboard card.

## 3. Verification
* [ ] **Filtering:** Filter by "Journal" - do Workbook entries disappear?
* [ ] **Action:** Click "Add to Quest". Does it appear in the Tasks list?
* [ ] **Trend:** Add a high-mood journal entry for "Today". Does the average mood stat recalculate instantly?
'''

spec_schema = r'''# 🗄️ Schema Architecture & Data Graph

**Storage Engine:** Cloud Firestore (NoSQL)
**Encryption Strategy:** Client-Side AES-GCM (Content fields only)

## 1. High-Level Topology

~~~mermaid
graph TD
    root[🔥 Firestore Root]
    
    root --> users[📂 users]
    users --> userDoc[📄 User Profile]
    userDoc --> workbook_progress[📂 workbook_progress]
    userDoc --> templates[📂 templates]
    
    root --> journals[📂 journals]
    root --> tasks[📂 tasks]
    root --> insights[📂 insights]
    root --> ai_logs[📂 ai_logs]
    root --> feedback[📂 feedback]
    root --> service[📂 service (Planned)]
~~~

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `encryptionSalt` (String): Public salt needed to derive key.
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness without storing it.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `role` (String): 'user' | 'admin'. Controls UI access.
    * `sponsorName` & `sponsorPhone` (String): Unencrypted. Used for SOS dialer.
    * `lastExportAt` (Timestamp): Used for the 7-day Backup Reminder.
    * `usage_limits` (Map): Timestamps (`lastWeeklyInsight`, `lastDeepDive`) to throttle AI costs.

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, and reflections.
* **Fields:**
    * `uid` (String): Owner ID.
    * `content` (String): **ENCRYPTED BLOB** (format: `iv:ciphertext`).
    * `isEncrypted` (Boolean): Flag for legacy plain text data handling.
    * `moodScore` (Int): **UNENCRYPTED** (Allows fast dashboard stats).
    * `sentiment` (String): AI-derived sentiment (e.g. 'Positive', 'Negative').
    * `tags` (Array): **UNENCRYPTED** (e.g., `["Vitality", "Movement"]`).
    * `weather` (Map): Snapshot of environment `{ temp, condition }`.

### `tasks/{taskId}`
* **Purpose:** Gamification, Habits, and AI Action Plans.
* **Encryption:** Unencrypted to allow background stats and streak evaluations.
* **Fields:**
    * `title` (String): Task name.
    * `category` (String): 'Recovery' | 'Health' | 'Life' | 'Work'.
    * `source` (String): 'manual' | 'ai'. (AI tasks map to the Action Plan tab).
    * `priority` (String): 'High' | 'Medium' | 'Low'.
    * `status` (String): 'pending' | 'completed'.
    * `currentStreak` (Int): Consecutive completions.
    * `recurrence` (Map): Logic for repetition.
    * `dueDate` & `lastCompletedAt` (Timestamp).

### `insights/{insightId}`
* **Purpose:** AI-generated analysis of journals/workbooks.
* **Fields:**
    * `type` (String): 'journal' | 'workbook'.
    * `summary` (String): The AI's output.
    * `pillars` (Map): Structured breakdown (understanding, growth, blind_spots).
    * `strengths` & `risks` (Array): Listed points for UI rendering.
    * `suggested_actions` (Array): 3 specific strings to be converted into Tasks.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).
* **Fields:**
    * `category`: 'bug' | 'suggestion' | 'content'.
    * `buildHash`: Commit hash for version tracing.
    * `environment`: 'DEV' | 'UAT' | 'PRODUCTION'.
    * `vaultUnlocked`: Boolean.
    * `route` & `userAgent`: Strings.

### `service/{serviceId}` (Planned - Project 05)
* **Purpose:** "Digital Rolodex" for sponsors to manage sponsees/commitments.
* **Fields:**
    * `type` (String): 'sponsee' | 'commitment'.
    * `name`, `contactInfo`, `notes` (Strings): **ENCRYPTED**.
    * `status` (String): 'Active' | 'Alumni' (Unencrypted for filtering).
    * `nextMeeting` (Timestamp): **UNENCRYPTED** (Allows push notifications).

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
'''

if __name__ == "__main__":
    print("🚀 Initiating Documentation Sync: Phase 3 (Technical Specs)...")
    
    write_file("docs/specs/01_JOURNAL.md", spec_journal)
    write_file("docs/specs/09_PROFILE.md", spec_profile)
    write_file("docs/specs/10_INSIGHTS.md", spec_insights)
    write_file("docs/specs/SCHEMA_ARCHITECTURE.md", spec_schema)

    print("✨ Phase 3 Complete. The Documentation Audit is officially finished.")
    print("👉 Next Steps: Run 'python3 scripts/sync_docs_phase3.py', commit all changes, and push to main.")