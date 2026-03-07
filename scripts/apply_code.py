import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. SCHEMA ARCHITECTURE
# =============================================================================
schema_content = r'''# 🗄️ Schema Architecture & Data Graph

**Storage Engine:** Cloud Firestore (NoSQL)
**Encryption Strategy:** Client-Side AES-GCM (Content fields only)

## 1. High-Level Topology

__FENCE__mermaid
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
__FENCE__

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, Billing, & Settings.
* **Fields:** `encryptionSalt`, `pinVerifier`, `sobrietyDate`, `role`, `tier`, `sponsorName`, `lastExportAt`, `usage_limits` (Map).

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, and reflections.
* **Fields:** `uid`, `content` (**ENCRYPTED BLOB**), `isEncrypted`, `moodScore` (Unencrypted), `sentiment`, `tags` (Unencrypted Array), `weather`.

### `tasks/{taskId}`
* **Purpose:** Gamification, Habits, and AI Action Plans.
* **Encryption:** Unencrypted to allow background stats and streak evaluations.
* **Fields:** `title`, `category`, `source` ('manual' | 'ai'), `priority`, `status`, `currentStreak`, `recurrence` (Map), `dueDate`, `lastCompletedAt`.

### `insights/{insightId}`
* **Purpose:** AI-generated analysis of journals/workbooks.
* **Fields:**
    * `type` (String): 'journal' | 'workbook'.
    * `scope_context` (String): e.g., 'Deep Pattern Recognition'.
    * `summary` (String): The AI's output narrative.
    * `pillars` (Map): Legacy structural breakdown (understanding, growth, blind_spots).
    * `key_themes` & `hidden_correlations` & `core_triggers` (Arrays): Extracted behavioral patterns.
    * `relapse_risk_level` (String): 'Low' | 'Moderate' | 'High' | 'Critical'.
    * `trajectory` (String): 'Improving' | 'Stable' | 'Declining' | 'Fluctuating'.
    * `strengths` & `risks` (Arrays): Listed points for UI rendering.
    * `suggested_actions` (Array): 3 specific strings to be converted into Tasks.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).
* **Fields:** `category`, `buildHash`, `environment`, `vaultUnlocked`, `route`, `userAgent`, `message`.

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
'''

# =============================================================================
# 2. AI INTEGRATION SPEC
# =============================================================================
ai_spec_content = r'''# 🧠 Feature Spec: AI Integration & Intelligence Layer

**Status:** Live (v4.5)
**Stack:** Google Gemini 3.1 & 2.5
**Context:** The architecture governing how MRT generates coaching, pattern recognition, and system health checks without compromising zero-knowledge security.

## 1. The Privacy Boundary
**Rule:** AI analysis is strictly "Opt-In" and "Stateless".
* Data is decrypted **in-browser**.
* The plain text is sent to the Gemini API via a secure HTTPS request.
* Gemini processes the data, returns the payload, and discards the prompt. User data is **never** stored by Google to train public models.

## 2. The Cascade & Model Optimization Engine
**Location:** `src/lib/gemini.ts`
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
'''

# =============================================================================
# 3. WORKBOOKS SPEC
# =============================================================================
workbooks_spec_content = r'''# 📐 Feature Spec: Wisdom (Workbooks & Library)

**Status:** Live (v2.0)
**Storage:** `users/{uid}/workbook_answers/{workbookId_questionId}`

## 1. Data Structure
To prevent state conflicts, each answer is stored as an individual document.
* **ID Format:** `[workbookId]_[questionId]`
* **Fields:** `answer` (Encrypted), `isEncrypted` (Bool), `updatedAt` (Timestamp).

## 2. The Library Hub (`Workbooks.tsx`)
The main entry point is structured via a dual-tab navigation system:
* **Workbooks Tab:** Renders the interactive, 12-Step and Buddhist logic flows.
* **Literature Tab:** A placeholder for upcoming classic reading materials and daily meditations.

## 3. Reading Experience & Mobile UX (`WorkbookSession.tsx`)
* **Zen Mode:** A full-screen, distraction-free reading layer using `@tailwindcss/typography`.
* **Mobile Keyboard Protection:** The layout uses strict flexbox constraints (`flex-1 min-h-0` on the parent, `shrink-0` on the question text, and `flex-1 resize-none` on the textarea). This ensures that when virtual keyboards appear on iOS/Android, the input area shrinks dynamically rather than pushing the question context off the screen.
* **Data Safety:** Answers are auto-saved to Firestore via `useAutoSave` every 2 seconds. Data is encrypted client-side *before* transmission.

## 4. AI Integration
* **Coach:** On-demand, individual question feedback via `getGeminiCoaching` (powered by ultra-fast `flash-lite`).
* **Compass:** Aggregate section analysis via `analyzeFullWorkbook`. Suggested actions added to Habits are tagged with `source: 'ai'` to route them to the Action Plan tab.
'''

