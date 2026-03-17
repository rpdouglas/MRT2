# 📐 Feature Spec: Dashboard (The Hub)

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
