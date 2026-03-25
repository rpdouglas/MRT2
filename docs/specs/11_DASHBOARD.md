# 📐 Feature Spec: Dashboard (The Hub)

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
