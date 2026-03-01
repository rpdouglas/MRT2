import os

# =============================================================================
# 1. TECHNICAL SPECIFICATIONS
# =============================================================================
spec_onboarding = r'''# 📐 Feature Spec: Onboarding & The Gates

**Status:** Live (Sprint 1)
**Access Level:** Free

## 1. The "Why" (User Story)
* **As a:** New user ("David" or "Ned")
* **I want to:** Understand the app's value quickly and set up my profile without friction.
* **So that:** I can start tracking my sobriety and journaling securely.

## 2. User Experience (The Flow)
### A. The Landing Page (The Interactive Showcase)
* **Visuals:** 60/40 Asymmetrical Layout on Desktop. Stacks vertically on Mobile.
* **Left Column:** MRT Branding, Empathetic Blurb, and a primary "Begin Journey" CTA. Features a large, glassmorphism-wrapped Notebook LM YouTube Demo embed.
* **Right Column:** Interactive Persona Grid.
    * *Desktop:* Hovering transitions headshots to bios.
    * *Mobile:* Tapping opens a clean modal with the Bio image stacked above the Persona's YouTube Video.

### B. The Auth Consolidation
* A single, clean tabbed glassmorphism card in `Login.tsx`. 
* Users can cleanly toggle between "Sign In" and "Create Account".
* The "Create Account" tab dynamically reveals "Confirm Password" and "Privacy Guarantee" trust badges.

### C. The Forced Redirect (The Trap)
* **Logic:** Upon successful login/signup, the app checks `userProfile.hasCompletedOnboarding`.
* **Action:** If `false` (or missing), the user is routed to `/profile`.
* **Requirement:** They must enter a Display Name and Sobriety Date. Once saved, `hasCompletedOnboarding` is set to `true`, releasing them to the Dashboard.

## 3. Technical Architecture
* **Data Model:** Checks and updates `users/{uid}` collection.
* **Routing:** Uses React Router DOM inside a `useEffect` authentication listener.
'''

sprint_board = r'''# 🏃 Active Sprint Board
**Sprint:** 4.5.3 "Triage Execution"
**Start Date:** 2026-02-26
**Goal:** Execute the 3-Sprint Triage plan from the Sector 1 Bug Bash.

## 🚧 Sprint 1: The Gates & Onboarding (Active)
- [x] **1.1 Landing Page:** Add MRT icon, persona headshots/bios, Notebook LM video link. (60/40 Asymmetrical Layout)
- [x] **1.2 Auth UI:** Consolidate to a single login/create account view. (Tabbed UI)
- [ ] **1.3 Onboarding Redirect:** Force new users to Profile to set Name, Sponsor, and Sobriety Date.

## 📌 Sprint 2: The Horizon & Identity (Planned)
- [ ] **2.1 Sidebar/Header:** Add "My" to icon, balance header layout, rename Quest -> Tasks.
- [ ] **2.2 Reactivity:** Fix "Hello friend" bug; update Dashboard when Profile name changes.
- [ ] **2.3 Dashboard UI:** Move XP tracker to Sobriety Counter; add Service/Games placeholders.
- [ ] **2.4 Profile Tabs:** Split Profile into General / Security / Data tabs.
- [ ] **2.5 PIN Management:** Add secure Change PIN / Reset PIN flows.

## 📌 Sprint 3: The Core Polish (Planned)
- [ ] **3.1 Journal Cache:** Fix UI state so journal edits appear without page refresh.
- [ ] **3.2 Tasks UI:** Allow text wrapping for long Action Plan titles instead of truncation.

## ✅ Done (Previous Sprint)
- [x] Gathered 13 bugs across Sector 1.
- [x] Built Triage Generator script.
- [x] Restructured VitePress Knowledge Base.
'''