# =============================================================================
# 4. INSIGHTS SPEC
# =============================================================================
insights_spec_content = r'''# 📐 Feature Spec: Insights Log

**Status:** Live (v2.0)
**Context:** A timeline of AI-generated coaching and pattern analysis.

## 1. Data Structure (Expanded Schema)
**Collection:** `insights`
The log handles polymorphic data types with rich, AI-extracted arrays:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | 'journal' \| 'workbook' |
| `summary` | String | AI narrative |
| `relapse_risk_level` | String | 'Low' \| 'Moderate' \| 'High' \| 'Critical' |
| `trajectory` | String | 'Improving' \| 'Declining' etc. |
| `hidden_correlations` | Array | Hidden links identified by Deep Pattern AI |
| `key_themes` | Array | Recurring topics from Comparative analysis |
| `suggested_actions` | Array | List of 3 recommended habits |

## 2. Features
* **Bento Grid UI:** Renders the rich arrays into a high-density, multi-column "Bento Grid" using vibrant background colors (`bg-purple-50`, `bg-rose-50`, etc.) that align with the "Vibrant Momentum" design system.
* **Action Integration:** "Add to Quest" buttons allow users to convert AI advice into tracked `Tasks` with a 7-day due date and the `ai` source tag.
* **Graceful Degradation:** The UI safely checks for the presence of new arrays (`hidden_correlations`, etc.) and falls back cleanly for legacy insight documents that only utilized the generic `pillars` map.
'''

# =============================================================================
# 5. USER GUIDE: WORKBOOKS
# =============================================================================
guide_workbooks_content = r'''# 🧭 The Library & The Compass

The Workbooks module is your centralized hub for structured, deep-dive recovery literature (like the 12-Steps and Recovery Dharma). **All answers are Zero-Knowledge Encrypted.**

## The Library Hub
When you open the Workbooks page, you will see two tabs:
* **Workbooks:** Interactive step-work and cognitive behavioral therapy (CBT) exercises.
* **Literature:** (Coming Soon) A repository of classic reading materials and daily meditations.

## Zen Mode & Auto-Save
* When you open a section, the app enters a distraction-free reading mode.
* The interface is optimized for mobile devices; the question will always stay pinned to the top of your screen even when your keyboard is open.
* As you type your answers, look at the top right of the screen. The app **Auto-Saves** and encrypts your work every 2 seconds.

## AI Coaching
Stuck on a tough question (like Step 4 resentments)? Type your initial thoughts, then click the **"AI Insight"** button in the sticky toolbar. The Recovery Coach will provide gentle, instantaneous feedback to help you dig deeper.

## Asking the Compass
From the main Workbook menu, click the floating **"Consult Compass"** button.
1. Select a specific section (e.g., Step 1), or the entire workbook.
2. The AI will decrypt your answers in-memory, analyze them, and generate a comprehensive Wisdom Report highlighting your **Strengths**, **Blind Spots**, and a 3-step **Action Plan**.
3. Click the `+` icon next to any Action Plan item to instantly add it to your Tasks ledger!
'''

# =============================================================================
# 6. SPRINT BOARD
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board

**Sprint:** 4.8 "The Crucible: Dogfooding & Polish"
**Start Date:** 2026-03-06
**Goal:** Perform rigorous manual QA ("Dogfooding") to identify and eradicate UX friction in Tasks, Vitality, Wisdom, and Insights.

