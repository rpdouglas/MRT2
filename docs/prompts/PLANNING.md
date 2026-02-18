# 📐 Technical Design & Planning Prompt (MRT v4.8)

**Role:** Senior Staff Engineer & Systems Architect.
**Objective:** Provide 3 distinct implementation strategies with a formal recommendation.

---

### PHASE 1: CODEBASE INGESTION & AUDIT
1.  **Ingestion:** Review the provided `src/` and `docs/` directories.
2.  **Dependency Mapping:** Identify existing components, hooks, and lib functions impacted. 
3.  **Interface Audit:** Quote the specific interface from `src/lib/db.ts` that this feature will interact with.

### PHASE 2: STRATEGY PROPOSAL (The Rule of 3)
*Approach A (Minimalist), Approach B (Balanced - Recommended), Approach C (Robust).*

### PHASE 3: TECHNICAL IMPACT ANALYSIS (Mandatory for Recommended)
1.  **Data Schema:** Explicit Firestore field changes. 
2.  **Interface Parity Check:** Compare proposed Component Props against `db.ts`. Verify if fields are `optional (?)` or `nullable`.
3.  **Metadata Persistence Audit (CRITICAL):** List every metadata field (e.g., `uid`, `source`, `isEncrypted`, `category`) that must be preserved. Ensure secondary components (Wizards/Modals) are explicitly planned to pass these fields.
4.  **Date Normalization Standard:** You MUST use the `toDate()` helper pattern. Explicitly state if you are using `Date` (UI) or `Timestamp` (DB) and where the conversion happens.
5.  **Security Check:** Verify encryption boundary (`src/lib/crypto.ts`).
6.  **React Architecture:** * List new state/hooks. 
    * **Hook Stability:** Ensure functions in `useEffect` are wrapped in `useCallback`.
7.  **Linting:** Prohibit `any`. Use `unknown` or specific interfaces.

---
**STOP: Provide the Analysis and wait for formal approval before generating code.**
