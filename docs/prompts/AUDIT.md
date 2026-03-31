# 🛡️ Phase Completion & Audit Prompt

**Trigger:** You have finished coding and testing a task or hotfix.

**Task:**
1. **Security Scan:** Check for `console.log` or weak types (`any`).
2. **PM Update:** Generate a Python script (`update_pm.py`) to:
    * Mark tasks as `[x]` in `docs/ACTIVE_CYCLE.md`.
    * If a whole Epic is done, move it to the Shipped section in `docs/ROADMAP.md`.
    * Update `docs/CHANGELOG.md` with technical details.

**Output:**
* Audit Report.
* `update_pm.py` script.
