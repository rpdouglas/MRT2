# 📐 Feature Spec: Dashboard (The Hub)

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
