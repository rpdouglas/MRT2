import os

# =============================================================================
# 1. PROJECT MANAGEMENT (Sprint Board)
# =============================================================================
sprint_board = r'''# 🏃 Active Sprint Board
**Sprint:** 4.6 "The Crucible" (Hardening)
**Start Date:** 2026-03-03
**Goal:** Finalize unit testing and prepare for the Service Module (Lisa Persona).

## ✅ Sprint 1: The Gates & Onboarding (Completed)
- [x] **1.1 Landing Page:** Add MRT icon, persona headshots/bios, Notebook LM video link.
- [x] **1.2 Auth UI:** Consolidate to a single login/create account view.
- [x] **1.3 Onboarding Redirect:** Force new users to Profile to set Name, Sponsor, and Sobriety Date.

## ✅ Sprint 2: The Horizon & Identity (Completed)
- [x] **2.1 Sidebar/Header:** Add "My" to icon, balance header layout, rename Quest -> Tasks.
- [x] **2.2 Reactivity:** Fix "Hello friend" bug; update Dashboard when Profile name changes.
- [x] **2.3 Dashboard UI:** Move XP tracker to Sobriety Counter; add Service/Games placeholders.
- [x] **2.4 Profile Tabs:** Split Profile into General / Security / Data tabs.
- [x] **2.5 PIN Management:** Add secure Change PIN / Reset PIN flows.

## ✅ Sprint 3: The Core Polish (Completed)
- [x] **3.1 Journal Cache:** Implemented `useJournalOperations` hook to fix History tab staleness on save/delete.
- [x] **3.2 Tasks UI:** Refactored `TaskRow` to support multi-line text wrapping for long AI-generated titles.

## 🟡 Sprint 4: Unit Testing & Hardening (Active)
- [ ] **4.1 Hook Testing:** Add comprehensive tests for `useTaskOperations` and `useJournalOperations`.
- [ ] **4.2 Critical Path QA:** Run full manual regression on PIN rotation and Export flows.

## ✅ Done (Previous Sprint)
- [x] Gathered 13 bugs across Sector 1.
- [x] Built Triage Generator script.
- [x] Restructured VitePress Knowledge Base.
'''

# =============================================================================
# 2. TECHNICAL SPECIFICATIONS (Journal)
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

# =============================================================================
# 3. CHANGELOG (Public)
# =============================================================================
changelog = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

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
    write_file("docs/specs/01_JOURNAL.md", spec_journal)
    write_file("docs-site/support/changelog.md", changelog)
    print("✨ Documentation aligned with Sprint 3 completion.")