# ✅ Execution Prompt (The Builder)

**Instructions:**
Use after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints:**
1. **Script First:** Generate `install_phase.sh` to create/update files safely.
2. **Governance:** Do NOT build features belonging to a future Phase. Stick to *this* Phase.
3. **Safety:** If modifying `deploy.yaml` or `crypto.ts`, add a rollback verification step.

**Output:**
1. The Bash Script (`install_phase.sh`).
2. **Manual Verification:** List specific checks to ensure the Phase is complete.