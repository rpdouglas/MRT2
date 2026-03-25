import os

# Protect Markdown backticks
FENCE = chr(96) * 3

def update_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.replace('__FENCE__', FENCE))
    print(f"✅ Synchronized: {filepath}")

def main():
    print("🚀 Initiating Post-Sprint Documentation Sync for PROJ-26...\n")

    # 1. SCHEMA ARCHITECTURE
    update_file('docs/SCHEMA_ARCHITECTURE.md', r"""# 🗄️ Schema Architecture & Data Graph

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
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness without storing it.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `role` (String): 'user' | 'admin'. Controls UI access.
    * `sponsorName` & `sponsorPhone` (String): Unencrypted. Used for SOS dialer.
    * `lastExportAt` (Timestamp): Used for the 7-day Backup Reminder.
    * `lastSeenBuildHash` (String): Used to trigger Changelog update toasts.
    * `usage_limits` (Map): Timestamps (`lastWeeklyInsight`, `lastDeepDive`) to throttle AI costs.
    * `fcmTokens` (Array): **NEW** Push notification device tokens for Cloud Messaging.
    * `timezone` (String): **NEW** User's local timezone for cron job alignment.

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
""")

    # 2. ROADMAP
    update_file('docs/ROADMAP.md', r"""# 🗺️ MRT Product Roadmap: "Forged in Fire"

## 📅 Q4 2026: The Road to 5,000 (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition & Scaling strategy. |
| 🟡 **Active** | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |
| 🟢 **Done** | `PROJ-24` | **The Asset Engine** | Admin | Centralized Typed Asset Dictionary & Medallion Pipeline. |
| 🟢 **Done** | `PROJ-26` | **The Beacon** | All | Firebase Cloud Messaging, push notifications, and PWA permission flows for retention. |
| ⚪ Planned | `PROJ-25` | **The Daily Oracle** | Walt / Ned | Daily prompted recovery reflections and journaling guides. |
| ⚪ Planned | `PROJ-22` | **Insights Stats** | Walt | Data visualization tab within the Insights module. |
| ⚪ Planned | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI and user metrics. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright). |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |
""")

    # 3. SPRINT BOARD
    update_file('docs/SPRINT_BOARD.md', r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 8.4 (The Polish Update)

## ✅ Completed Sprints
- [x] **Sprint 8.1:** Virality & Polish (PROJ-20). Milestone confetti, AI task badges.
- [x] **Sprint 8.2:** Medallion Pipeline (PROJ-24). Refined circular chips + transparency automation.
- [x] **Sprint 8.3:** Content Expansion. Integrated "Women for Recovery" specialty workbook with tailored UI routing.

## 🟡 Sprint 8.4: The Polish Update (Active)
- [x] **Feature:** PROJ-26 The Beacon (Firebase Cloud Messaging, backend cron job, PWA push notifications).
- [x] **Fix:** Workbook AI results not saving to Insights Log / UI rendering properly.
- [x] **Fix:** S21 mobile template dropdown visibility.
- [x] **Fix:** Remove distracting flashing pulse from global header icon (keep only on SOS).
- [x] **Fix:** Add white background to Nav Menu Logo.
- [x] **Fix:** Suppress "Backup Needed" warning for Google Drive auto-sync users.
- [ ] **Feature:** Admin terminology update ("Users" -> "Friends").

## 🟡 Sprint 8.0: The Road to 5,000 (Active)
- [ ] **Admin:** Receive $50,000 funding tranche.
- [ ] **PROJ-07:** Finalize Android App Store deployment.
- [ ] **Web Infra:** Move VitePress to docs.myrecoverytoolkit.ca.
- [ ] **Web Infra:** Landing page mobile polish & "About Us" section.
- [ ] **Assets:** Create company letterhead and slide deck master.
""")

    # 4. DASHBOARD SPECS
    update_file('docs/specs/11_DASHBOARD.md', r"""# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.5)
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
* **Resolution:** Dismissing or viewing the toast updates the user's profile with the new hash.

### C. Smart Backup Alerts
* **Logic:** The dashboard monitors the `lastExportAt` timestamp on the user's profile.
* **Trigger:** If the last export is older than 7 days AND the user does not have an active `driveAccessToken` (Google Drive Auto-Sync), an amber warning banner appears prompting them to perform a manual JSON export.

## 3. UI Components
* **Notification Banner (`NotificationBanner.tsx`):** A contextual opt-in for Push Notifications (PROJ-26). It strictly adheres to iOS constraints, suppressing the prompt unless the PWA is installed standalone.
* **Header:** True flex-centered `VibrantHeader` displaying globally mirrored icons, a dynamic daily recovery Slogan, and the Contextual Help icon.
* **Unified Identity Hero (`SobrietyHero.tsx`):** Displays clean time and gamification.
    * **Milestone Transformation:** If the user's `daysClean` matches a major milestone (e.g., 30, 90, 365), the UI swaps the gamification progress bar for a highly visible "Milestone Reached" banner that pulses to draw attention to the Share icon.
    * **Confetti Celebration:** On milestone days, the Dashboard triggers `react-confetti`. A `sessionStorage` key (`mrt_milestone_X_played`) ensures it only plays once per session to prevent UI annoyance upon returning to the hub.
    * **Viral Watermark:** When exporting via `html-to-image`, the component temporarily shifts to an `aspect-square` layout and injects the MRT logo and website URL for marketing visibility.
* **Bento Grid:** 6-tile layout linking to core modules.
""")

    # 5. USER GUIDE - DASHBOARD
    update_file('docs-site/guide/02-dashboard.md', r"""# 🌅 The Horizon Dashboard

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

## 3. Daily Reminders (The Beacon)
Staying on track is easier with gentle nudges. At the top of your Dashboard, you may see a banner asking you to **"Enable Daily Reminders"**. 
* **Milestone Celebrations:** Get notified the moment you hit a new recovery milestone.
* **Habit Nudges:** Receive a quiet reminder if you have pending habits or tasks left to complete for the day.
* *Note for iOS (iPhone) users:* Apple requires you to install the app to your Home Screen before it allows push notifications. Follow the installation guide if you don't see the banner!

## 4. Smart Data Alerts & Changelog
* **Backup Needed:** Because your data is encrypted with Zero-Knowledge architecture, we cannot recover it for you. If it has been more than 7 days since your last export, the Dashboard will politely remind you to download a backup. *(Note: If you have Google Drive Auto-Sync enabled in your Profile, this warning is hidden as the app handles it for you).*
* **Changelog Beacon:** When we release a new feature or bug fix, a small banner will appear at the top of your dashboard to let you know what's new.

## 5. The Bento Grid
Quickly view your active streaks and completion rates across your core pillars:
* **Journal:** View your consecutive day streak and weekly consistency.
* **Habits:** View your overall completion rate and "Fire" score (the combined sum of all your active habit streaks).
* **Vitality:** View your biological regulation streak.
* **Wisdom:** View your workbook mastery percentage.
* **Tools:** Access the Urge Surfer and grounding exercises.

## 6. The Gamification Engine
Recovery is a high-performance lifestyle. MRT tracks your positive actions and assigns you an **Archetype** and **Level**.
* **Earning XP:** You earn XP by writing journals (+25 XP), completing tasks (+10 to +50 XP), and logging vitality metrics.
* **Archetypes:** Depending on where you spend your time, the system will assign you a persona: *Scholar* (Workbooks), *Doer* (Tasks), *Monk* (Vitality), or *Philosopher* (Journaling).
""")

    # 6. CHANGELOG
    update_file('docs-site/support/changelog.md', r"""# 🚀 Changelog

### v1.10.0 (The Beacon Update)
* **New:** **Daily Reminders & Milestone Alerts:** Staying on track just got a little easier. You can now opt-in to receive gentle, daily push notifications directly to your device! Get notified the moment you hit a new recovery milestone, or receive a quiet reminder if you have pending habits left to complete for the day.
* **Security:** **Zero-Knowledge Push Engine:** As always, your privacy is absolute. Our new notification engine only knows *that* you have tasks to do, never *what* those tasks are. Your journal entries remain securely encrypted on your device.
* **Improvement:** **Dead-Token Pruning:** Added automated database hygiene routines to respect the right-to-be-forgotten when users revoke device permissions.

### v1.9.1 (The Polish Update)
* **Fix:** **Wisdom Log Synchronization:** Resolved an issue where Workbook AI Compass insights were successfully generating but failing to render visually in the Insights Log.
* **Improvement:** **Action Plan Routing:** Adding a suggested task directly from a Workbook insight now correctly routes it to the AI Action Plan tab.
* **UI Polish:** **Journal Editor:** Optimized the template selector dropdown to ensure it scales cleanly on smaller mobile devices (like the Galaxy S21).
* **UI Polish:** **Header & Navigation:** Refined the header pulse animations to reduce visual distraction and improved the contrast of the main navigation logo.
* **UX Polish:** **Smart Backup Alerts:** The Dashboard will now intelligently hide the "Manual Backup Needed" warning for users who have Cloud Auto-Sync enabled via Google Drive.

### v1.9.0 (The Content Expansion Update)
* **New:** **Women for Recovery Workbook:** Added a completely new, 8-section specialty workbook focused on self-discovery, emotional awareness, boundaries, and overdose survival reframing.
* **Improvement:** **Specialty Themes:** Added a dedicated 'specialty' workbook category that triggers a unique purple (Heart) UI theme to distinguish it from traditional 12-Step or Dharma paths.

### v1.8.0 (The Medallion Update)
* **New:** **Monthly Milestones:** Added unique, high-fidelity circular recovery medallions for every month of the first year of sobriety.
* **Improvement:** **Reliable Sharing:** Implemented an image pre-loader in the Sobriety Hero to ensure medallions appear perfectly in social media exports.
* **Dev:** **Asset Pipeline:** Created Python-based automation for segmenting and processing transparent PWA assets.

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.7.0 (The Virality Update)
* **New:** **Milestone Celebrations:** Hitting major clean-time milestones (30 days, 6 months, 1 year) now triggers a celebratory confetti burst on your dashboard and transforms your Sobriety Hero card into a highly shareable badge.
* **Improvement:** **AI Task Clarity:** Tasks generated by the AI Compass or Analysis Wizard now feature a clear "+7 Days" badge in your Action Plan to help you track when they were scheduled.
* **Improvement:** The image export tool now formats your milestones into a perfect square for seamless sharing on Instagram and Facebook.

### v1.6.0 (The Pre-Launch Polish Update)
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
""")

    # 7. PRIVACY POLICY (Internal Docs)
    update_file('docs/legal/PRIVACY_POLICY.md', r"""# 🔒 Privacy Policy for My Recovery Toolkit (MRT)

**Last Updated:** March 2026

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy. This policy explains how your information is collected, used, and secured.

## 1. Our Core Philosophy: Zero-Knowledge Encryption
MRT is built on a **Zero-Knowledge Architecture**.
* **Your Private Data:** Your Journal entries, Workbook answers, and Sponsee notes are encrypted on your device using a key derived from your PIN.
* **Our Access:** We (the developers) and our cloud providers (Firebase/Google) **cannot decrypt or read this data**. It is stored as mathematical gibberish (`ciphertext`) on our servers.
* **Your Responsibility:** Because we do not have your encryption key, **we cannot recover your data if you lose your PIN.**

## 2. Information We Collect
We collect data in two categories:

### A. Account & Metadata (Unencrypted)
To operate the service, the following data is stored in plain text:
* **Authentication:** Email address and User ID (via Firebase Auth).
* **Usage Stats:** App performance, error logs, and activity streaks (e.g., "User logged in today").
* **Non-Sensitive Content:** Task titles, Mood scores (1-10), and Vitality tags (e.g., "Movement", "Breath"). We use these to generate charts/graphs.
* **Device Tokens:** If you opt-in to Push Notifications, we securely store your device FCM token to deliver generic reminders (e.g., "You have tasks due today"). These tokens contain no personal information and are automatically deleted if you disable notifications.

### B. User Generated Content (Encrypted)
The following data is encrypted *before* it leaves your device:
* **Journals:** The text body of your diary entries.
* **Workbooks:** Your answers to deep-dive recovery questions.
* **Service Data:** Names and notes regarding people you sponsor.

## 3. How We Use Artificial Intelligence (AI)
MRT uses Artificial Intelligence (Google Gemini) to provide coaching and analysis.
* **Consent:** AI analysis only happens when you explicitly click a button (e.g., "Analyze Journal", "Consult Compass").
* **Process:** Your device temporarily decrypts the specific text, sends it to the AI provider via a secure connection, and displays the result.
* **Privacy:** We utilize "Stateless" API calls. Your journal entries are **NOT** used to train Google's public AI models. The data is processed in memory and then discarded by the AI provider.

## 4. Data Storage & Third Parties
We use trusted third-party infrastructure to host the app:
* **Google Firebase:** Hosts the database, authentication, push notifications, and static files.
* **Google Generative AI:** Provides the intelligence for analysis features.

## 5. Data Sovereignty
You own your data.
* **Export:** You may download a decrypted JSON or PDF copy of your data at any time via the Profile page.
* **Deletion:** You may delete your account at any time. This permanently wipes all data (Encrypted and Unencrypted) from our servers.

## 6. Children's Privacy
MRT is not intended for individuals under the age of 13. We do not knowingly collect data from children.

## 7. Contact Us
For technical support or privacy questions, please contact:
**Email:** rpdouglas@gmail.com
""")

    # 8. PRIVACY POLICY (Public VitePress Site)
    update_file('docs-site/privacy.md', r"""# 🔒 Privacy Policy 

**My Recovery Toolkit ("MRT", "we", "our")** is committed to protecting your privacy. This policy explains how your information is collected, used, and secured at `www.myrecoverytoolkit.ca`.

**Last Updated:** March 2026

## 1. Our Core Philosophy: Zero-Knowledge Encryption
MRT is built on a **Zero-Knowledge Architecture**.
* **Your Private Data:** Your Journal entries, Workbook answers, and Sponsee notes are encrypted on your device using a key derived from your 4-digit PIN.
* **Our Access:** We (the developers) and our cloud providers (Firebase/Google) **cannot decrypt or read this data**. It is stored as mathematical gibberish (`ciphertext`) on our servers.
* **Your Responsibility:** Because we do not have your encryption key, **we cannot recover your data if you lose your PIN.**

## 2. Information We Collect
We collect data in two categories:

### A. Account & Metadata (Unencrypted)
To operate the service and generate dashboards, the following data is stored in plain text:
* **Authentication:** Email address and User ID.
* **Usage Stats:** App performance, activity streaks, and XP points.
* **Non-Sensitive Content:** Task titles, Mood scores (1-10), and Vitality tags (e.g., "Movement", "Breath"). 
* **Device Tokens:** If you opt-in to Push Notifications, we securely store your device FCM token to deliver generic reminders (e.g., "You have tasks due today"). These tokens contain no personal information and are automatically deleted if you disable notifications.

### B. User Generated Content (Encrypted)
The following data is encrypted *before* it leaves your device via AES-GCM:
* **Journals:** The text body of your diary entries.
* **Workbooks:** Your answers to deep-dive recovery questions.

## 3. How We Use Artificial Intelligence (AI)
MRT uses **Google Gemini 2.5 (Flash and Pro models)** to provide coaching, pattern recognition, and sentiment analysis.
* **Consent:** AI analysis only happens when you explicitly click a button (e.g., "Analyze Journal", "Consult Compass").
* **Process:** Your device temporarily decrypts the specific text in-memory, sends it to the AI provider via a secure connection, and displays the result.
* **Stateless Privacy:** We utilize "Stateless" API calls. Your journal entries are **NOT** stored by Google and are **NOT** used to train public AI models. 

## 4. Data Sovereignty
You own your data.
* **Export:** You may download a decrypted JSON or PDF copy of your data at any time.
* **Deletion:** You may delete your account at any time via the Profile page, permanently wiping all data from our servers.

## 5. Contact Us
For technical support or privacy questions, please contact:
**Email:** rpdouglas@gmail.com
""")

    print("\n🎉 Documentation fully synchronized and drift eliminated!")

if __name__ == "__main__":
    main()