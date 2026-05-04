# Comprehensive Codebase & Documentation Audit

**Objective:** Achieve a deep, structural understanding of the MRT (My Recovery Toolkit) codebase and perform a gap analysis against the user-facing documentation to ensure feature parity, accuracy, and completeness.

**Phase 1: Deep Codebase Ingestion & Architectural Mapping**
1. **Analyze Core Architecture:** 
   - Trace the lifecycle of the application starting from `src/main.tsx` and `src/App.tsx`.
   - Understand the `AppShell` layout, protected routing (`PrivateRoute`), and the offline-first TanStack Query configuration.
   - Deeply inspect the `VaultGate` and the encryption boundary (`src/lib/crypto.ts`) to understand how zero-knowledge AES-GCM encryption is enforced before data hits Firestore.
2. **Feature & Module Breakdown:**
   - Map out all major features (e.g., Journaling, Workbooks, Tasks/Habits, Vitality/Mood, Insights, and Gamification).
   - Identify how each feature is connected: Trace UI components (`src/components/`) to their respective hooks (`src/hooks/`), contexts (`src/contexts/`), and backend data models.
   - Catalog all interactive elements, modals, forms, and specific user flows (especially crisis/urge interventions designed for the "David" persona).
3. **Database & Services:**
   - Review Firestore schemas, indexes, and Cloud Functions (`functions/`) to understand data persistence and background jobs (like the daily cron).

**Phase 2: Documentation Comparison**
1. **Review User-Facing Docs:** 
   - Read through all markdown files in the `/docs-site/` directory (e.g., Getting Started, Dashboard, Journaling, CBT Tools, etc.).
2. **Cross-Reference:** 
   - Compare the documented features, UI descriptions, and workflows against the actual implementation discovered in Phase 1.
   - Verify that encryption promises, offline capabilities, and specific tools (like the Dynamic Anchor or Urge Intervention) are accurately represented to the user.

**Phase 3: Gap Analysis & Reporting (Action Required)**
1. **Synthesize Findings:** 
   - Generate a structured report highlighting areas where the codebase has outpaced the documentation (undocumented features, outdated screenshots/descriptions) or where the documentation promises functionality that does not exist or works differently.
2. **Actionable Recommendations:** 
   - Provide a prioritized list of suggested updates for the `/docs-site/` files.
   - *CRITICAL:* Do NOT make any changes to the documentation or codebase yet. Present the gap analysis and wait for explicit approval on which updates to apply.