# =============================================================================
# 2. VITEPRESS USER GUIDE (docs-site/guide/)
# =============================================================================
guide_getting_started = r'''# 🚀 Getting Started: Account & Vault Setup

Welcome to My Recovery Toolkit (MRT). We believe that the hardest work you do should be done in the safest place possible. 

## The Onboarding Journey
When you first create an account, MRT requires you to set up your basic identity profile.
1. **Create Account:** Use Email/Password or Google Sign-In.
2. **Profile Setup:** You will be automatically redirected to your Profile. You must enter your **Display Name** and your **Sobriety Date** to continue. *(The app uses your Sobriety Date to calculate milestones and gamification XP).*
3. **Save:** Click "Save Changes" to unlock the Dashboard.

## 🔒 Securing Your Vault
MRT uses **Zero-Knowledge Encryption**. This means your journals and workbook answers are mathematically scrambled on your device *before* they are sent to the cloud.

1. Navigate to **Journal** or **Workbooks** in the sidebar.
2. You will be prompted to create a **4-Digit PIN**.
3. **WARNING:** We do not store this PIN. If you forget it, your encrypted data is permanently lost. There is no "Forgot Password" button for the Vault.

> **💡 Pro Tip:** Your PIN is temporarily cached in your browser while the app is open so you don't have to type it on every page. Clicking "Lock Vault" in the sidebar instantly clears it from memory.
'''

guide_dashboard = r'''# 🌅 The Horizon Dashboard

Your Dashboard is the central command center for your recovery journey. It aggregates data from across the app to give you a real-time snapshot of your health.

## 1. Clean & Sober Time
At the very top of your dashboard, your Sobriety Counter tracks your exact time in Years, Months, and Days based on the date set in your Profile. 

## 2. The Gamification Engine (XP & Rank)
Recovery is a high-performance lifestyle. MRT tracks your positive actions and assigns you an **Archetype** and **Level**.
* **Earning XP:** You earn XP by writing journals (+25 XP), completing tasks (+10 to +50 XP based on priority), and logging vitality metrics.
* **Archetypes:** Depending on where you spend your time, the system will assign you a persona: *Scholar* (Workbooks), *Doer* (Tasks), *Monk* (Vitality), or *Philosopher* (Journaling).

## 3. The Bento Grid
Quickly view your active streaks and completion rates:
* **Journal:** View your consecutive day streak and weekly consistency.
* **Quests (Tasks):** View your overall completion rate and "Fire" score (the combined sum of all your active habit streaks).
* **Vitality:** View your biological regulation streak.
* **Wisdom:** View your workbook mastery percentage.
'''

guide_journal = r'''# 📖 The Vault (Journal & AI)

The Journal is your secure space to process emotions, log triggers, and track your daily mood. **All entries here are Zero-Knowledge Encrypted.**

## 1. Writing an Entry
* **Text Mode:** Select a template (like "Morning Check-in" or "Urge Log") or free-write. 
* **Voice-to-Vault:** Tap the Microphone icon to dictate your journal. The app uses Google Gemini to transcribe your audio, detect your mood, and auto-generate tags.
* **Metadata:** Always slide the 1-10 Mood scale and add custom tags (e.g., `#Anxiety`, `#Meeting`) to help the AI track your patterns later.

## 2. History & Search
Navigate to the **History** tab to view past entries. 
* Use the top search bar to filter by keyword or tag.
* Click the "Share" icon on any card to decrypt it and copy it to your clipboard for a sponsor or therapist.

## 3. Insights & Analytics
Navigate to the **Insights** tab to view your data visually.
* **Weekly Rhythm:** A bar chart comparing your average mood over the last 30 days vs the previous 30 days.
* **Trend Arrow:** A quick visual indicator (Up/Down) showing your trajectory.
* **Recurring Themes:** An interactive Word Cloud. Click any word in the cloud to instantly search your journal history for that specific topic!
'''

guide_tasks = r'''# 📋 The Ledger (Tasks & Habits)

The Tasks module helps you build consistent routines and track actionable recovery steps.

## Smart Tabs
Your tasks are automatically routed into four distinct lanes to reduce overwhelm:
1. **Today:** Tasks due today or earlier.
2. **Upcoming:** Tasks scheduled for tomorrow or beyond.
3. **Action Plan:** Tasks generated automatically by the AI Compass (indicated by a purple Sparkles icon).
4. **Log:** Your history of completed tasks.

## The "Smart Reset" System
We don't believe in "Schedule Debt" or guilt. 
* If you miss a daily recurring habit (like "Morning Meditation"), MRT doesn't leave it in the past. 
* It automatically drops your current streak to 0 (a gentle penalty) and **moves the due date to Today** so you can try again immediately.

## Creating a Task
Click the floating `+` button to add a task. You can set Priorities (High, Medium, Low) and advanced Recurring schedules (e.g., "The Last Friday of every month").
'''

