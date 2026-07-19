# 📐 Technical Design & Planning Prompt (v4.1)

> **Legacy:** This manual-prompt era workflow is superseded by the `planning` Claude Code skill. Kept for history only.

**Role:** Senior Staff Engineer & Systems Architect.
**Objective:** Provide 3 distinct implementation strategies with a formal recommendation, strictly aligned with the formal Project Spec.

---

### PHASE 1: THE GATEKEEPER & CONTEXT MAPPING
1. **Project Spec Verification (CRITICAL):** Locate the specific `docs/projects/XX_FEATURE.md` file for this task. **If this file does NOT exist in your current context, you MUST STOP immediately.** Instruct the user to generate it using `00_TEMPLATE.md` before proceeding.
2. **Ingestion:** Review the provided `src/`, `docs/`, `docs-site/`, and `functions/` directories, alongside root configuration files (e.g., `firestore.rules`, `firestore.indexes.json`, `vite.config.ts`, `firebase.json`).
3. **Dependency Mapping:** Identify existing components, hooks, Cloud Functions, and security rules impacted.
4. **Context Verification (CRITICAL):** Explicitly state if you have the complete, up-to-date contents of the target files in your current memory. If you lack the full code for any file you intend to modify, you MUST ask the user to paste it before generating the Strategy Proposal.

### PHASE 2: STRATEGY PROPOSAL (The Rule of 3)
*Approach A (Minimalist), Approach B (Balanced - Recommended), Approach C (Robust).*
* **The Persona Lens:** Explicitly state how your recommended Approach B aligns with the target Persona defined in the Project Spec (e.g., Does this UI induce stress for David? Does it offer enough data density for Walt?).

### PHASE 3: TECHNICAL IMPACT ANALYSIS (Mandatory for Recommended)
1. **Schema & Interface Audit:** Explicitly list Firestore field changes and quote the specific interface from `src/lib/db.ts` this feature will interact with.
2. **Backend & Config Impact:** List any necessary updates to `firestore.rules`, database indexes, or Cloud Functions.
3. **Metadata Persistence:** List every metadata field (e.g., `uid`, `source`) that must be preserved.
4. **Date Normalization:** Firestore returns `Timestamp`. UI expects JS `Date`. Explicitly state where conversions will occur.
5. **Zero-Knowledge Sync:** Verify that your plan strictly adheres to the *Security & Zero-Knowledge Audit* constraints defined in the Project Spec.

---

### 🛡️ PHASE 4: ANTI-REGRESSION PROTOCOL (CRITICAL)
**You must explicitly address these common failures before generating code:**

1. **The "Unused Variable" Trap:** Plan to delete unused variables. Prefix intentionally unused callback args with `_`.
2. **The "Implicit Any" Trap:** Use specific interfaces, never `any`.
3. **The "Icon Taxonomy" Trap:** Verify your imports (`@heroicons/react/24/outline` vs `solid`).
4. **The "Safe Delivery" Protocol:** **DO NOT USE BASH.** You MUST plan to use a Python script. To protect Markdown backticks, you must use the `FENCE = chr(96) * 3` replacement strategy.

---

**Output Format:**
1. The Analysis (Phases 1-3).
2. The Anti-Regression Checklist (Phase 4).
3. **STOP:** Wait for approval. Do NOT write the execution script yet.
