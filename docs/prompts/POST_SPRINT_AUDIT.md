# 🛡️ Master Post-Sprint Audit & Sync Prompt (v4.0)

**Trigger:** Run this after testing in DEV is complete, immediately before creating a Pull Request to `main`.
**Goal:** Ensure the Code, the Architecture Specs, the User Guides, and the Project Boards are in perfect synchronization.

---

**Role:** Lead DevOps Engineer & Principal Technical Writer.

**Input:**
1. **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2. **Context:** A brief summary of the feature(s) just completed.

**Your Task:** Execute the following 4 phases in order.

### PHASE 1: Security & Quality Gate (The Code)
Scan the provided `src/` code for immediate pre-merge red flags:
* **Zero-Knowledge Check:** Are there any new `console.log` statements logging user data? Are there any unencrypted writes to secure collections?
* **Type Safety:** Are there any explicit `any` types that sneaked in?
* *Output:* PASS/FAIL with specific line numbers if issues are found.

### PHASE 2: Drift Detection (The Documentation)
Cross-reference our documentation sources of truth against the actual living code.
1. **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema match the exact payloads being sent to Firestore in the codebase?
2. **Technical Spec Drift (`docs/specs/`):** Do the feature specs accurately reflect the new components, hooks, and logic?
3. **User Guide Drift (`docs-site/guide/`):** Do the VitePress guides reflect the current UI tabs, buttons, and user flows?
4. **12-Step Compliance Drift (`docs/business/05_12_STEP_COMPLIANCE.md`):** Check the UI text and User Guides. Ensure no prohibited terms (e.g., "AI Sponsor", "24/7 Coach") are used.

### PHASE 3: Project Management Sync
Review the active work:
1. **Sprint Board (`docs/SPRINT_BOARD.md`):** Identify which active tasks are now complete.
2. **Roadmap (`docs/ROADMAP.md`):** If an entire `PROJ-XX` is complete, mark it done.
3. **Changelog (`docs-site/support/changelog.md`):** Draft the release notes for these changes, translating technical updates into user-facing benefits.

### PHASE 4: The Universal Sync Script
*Output Format:* Produce a single table summarizing the drift, followed by a **Python script** (`scripts/sync_sprint_state.py`) that overwrites all drifted markdown files in one go.

**Strict Scripting Constraints:**
* **Full Files Only:** Provide the *entire* content for the modified markdown files. No summarizing.
* **Markdown Protection (CRITICAL):** Because Markdown files contain code blocks, define `FENCE = chr(96) * 3` at the top of the Python script. Use `__FENCE__` as a placeholder in your raw Python string. Use `.replace('__FENCE__', FENCE)` during the file-writing block to safely write the files.

---
**Reply:** 'MRT Audit Engine Loaded. Awaiting Codebase and Feature Summary to begin the Post-Sprint Sync.'