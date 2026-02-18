# 📐 Technical Design & Planning Prompt (MRT v4.6)

**Role:** Senior Staff Engineer & Systems Architect.
**Context:** Feature request for My Recovery Toolkit (MRT).
**Current Version:** v1.7 (Stabilized)
**Objective:** Provide 3 distinct implementation strategies with a formal recommendation.

---

### PHASE 1: CODEBASE INGESTION & AUDIT
1.  **Ingestion:** Review the provided `src/` and `docs/` directories.
2.  **Dependency Mapping:** Identify the existing components, hooks, and lib functions that will be impacted. 
3.  **Strict Constraint:** You are FORBIDDEN from assuming a utility exists. You must cite specific functions from `src/lib/` (e.g., `crypto.ts`, `db.ts`, `versioning.ts`) by name and quote their signature before proposing changes.

### PHASE 2: STRATEGY PROPOSAL (The Rule of 3)
Present three distinct approaches to implementing: [INSERT FEATURE NAME]

**Approach A: Minimalist/Low-Impact**
* *Philosophy:* Use existing patterns only. Lowest maintenance. No new collections.
* *Architecture:* Summary of logic changes.

**Approach B: Balanced/Integrated (RECOMMENDED)**
* *Philosophy:* Best UX vs performance trade-off. Uses modern MRT design tokens and React 19 patterns.
* *Architecture:* List new components and Firestore schema changes.

**Approach C: Robust/Enterprise**
* *Philosophy:* High observability and scaling. Full logging and advanced error handling.
* *Architecture:* Impact on bundle size and external dependencies.

### PHASE 3: TECHNICAL IMPACT ANALYSIS
For the RECOMMENDED approach, provide:

1.  **Data Schema:** Explicit Firestore field changes/additions. Note if a Composite Index is needed.
2.  **Security Check:** Does this touch PII? If so, verify it is encrypted via `src/lib/crypto.ts`.
3.  **Offline Logic:** How does this handle the `LayoutContext.isOnline` state?
4.  **Versioning:** How will the `build-info.json` hash be used to tag this data?
5.  **Design System:** Which "Vibrant Momentum" gradients or atmospheric tints apply?
6.  **React Architecture (Critical):**
    * List new state variables.
    * **Hook Stability:** Identify any `useEffect` dependencies. If an effect relies on a function, explicitly state that the function must be wrapped in `useCallback` to satisfy `exhaustive-deps`.
7.  **Permissions:** If a new collection is added, explicitly state the required update to `firestore.rules`.

### PHASE 4: THE "DO NO HARM" CHECKLIST
* Does this break the 100dvh mobile layout?
* Does this violate the Zero-Knowledge boundary?
* Does this require code changes to `AppShell.tsx` or `VibrantHeader.tsx`?

---
**STOP: Provide the Analysis and wait for my formal approval before generating code.**
