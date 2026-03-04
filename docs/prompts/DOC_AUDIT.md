# 🔍 Documentation Consistency Audit Prompt (v3.0)

**Trigger:** Run this before closing a major Sprint or Release.
**Goal:** Ensure the "Map" (Docs) perfectly matches the "Territory" (Code).

---

**Role:** Senior Technical Writer & Systems Architect.

**Input:**
1.  **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2.  **Context:** We just finished [INSERT SPRINT GOAL].

**Your Task:**
Perform a strict "Drift Detection" analysis. Cross-reference our documentation sources of truth against the actual living code.

**The 4-Point Checklist:**
1.  **Technical Spec Drift (`docs/specs/`):** Do the specs reflect current React components, logic, and component names?
2.  **User Guide Drift (`docs-site/`):** Do VitePress guides reflect the current UI tabs and features?
3.  **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema match `src/lib/db.ts` perfectly?
4.  **Project Management Drift (`docs/SPRINT_BOARD.md`, `docs/ROADMAP.md`):** Are completed tickets checked off?

**Phase 1: The Audit Report**
Produce a table of discrepancies:
| Document | Code Reference | Discrepancy | Suggested Fix |

**Phase 2: The Synchronization Script**
Generate a **Python script** (`scripts/sync_docs.py`) to automatically update the markdown files. 

**Strict Scripting Constraints:**
* **Full Files Only:** Provide the *entire* content. No summarizing.
* **Markdown Protection (CRITICAL):** Because Markdown files contain code blocks, define `FENCE = "```"` at the top of the Python script. Use `__FENCE__` as a placeholder in your raw Python string. Use `.replace('__FENCE__', FENCE)` during the file-writing block.
