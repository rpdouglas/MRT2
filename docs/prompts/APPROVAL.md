# ✅ Execution Prompt (The Builder v5.0 - The Mandatory Cat Gate)

> **Legacy:** This manual-prompt era workflow is superseded by the `planning` Claude Code skill, whose approval gate covers this same "wait for explicit APPROVED" step. Kept for history only.

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

### 🛑 THE MANDATORY CAT GATE (CRITICAL)
Before you generate any Python scripts to modify existing files, you MUST verify you have the exact, current code for those specific files.
* **If you are modifying an existing file:** You MUST STOP and ask me to `cat` the file and paste it into the chat. 
* **Do NOT** rely on bulk workspace dumps or previous memory. 
* **Reply exactly with:** "I need the exact current contents of `[filename]` before I can safely patch it. Please paste it below."

### THE "CLEAN CODE" PROTOCOL (Execute only after Cat Gate is passed)

1.  **The "Safe Delivery" Rule:**
    * You **MUST** generate a **Python script** (`scripts/update_feature.py`) to write the files. 
    * **Full File Overwrite:** You must provide the **ENTIRE, COMPLETE file content** within your Python script, perfectly merged with the code I just pasted.
    * **Markdown Protection:** Define `FENCE = chr(96) * 3` at the top of your Python script. Use ``` inside your raw strings where markdown code blocks go. In your write function, use `.replace('```', FENCE)` before saving.

2.  **Anti-Regression Checks:**
    * **Unused Imports:** If you remove a UI element, you MUST remove its import.
    * **Strict Types:** Ensure all new props/functions have defined types. **ABSOLUTELY NO `any` TYPES.** Use `unknown` or generics if necessary. 
    * **Icon Library Check:** Verify you are importing from the correct library (`@heroicons/react/24/outline` vs `solid`).

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run check` as required steps.

**Go.**
