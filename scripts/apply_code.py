import os

# =============================================================================
# 1. PROJECT MANAGEMENT
# =============================================================================
sprint_board = r'''# 🏃 Active Sprint Board
**Sprint:** 4.5.3 "Triage Execution"
**Start Date:** 2026-02-26
**Goal:** Execute the 3-Sprint Triage plan from the Sector 1 Bug Bash.

## ✅ Sprint 1: The Gates & Onboarding (Completed)
- [x] **1.1 Landing Page:** Add MRT icon, persona headshots/bios, Notebook LM video link.
- [x] **1.2 Auth UI:** Consolidate to a single login/create account view.
- [x] **1.3 Onboarding Redirect:** Force new users to Profile to set Name, Sponsor, and Sobriety Date.

## 🟡 Sprint 2: The Horizon & Identity (Active)
- [x] **2.1 Sidebar/Header:** Add "My" to icon, balance header layout, rename Quest -> Tasks.
- [x] **2.2 Reactivity:** Fix "Hello friend" bug; update Dashboard when Profile name changes.
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
# 2. TECHNICAL SPECIFICATIONS
# =============================================================================
spec_dashboard = r'''# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.1)
**Architecture:** Client-Side Aggregator
**Primary Code:** `src/pages/Dashboard.tsx`

## 1. Overview
The Dashboard is the central landing page. It does not store its own data; instead, it queries all other modules (Journal, Tasks, Workbooks, Profile) to generate a real-time "Health Snapshot" of the user's recovery.

## 2. Technical Architecture

### A. Data Aggregation
The Dashboard executes 4 concurrent queries on mount:
1.  **Profile:** Fetches `sobrietyDate`, `displayName` (for reactivity), and `lastExportAt`.
2.  **Journals:** Fetches *all* history to calculate streaks and consistency.
3.  **Tasks:** Fetches active tasks to calculate "Fire" scores.
4.  **Workbooks:** Fetches answer count for "Wisdom" score.

**Performance Note:** Queries are set to `refetchOnMount: 'always'` to ensure gamification stats update immediately after a user performs an action in another tab.

### B. The Calculation Engine
Inside a `useMemo` hook, the Dashboard passes raw data to the **Gamification Engine** (`src/lib/gamification.ts`) to derive:
* **User Level:** Based on total XP from all sources.
* **Archetype:** (Scholar, Doer, Monk, etc.) based on activity distribution.
* **Streaks:** Current consecutive activity chains.

### C. The Backup Sentinel
* **Logic:** Compares `userProfile.lastExportAt` to `Date.now()`.
* **Trigger:** If > 7 days since last export.
* **UI:** Displays an amber "Backup Needed" alert card that links to the Profile.

## 3. UI Components
* **Header:** True flex-centered `VibrantHeader` displaying "Welcome back, {Name}".
* **Floating Hero:** Displays "Clean Time" (Years/Months/Days) in an asymmetrical textured card.
* **Bento Grid:** 4-quadrant layout linking to core modules with live stats:
  * Journal (Streak & Consistency)
  * Tasks/Habits (Rate & Fire Score)
  * Vitality (Bio-Streak & Logs)
  * Wisdom (Mastery % & Total Score)
* **Rank Card (Bottom):** Glassmorphism card displaying current Level, Archetype, and XP Progress Bar.

## 4. Verification Checklist
* [ ] **Clean Time:** Change sobriety date in Profile. Does Dashboard update?
* [ ] **Gamification:** Complete a task. Does the "Fire" score in the Bento Grid increment?
* [ ] **Backup Alert:** If new user (no export), is the amber alert visible?
* [ ] **Reactivity:** Does changing the display name in the Profile instantly update the greeting on the Dashboard?
'''

# =============================================================================
# 3. USER GUIDE
# =============================================================================
guide_dashboard = r'''# 🌅 The Horizon Dashboard

Your Dashboard is the central command center for your recovery journey. It aggregates data from across the app to give you a real-time snapshot of your health.

## 1. Clean & Sober Time
At the top of your dashboard, your Sobriety Counter tracks your exact time in Years, Months, and Days based on the date set in your Profile. 

## 2. The Bento Grid
Quickly view your active streaks and completion rates across your core pillars:
* **Journal:** View your consecutive day streak and weekly consistency.
* **Tasks:** View your overall completion rate and "Fire" score (the combined sum of all your active habit streaks).
* **Vitality:** View your biological regulation streak.
* **Wisdom:** View your workbook mastery percentage.

## 3. The Gamification Engine (XP & Rank)
Recovery is a high-performance lifestyle. MRT tracks your positive actions and assigns you an **Archetype** and **Level**.
* **Earning XP:** You earn XP by writing journals (+25 XP), completing tasks (+10 to +50 XP based on priority), and logging vitality metrics.
* **Archetypes:** Depending on where you spend your time, the system will assign you a persona: *Scholar* (Workbooks), *Doer* (Tasks), *Monk* (Vitality), or *Philosopher* (Journaling).
* **Leveling Up:** As you earn XP, your rank will increase. Your current rank and progress to the next level are displayed at the bottom of the Dashboard.
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact using the protection protocol
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Synced: {path}")

if __name__ == "__main__":
    print("🚀 Running Documentation Sync Protocol (v2.0)...")
    write_file("docs/SPRINT_BOARD.md", sprint_board)
    write_file("docs/specs/11_DASHBOARD.md", spec_dashboard)
    write_file("docs-site/guide/02-dashboard.md", guide_dashboard)
    print("✨ Documentation perfectly aligned with codebase.")