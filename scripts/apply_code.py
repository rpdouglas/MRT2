import os

# =============================================================================
# 1. PROJECT MANAGEMENT (Sprint Board)
# =============================================================================
sprint_board = r'''# 🏃 Active Sprint Board
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
- [ ] **4.4 List Efficiency:**
    - Fix missing Sidebar Icon.
    - Implement "Month/Year" collapsible headers in History list.

### 🧠 Category C: Intelligence & Analytics
- [ ] **4.5 Visuals & Logic:**
    - Revamp Chart to Gradient Area Chart (Mon-Sun axis).
    - Filter "Template Words" from Word Cloud.
    - Tune AI Prompt for "Emotional Velocity".
- [ ] **4.6 Template Refresh:** Update default templates (Somatic Urge Log, Evening Inventory).

## 🧊 Backlog (Sprint 5+)
- [ ] **Photo Attachments:** Requires Firestore Storage + Client-Side Encryption.
- [ ] **Demo Mode:** Anonymous Auth flow for "Try before you buy".
'''

# =============================================================================
# 2. THE CRUCIBLE (QA Strategy)
# =============================================================================
crucible_spec = r'''# 🛡️ Project 04.5: The Crucible (Hardening & QA)

**Objective:** Lock down core business logic with unit tests and perform a comprehensive "Documentation-Driven QA" loop.
**Status:** 🟡 Active
**Context:** We are currently executing the "Bug Bash" phase based on the March 2026 Audit.

## 🏗️ Phase 1: The Logic Ledger (Unit Testing)
* [x] **Setup:** Ensure `vitest` and `@testing-library/react` are fully configured.
* [x] **Auto-Save:** Verified debounce and encryption timing.
* [x] **Journal CRUD:** Verified `add/update/delete` hooks invalidate cache correctly (Ticket 4.1).
* [ ] **Task CRUD:** Verify Optimistic UI rollbacks (Pending).

## 🐛 Phase 2: Documentation-Driven QA (The Bug Bash)

### Sector 1: The Gates (Auth & Onboarding)
* [x] **Status:** Secure.

### Sector 2: The Horizon (Dashboard)
* [ ] **Bug:** Fix missing/broken icon in top-left sidebar navigation.

### Sector 3: The Vault (Journal & Insights)
**Active Focus Area (Sprint 4)**
* [x] **Editor:** Fix Microphone icon overlapping text area (Moved to Sticky Toolbar).
* [x] **Editor:** Move Mood Slider to a position that doesn't require scrolling (Moved to Sticky Toolbar).
* [x] **Logic:** Change default mood from 5 to "User's Recent Average".
* [ ] **Visuals:** Replace "Cheap" Recharts bars with professional Gradient Area Chart.
* [ ] **Logic:** Word Cloud must ignore template boilerplate (e.g., "Today", "Grateful").
* [ ] **Performance:** Implement Month/Year grouping for long history lists.

### Sector 4: The Ledger (Tasks)
* [x] **Status:** Stable (Text wrapping fixed in Sprint 3).

### Sector 5: The Pulse (Vitality)
* [ ] **Audit Pending:** Verify Breathwork timer prevents screen sleep.

### Sector 6: The Compass (Workbooks)
* [ ] **Audit Pending:** Verify Auto-save works on slow 3G connections.

### Sector 7: The Settings (Profile)
* [x] **Critical Path:** Verified JSON Export contains readable data (decrypts correctly).
* [x] **Critical Path:** Verified PIN Rotation does not corrupt history.

'''

# =============================================================================
# 3. JOURNAL SPEC (Verification Update)
# =============================================================================
spec_journal = r'''# 📖 Feature Specification: The Journal (The Vault)

**Status:** Live (v2.1)
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

### B. History (The Timeline & Search)
* **View:** Virtualized list (`Virtuoso`) grouped by date headers (Today, Yesterday, etc.).
* **The Memory Engine (Search):**
    * **Mechanism:** A client-side search bar filters entries *after* they are decrypted in memory.
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
    5.  **Populates:** The Editor state.

---

## 4. Technical Architecture

### Data Flow & Encryption
~~~~mermaid
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
~~~~

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
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Synced: {path}")

if __name__ == "__main__":
    print("🚀 Running Documentation Sync Protocol (v2.1)...")
    write_file("docs/SPRINT_BOARD.md", sprint_board)
    write_file("docs/projects/04.5_THE_CRUCIBLE.md", crucible_spec)
    write_file("docs/specs/01_JOURNAL.md", spec_journal)
    print("✨ Documentation aligned with Ticket 4.3 completion.")