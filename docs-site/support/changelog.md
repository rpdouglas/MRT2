# 🚀 Changelog

## [v1.8.22] - 2026-07-21
### 🛠️ Update
- Added Recovery Games — a new Games section with your first mini-game, Craving Buster, a short breathing exercise you can reach from the SOS button during an urge. Also added Morning Intent, a guided reflection tool to help you get ahead of today's challenges.

## [v1.8.21] - 2026-07-21
### 🐛 Bug Fixes
- Journal entries created by completing a tool from the Tools Hub (like a Cost Benefit Analysis or Thought Record) now show up in your Journal History as clear, readable summaries instead of raw text data — searching and sharing those entries works correctly too.

## [v1.8.20] - 2026-07-21
### 🛠️ Update
- Recovery Tools are now organized into sections based on when you'd need them — the tools for cravings and crisis are always open right at the top. A new shortcut also lets you jump back into any tool session you didn't finish.

## [v1.8.19] - 2026-07-20
### 🛠️ Bug Fixes
- Fixed a rare issue where a new journal entry could be silently cleared while you were still writing it.
- **Accessibility:** Added screen reader labels to the task-complete checkbox and the add-task button on the Tasks page.

## [v1.8.18] - 2026-07-19
### ✨ Play Store Pre-Submission Prep
- **Compliance:** Added a new web-accessible account deletion path at myrecoverytoolkit.ca/delete-account — sign in and confirm without needing to open the app first, required by Google Play's Data Safety policy ahead of Play Store submission. Runs the same cryptographic-shredding deletion pipeline as the existing in-app "Danger Zone" flow.
- **Trust:** Added Privacy Policy and Terms of Service links to the Login screen and Profile settings.
- **Mobile Polish:** Disabled browser pull-to-refresh and text-selection highlighting for a more native feel when installed as an app.

## [v1.8.17] - 2026-07-19
### 🛠️ Play Store Compliance
- If you're using the Android app, the in-app "Become a Supporter" purchase flow now links out to a browser to complete checkout, in line with Play Store policy. Existing Supporters can still manage or cancel their subscription from inside the app. No change for web or desktop users.

## [v1.8.15] - 2026-07-16
### 🛠️ AI Insights Reliability
- Fixed an issue where AI analysis (Journal Patterns, Comparative Analysis, ROSC, Workbook) could get stuck on "Consulting the Compass" indefinitely if the request failed, instead of showing a clear error.

## [v1.8.14] - 2026-07-15
### 🛠️ AI Insights Fixes
- Fixed a crash on the Workbook details page triggered by certain AI review results.
- Fixed an issue where a failed AI analysis request could incorrectly use up part of your free-tier usage.

## [v1.8.11] - 2026-07-12
### ✨ Journal Sharing Enhancements
- **Domain Link:** Appended a blank line followed by `myrecoverytoolkit.ca` to the end of the plaintext journal entry share text.
- **Accessibility:** Added a "Share Entry" label to the Journal History share button to improve screen reader accessibility.

## [v1.8.9] - 2026-07-12
### 🛠️ Vitality Improvements
- You'll now see a confirmation when you log a Vitality entry (Movement, Fuel, or Breathwork).

## [v1.8.8] - 2026-07-12
### 🛠️ Bug Fixes
- Fixed the Dashboard streak not updating right away after saving a journal entry.
- Fixed a crash on the Daily Reading button for users without a saved fellowship preference.

## [v1.8.7] - 2026-07-10
### 🛠️ Profile Settings Reliability
- **Autosave:** Profile → General now saves every field automatically as you type or toggle it — no more "Save Changes" button to remember to click, matching how Hero Appearance and Reading preferences already worked.
- **Reset Vault Dialog:** The "Destroy & Reset Vault" confirmation is now a proper in-app dialog (matching the account deletion flow) instead of a plain browser pop-up.
- **Direct Links:** Profile's Security and Data tabs are now real, shareable links instead of hidden behind in-page tab state.
- **Clearer Errors:** Failed data imports now explain what went wrong (bad file, permission issue, connection problem) instead of a generic "check console" message.

## [v1.8.6] - 2026-07-10
### ✨ Journal Template Modality Expansion
- **11 New Templates:** The journal template picker now covers 11 recovery modalities beyond Twelve-Step — CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, and General — for 15 templates total, grouped by modality in the picker.
- **Guided Forms:** The new templates open as a short guided form (one labeled box per prompt) instead of a single free-text block. The original 4 Twelve-Step templates are unchanged.

## [v1.8.5] - 2026-07-08
### 🎨 Sobriety Hero Color Themes
- **Feature:** Added a swatch button to the top-left of the dashboard sobriety hero, letting you pick from 5 color themes (Amber, Sky, Emerald, Violet, Rose). Your choice is saved instantly and reflected in any milestone image you share.
- **Settings:** The same picker is also available permanently under **Profile → General → Hero Appearance**.

## [v1.8.4] - 2026-07-08
### ✨ Journal Polish
- **Lined Paper Journaling:** The Dashboard Check-In modal, main Journal page, and Journal History free-write editor now share the Resentment Burner's lined-notebook-paper look — cream background, ruled lines, and a serif font — for a more tactile writing feel.

