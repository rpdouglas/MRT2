# 🚀 Changelog

## [v1.8.14] - 2026-07-15
### 🛠️ Secure AI Insights Cloud Functions Alignment (Internal)
- **Security & Reliability [PROJ-54]:** Removed the client-side `VITE_GEMINI_API_KEY` presence check, enabling the PWA client to securely invoke the Firebase Cloud Function proxy directly without exposing secrets. Added `VITE_USE_MOCK_AI` environment variable configuration for local development/offline fallbacks.
- **Data Schemas [PROJ-54]:** Aligned the Cloud Function prompt structure for workbook reviews to output the expected `pillars` (understanding, emotional_resonance, blind_spots) and `suggested_actions` fields, resolving a critical JSON schema mismatch that was crashing the Workbook details page.
- **Rate Limiting [PROJ-54]:** Purged redundant client-side `stampUsage` writes from the Journal Analysis wizard to prevent free users from being locked out if an AI call fails, and corrected the ROSC assessment rate limiting on the server to check and update `lastROSCAssessment` instead of `lastDeepDive`.

## [v1.8.13] - 2026-07-12
### 🛠️ Automated Mobile Screenshot Generator (Internal)
- **Developer Experience [PROJ-63]:** Implemented a zero-manual-effort Playwright automation script (`npm run screenshots:generate`) to capture key app pages in mobile view. Bypassed Firebase Auth and the ZK encryption boundary client-side using type-safe mock personas (Ned, Maya, David, Walt) and duck-typed offline stores. Added WebP asset optimization and output direct to docs-site.

## [v1.8.12] - 2026-07-12
### 🛠️ Tech Debt Quick Wins (Internal)
- **Security [PROJ-62]:** Tightened Firestore rules so `ai_logs`, `client_errors`, and `feedback` writes must match the authenticated user's ID, closing a gap where any signed-in user could write a log entry under an arbitrary `uid`. No user-facing behavior changed.
- **Architecture [PROJ-62]:** Extracted the Tasks page's live data feed into a dedicated hook, removed a leftover debug log, hardened a CI secret-handling step, and fixed the last four `any`-typed inference gaps flagged in the codebase deep review — two of which turned out to be masking real (harmless in practice) type bugs. No user-facing behavior changed.

## [v1.8.11] - 2026-07-12
### ✨ Journal Sharing Enhancements
- **Domain Link:** Appended a blank line followed by `myrecoverytoolkit.ca` to the end of the plaintext journal entry share text.
- **Accessibility:** Added `title="Share Entry"` to the Journal History share button to improve screen reader accessibility and testability.

## [v1.8.10] - 2026-07-12
### 🛠️ Test Coverage Backfill (Internal)
- **Quality [PROJ-61]:** Added automated test coverage for data export, ROSC check-ins, AI feature rate limiting, and Daily Reading prompt generation — closing the last of the zero-coverage gaps flagged in the codebase deep review. No user-facing behavior changed.

## [v1.8.9] - 2026-07-12
### 🛠️ Vitality & Data Management Architecture Cleanup
- **Security Fix [PROJ-60]:** Vitality entries (Movement, Fuel, Breathwork logs) are now properly encrypted client-side before being saved, closing a gap where they were written unencrypted. A confirmation toast now appears when a Vitality entry is logged.
- **Architecture [PROJ-60]:** Split the Vitality and Profile → Data Management screens into smaller, single-purpose files, isolating account deletion from the lower-risk export/import code so changes to one can't accidentally affect the other. No user-facing behavior changed beyond the fixes above.

## [v1.8.8] - 2026-07-12
### 🛠️ Data Layer Consolidation (Internal)
- **Architecture [PROJ-59]:** Consolidated Firestore access behind TanStack Query across the app — fixed a bug where saving a journal entry didn't refresh the Dashboard streak until next page load, and a crash that could hit the Daily Reading button for users without a saved fellowship preference.

