# 🛡️ Master Post-Cycle Audit & Sync Prompt (v4.2)

**Trigger:** Run this at the end of the week before creating a Pull Request to `main`.
**Goal:** Ensure the Code, Architecture Specs, User Guides, and Project Boards are in perfect synchronization.

---

**Role:** Lead DevOps Engineer & Principal Technical Writer.

**Input:**
1. **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2. **Context:** A brief summary of the hotfixes and features completed this cycle.

**Your Task:** Execute the following 4 phases in order.

### PHASE 1: Security & Quality Gate (The Code)
Scan the provided `src/` code for immediate pre-merge red flags:
* **Zero-Knowledge Check:** Are there any unencrypted writes to secure collections?
* **Type Safety:** Are there any explicit `any` types?
* **Tech Debt Sweep:** Scan for leftover `TODO` comments, disabled ESLint rules (`eslint-disable-next-line`), or commented-out legacy code blocks. Flag them for removal.

### PHASE 2: Drift Detection (The Documentation)
1. **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema match the exact payloads?
2. **Technical Spec Drift (`docs/specs/`):** Do the feature specs accurately reflect new logic?
3. **User Guide Drift (`docs-site/guide/`):** Do the VitePress guides reflect current UI flows?

### PHASE 3: Project Management Sync
Review the active work:
1. **Active Cycle (`docs/ACTIVE_CYCLE.md`):** Identify complete tasks. Draft next week's template.
2. **Roadmap (`docs/ROADMAP.md`):** Promote items from NEXT to NOW.
3. **Changelog (`docs-site/support/changelog.md`):** Draft release notes.

### PHASE 4: The Universal Sync Script
*Output Format:* Produce a single table summarizing the drift, followed by a **Python script** (`scripts/sync_cycle_state.py`) that applies the tech debt cleanup and overwrites all drifted markdown files. Use `FENCE` protection.
