# 🚀 Changelog

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