## [v1.8.7] - 2026-07-10
### 🛠️ Profile Settings Reliability
- **Autosave [PROJ-58]:** Profile → General now saves every field automatically as you type or toggle it — no more "Save Changes" button to remember to click, matching how Hero Appearance and Reading preferences already worked.
- **Reset Vault Dialog [PROJ-58]:** The "Destroy & Reset Vault" confirmation is now a proper in-app dialog (matching the account deletion flow) instead of a plain browser pop-up.
- **Direct Links [PROJ-58]:** Profile's Security and Data tabs are now real, shareable links (`/profile/security`, `/profile/data`) instead of hidden behind in-page tab state.
- **Clearer Errors [PROJ-58]:** Failed data imports now explain what went wrong (bad file, permission issue, connection problem) instead of a generic "check console" message.

## [v1.8.6] - 2026-07-10
### ✨ Journal Template Modality Expansion
- **11 New Templates [PROJ-57]:** The journal template picker now covers 11 recovery modalities beyond Twelve-Step — CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, and General — for 15 templates total, grouped by modality in the picker.
- **Guided Forms [PROJ-57]:** The new templates open as a short guided form (one labeled box per prompt) instead of a single free-text block. The original 4 Twelve-Step templates are unchanged.

## [v1.8.5] - 2026-07-08
### 🎨 Sobriety Hero Color Themes
- **Feature [PROJ-56]:** Added a swatch button to the top-left of the dashboard sobriety hero, letting you pick from 5 color themes (Amber, Sky, Emerald, Violet, Rose). Your choice is saved instantly and reflected in any milestone image you share.
- **Settings [PROJ-56]:** The same picker is also available permanently under **Profile → General → Hero Appearance**.

## [v1.8.4] - 2026-07-08
### ✨ Journal Polish
- **Lined Paper Journaling:** The Dashboard Check-In modal, main Journal page, and Journal History free-write editor now share the Resentment Burner's lined-notebook-paper look — cream background, ruled lines, and a serif font — for a more tactile writing feel.

## [v1.8.3] - 2026-07-08
### ✨ Workbook Remediation
- **Real Step Content [PROJ-55]:** Rewrote Steps 2-11 of the 12-Step workbook with genuine, step-specific reflection questions — each with its own unique, literature-grounded context — replacing a templated placeholder that repeated the same three questions across ten steps.
- **Architecture Cleanup [PROJ-55]:** Migrated the Workbook Detail and Session pages, plus auto-save, onto a dedicated TanStack Query hook instead of calling Firestore directly, and fixed a fragile string-based check that decided whether an answer needed decrypting.
- **Wisdom Tile [PROJ-55]:** The Dashboard's workbook stat now leads with "Questions Answered: X / Y" instead of a bare percentage, and the completion percentage is computed dynamically instead of a hardcoded guess.

## [v1.8.2] - 2026-05-08
### ✨ Journal Insights UI Redesign
- **Momentum UI [PROJ-54]:** Refactored the Journal Insights tab to an atmospheric "Glass and Glow" interface using the Walt persona rules. Introduced GlassCard components and dark mode semantic styling.
- **Typography & Charts [PROJ-54]:** Upgraded fonts to JetBrains Mono and DM Sans. Smoothed chart curves, reduced grid lines, and implemented pill-based Weekly Rhythm visualization for lower cognitive load.
- **Word Cloud Polish [PROJ-54]:** Enhanced the word cloud design and empty states to be more compassionate.

## [v1.8.1] - 2026-05-07
### ✨ ROSC Matrix Visual Upgrade
- **Pill Capsules [PROJ-53]:** Replaced the Recharts radar chart with a custom, animated "Pill Capsules" visualization featuring a premium glassmorphic dark theme.
- **Longitudinal Tracking [PROJ-53]:** Previous month's scores are now subtly "ghosted" behind the current month's active pill segments, providing an instant visual diff of your momentum.

## [v1.8.0] - 2026-05-06
### ✨ The Recovery Capital (ROSC) Matrix
- **Feature [PROJ-49]:** Monthly self-check-in across SAMHSA's four recovery dimensions — Health, Home, Purpose, and Community — using five strength-based questions and an AI analysis of your last 30 journal entries.
- **Radar Chart [PROJ-49]:** Scores are visualised as an animated radar chart. When two or more monthly snapshots exist, the chart overlays the current and previous month so you can see the shape of your recovery changing over time.
- **ZK Privacy [PROJ-49]:** Domain scores (numbers) are readable without vault unlock. The AI narrative, strengths, growth areas, and evidence references are encrypted client-side — the server never sees your AI insights in plaintext.
- **Premium vs Free [PROJ-49]:** Free tier completes the self-check-in and receives domain scores. Premium adds a full Gemini analysis of your journal history, producing a narrative, identified strengths, and compassionate growth suggestions.
- **Rate Limit [PROJ-49]:** One assessment per calendar month — consistent with clinical ROSC methodology and designed to prevent compulsive reassessment.

