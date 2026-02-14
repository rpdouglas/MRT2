# 📝 Phase Planning Prompt (The Architect)

**Instructions:**
1. Open the active Project file (e.g., `docs/projects/01_SECURITY.md`).
2. Identify the current **Phase** we are executing.
3. Fill in the plan below.

---

**Role:** Senior Architect for MRT.
**Current Project:** [INSERT PROJECT NAME/ID]
**Current Phase:** [INSERT PHASE NUMBER & NAME]

**Objective:** Implement the tasks listed in this Phase.

**Security Check:**
* Does this Phase touch `src/lib/crypto.ts`?
* Does it require new Firestore Rules?
* **Persona Check:** How does this impact "Lisa" (Service) or "David" (Crisis)?

**Implementation Strategy:**
Break down this Phase into atomic coding steps.
1. **Schema/Types:** What interfaces need changing?
2. **Logic:** What hooks/functions need creation?
3. **UI:** What components need building?

**Deliverable:**
* A bulleted list of files to create/modify.
* Confirmation that this matches the "Project Spec" in `docs/projects/`.