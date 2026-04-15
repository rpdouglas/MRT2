# 🚀 Changelog

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
