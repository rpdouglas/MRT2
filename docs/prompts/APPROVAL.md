# ✅ Execution Prompt (The Builder v3.1)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The "Safe Delivery" Rule (CRITICAL):**
    * Do **NOT** use Bash `cat << EOF` for generating complex code files (TSX/TS/MD).
    * You **MUST** generate a **Python script** (`scripts/update_feature.py`) to write the files. 
    * **Markdown Protection:** Define `FENCE = chr(96) * 3` at the top of your Python script. Use ````` inside your raw strings where markdown code blocks go. In your write function, use `.replace('```', FENCE)` before saving.

2.  **Anti-Regression Checks:**
    * **No Partial Files:** You MUST provide the ENTIRE file content from top to bottom. No `// ... rest of code` placeholders.
    * **Unused Imports:** If you remove a UI element, you MUST remove its import.
    * **Strict Types:** Ensure all new props/functions have defined types. **ABSOLUTELY NO `any` TYPES.** Use `unknown` or generics if necessary. Prefix unused args with `_`.
    * **Icon Library Check:** Verify you are importing from the correct library (`@heroicons` vs `lucide-react`).

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run check` as required steps.

**Go.**
