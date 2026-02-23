# ✅ Execution Prompt (The Builder v2.5)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The "Safe Delivery" Rule (CRITICAL):**
    * Do **NOT** use Bash `cat << EOF` for generating complex code files (TSX/TS/MD).
    * You **MUST** generate a **Python script** (`scripts/update_feature.py`) to write the files. 
    * When writing Markdown strings containing backticks (like code blocks or Mermaid diagrams), you MUST use a placeholder like ````` in the raw python string and replace it with backticks via `.replace('```', '```')` before writing the file to prevent parser breaks.

2.  **Anti-Regression Checks:**
    * **Unused Imports:** If you remove a UI element (like a button), you MUST remove its corresponding import (e.g., icons).
    * **Implicit Any:** Ensure all new props have defined types (no `any`).

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run lint` as required steps.

**Go.**
