# ✅ Execution Prompt (The Builder v2.1)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The Quoted Heredoc Rule:** When generating bash scripts, **ALWAYS** use `cat << 'EOF'` (with single quotes). This prevents the shell from expanding TypeScript variables like `${id}` which causes build failures.
2.  **Script First:** Generate `install_phase.sh` to create/update files.
3.  **Type Safety:** * No explicit `any`.
    * Use `import type { ... }` for TS definitions.
    * Use `toDate()` helpers for Firestore Date/Timestamp normalization.
4.  **Linting Gate:** Code must pass `no-unused-vars` and `no-explicit-any`.

**Output:**
1.  The Bash Script (`install_phase.sh`).
2.  **Manual Verification:** List `npm run build` and `npm run lint` as required steps.
