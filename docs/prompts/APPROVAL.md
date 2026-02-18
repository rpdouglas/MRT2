# ✅ Execution Prompt (The Builder)

**Instructions:**
Use after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **Script First:** Generate `install_phase.sh` to create/update files safely.
2.  **Bash Safety:** When generating the script, **ALWAYS** use quoted heredocs (e.g., `cat << 'EOF'`) for writing React/TSX files. Never use unquoted `EOF`, as it breaks variables like `${variable}` in the generated code.
3.  **Governance:** Do NOT build features belonging to a future Phase. Stick to *this* Phase.
4.  **Safety:** If modifying `deploy.yaml` or `crypto.ts`, add a rollback verification step.

**Linting & Quality Pre-Check:**
* **No Unused Imports:** Double-check that every imported Icon or Hook is actually used in the JSX.
* **Hook Stability:** If a function is in a `useEffect` dependency array, it **MUST** be wrapped in `useCallback`.
* **Strict Types:** Use `ReturnType<typeof setInterval>` instead of `NodeJS.Timeout`.
* **No Implicit Any:** Ensure all map/reduce operations have typed arguments.

**Output:**
1.  The Bash Script (`install_phase.sh`).
2.  **Manual Verification:** List specific checks to ensure the Phase is complete.