guide_vitality = r'''# ❤️ The Pulse (Vitality & Breathwork)

Somatic regulation—managing your physical body—is critical to preventing emotional relapse. The Vitality module tracks three pillars of physical health.

## The Bio-Rhythm Score
At the top of the screen, you will see a percentage ring. Logging an activity in any of the three categories below adds 33.3% to your daily score. Aim for 100% every day!

## 1. Movement
Log physical activities (Walking, Gym, Yoga) along with the duration and intensity. 

## 2. Fuel (Nutrition)
A mindful eating tracker. Log your meals and identify if your hunger was *Physical*, *Emotional*, *Boredom*, or just *Habit*. Includes a quick-tap Hydration (H2O) counter.

## 3. Breathwork (4-7-8 Pacer)
A real-time visual tool to de-escalate anxiety and lower your heart rate.
* Tap **Start** to begin the pacer.
* Follow the visual ring: **Inhale for 4s**, **Hold for 7s**, **Exhale for 8s**.
* You must complete at least one full cycle to log the session to your history.
'''

guide_workbooks = r'''# 🧭 The Library & The Compass

The Workbooks module provides structured, deep-dive recovery literature (like the 12-Steps and Recovery Dharma). **All answers are Zero-Knowledge Encrypted.**

## Zen Mode & Auto-Save
* When you open a section, the app enters a distraction-free reading mode.
* As you type your answers, look at the top right of the screen. The app **Auto-Saves** and encrypts your work every 2 seconds.

## AI Coaching
Stuck on a tough question (like Step 4 resentments)? Type your initial thoughts, then click the **"AI Insight"** button in the sticky toolbar. The Recovery Coach will provide gentle, specific feedback to help you dig deeper.

## Asking the Compass
From the main Workbook menu, click the floating **"Consult Compass"** button.
1. Select a specific section (e.g., Step 1), or the entire workbook.
2. The AI will decrypt your answers in-memory, analyze them, and generate a comprehensive Wisdom Report highlighting your **Strengths**, **Blind Spots**, and a 3-step **Action Plan**.
3. Click the `+` icon next to any Action Plan item to instantly add it to your Tasks ledger!
'''

guide_account_data = r'''# ☁️ Data Export & Cloud Sync

You own your recovery data. MRT provides multiple ways to ensure you never lose it, even if you lose your phone.

## 1. Google Drive Auto-Sync
If you created your account using **Google Sign-In**, MRT can automatically back up your data.
* Ensure your Vault is unlocked.
* Every 7 days, the app will silently compile a JSON backup of your data and save it to your personal Google Drive in the background.
* *Note: This backup is unencrypted so you can always read it outside the app.*

## 2. Manual Export
You can manually export your data at any time from the **Profile -> Data Management** section.
* **JSON Backup:** A raw data file containing your entire history.
* **PDF Document:** A beautifully formatted, readable document containing your Journals and Tasks. Perfect for printing and bringing to a therapy session.

## 3. Import Legacy Data
If you have a JSON backup file, you can upload it here to merge old entries into your current timeline.

## 4. Account Deletion
You have the "Right to be Forgotten." Clicking **Log Out** at the bottom of your profile signs you out. If you wish to permanently destroy your account and wipe all data from our servers, contact support or use the deletion tools (coming soon).
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Synced: {path}")

if __name__ == "__main__":
    print("🚀 Running Documentation Sync Protocol...")
    
    # 1. Update Specs & Sprint Board
    write_file("docs/specs/17_ONBOARDING.md", spec_onboarding)
    write_file("docs/SPRINT_BOARD.md", sprint_board)
    
    # 2. Update VitePress User Guides
    write_file("docs-site/guide/01-getting-started.md", guide_getting_started)
    write_file("docs-site/guide/02-dashboard.md", guide_dashboard)
    write_file("docs-site/guide/03-journal-and-ai.md", guide_journal)
    write_file("docs-site/guide/04-tasks-habits.md", guide_tasks)
    write_file("docs-site/guide/05-vitality.md", guide_vitality)
    write_file("docs-site/guide/06-workbooks.md", guide_workbooks)
    write_file("docs-site/guide/07-account-data.md", guide_account_data)
    
    print("✨ Documentation successfully aligned with Codebase Reality.")