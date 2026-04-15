# 🚀 Changelog

## [v1.1.0] - 2026-04-15
### Added
- **Admin Workflow Upgrade:** Introduced a dedicated "Backlog" tier to the Admin Inbox. Feedback and feature requests can now be triaged into a resting state (Backlog) before active development begins (Investigating), keeping the "New" queue clean and actionable.

### Fixed & Optimized (v1.0.2 Hotfixes)
- **TypeScript Strictness:** Resolved optional prop drilling errors in the Admin Dashboard and fortified Firebase `Firestore` instance casting for the ticketing system.
- **PWA Cache Collision (PROJ-19):** Shifted the Service Worker update strategy from aggressive auto-updating to a deterministic user prompt (`PWAUpdateBeacon`). 
- **SRE Stability Patches:** Resolved a strict TypeScript compilation error in the `crypto.ts` fallback logic and purged unused ESLint directives.

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`).
