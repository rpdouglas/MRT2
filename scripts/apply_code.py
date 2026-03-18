import os

FENCE = chr(96) * 3

FILES = {
    "docs/SCHEMA_ARCHITECTURE.md": r"""# 🗄️ Schema Architecture & Data Graph

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
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `encryptionSalt` (String): Public salt needed to derive key.
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `role` (String): 'user' | 'admin'. Controls UI access.
    * `sponsorName` & `sponsorPhone` (String): Unencrypted. Used for SOS dialer.
    * `lastExportAt` (Timestamp): Used for the 7-day Backup Reminder.
    * `lastSeenBuildHash` (String): Used to trigger Changelog update toasts.
    * `usage_limits` (Map): Timestamps (`lastWeeklyInsight`, `lastMonthlyInsight`, `lastDeepDive`) to throttle AI usage for free tier users.
    * `tier` / `tierSource`: Monetization access tracking ('free' | 'premium').
    * `substanceCost` (Number): Used for Financial Freedom calculator.
    * `costFrequency` (String): 'daily' | 'weekly' | 'monthly'.
    * `currencySymbol` (String): User's local currency symbol.

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, Urge Surfing reflections.
* **Fields:**
    * `uid` (String): Owner ID.
    * `content` (String): **ENCRYPTED BLOB** (format: `iv:ciphertext`).
    * `isEncrypted` (Boolean): Flag for legacy plain text data handling.
    * `moodScore` (Int): **UNENCRYPTED** (Allows fast dashboard stats).
    * `sentiment` (String): AI-derived sentiment.
    * `tags` (Array): **UNENCRYPTED** (e.g., `["Vitality", "Crisis Avoided"]`).
    * `weather` (Map): Snapshot of environment.

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
    * `pillars` (Map): Structured breakdown.
    * `strengths` & `risks` (Array): Listed points for UI rendering.
    * `suggested_actions` (Array): Recommended tasks.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
""",

    "docs/specs/01_JOURNAL.md": r"""# 📖 Feature Specification: The Journal (The Vault)

**Status:** Live (v2.3)
**Security Level:** Zero-Knowledge (Client-Side AES-GCM)
**Primary Persona:** David (The Crisis User), Walt (The Zen Master), Ned (Pink Cloud)

---

## 1. Overview
The Journal is the central "Input" mechanism of My Recovery Toolkit. It allows users to document their daily inventory, process emotions, and receive AI-driven recovery coaching. Crucially, it is a **secure, encrypted vault**; plain text data is never stored on the server.

## 2. The Three Modes (Tabs)
The Journal functionality is split into three distinct views via `JournalTabs.tsx`:

### A. Write (The Editor - "Sticky Studio")
* **Layout:** A flexible column layout with a persistent **Command Toolbar** at the bottom.
* **Input Methods:** Text and Voice-to-Vault (audio transcribed and analyzed via Gemini 2.5 Flash).
* **Templates:** Sourced from `src/data/journalTemplates.ts` or user-defined custom templates (Premium feature).

### B. History (The Timeline)
* **Structure:** A virtualized list (`Virtuoso`) optimized for long-term recovery tracking, grouped by Year and Month.
* **The Memory Engine (Search):** Client-side search bar filters entries *after* they are decrypted in memory.

### C. Insights (The Dashboard)
* **Visualizations:** Emotional Velocity (Area Chart), Weekly Rhythm, and an Interactive Word Cloud with a local storage blocklist.

---

## 3. Advanced AI Features

### 🧠 The Analysis Wizard (Cost Shield Enabled)
* **Component:** `JournalAnalysisWizard.tsx`
* **Concept:** An "on-demand" recovery coach that reads decrypted history to find patterns.
* **Usage Limits (Rate Limiting):** Controlled via `useRateLimits.ts` reading `UserProfile.usage_limits`.
    * **Free Tier:** Limited to 1 Weekly/Monthly Analysis per 7/30 days, and 1 Deep Dive per 30 days. Requires a minimum entry count (7 for weekly, 30 for monthly/deep dive).
    * **Premium Tier:** Unlimited access (bypasses the timestamp checks).
* **Output:** Generates a `ComparativeAnalysisResult` or `DeepPatternResult` which is saved to the `insights` collection.

### 🎙️ Voice-to-Vault
* **Component:** `AudioRecorder.tsx`
* **Flow:** Records audio -> Converts to Base64 -> Sent to Gemini 2.5 Flash -> Returns Transcription + Mood Score + Smart Tags.
""",

    "docs/specs/11_DASHBOARD.md": r"""# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.3)
**Architecture:** Client-Side Aggregator
**Primary Code:** `src/pages/Dashboard.tsx`

## 1. Overview
The Dashboard is the central command center. It aggregates data from all other modules (Journal, Tasks, Workbooks, Vitality) to generate a real-time "Health Snapshot" of the user's recovery, emphasizing high density and immediate visual feedback.

## 2. Technical Architecture

### A. Data Aggregation
The Dashboard executes concurrent queries on mount via React Query to fetch Profile, Journals, Tasks, and Workbook answers, triggering the Gamification engine.

### B. The Changelog Beacon (Update Notification)
* **Logic:** Compares the active build hash (`useBuildInfo().globalHash`) against the user's `lastSeenBuildHash` stored in Firestore.
* **Trigger:** If the hashes mismatch, an animated toast drops down notifying the user of a new release, linking to the VitePress changelog.
* **Resolution:** Dismissing or viewing the toast updates the user's profile with the new hash, preventing future spam. Legacy users without a hash silently receive the current hash on mount.

### C. The Backup Sentinel
* **Logic:** Compares `userProfile.lastExportAt` to `Date.now()`. If > 7 days, displays an amber "Backup Needed" alert.

## 3. UI Components
* **Header:** True flex-centered `VibrantHeader` displaying globally mirrored icons, a dynamic daily recovery Slogan, and the Contextual Help icon.
* **Unified Identity Hero (`SobrietyHero.tsx`):** Displays clean time and gamification.
    * **Viral Watermark:** When the user clicks the Share icon, the `html-to-image` export temporarily renders a square aspect ratio and injects a "myrecoverytoolkit.ca" watermark at the bottom of the exported image for marketing visibility.
* **Bento Grid:** 6-tile layout linking to core modules.
""",

    "docs/SPRINT_BOARD.md": r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 7.1 (Investor Readiness) & Sprint 7.2 (Pre-Launch Polish)

## ✅ Completed Sprints
- [x] **Sprints 1-4:** Foundation, Auth, Journal Engine, Tasks, Vitality.
- [x] **Sprint 5.0:** The GTM Engine (Links Route, Account Deletion, VitePress).
- [x] **Sprint 6.0/6.5:** Crisis Tools (Urge Surfer, Financials) & Monetization Engine (Stripe Live).
- [x] **Sprint 7.0:** Android Play Store TWA (Bubblewrap CLI initialized, `.aab` generated).

## ⏳ Waiting On (External Blockers)
- [ ] **ServiceOntario:** Awaiting NUANS Reservation Number to finalize Incorporation.
- [ ] **Launch Lab:** Awaiting reply to initial intake email for EIR assignment.

## 🟡 Sprint 7.1: Investor Readiness (PROJ-16)
*Current Focus: Awaiting NUANS report to finalize entity.*

### 🏃 In Progress (Active Focus)
- [x] **PROJ-16:** Secure initial $400 Pre-Seed SAFE tranche to unblock incorporation.
- [x] **PROJ-16:** Draft the content for the 10-Slide Pitch Deck (Vibrant Momentum themed).
- [ ] **PROJ-16:** Finalize ServiceOntario Incorporation (pending NUANS).
- [ ] **PROJ-16:** Take $25 of remaining capital to Staples to print and bind physical decks.

## 🟢 Sprint 7.2: Pre-Launch Polish (PROJ-17) - COMPLETED
*Current Focus: High-impact UX and security fixes requested during Beta Testing.*

### ✅ Completed
- [x] **PROJ-17:** Implement AI Rate Limiting (Cost Shield) based on user tier.
- [x] **PROJ-17:** Inject MRT Viral Watermark into `SobrietyHero` image export.
- [x] **PROJ-17:** Add Contextual Help Icon (Question Mark) to `VibrantHeader.tsx`.
- [x] **PROJ-17:** Implement Changelog "Toast" beacon on login via `buildHash` tracking.
- [x] **PROJ-17:** Remove duplicate GitHub Action workflow causing double deployments.

## 🧊 Backlog (Up Next)
- [ ] **PROJ-05:** The Service Network (Sponsee Rolodex - "Lisa" Persona).
- [ ] **PROJ-18:** Desktop Command Center (Advanced Analytics).
""",

    "docs/ROADMAP.md": r"""# 🗺️ MRT Product Roadmap: "Forged in Fire"

**Vision:** To build the world's most secure, persona-aware clinical recovery operating system.

## 📅 Q1/Q2 2026: Foundation & Polish (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search |
| 🟢 **Done** | `PROJ-04.5`| **The Crucible** | Admin | Dogfooding, QA, & Virtuoso Log |
| 🟢 **Done** | `PROJ-10` | **Crisis & Momentum**| Admin | Urge Surfer + Financial Calculator |

## 📅 Q3 2026: Launch & The Service Network (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-09` | **The GTM Engine** | All | VitePress rewrite, `/links` Native routing. |
| 🟢 **Done** | `PROJ-15` | **The Checkout Engine**| All | Stripe Integration, Tier Management, Supporter Gate. |
| 🟢 **Done** | `PROJ-17` | **Pre-Launch Polish** | All | AI Cost Shield, Viral Watermark, UX. |
| 🟡 **Active** | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |
| 🟡 **Active** | `PROJ-16` | **Investor Readiness** | Founders | SAFE, Incorporation, Pitch Deck. |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |

## 📅 Q4 2026: The Deep Mind & Command (Planned)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-14` | **The Deep Mind** | Walt | Local RAG (Chat with your Journal). |
| ⚪ Planned | `PROJ-18` | **The Command Center** | Admin | Desktop-Optimized Deep Analytics. |
""",

    "docs-site/guide/03-journal-and-ai.md": r"""# 📖 The Vault (Journal & AI)

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

## 3. AI Analysis Wizard (The Compass)
Click the floating **Analyze** button to have the AI review your past entries and generate an actionable recovery strategy.

### Usage Limits
To protect the system and ensure fair usage, AI analysis is governed by your tier:
* **Standard (Free) Tier:** Limited to 1 Weekly Analysis per week, 1 Monthly Analysis per month, and 1 Deep Pattern scan per month.
* **Supporter (Premium) Tier:** Unlimited, on-demand access to all AI pattern recognition tools.

## 4. Insights & Analytics
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
""",

    "docs-site/guide/freemium.md": r"""# 💎 Free vs. Premium Tiers

My Recovery Toolkit operates on a "Freemium" model. Our core belief is that tools for acute crisis de-escalation should **always be free**. We only charge for features that cost us money to run (like advanced AI processing) or power-user tools for established sponsors.

## 🟢 The Free Tier (Standard)
Designed for immediate relief, habit building, and finding stability.
* **Unlimited Journaling:** Secure, zero-knowledge encryption for all entries.
* **The Ledger:** Unlimited task and habit tracking with "Smart Resets."
* **The Horizon:** Full dashboard tracking for clean time and gamification streaks.
* **The Pulse:** Unlimited somatic tracking (Fuel, Movement) and 4-7-8 Breathwork.
* **AI Access (Metered):** Limited to 1 Weekly Check-in per week, 1 Monthly Review per month, and 1 Deep Pattern Scan per month.

## 🌟 MRT Premium (Supporter)
Designed for users in the maintenance phase looking for deep insights, and sponsors managing commitments.
* **Unlimited AI Compass:** Unlimited, on-demand Gemini pattern recognition and deep-dive journal analysis.
* **Custom Templates:** Build and save your own Markdown-powered journal structures.
* **The Digital Rolodex (Service Module):** A securely encrypted system to track sponsee step work, contact info, and meeting times *(Coming Soon)*.
* **Cloud Auto-Sync:** Automated, invisible JSON backups to your personal Google Drive.
* **PDF Exports:** Generate beautiful, formatted reports of your journal history for therapy or sponsorship sessions.
""",

    "docs-site/support/changelog.md": r"""# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.6.0 (The Pre-Launch Polish Update)
* **New:** **Viral Watermark:** When exporting your Sobriety Hero milestone to an image, it now beautifully formats into a square aspect ratio perfect for Instagram/Facebook sharing, complete with a subtle MRT watermark.
* **New:** **Changelog Beacon:** You'll now receive a friendly toast notification on your dashboard when a new update is released.
* **New:** **Contextual Help:** Added a quick-access help icon to the main navigation header so you can easily access this User Guide from anywhere.
* **Improvement:** **AI Cost Shield:** Implemented clear rate-limiting for AI Analysis Wizard usage on the Free Tier, while maintaining unlimited access for Premium Supporters.

### v1.5.0 (The Supporter Update)
* **New:** **MRT Supporter Tier:** We have officially launched our Premium "Supporter" tier. By upgrading, you not only unlock unlimited AI Deep Dives, custom Journal Templates, and PDF Exports, but you also help keep the core crisis tools completely free for users who need them most.
* **New:** **Manage Subscription:** Seamless, secure integration with Stripe to manage your subscription directly from your Profile.

### v1.4.0 (The Momentum & Crisis Update)
* **New:** **Financial Freedom Tracker:** You can now enter your historical substance cost in your Profile. The dashboard will automatically calculate and display exactly how much money you've saved by staying clean.
* **New:** **The Urge Surfer:** Added a 5-minute interactive somatic grounding tool (accessible via the SOS menu and Tools tile). This feature uses the 5-4-3-2-1 method to help you ride out intense cravings, securely logging your victory to your journal when the wave passes.

### v1.3.1 (The Privacy & Marketing Update)
* **New:** **Right to be Forgotten:** You now have complete, automated control over your data. You can permanently delete your account directly from the Profile Data tab.
* **New:** **Native Link Tree:** Added a beautifully designed public `/links` page to easily share the app.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
"""
}

def apply_sync():
    for filepath, raw_content in FILES.items():
        content = raw_content.replace('__FENCE__', FENCE)
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Synced: {filepath}")

if __name__ == "__main__":
    apply_sync()
    print("✨ Documentation Drift Resolved. All systems synchronized.")