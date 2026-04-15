# 🚀 Changelog

## [v1.0.2] - 2026-04-15
### Fixed & Optimized
- **PWA Cache Collision (PROJ-19):** Shifted the Service Worker update strategy from aggressive auto-updating to a deterministic user prompt (`PWAUpdateBeacon`). This eliminates the "3-to-4 reloads required" bug and protects users from fatal `ChunkLoadError` crashes during active sessions.
- **SRE Stability Patches:** Resolved a strict TypeScript compilation error in the `crypto.ts` fallback logic and purged unused ESLint directives to ensure a perfectly clean CI/CD pipeline.

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing. This drastically reduces initial load times and prevents memory exhaustion for long-term users with thousands of entries.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback. The vault now gracefully handles corrupted `ArrayBuffer` payloads and invalid keys without locking the UI thread.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`) and resolved strict TypeScript type-checking (`verbatimModuleSyntax`) errors.