## [v1.7.1] - 2026-05-06
### 🐛 Bug Fixes
- **Recurring Tasks:** Fixed an issue where completing an overdue recurring task would calculate its next due date based on the missed date rather than today, preventing it from properly rolling forward.

## [v1.7.0] - 2026-05-06
### ✨ The Ledger — Precision, Resilience & Tab Redesign
- **Tab Redesign [PROJ-47]:** Replaced the four-tab layout (This Week / Later / Action Plan / Log) with a three-tab actionability model: **Today** (all overdue + due today), **Later** (due tomorrow or beyond), **Log** (completed history). AI-suggested tasks now route by due date alongside manual tasks — no separate Action Plan tab.
- **Overdue Labels [PROJ-47]:** Tasks overdue by exactly 1 day display "From yesterday" (amber). Tasks overdue by 2+ days display "Overdue" (amber). No red states, no "missed" or "failed" language.
- **Monthly Precision Fix [PROJ-47]:** Fixed a calendar drift bug where tasks scheduled on the 31st would permanently shift to the 28th after a February occurrence. Monthly tasks now restore to their original day-of-month after short months (e.g. Jan 31 → Feb 28 → Mar 31).
- **Late-Night Grace Window [PROJ-47]:** Added a 2-hour trailing grace window around midnight. Completing a recurring habit at 11:45 PM and opening the app after midnight no longer silently breaks your streak.
- **Miss History [PROJ-47]:** The app now records how many days each habit was missed per evaluation cycle in a `missedCountHistory` field — foundation for future compliance pattern analysis in Insights.

## [v1.6.1] - 2026-05-06
### 📚 User Guide Sync
- **Docs [PROJ-48]:** Added a new Daily Readings guide covering all 7 modalities, day-of-year rotation, the share feature, and how to journal from a reading.
- **Docs [PROJ-48]:** Rewrote the Dashboard guide with the Dynamic Anchor widget (time-aware check-in prompts and their exact windows), and documented all three push notification toggles (Check-In, Reading, Intent).
- **Docs [PROJ-48]:** Expanded Voice-to-Vault in the Journal guide to a full section explaining transcription, auto mood detection, and the ZK encryption step.
- **Docs [PROJ-48]:** Added a full recurrence schedule table to the Tasks guide (Once, Daily, Weekly, Bi-weekly, Monthly, Monthly-relative) and expanded the Smart Reset section with a Lazy Evaluation explanation and streak penalty table.

## [v1.6.0] - 2026-05-05
### ✨ The Ledger — Frictionless Task Module Upgrade
- **Gesture Interactions [PROJ-46]:** Swipe right on any task to complete it — a green layer reveals beneath the card and a brief vibration confirms the action. Swipe left to open the "Let today go" Forgiveness Tap sheet, offering a compassionate move-to-tomorrow option with no streak penalty.
- **Quick Capture [PROJ-46]:** Pull down from the top of the task list to instantly capture a task. Set priority and date in a focused bottom sheet, or tap "More options →" for the full form.
- **Rhythm Score [PROJ-46]:** A 14-day consistency ring (0–100) now sits above your task list. One missed day out of 14 scores ~93, not 0 — designed to reflect your pattern, not punish imperfection.
- **AI Context Cards [PROJ-46]:** Tasks generated by the AI Compass now show a one-line explanation of why they were suggested. Tap to expand and follow the "See insight →" deep-link back to the source workbook or journal analysis.

## [v1.5.0] - 2026-05-03
### ✨ Daily Reading Engine Launch
- **Feature [PROJ-42]:** Full integration of multi-modality Daily Readings (AA, NA, Dharma, SMART).
- **UX [PROJ-41]:** Finalized the Dynamic Anchor widget with circadian-aware prompts.
- **Privacy:** Confirmed Readings bypass the ZK boundary as shared content to ensure instant access.

