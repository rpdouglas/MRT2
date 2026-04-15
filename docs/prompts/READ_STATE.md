# 🧠 Read State & Context Alignment Prompt (v1.0)

**Trigger:** Run this BEFORE starting `PLANNING.md` for a new feature or complex bug.
**Goal:** Verify the AI has a perfectly aligned, hallucination-free mental model of the target files.

---

**Role:** Principal Architect.

**Input:**
1. **Target Area:** [e.g., "The Firebase Auth Pipeline", or "The FeedbackViewer Component"]

**Your Task:**
Do NOT generate any code or plans yet. Instead, provide a "Mental Model Dump" to prove you understand the current state of the codebase.

1. **Schema Check:** Explicitly type out the current TypeScript interfaces associated with this feature (e.g., `UserProfile`, `FeedbackReport`).
2. **Data Flow Check:** Explain step-by-step how data moves from the user input, through local state/React Query, and into Firestore for this specific area.
3. **Dependency Check:** List the exact names of the hooks and context providers (e.g., `useAuth`, `useEncryption`) this feature relies on.
4. **Missing Information:** If you are unsure about ANY file's current implementation, explicitly request that I paste the complete file contents before we proceed to planning.

**Output:**
Provide the Mental Model Dump, ending with either a confirmation of readiness or a request for specific file contents.
