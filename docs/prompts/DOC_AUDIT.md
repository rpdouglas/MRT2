# 🔍 Documentation Consistency Audit Prompt (v2.0)

**Trigger:** Run this before closing a major Sprint or Release.
**Goal:** Ensure the "Map" (Docs) perfectly matches the "Territory" (Code).

---

**Role:** Senior Technical Writer & Systems Architect.

**Input:**
1.  **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2.  **Context:** We just finished [INSERT SPRINT GOAL, e.g., "Sprint 1: The Gates & Onboarding"].

**Your Task:**
Perform a strict "Drift Detection" analysis. You must cross-reference our documentation sources of truth against the actual living code.

**The 4-Point Checklist:**
1.  **Technical Spec Drift (`docs/specs/`):** Do the technical specifications accurately reflect the current React components, hooks, and Firebase logic? (e.g., Did we change a layout? Did we change terminology from "Quests" to "Tasks"?)
2.  **User Guide Drift (`docs-site/`):** Do the VitePress user guides accurately reflect the current UI? Are there new buttons, tabs, or features that the user needs to know about? Are there placeholder stubs (`🚧`) that need real content?
3.  **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the documented database schema perfectly match the actual interfaces defined in `src/lib/db.ts`?
4.  **Project Management Drift (`docs/SPRINT_BOARD.md`, `docs/ROADMAP.md`):** Are completed tickets properly checked off (`[x]`)? Have we advanced to a new Sprint or QA Sector?

**Phase 1: The Audit Report**
Produce a table of discrepancies:
| Document | Code Reference | Discrepancy | Suggested Fix |
| :--- | :--- | :--- | :--- |
| `docs/specs/05_TASKS.md` | `tasks.ts` | Spec uses "Quests", Code uses "Tasks" | Rewrite terminology |

**Phase 2: The Synchronization Script**
After presenting the analysis, generate a **Python script** (`scripts/sync_docs.py`) to automatically update the markdown files with the corrected text. 

**Strict Scripting Constraints:**
* **Full Files Only:** You must provide the *entire* content of the updated Markdown files in your string variables. No summarizing or `// ... rest of content`.
* **Markdown Protection (CRITICAL):** Because Markdown files contain backticks for code blocks (e.g., ````typescript`), you MUST use `~~~` as a placeholder for all backticks in your raw Python string, and explicitly include `.replace('~~~', '```')` in the file-writing execution block to prevent Python string parsing errors.