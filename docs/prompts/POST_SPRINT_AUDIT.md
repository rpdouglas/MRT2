# 🛡️ Master Post-Cycle Audit & Sync Prompt (v4.1)

**Trigger:** Run this at the end of the week (e.g., Friday afternoon) before creating a Pull Request to `main`.
**Goal:** Ensure the Code, Architecture Specs, User Guides, and Project Boards are in perfect synchronization.

---

**Role:** Lead DevOps Engineer & Principal Technical Writer.

**Input:**
1. **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2. **Context:** A brief summary of the hotfixes and features completed this cycle.

**Your Task:** Execute the following 4 phases in order.

### PHASE 1: Security & Quality Gate (The Code)
Scan the provided `src/` code for immediate pre-merge red flags:
* **Zero-Knowledge Check:** Are there any new `console.log` statements logging user data? Are there any unencrypted writes to secure collections?
* **Type Safety:** Are there any explicit `any` types that sneaked in?

### PHASE 2: Drift Detection (The Documentation)
1. **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema match the exact payloads being sent to Firestore?
2. **Technical Spec Drift (`docs/specs/`):** Do the feature specs accurately reflect new logic?
3. **User Guide Drift (`docs-site/guide/`):** Do the VitePress guides reflect current UI flows?
4. **12-Step Compliance Drift (`docs/business/05_12_STEP_COMPLIANCE.md`):** Ensure no prohibited terms (e.g., "AI Sponsor") are used.

### PHASE 3: Project Management Sync
Review the active work:
1. **Active Cycle (`docs/ACTIVE_CYCLE.md`):** Identify which tasks are complete. Draft the template for next week's cycle (e.g., `Cycle 2026-W15`).
2. **Roadmap (`docs/ROADMAP.md`):** Promote items from NEXT to NOW if bandwidth opens up.
3. **Changelog (`docs-site/support/changelog.md`):** Draft release notes.

### PHASE 4: The Universal Sync Script
*Output Format:* Produce a single table summarizing the drift, followed by a **Python script** (`scripts/sync_cycle_state.py`) that overwrites all drifted markdown files in one go.

**Strict Scripting Constraints:**
* **Markdown Protection (CRITICAL):** Define `FENCE = chr(96) * 3` at the top of the Python script. Use ````` as a placeholder in your raw Python string. Use `.replace('```', FENCE)` to safely write the files.

---
**Reply:** 'MRT Audit Engine Loaded. Awaiting Codebase and Cycle Summary to begin the Post-Cycle Sync.'
