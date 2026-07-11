# 🛡️ Master Close & Audit Sync Prompt (v4.4)

> **Legacy:** This manual-prompt era workflow is superseded by the `governance` and `ticket-close` Claude Code skills, which together cover the code/spec/user-guide/board sync this prompt describes. Kept for history only.

**Trigger:** Run this after completing a Ticket OR at the end of a Sprint before a Pull Request.
**Goal:** Ensure the Code, Architecture Specs, User Guides, and Project Boards are in perfect synchronization.

---

**Role:** Lead DevOps Engineer & Principal Technical Writer.

**Input:**
1. **Context:** A brief summary of the ticket(s) or hotfixes just completed.
2. *(Optional)* Codebase dump if required for deep drift detection.

**Your Task:** Execute the following 4 phases in order.

### PHASE 1: Security & Quality Gate (The Code)
Verify the recent work against pre-merge red flags:
* **Zero-Knowledge Check:** Are there any unencrypted writes to secure collections?
* **Type Safety & Linting:** Did we verify `npm run check` passes with zero unused variables or implicit `any`s?
* **Tech Debt Sweep:** Identify any leftover `console.log` statements, disabled ESLint rules, or commented-out legacy code from the recent work.

### PHASE 2: Drift Detection (The Documentation)
1. **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema perfectly match `src/lib/db.ts` payload changes?
2. **Technical Spec Drift (`docs/specs/`):** Do the feature specs accurately reflect the newly injected logic or UX flows?
3. **User Guide Drift (`docs-site/guide/`):** Do the VitePress guides require updates for new user-facing behavior?

### PHASE 3: Project Management Sync
Review the active work boards:
1. **Active Cycle (`docs/ACTIVE_CYCLE.md`):** Mark completed tasks as `[x]`. Move them to "Resolved This Cycle".
2. **Roadmap (`docs/ROADMAP.md`):** If a major feature or Epic is done, promote it to the "Recently Shipped" section.
3. **Changelog (`docs-site/support/changelog.md`):** Draft technical release notes and bump the version number.

### PHASE 4: The Universal Sync Script
*Output Format:* Produce a single table summarizing the drift, followed by a **Python script** (`scripts/sync_cycle_state.py`) that applies any tech debt cleanup and overwrites all drifted markdown files. Use `FENCE = chr(96) * 3` protection.

**Strict Changelog Safety Protocol (CRITICAL):**
When writing the Python script to update the changelog, you MUST NEVER overwrite the entire file. You must preserve all historical data. Use the following `readlines()` and `.insert()` methodology:
1. Open the file in `'r'` mode and call `lines = f.readlines()`.
2. Find the index of the main `# 🚀 Changelog` (or similar `h1`) header.
3. Use `lines.insert(index + 1, new_version_string)` to prepend the new entry safely.
4. Open the file in `'w'` mode and `f.writelines(lines)`.

Finally, output a ready-to-paste `git commit` message summarizing the release.