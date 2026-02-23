# 🔍 Documentation Consistency Audit Prompt

**Trigger:** Run this before closing a major Sprint or Release.
**Goal:** Ensure the "Map" (Docs) matches the "Territory" (Code).

---

**Role:** Senior Technical Writer & Systems Architect.

**Input:**
1.  **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2.  **Context:** We just finished [INSERT SPRINT GOAL, e.g., "Stabilizing Gamification"].

**Your Task:**
Perform a "Drift Detection" analysis. Compare every Specification file in `docs/specs/` and User Guide file in `docs-site/` against its corresponding React Component/Hook in `src/`.

**The Checklist:**
1.  **Logic Drift:** Does the spec/guide describe logic (e.g., "Daily reset") that was changed in the code (e.g., "Lazy evaluation")?
2.  **Schema Drift:** Does the spec list Firestore fields that were renamed or removed?
3.  **Missing Features:** Does the code contain new buttons/features (e.g., "Export PDF") not mentioned in the spec/guide?
4.  **Stale Roadmaps:** Is `docs/ROADMAP.md` showing completed features as "Planned"?

**Output Format:**
Produce a table of discrepancies:
| Document | Code Reference | Discrepancy | Suggested Fix |
| :--- | :--- | :--- | :--- |
| `05_TASKS.md` | `tasks.ts` | Spec says "Cron Job", Code uses "Lazy Eval" | Rewrite Section 2 of Spec |

**Verification:**
After the analysis, generate a **Python script** (`scripts/sync_docs.py`) using `r"""` raw strings to automatically update the markdown files with the corrected text. Remember to use the ````` placeholder for backticks in Markdown strings!
