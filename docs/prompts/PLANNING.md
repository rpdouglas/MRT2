# 📐 Technical Design & Planning Prompt (MRT v5.0)

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
2.  **Interface Parity Check:** Compare proposed Component Props against `db.ts`. 
3.  **Metadata Persistence Audit:** List every metadata field (e.g., `uid`, `source`) that must be preserved.
4.  **Date Normalization:** You MUST use the `toDate()` helper pattern for all Timestamps.
5.  **Security Check:** Verify encryption boundary (`src/lib/crypto.ts`).
6.  **React Architecture:** List new state/hooks. Ensure `useEffect` dependencies are stable.

---

### 🛡️ PHASE 4: ANTI-REGRESSION PROTOCOL (CRITICAL)
**You must explicitly address these common failures before generating code:**

1.  **The "Unused Variable" Trap:**
    * *Check:* Do I declare variables (like `workbook` or `loading`) that are never used in the JSX?
    * *Rule:* Delete them. Do not prefix with `_` unless absolutely necessary for signature matching.
2.  **The "Implicit Any" Trap:**
    * *Check:* Are there any function parameters missing types?
    * *Rule:* Use specific interfaces (e.g., `WorkbookSection`), never `any`.
3.  **The "Heredoc" Trap (Safe Delivery):**
    * *Check:* Does the code contain backticks (\`) or template literals (`${}`) or complex quoting?
    * *Rule:* **DO NOT USE BASH.** You MUST generate a **Python script** (`scripts/update_feature.py`) to write the files. Python handles string escaping reliably; Bash does not.

---

**Output Format:**
1.  The Analysis (Phases 1-3).
2.  The Anti-Regression Checklist (Phase 4).
3.  **STOP:** Wait for approval.
4.  (Upon Approval): Provide the **Python Execution Script**.
