import os

# FENCE pattern to protect markdown codeblocks during generation
FENCE = chr(96) * 3

files_to_update = {
    "docs/ACTIVE_CYCLE.md": r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W14
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [x] **[BUG]** Dashboard load speed optimization (Check Firestore indexes & React Query caching). -> *Resolved via 30-day bounded queries and composite indexing.*
- [ ] **[BUG]** PWA Workbox cache collision (Fix deploy refresh requiring 3-4 reloads).
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[UX]** Rename global variables/UI text from "Users" to "Friends" (Peer-to-peer alignment).

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage and user flow (Recharts already integrated).
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) and Recovery Community Centers (RCCs) for employment/training resources in Workbooks hub (Recovery Capital integration).

## 🧹 Chores & Tech Debt
- [ ] Increase Nav Icon sizes by 25% (Accessibility).
- [ ] Fix Nav Logo white background issue.
- [ ] Wire up Changelog Beacon alert in Dashboard.
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState` and `<form action={...}>`.
""",

    "docs/specs/11_DASHBOARD.md": r"""# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v2.6)
**Architecture:** Client-Side Aggregator with Bounded Queries
**Primary Code:** `src/pages/Dashboard.tsx`, `src/hooks/useDashboardData.ts`

## 1. Overview
The Dashboard is the central command center. It aggregates data from all other modules (Journal, Tasks, Workbooks, Vitality) to generate a real-time "Health Snapshot" of the user's recovery, emphasizing high density and immediate visual feedback.

## 2. Technical Architecture

### A. Data Aggregation (O(1) Load Time)
To prevent mobile browser crashes and massive data payloads for long-term users, the Dashboard executes concurrent bounded queries (capped at 30 days via `useDashboardData.ts`). 
* It fetches Profile, Journals, Tasks, and Workbook answers utilizing `staleTime` caching.
* The Gamification engine safely evaluates active streaks and "Clean Time" within this window using strictly unencrypted metadata (tags, status, createdAt), completely bypassing AES-GCM decryption on the initial render.

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
""",

    "docs-site/support/changelog.md": r"""# 🚀 Changelog

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing. This drastically reduces initial load times and prevents memory exhaustion for long-term users with thousands of entries.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback. The vault now gracefully handles corrupted `ArrayBuffer` payloads and invalid keys without locking the UI thread.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`) and resolved strict TypeScript type-checking (`verbatimModuleSyntax`) errors across the data fetching layer to ensure bulletproof CI/CD pipelines.
"""
}

def sync_post_sprint():
    print("Initiating MRT Post-Cycle Sync...")
    for filepath, content in files_to_update.items():
        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Inject the Markdown FENCE variable safely
        safe_content = content.replace('___FENCE___', FENCE)
        
        # Write the full file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(safe_content)
        print(f"✅ Successfully synchronized: {filepath}")
    
    print("\nSync Complete. Architecture, UI, and Project Boards are aligned.")

if __name__ == "__main__":
    sync_post_sprint()