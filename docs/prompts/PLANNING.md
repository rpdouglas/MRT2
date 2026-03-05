# 📐 Technical Design & Planning Prompt (v3.1)

**Role:** Senior Staff Engineer & Systems Architect.
**Objective:** Provide 3 distinct implementation strategies with a formal recommendation.

---

### PHASE 1: CODEBASE INGESTION & CONTEXT MAPPING
1.  **Ingestion:** Review the provided `src/`, `docs/`, and `docs-site/` directories.
2.  **Dependency Mapping:** Identify existing components, hooks, and lib functions impacted. 
3.  **Interface Audit:** Quote the specific interface from `src/lib/db.ts` that this feature will interact with.

### PHASE 2: STRATEGY PROPOSAL (The Rule of 3)
*Approach A (Minimalist), Approach B (Balanced - Recommended), Approach C (Robust).*

### PHASE 3: TECHNICAL IMPACT ANALYSIS (Mandatory for Recommended)
1.  **Data Schema:** Explicit Firestore field changes. 
2.  **Metadata Persistence Audit:** List every metadata field (e.g., `uid`, `source`) that must be preserved.
3.  **Date Normalization (CRITICAL):** Firestore returns `Timestamp`. UI expects JS `Date`. Explicitly state where `val instanceof Timestamp ? val.toDate() : val` conversions will occur.
4.  **Zero-Knowledge Security Check:** Verify encryption boundary (`src/lib/crypto.ts`). Declare if the data payload requires AES-GCM encryption before writing to Firestore.

---

### 🛡️ PHASE 4: ANTI-REGRESSION PROTOCOL (CRITICAL)
**You must explicitly address these common failures before generating code:**

1.  **The "Unused Variable" Trap:**
    * *Rule:* Delete unused variables. Prefix intentionally unused callback args with `_` (e.g., `_event`).
2.  **The "Implicit Any" Trap:**
    * *Rule:* Use specific interfaces, never `any`. If casting from Firebase, use `as unknown as MyInterface`.
3.  **The "Icon Taxonomy" Trap:**
    * *Rule:* Do not mix icon libraries. `src/pages/AdminDashboard.tsx` and its subcomponents use `lucide-react`. The rest of the app uses `@heroicons/react/24/outline`. Verify your imports.
4.  **The "Safe Delivery" Protocol (CRITICAL):**
    * *Rule:* **DO NOT USE BASH.** You MUST plan to use a Python script. To protect Markdown backticks, you must use the `FENCE = chr(96) * 3` replacement strategy.

---

**Output Format:**
1.  The Analysis (Phases 1-3).
2.  The Anti-Regression Checklist (Phase 4).
3.  **STOP:** Wait for approval.