## [v1.8.3] - 2026-07-08
### ✨ Workbook Remediation
- **Real Step Content:** Rewrote Steps 2-11 of the 12-Step workbook with genuine, step-specific reflection questions — each with its own unique, literature-grounded context — replacing a templated placeholder that repeated the same three questions across ten steps.
- **Wisdom Tile:** The Dashboard's workbook stat now leads with "Questions Answered: X / Y" instead of a bare percentage, and the completion percentage is computed dynamically instead of a hardcoded guess.

## [v1.8.2] - 2026-05-08
### ✨ Journal Insights UI Redesign
- **Momentum UI:** Refreshed the Journal Insights tab with a new atmospheric, glass-like design and improved dark mode styling.
- **Typography & Charts:** Upgraded fonts, smoothed out chart curves, and simplified the Weekly Rhythm visualization for an easier read.
- **Word Cloud Polish:** Enhanced the word cloud design and empty states to be more compassionate.

## [v1.8.1] - 2026-05-07
### ✨ ROSC Matrix Visual Upgrade
- **Pill Capsules:** Replaced the radar chart with a custom, animated "Pill Capsules" visualization featuring a premium dark theme.
- **Longitudinal Tracking:** Previous month's scores are now subtly "ghosted" behind the current month's active pill segments, providing an instant visual diff of your momentum.

## [v1.8.0] - 2026-05-06
### ✨ The Recovery Capital (ROSC) Matrix
- **Feature:** Monthly self-check-in across SAMHSA's four recovery dimensions — Health, Home, Purpose, and Community — using five strength-based questions and an AI analysis of your last 30 journal entries.
- **Radar Chart:** Scores are visualised as an animated radar chart. When two or more monthly snapshots exist, the chart overlays the current and previous month so you can see the shape of your recovery changing over time.
- **ZK Privacy:** Domain scores (numbers) are readable without vault unlock. The AI narrative, strengths, growth areas, and evidence references are encrypted client-side — the server never sees your AI insights in plaintext.
- **Premium vs Free:** Free tier completes the self-check-in and receives domain scores. Premium adds a full Gemini analysis of your journal history, producing a narrative, identified strengths, and compassionate growth suggestions.
- **Rate Limit:** One assessment per calendar month — consistent with clinical ROSC methodology and designed to prevent compulsive reassessment.

## [v1.7.1] - 2026-05-06
### 🐛 Bug Fixes
- **Recurring Tasks:** Fixed an issue where completing an overdue recurring task would calculate its next due date based on the missed date rather than today, preventing it from properly rolling forward.

## [v1.7.0] - 2026-05-06
### ✨ The Ledger — Precision, Resilience & Tab Redesign
- **Tab Redesign:** Replaced the four-tab layout (This Week / Later / Action Plan / Log) with a three-tab actionability model: **Today** (all overdue + due today), **Later** (due tomorrow or beyond), **Log** (completed history). AI-suggested tasks now route by due date alongside manual tasks — no separate Action Plan tab.
- **Overdue Labels:** Tasks overdue by exactly 1 day display "From yesterday" (amber). Tasks overdue by 2+ days display "Overdue" (amber). No red states, no "missed" or "failed" language.
- **Monthly Precision Fix:** Fixed a calendar drift bug where tasks scheduled on the 31st would permanently shift to the 28th after a February occurrence. Monthly tasks now restore to their original day-of-month after short months (e.g. Jan 31 → Feb 28 → Mar 31).
- **Late-Night Grace Window:** Added a 2-hour trailing grace window around midnight. Completing a recurring habit at 11:45 PM and opening the app after midnight no longer silently breaks your streak.
- **Miss History:** The app now records how many days each habit was missed per evaluation cycle — foundation for future compliance pattern analysis in Insights.

## [v1.6.1] - 2026-05-06
### 📚 User Guide Sync
- Added a new Daily Readings guide covering all 7 modalities, day-of-year rotation, the share feature, and how to journal from a reading.
- Rewrote the Dashboard guide with the Dynamic Anchor widget (time-aware check-in prompts and their exact windows), and documented all three push notification toggles (Check-In, Reading, Intent).
- Expanded Voice-to-Vault in the Journal guide to a full section explaining transcription, auto mood detection, and the encryption step.
- Added a full recurrence schedule table to the Tasks guide (Once, Daily, Weekly, Bi-weekly, Monthly, Monthly-relative) and expanded the Smart Reset section with a Lazy Evaluation explanation and streak penalty table.

## [v1.6.0] - 2026-05-05
### ✨ The Ledger — Frictionless Task Module Upgrade
- **Gesture Interactions:** Swipe right on any task to complete it — a green layer reveals beneath the card and a brief vibration confirms the action. Swipe left to open the "Let today go" Forgiveness Tap sheet, offering a compassionate move-to-tomorrow option with no streak penalty.
- **Quick Capture:** Pull down from the top of the task list to instantly capture a task. Set priority and date in a focused bottom sheet, or tap "More options →" for the full form.
- **Rhythm Score:** A 14-day consistency ring (0–100) now sits above your task list. One missed day out of 14 scores ~93, not 0 — designed to reflect your pattern, not punish imperfection.
- **AI Context Cards:** Tasks generated by the AI Compass now show a one-line explanation of why they were suggested. Tap to expand and follow the "See insight →" deep-link back to the source workbook or journal analysis.

