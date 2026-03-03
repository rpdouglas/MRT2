import os

# =============================================================================
# 1. docs/specs/01_JOURNAL.md (Technical Spec Update)
# =============================================================================
# NOTE: We use '~~~' as a placeholder for triple backticks to prevent Python string parsing errors.
journal_spec_content = r'''# 📖 Feature Specification: The Journal (The Vault)

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
    1.  **Emotional Velocity (Area Chart):** A gradient-filled area chart showing mood fluctuation over the last 14 active days, overlaid with temperature data to detect seasonal patterns.
    2.  **Weekly Rhythm (Baseline vs. Reality):** A comparative chart showing:
        * **Ghost Line (Dotted):** Average mood for the *Previous 30 Days*.
        * **Solid Bar:** Average mood for the *Current 30 Days*.
        * *Insight:* If the bar is higher than the line, the user is trending up.
    3.  **Interactive Word Cloud:** Frequency analysis of entry content.
        * **Smart Filters:** Automatically excludes boilerplate words (e.g., "Check-in", "Morning").
        * **User Blocklist:** Users can click the "Eye Slash" icon to open `ManageWordCloudModal` and hide specific words from the cloud locally (persisted in `localStorage`).
        * *Interaction:* Clicking a word routes the user to the History tab and auto-populates the search filter with that word.

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
~~~mermaid
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

## 5. Verification (QA)
* [x] **Unit Test:** `src/hooks/__tests__/useJournalOperations.test.ts` verifies cache invalidation signals.
* [x] **UX Polish:** Verified "Sticky Studio" layout handles overflow correctly and mic button does not block text.
* [x] **Navigation:** Verified Month/Year grouping allows easy access to old entries without infinite scrolling.
'''

# =============================================================================
# 2. docs-site/guide/03-journal-and-ai.md (User Guide Update)
# =============================================================================
guide_content = r'''# 📖 The Vault (Journal & AI)

The Journal is your secure space to process emotions, log triggers, and track your daily mood. **All entries here are Zero-Knowledge Encrypted.**

## 1. Writing an Entry
* **Text Mode:** Select a template (like "Morning Check-in" or "Urge Log") or free-write. 
* **Voice-to-Vault:** Tap the Microphone icon to dictate your journal. The app uses Google Gemini to transcribe your audio, detect your mood, and auto-generate tags.
* **Metadata:** Always slide the 1-10 Mood scale and add custom tags (e.g., `#Anxiety`, `#Meeting`) to help the AI track your patterns later.

## 2. History & Navigation
Navigate to the **History** tab to view past entries.
* **Timeline View:** Your entries are grouped by **Year** and **Month**.
* **Navigation:** By default, only the current month is open. Tap any Year or Month header to expand it and view older entries.
* **Search:** Use the top search bar to filter by keyword or tag. Searching automatically expands all groups to show every matching result.
* **Share:** Click the "Share" icon on any card to decrypt it and copy it to your clipboard for a sponsor or therapist.

## 3. Insights & Analytics
Navigate to the **Insights** tab to view your data visually.

### 📊 Emotional Velocity
This gradient chart shows the "flow" of your mood over the last 14 days.
* The purple curve represents your **Mood**.
* The orange line represents the **Temperature**.
* **Why this matters:** Look for patterns. Does your mood dip when the temperature drops? Do you have "spikey" weeks or smooth sailing?

### 📉 Weekly Rhythm (Baseline vs. Reality)
This chart compares your **Current 30 Days** against your **Previous 30 Days**.
* **Solid Purple Bar:** Your average mood for that day of the week *recently*.
* **Dotted Grey Line:** Your average mood for that day *last month*.
* **How to read it:** If the Purple Bar is taller than the Dotted Line, you are improving compared to your baseline!

### ☁️ Recurring Themes (Word Cloud)
See what you talk about most often.
* **Filtering Noise:** MRT automatically hides common template words like "Morning" or "Check-in."
* **Custom Filters:** Tap the **Eye Slash Icon** in the corner to manage your ignored words. If you want to hide a specific name or place from the cloud, add it there.
* **Deep Dive:** Click any word in the cloud to instantly search your journal history for that specific topic!
'''

# =============================================================================
# 3. docs/SPRINT_BOARD.md (Project Management Sync)
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board
**Sprint:** 4.6 "The Crucible & The Polish"
**Start Date:** 2026-03-03
**Goal:** Lock down logic stability (Tests) and eradicate high-friction UX bugs (Journal Polish).

## ✅ Sprint 1: The Gates & Onboarding (Completed)
- [x] **1.1 Landing Page:** Add MRT icon, persona headshots/bios.
- [x] **1.2 Auth UI:** Consolidate to a single login/create account view.
- [x] **1.3 Onboarding Redirect:** Force new users to Profile setup.

## ✅ Sprint 2: The Horizon & Identity (Completed)
- [x] **2.1 Sidebar/Header:** Brand alignment.
- [x] **2.2 Reactivity:** Dashboard updates when Profile name changes.
- [x] **2.3 Dashboard UI:** Move XP tracker to Sobriety Counter.
- [x] **2.4 Profile Tabs:** Split Profile into General / Security / Data tabs.
- [x] **2.5 PIN Management:** Add secure Change PIN / Reset PIN flows.

## ✅ Sprint 3: The Core Polish (Completed)
- [x] **3.1 Journal Cache:** Fix History tab staleness on save/delete.
- [x] **3.2 Tasks UI:** Fix text wrapping for long Action Plan titles.

## 🟡 Sprint 4: Hardening & UX Polish (Active)

### 🛠️ Category A: System Hardening
- [x] **4.1 Hook Testing:** Write Vitest specs for `useJournalOperations` and `useTaskOperations`.
- [x] **4.2 Critical Path QA:** Manual verification of Export, PIN Rotation, and Crypto-Shredding.

### 🎨 Category B: Journal UX Polish
- [x] **4.3 Editor Ergonomics:**
    - Fix Mic icon blocking text (padding).
    - Move Mood Slider to Sticky Header/Footer.
    - Set default mood to "Last 7 Days Average" instead of 5.
- [x] **4.4 List Efficiency:**
    - Fix missing Sidebar Icon.
    - Implement "Month/Year" collapsible headers in History list.

### 🧠 Category C: Intelligence & Analytics
- [x] **4.5 Visuals & Logic:**
    - Revamp Chart to Gradient Area Chart (Emotional Velocity).
    - Implement "Baseline vs Reality" Weekly Rhythm Chart.
    - Tune AI Prompt for brevity.
- [x] **4.5.1 Filters:**
    - Add "Manage Ignored Words" modal for Word Cloud.
    - Persist user blocklist to LocalStorage.
- [ ] **4.6 Template Refresh:** Update default templates (Somatic Urge Log, Evening Inventory).

## 🧊 Backlog (Sprint 5+)
- [ ] **Photo Attachments:** Requires Firestore Storage + Client-Side Encryption.
- [ ] **Demo Mode:** Anonymous Auth flow for "Try before you buy".
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    
    # === THE FIX IS HERE ===
    # We replace the ~~~ placeholder with the actual ``` triple backticks.
    # This ensures the Python script parses correctly but the output file is valid Markdown.
    final_content = content.replace("~~~", "```").strip() + "\n"
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated Docs: {path}")

if __name__ == "__main__":
    write_file("docs/specs/01_JOURNAL.md", journal_spec_content)
    write_file("docs-site/guide/03-journal-and-ai.md", guide_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    print("✨ Documentation Synchronization Complete.")