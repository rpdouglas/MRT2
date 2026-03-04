# ✅ Execution Prompt (The Builder v3.0)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The "Safe Delivery" Rule (CRITICAL):**
    * Do **NOT** use Bash `cat << EOF` for generating complex code files (TSX/TS/MD).
    * You **MUST** generate a **Python script** (`scripts/update_feature.py`) to write the files. 
    * **Markdown Protection:** Define `FENCE = "```"` at the top of your Python script. Use `__FENCE__` inside your raw strings for code blocks. In your write function, use `.replace('__FENCE__', FENCE)` before saving.

2.  **Anti-Regression Checks:**
    * **No Partial Files:** You MUST provide the ENTIRE file content. No `// ... rest of code` placeholders.
    * **Unused Imports:** If you remove a UI element, you MUST remove its import.
    * **Strict Types:** Ensure all new props/functions have defined types. **ABSOLUTELY NO `any` TYPES.** Use `unknown` or generics if necessary.
    * **Icon Library Check:** Verify you are importing from the correct library. (App uses `@heroicons/react/24/outline`, Admin uses `lucide-react`).

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run lint` as required steps.

**Go.**
