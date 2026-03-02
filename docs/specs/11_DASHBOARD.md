# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.2)
**Architecture:** Client-Side Aggregator
**Primary Code:** `src/pages/Dashboard.tsx`

## 1. Overview
The Dashboard is the central command center. It aggregates data from all other modules (Journal, Tasks, Workbooks, Vitality) to generate a real-time "Health Snapshot" of the user's recovery, emphasizing high density and immediate visual feedback.

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
* **UI:** Displays an amber "Backup Needed" alert card linking to the Profile.

## 3. UI Components
* **Header:** True flex-centered `VibrantHeader` displaying globally mirrored icons and a dynamic daily recovery Slogan as the subtitle.
* **Unified Identity Hero (`SobrietyHero.tsx`):** A highly dense, asymmetrical textured card displaying:
  * "Clean Time" (Years/Months/Days) with `leading-none` for tight vertical rhythm.
  * A single-row gamification footer combining Rank, Level, Progress Bar, and XP.
  * Mirrored Calendar icons wrapping the Total Days counter.
* **Bento Grid:** 6-tile layout linking to core modules:
  * **Active Modules:** Journal (Streak & Consistency), Habits (Rate & Fire Score), Vitality (Bio-Streak & Logs), Wisdom (Mastery % & Total Score).
  * **Teaser Modules:** Service Portal and Recovery Games (Rendered with 50% opacity and 'Coming Soon' state).

## 4. Verification Checklist
* [ ] **Clean Time:** Change sobriety date in Profile. Does Dashboard update?
* [ ] **Gamification:** Complete a task. Does the "Fire" score in the Bento Grid increment?
* [ ] **Backup Alert:** If new user (no export), is the amber alert visible?
* [ ] **Responsiveness:** Does the single-row Gamification footer gracefully truncate on devices narrower than 350px (e.g., iPhone SE)?
