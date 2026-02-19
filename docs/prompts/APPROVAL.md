# ✅ Execution Prompt (The Builder v2.5)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The "Safe Delivery" Rule (CRITICAL):**
    * Do **NOT** use Bash `cat << EOF` for generating complex code files (TSX/TS).
    * You **MUST** generate a **Python script** (e.g., `scripts/update_feature.py`) to write the files. Python handles template literals (\`${}`) and backticks correctly; Bash does not.

2.  **Anti-Regression Checks:**
    * **Unused Imports:** If you remove a UI element (like a button), you MUST remove its corresponding import (e.g., icons).
    * **Implicit Any:** Ensure all new props have defined types (no `any`).

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run lint` as required steps.

**Go.**