## ✅ Sprints 1-5: Foundation to Vitality (Completed)
- [x] Auth UI, Onboarding Redirect, Dashboard Identity, Journal Cache.
- [x] Sector 4: The Ledger (Tasks) fully scaled and time-zone hardened.
- [x] Sector 5: The Pulse (Vitality) organic engine and haptics deployed.

## 🟡 Sprint 4.8: The Dogfooding Phase (Active)

### ✅ Sector 6: The Compass (Wisdom) - (Completed)
- [x] **Phase 1: Library Hub:** Replaced gamification stats with Workbooks/Literature tabs.
- [x] **Phase 2: Mobile UX:** Fixed virtual keyboard pushing the question text off-screen via flex-shrink architecture.
- [x] **Phase 3: Intelligence Upgrade:** Re-aligned Gemini models (3.1 Pro for deep reasoning, 2.5 Flash-Lite for instant coaching).

### 📍 Sector 7: The Insights Log - [ACTIVE FOCUS]
- [ ] Test rendering of massive AI responses and markdown parsing.
- [ ] Verify the new Bento Grid UI scales gracefully on ultra-small screens (iPhone SE).
- [ ] Verify "Add to Tasks" button safely disables after clicking to prevent duplicate tasks.

## 🧊 Backlog (Sprint 5+)
- [ ] **PROJ-09:** The GTM Engine (VitePress Rewrite)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media)
'''

# =============================================================================
# 7. CHANGELOG
# =============================================================================
changelog_content = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model for incredibly deep, highly accurate pattern recognition across your journal and workbook history.
* **New:** **Lightning Fast Coaching:** The "AI Insight" coach in workbooks now utilizes *Flash-Lite*, providing near-instantaneous feedback and guidance while you write.
* **Improvement:** **Rich Insights Log:** Redesigned the AI Insights output into a vibrant "Bento Grid" that visually highlights your Relapse Risk Level, Hidden Triggers, and Emotional Velocity.
* **Improvement:** **Library Hub Restructure:** Reorganized the Workbooks page with a clean tabbed navigation system to prepare for upcoming reading materials.
* **Fix:** **Mobile Keyboard UX:** Resolved an issue where opening the virtual keyboard on mobile phones would push the workbook question off the screen.

### v1.2.0 (The Pulse Polish Update)
* **New:** **Somatic Breathwork Engine:** Upgraded the breathing tool with a fluid "Organic Halo" visualization that perfectly matches real-world seconds.
* **New:** **Haptic Grounding:** The app now gently vibrates at every breath change (Inhale, Hold, Exhale) so you can close your eyes and stay grounded during a crisis.
* **Improvement:** **Smart Mood Scoring:** Breathwork logs now automatically inherit your 7-day average mood, preventing your charts from being artificially skewed.

### v1.1.1 (The Ledger Polish Update)
* **New:** **Future Task Safety:** Added a warning modal to prevent accidentally completing tasks scheduled for later dates, keeping your daily stats accurate.
* **Fix:** **Timezone Stability:** Recurring tasks no longer accidentally show up as overdue on the exact day they are created due to timezone calculation bugs.

### v1.1.0 (The Visuals & Hardening Update)
* **New:** **Gradient Insights:** Replaced basic charts with a beautiful "Emotional Velocity" area chart and a "Baseline vs Reality" weekly rhythm tracker.
* **New:** **Template Library:** Upgraded journal templates with structured, recovery-focused prompts (e.g., HALT check, Morning Intention).

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Running Post-Sprint Documentation Sync...")
    write_file("docs/SCHEMA_ARCHITECTURE.md", schema_content)
    write_file("docs/specs/15_AI_INTEGRATION.md", ai_spec_content)
    write_file("docs/specs/04_WORKBOOKS.md", workbooks_spec_content)
    write_file("docs/specs/10_INSIGHTS.md", insights_spec_content)
    write_file("docs-site/guide/06-workbooks.md", guide_workbooks_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs-site/support/changelog.md", changelog_content)
    print("✨ Audit and Synchronization Complete!")