## [v1.4.0] - 2026-04-30
### ✨ Major UX & Architecture Overhaul
- **Feature [PROJ-41]:** Launched the Dynamic Anchor (Circadian Companion Widget). Replaced the static daily pledge with a highly responsive, 3-column quick action bar on the dashboard.
- **Adaptive Check-Ins:** The widget now intelligently tracks the time of day (Morning, Afternoon, Evening, Night) and injects specialized CBT journaling prompts directly into a secure, Vault-protected modal.
- **Fellowship Integrations:** Added a built-in headless dropdown to easily access daily readings across major recovery programs (AA, NA, SMART Recovery, etc.), alongside quick-action intent setting.
- **Granular Control:** Added an "Anchor Notifications" section in Profile settings, allowing users to toggle visual reminder badges on/off dynamically.

## [v1.3.1] - 2026-04-30
### Fixed & Optimized (Testing Infrastructure)
- **Feature [PROJ-40]:** Completed a comprehensive Test Suite Audit to secure core logic ahead of the React 19 scaling initiatives.
- **Test Suite Overhaul:** Established a robust Vitest testing pipeline covering core pure functions (milestone calculations, timeline grouping) and strict boundary components (`PremiumGate`). Ensures zero regressions in gamification accuracy and monetization UX.

## [v1.3.0] - 2026-04-28
### Added
- **Frictionless Onboarding:** Added a "Skip for Now" option to the Vault Setup screen, allowing users in distress to access tools immediately without memorizing a PIN (PROJ-39).
- **Security Banners:** Added persistent warnings when the Vault is operating in an unencrypted state.

### Changed
- **Zero-Knowledge Pipeline:** Upgraded the `executePinRotation` system to utilize cursor-based pagination (`limit(50)` + `startAfter`), preventing UI freezes when encrypting large datasets (PROJ-31).
- **Test Suite:** Resolved complex context mocking issues within the Vitest suite (`VaultGate.test.tsx`).


## [v1.2.0] - 2026-04-22
### ✨ Major UX & Architecture Overhaul
- **Feature [PROJ-19]:** Overhauled the top-of-funnel acquisition flow. Deployed the 'Vibrant Momentum' mobile-first landing page with an integrated glassmorphic AuthCard and native Google OAuth context.
- **Feature [PROJ-24]:** Deployed the Asset Engine. Implemented an automated WebP compression pipeline and auto-generated, strictly-typed `ASSETS` dictionary to eliminate 404s and optimize First Contentful Paint (FCP).
- **UI Polish:** Scaled and tightened the brand header lockup, replaced external placeholders with offline SVGs, and updated marketing copy to target high-intent users.

## [v1.1.10] - 2026-04-20
### ⚖️ Compliance & Resources
- **Lifeline:** Added a progressive-disclosure "Find a Meeting" locator to the SOS Modal for urgent crisis support.
- **Library:** Transformed the Workbooks 'Literature' tab into a comprehensive 'Fellowships' directory with direct links to official websites and core literature (AA, NA, SMART, Recovery Dharma, WFS).
- **Security:** Enforced `noopener noreferrer` boundary on all outbound links to prevent tab-nabbing.


## [v1.1.8] - 2026-04-17
### 📊 Admin & SRE (Runway Protection)
- **Feature [PROJ-18]:** Deployed the Command Center Telemetry Dashboard (`/admin/telemetry`). Provides real-time visual analytics of Gemini API token burn and model distribution (Flash vs Pro) utilizing Recharts.
- **SRE Update:** Upgraded the `useRateLimits` hook with an optimistic UI lock to strictly prevent API race conditions from free-tier users spam-clicking analysis actions.


## [v1.1.7] - 2026-04-17
### 🚑 Hotfixes & Infrastructure
- **Bug Fix [PROJ-26]:** Resolved a critical issue in the `dailyBeacon` system where users were not receiving push notifications for tasks due "today" due to a timezone boundary parsing error.
- **System Update:** Upgraded FCM push notification payloads to utilize the modern HTTP v1 `webpush` spec, ensuring notifications reliably launch the PWA dashboard on Android and iOS devices.


