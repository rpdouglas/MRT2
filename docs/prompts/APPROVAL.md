# ✅ Execution Prompt (The Builder v3.2)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The "Safe Delivery" Rule (CRITICAL):**
    * Do **NOT** use Bash `cat << EOF` for generating complex code files (TSX/TS/MD).
    * You **MUST** generate a **Python script** (`scripts/update_feature.py`) to write the files. 
    * **Targeted Patching:** For files longer than 50 lines, do NOT rewrite the entire file in the Python script. Instead, use Python's read/replace logic (e.g., `code.replace(old_block, new_block)`) to surgically patch the specific functions, leaving the rest of the file untouched.
    * **Markdown Protection:** Define `FENCE = chr(96) * 3` at the top of your Python script. Use ``` inside your raw strings where markdown code blocks go. In your write function, use `.replace('```', FENCE)` before saving.

2.  **Anti-Regression Checks:**
    * **Unused Imports:** If you remove a UI element, you MUST remove its import.
    * **Strict Types:** Ensure all new props/functions have defined types. **ABSOLUTELY NO `any` TYPES.** Use `unknown` or generics if necessary. Prefix unused args with `_`.
    * **Icon Library Check:** Verify you are importing from the correct library.

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run check` as required steps.

**Go.**