## [v1.5.0] - 2026-05-03
### ✨ Daily Reading Engine Launch
- **Feature:** Full integration of multi-modality Daily Readings (AA, NA, Dharma, SMART).
- **UX:** Finalized the Dynamic Anchor widget with circadian-aware prompts.
- **Privacy:** Daily Readings load instantly without needing your vault unlocked, since they're shared content rather than personal data.

## [v1.4.0] - 2026-04-30
### ✨ Major UX Overhaul
- **Feature:** Launched the Dynamic Anchor (Circadian Companion Widget). Replaced the static daily pledge with a highly responsive, 3-column quick action bar on the dashboard.
- **Adaptive Check-Ins:** The widget now intelligently tracks the time of day (Morning, Afternoon, Evening, Night) and injects specialized CBT journaling prompts directly into a secure, Vault-protected modal.
- **Fellowship Integrations:** Added a built-in dropdown to easily access daily readings across major recovery programs (AA, NA, SMART Recovery, etc.), alongside quick-action intent setting.
- **Granular Control:** Added an "Anchor Notifications" section in Profile settings, allowing users to toggle visual reminder badges on/off dynamically.

## [v1.3.0] - 2026-04-28
### Added
- **Frictionless Onboarding:** Added a "Skip for Now" option to the Vault Setup screen, allowing users in distress to access tools immediately without memorizing a PIN.
- **Security Banners:** Added persistent warnings when the Vault is operating in an unencrypted state.

### Changed
- **Performance:** Improved performance during PIN changes, so encrypting a large amount of data no longer freezes the UI.

## [v1.2.0] - 2026-04-22
### ✨ Landing Page Refresh
- **Feature:** Overhauled the top-of-funnel acquisition flow with a new mobile-first landing page and native Google sign-in.
- **UI Polish:** Scaled and tightened the brand header lockup, replaced external placeholders with offline graphics, and updated marketing copy to target high-intent users.

## [v1.1.10] - 2026-04-20
### ⚖️ Compliance & Resources
- **Lifeline:** Added a progressive-disclosure "Find a Meeting" locator to the SOS Modal for urgent crisis support.
- **Library:** Transformed the Workbooks 'Literature' tab into a comprehensive 'Fellowships' directory with direct links to official websites and core literature (AA, NA, SMART, Recovery Dharma, WFS).
- **Security:** Hardened all outbound links to prevent a browser tab-hijacking technique known as tab-nabbing.

## [v1.1.8] - 2026-04-17
### 🐛 Bug Fixes
- Fixed an issue where quickly tapping an AI analysis button multiple times could trigger duplicate, conflicting requests.

## [v1.1.7] - 2026-04-17
### 🐛 Bug Fixes
- Fixed an issue where push notifications for tasks due "today" weren't being sent, due to a timezone calculation error.
- Improved push notification reliability so tapping a notification more consistently opens the app.

## [v1.1.6] - 2026-04-16
### ✨ Quality of Life Improvements
- Introduced modern, non-blocking toast notifications throughout the app.
- Converting an AI Insight from Journal History or Workbooks into a tracked task now shows an actionable toast, letting you quickly add multiple tasks or jump straight to your Task Ledger.

## [v1.1.5] - 2026-04-16
### ✨ Supporter Subscriptions Launched
- MRT is now fully monetized! You can become a Supporter, with your account automatically upgraded right after checkout — no waiting on manual approval.

## [v1.1.4] - 2026-04-15
### ✨ Shareable Milestone Cards
- Launched shareable milestone cards — your sobriety hero card now automatically includes a short AI-generated insight alongside your stats when you share it.
- **Privacy:** Zero-Knowledge protections are maintained throughout — only high-level thematic insights are shared, never raw journal content.

## [v1.1.3] - 2026-04-15
### ✨ Terminology Update
- Renamed "Users" to "Friends" throughout the app to better reflect peer-to-peer 12-step fellowship traditions.

## [v1.1.2] - 2026-04-15
### 🛠️ UI Polish
- **Brand Visibility:** Scaled up the main MRT navigation logo by ~33% to improve visual hierarchy and accessibility for older devices, and resolved an issue with transparent logo backgrounds causing contrast issues in the sidebar.

## [v1.1.0] - 2026-04-15
### 🛠️ App Update Notifications
- Changed how app updates are applied — instead of silently auto-updating in the background, you'll now see a clear prompt when a new version is ready.

## [v1.0.1] - 2026-04-14
### 🐛 Bug Fixes
- Improved Dashboard loading performance.
- Fixed a rare crash that could happen during PIN rotation or vault decryption.

## [v1.0.0] - 2026-04-01
### ✨ The CBT Engine (SMART Tools)
- Launched the SMART Tools (CBT Engine), including Cost-Benefit Analysis (CBA) and ABC model exercises, fully secured with Zero-Knowledge encryption.
