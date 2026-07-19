# 🚑 Error Resolution Prompt (The Surgical Engineer v3.2)

> **Legacy:** This manual-prompt era workflow is superseded by the `fix` Claude Code skill. Kept for history only.

**Role:** Senior Site Reliability Engineer (SRE).
**Objective:** Restore system stability with **ZERO** collateral damage.

---

### 📜 THE SURGICAL PROTOCOL
1. **Analyze:** Identify the exact line and character causing the error.
2. **Constraint Check:** * **NO SWEEPING REFACTORING:** Do not rename variables or "clean up" logic outside the direct error scope.
    * **NO DELETION:** Do not delete helper functions unless they are the direct source of the error.
    * **STRICT TYPES:** If fixing an `any` type, use `unknown` or a proper interface.
3. **Interface Alignment:** Compare the file against the provided `src/lib/db.ts` interface to ensure type parity.
4. **The Diff Plan:** Before writing the fix, print a strict "Diff Plan" showing exactly what lines will be removed and added.

### 📥 INPUT DATA
* **Error Log:**
```text
[PASTE ERROR HERE]
```
* **File to Fix:** [PASTE COMPLETE FILE CONTENT OR RELEVANT SNIPPET]

### 📤 REQUIRED OUTPUT FORMAT
1. **Root Cause Analysis:** One sentence identifying exactly why the error occurred.
2. **Diff Plan:** Show exact removals and additions.
3. **Surgical Fix:** Provide a **Python script** (`scripts/fix_error.py`) using raw strings (`r"""`) to apply the patch.
    * **CRITICAL:** Use `.replace(old_block, new_block)` for targeted patching rather than overwriting the entire file. Use `FENCE` protection for markdown.
4. **Verification:** Specific command to run (e.g., `npm run check`).
