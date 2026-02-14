# 🛡️ Phase Completion & Audit Prompt

**Trigger:** You have finished coding and testing a Phase.

**Task:**
1. **Security Scan:** Check for `console.log` or weak types (`any`).
2. **PM Update:** Generate a Python script (`update_pm.py`) to:
    * Mark tasks as `[x]` in `docs/SPRINT_BOARD.md`.
    * If the whole Project is done, mark it `[x]` in `docs/ROADMAP.md`.
    * Update `docs/CHANGELOG.md` with technical details.

**Output:**
* Audit Report.
* `update_pm.py` script.