## [v1.1.6] - 2026-04-16
### UX/UI Refinements (Quality of Life)
- **Feature [UX]:** Introduced a modern, non-blocking global toast notification system utilizing `sonner`.
- **Workflow Improvement:** Converting an AI Insight from the Journal History or Workbooks into a tracked task now triggers an actionable toast, allowing users to rapidly batch-add tasks or navigate directly to their Task Ledger with a single click.


## [v1.1.5] - 2026-04-16
### Added & Upgraded (Monetization Engine)
- **Feature [BILLING]:** MRT is now fully monetized! Implemented the backend Stripe synchronization pipeline.
- **Infrastructure:** Configured Eventarc and 2nd-gen Cloud Functions to listen for Firebase Stripe Extension events, automatically upgrading users to the `premium` tier and generating secure Firebase Auth JWT custom claims without requiring manual developer intervention.


## [v1.1.4] - 2026-04-15
### Added & Upgraded (Viral Export Engine)
- **Feature (PROJ-32):** Launched the completed Viral Export Engine! The `SobrietyHero` milestone cards now securely query your latest abstract AI insight and inject it into your shareable image alongside your clean-time gamification stats. 
- **Security:** Zero-Knowledge compliance strictly maintained. The export engine automatically buffers the UI to prevent unencrypted DOM flashes and only shares high-level thematic insights, protecting raw journal data.


## [v1.1.3] - 2026-04-15
### Added & Upgraded (The Fellowship Alignment)
- **UX Alignment:** Codebase-wide sweep renaming "Users" to "Friends" in the presentation layer (e.g., `FriendsDirectory.tsx`) to better align with peer-to-peer 12-step fellowship traditions, while safely preserving underlying database architecture.
- **SRE & Prompt Infrastructure:** Upgraded the internal Prompt Engineering ecosystem to v4.2, introducing strict AST/Targeted Patching to prevent context hallucinations and full-file overwrite regressions.
- **Governance Update:** Realigned the Master Plan and Roadmap to target the "Road to 5,000" KPI, specifically prioritizing the Viral Export Engine (PROJ-32) and Play Store TWA deployment (PROJ-07).


## [v1.1.2] - 2026-04-15
### Fixed & Optimized (UI Polish)
- **Brand Visibility:** Scaled up the main MRT navigation logo by ~33% to improve visual hierarchy and accessibility for older devices, and resolved an issue with transparent logo backgrounds causing contrast issues in the sidebar.

## [v1.1.1] - 2026-04-15
### Fixed & Optimized (Hotfix)
- **Admin Inbox Data Pipeline:** Resolved a schema mismatch where the frontend UI expected fields (`description`, `type`) that did not align with the production database (`message`, `category`). This fixed a bug where the inbox appeared empty.
- **Real-Time Synchronization:** Restored the `onSnapshot` Firebase listener in the Admin Inbox, ensuring tickets update instantly across all connected administrative dashboards when statuses (like moving to Backlog) are changed.

## [v1.1.0] - 2026-04-15
### Added
- **Admin Workflow Upgrade:** Introduced a dedicated "Backlog" tier to the Admin Inbox. Feedback and feature requests can now be triaged into a resting state (Backlog) before active development begins (Investigating), keeping the "New" queue clean and actionable.

### Fixed & Optimized
- **TypeScript Strictness:** Fortified Firebase `Firestore` instance casting for the ticketing system.
- **PWA Cache Collision (PROJ-19):** Shifted the Service Worker update strategy from aggressive auto-updating to a deterministic user prompt (`PWAUpdateBeacon`). 
- **SRE Stability Patches:** Resolved a strict TypeScript compilation error in the `crypto.ts` fallback logic and purged unused ESLint directives.

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`).

## [v1.0.0] - 2026-04-01
### ✨ The CBT Engine (SMART Tools)
- **Feature [PROJ-27]:** Launched the SMART Tools (CBT Engine) including Cost Benefit Analysis (CBA) and ABC models, completely refactored into strictly-typed React components and secured by Zero-Knowledge encryption.
