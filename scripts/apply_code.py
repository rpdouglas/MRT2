import os
import datetime

# =============================================================================
# 1. docs/SPRINT_BOARD.md (Closing the Sprint)
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board
**Sprint:** 5.0 "The Service Module (Lisa)"
**Start Date:** 2026-03-04
**Goal:** Implement the "Digital Rolodex" for sponsors to securely manage sponsees (The "Lisa" Persona).

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

## ✅ Sprint 4: Hardening & UX Polish (Completed)
- [x] **4.1 Hook Testing:** Write Vitest specs for `useJournalOperations` and `useTaskOperations`.
- [x] **4.2 Critical Path QA:** Manual verification of Export, PIN Rotation, and Crypto-Shredding.
- [x] **4.3 Editor Ergonomics:** Fix Mic icon, move Mood Slider, set smart default mood.
- [x] **4.4 List Efficiency:** Implement Month/Year grouping for Journal History.
- [x] **4.5 Visuals:** Upgrade Insights to Gradient Area Chart and "Baseline vs Reality" Weekly Rhythm.
- [x] **4.5.1 Filters:** Add "Manage Ignored Words" modal for Word Cloud.
- [x] **4.6 Template Refresh:** Extract templates to `src/data/` and upgrade content to recovery-focused prompts.

## 🟡 Sprint 5: The "Lisa" Service Module (Active)
- [ ] **5.1 Schema & Types:** Define `Sponsee` interface and Firestore security rules.
- [ ] **5.2 Service Hook:** Build `useServiceOperations` (CRUD with encryption).
- [ ] **5.3 Sponsee List UI:** Create "Active" and "Alumni" tabs.
- [ ] **5.4 Secure Card:** Build the detail view for encrypted notes.

## 🧊 Backlog (Sprint 6+)
- [ ] **Photo Attachments:** Requires Firestore Storage + Client-Side Encryption.
- [ ] **Demo Mode:** Anonymous Auth flow for "Try before you buy".
'''

# =============================================================================
# 2. docs/ROADMAP.md (Status Update)
# =============================================================================
roadmap_content = r'''# 🗺️ MRT Product Roadmap

**Vision:** To build the world's most secure, persona-aware digital recovery companion.

## 📅 Q1 2026: Foundation & Security (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |

## 📅 Q2 2026: The "Core Polish" Phase (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search, and VitePress |

## 📅 Q3 2026: Hardening & Expansion (Active)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-04.5`| **The Crucible (Hardening & QA)** | Admin | Unit Testing & Bug Bash |
| 🟡 **Active** | `PROJ-05` | **The "Lisa" Service Module**| Admin | Sponsee Management (Encrypted) |

## 📅 Q4 2026: Business & Distribution (Planned)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-06` | **The Freemium Engine** | Admin | Stripe Links, Tier Locks, Paywalls |
| ⚪ Planned | `PROJ-07` | **The Launch** | Admin | TWA Android Wrapper & Play Store |
| ⚪ Planned | `PROJ-08` | **Recovery Games** | Admin | Interactive gamified tools |
'''

# =============================================================================
# 3. docs-site/support/changelog.md (Release Notes)
# =============================================================================
changelog_content = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.1.0 (The Visuals & Hardening Update)
* **New:** **Gradient Insights:** Replaced basic charts with a beautiful "Emotional Velocity" area chart and a "Baseline vs Reality" weekly rhythm tracker.
* **New:** **Smart Word Cloud:** Added a filter button to hide specific words from your recurring themes. 
* **New:** **Template Library:** Upgraded journal templates with structured, recovery-focused prompts (e.g., HALT check, Morning Intention).
* **Improvement:** **Journal History:** Grouped entries by Year and Month for easier navigation of long timelines.
* **Security:** **Hardened:** Added comprehensive unit tests for core data operations and verified PIN rotation safety.

### v1.0.1 (Core Polish Update)
* **Improvement:** Journal entries now appear instantly in your History list after saving. No more manual refreshing!
* **Improvement:** Task titles now wrap text naturally, so longer AI-generated Action Plans are fully readable.
* **Fix:** Resolved a bug where deleting a journal entry might leave a "ghost" card until the next login.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release!
* **Feature:** Zero-Knowledge Client-Side Encryption (AES-GCM).
* **Feature:** The Horizon Gamification Dashboard.
* **Feature:** The Pulse (Vitality Tracking & Breathwork).
* **Feature:** The Compass (Gemini 2.5 AI Analysis).
* **Feature:** Task Ledger with Smart Resets.
'''

# =============================================================================
# 4. docs/specs/01_JOURNAL.md (Reflecting Code Changes)
# =============================================================================
# Using ~~~ as a placeholder for triple backticks to avoid Python string breaking
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
    * **Source:** `src/data/journalTemplates.ts`.
    * **Standard:** Morning Intention, Nightly Inventory, Urge Log (HALT), Meeting Reflection.
    * **Custom:** Users can define their own prompts via `TemplateEditor.tsx`.

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

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    
    # === THE FIX ===
    # Replace the ~~~ placeholder with actual triple backticks
    final_content = content.replace("~~~", "```").strip() + "\n"
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated Docs: {path}")

if __name__ == "__main__":
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs/ROADMAP.md", roadmap_content)
    write_file("docs-site/support/changelog.md", changelog_content)
    write_file("docs/specs/01_JOURNAL.md", journal_spec_content)
    print("✨ Sprint 4 Closed. Documentation Synchronized.")