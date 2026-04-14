# 🚀 Changelog

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing. This drastically reduces initial load times and prevents memory exhaustion for long-term users with thousands of entries.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback. The vault now gracefully handles corrupted `ArrayBuffer` payloads and invalid keys without locking the UI thread.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`) and resolved strict TypeScript type-checking (`verbatimModuleSyntax`) errors across the data fetching layer to ensure bulletproof CI/CD pipelines.
