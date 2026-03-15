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
    * `usage_limits` (Map): Timestamps (`lastWeeklyInsight`, `lastDeepDive`) to throttle AI.
    * `tier` / `tierSource`: Monetization access tracking.
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
| 🟡 **Active** | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |
| ⚪ Planned | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |

## 📅 Q4 2026: The Deep Mind & Monetization (Planned)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-14` | **The Deep Mind** | Walt | Local RAG (Chat with your Journal). |
| 🟡 **Active** | `PROJ-15` | **The Checkout Engine**| All | Stripe Integration, Tier Management. |
""",

    "docs/SPRINT_BOARD.md": r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 6.5 (Pre-Release Consolidation)

## ✅ Completed Sprints
- [x] **Sprints 1-4:** Foundation, Auth, Journal Engine, Encryption, Tasks, Vitality.
- [x] **Sprint 5.0:** The GTM Engine (Links Route, Account Deletion, VitePress).

## 🟡 Sprint 6.0: Monetization & Crisis Tooling
*Current Focus: Merging feature branches to main.*

### ✅ Completed in this Sprint
- [x] **PROJ-15:** Phase 1-3: Stripe Configuration & VIP Admin Overrides.
- [x] **PROJ-10:** Integrated Financial Freedom calculator into `SobrietyHero.tsx`.
- [x] **PROJ-10:** Activated `UrgeSurfer.tsx` with WakeLock and 5-4-3-2-1 somatic logic.
- [x] **PROJ-10:** Test Hardening - Extracted financial math and secured Urge Surfer unmount lifecycle.

### 🏃 In Progress (Active Focus)
- [ ] **PROJ-10/15:** Create Pull Request from `feature/proj10` to `main`.
- [ ] **PROJ-15:** Configure Stripe "Live Mode" (Get Live Price ID) for production.
- [ ] **PROJ-07:** Re-run Bubblewrap build with `mrt-release.keystore` for Play Store TWA.

## 🧊 Backlog (Up Next)
- [ ] **PROJ-05:** The Service Network (Sponsee Rolodex)
""",

    "docs-site/guide/02-dashboard.md": r"""# 🌅 The Horizon Dashboard

Your Dashboard is the central command center for your recovery journey. It aggregates data from across the app to give you a real-time snapshot of your health.

## 1. The Identity & Momentum Card
At the very top of your dashboard is your unified Identity Card. 
* **Clean Time:** Tracks your exact sobriety time in Years, Months, and Days. 
* **Gamification Rank:** Right below your time, you will see your current Level, Archetype (e.g., Scholar, Doer, Monk), and your XP Progress Bar.
* **Financial Freedom:** If configured, the bottom right will show exactly how much money you have saved since your sobriety date.
  > **💡 Pro Tip:** You can configure your daily, weekly, or monthly substance cost in **Profile -> General** to activate the Financial Freedom tracker.

## 2. Crisis Tools (Urge Surfer & SOS)
If you are experiencing a craving or a panic attack, tap the red **Warning Triangle (SOS)** in the top right corner of the dashboard header.
* **Urge Surfer:** A 5-minute interactive grounding tool that uses the 5-4-3-2-1 method. It helps you "ride the wave" of a craving without fighting it.
* **Call Sponsor:** One-tap access to call or WhatsApp your sponsor (configurable in Profile).
* **Emergency Lines:** Instant routing to the 988 Lifeline or 911.

## 3. The Bento Grid
Quickly view your active streaks and completion rates across your core pillars:
* **Journal:** View your consecutive day streak and weekly consistency.
* **Habits:** View your overall completion rate and "Fire" score (the combined sum of all your active habit streaks).
* **Vitality:** View your biological regulation streak.
* **Wisdom:** View your workbook mastery percentage.
* **Tools:** Access the Urge Surfer and grounding exercises.

## 4. The Gamification Engine
Recovery is a high-performance lifestyle. MRT tracks your positive actions and assigns you an **Archetype** and **Level**.
* **Earning XP:** You earn XP by writing journals (+25 XP), completing tasks (+10 to +50 XP), and logging vitality metrics.
* **Archetypes:** Depending on where you spend your time, the system will assign you a persona: *Scholar* (Workbooks), *Doer* (Tasks), *Monk* (Vitality), or *Philosopher* (Journaling).
""",

    "docs-site/support/changelog.md": r"""# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.4.0 (The Momentum & Crisis Update)
* **New:** **Financial Freedom Tracker:** You can now enter your historical substance cost in your Profile. The dashboard will automatically calculate and display exactly how much money you've saved by staying clean.
* **New:** **The Urge Surfer:** Added a 5-minute interactive somatic grounding tool (accessible via the SOS menu and Tools tile). This feature uses the 5-4-3-2-1 method to help you ride out intense cravings, securely logging your victory to your journal when the wave passes.
* **Improvement:** The SOS menu now allows direct access to the Urge Surfer without requiring you to unlock your vault first, reducing friction during a crisis.

### v1.3.1 (The Privacy & Marketing Update)
* **New:** **Right to be Forgotten:** You now have complete, automated control over your data. You can permanently delete your account directly from the Profile Data tab. The system will cryptographically shred all your encrypted journals, tasks, and analytics before removing your identity.
* **New:** **Native Link Tree:** Added a beautifully designed public `/links` page to easily share the app.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model for incredibly deep, highly accurate pattern recognition.
* **Improvement:** **Timeline Navigation:** The Insights Log now groups your AI history by Year and Month using smooth, collapsible accordions.

### v1.2.0 (The Pulse Polish Update)
* **New:** **Somatic Breathwork Engine:** Upgraded the breathing tool with a fluid "Organic Halo" visualization and haptic feedback.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
"""
}

def apply_fixes():
    for filepath, raw_content in FILES.items():
        content = raw_content.replace('__FENCE__', FENCE)
        
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Synced: {filepath}")

if __name__ == "__main__":
    apply_fixes()
    print("✨ Documentation Drift Resolved. Ready for Pull Request.")