This is a fantastic idea. We have essentially built a **"Recursive Intelligence Pipeline"**—a self-correcting system where the output of one cycle reinforces the quality of the next.

Documenting this transforms it from a "habit" into a **Standard Operating Procedure (SOP)**. This allows you to scale, bring in other developers, or simply maintain high velocity without mental fatigue.

Here is the **AI-Assisted Development Workflow Standard (v1.0)** for the "My Recovery Toolkit" project.

---

# 🚀 The Recursive Build Protocol (v1.0)

**Project:** My Recovery Toolkit (MRT)
**Objective:** Maintain high-velocity, error-free feature delivery by enforcing strict context ingestion, architectural planning, and anti-regression coding standards.

---

## 🔁 The Core Loop

The workflow follows a 4-phase cycle. **Do not skip phases.**

1. **Ingestion:** Loading the AI with the current state of reality.
2. **Definition:** Stating the intent and asking for strategy.
3. **Execution:** Authorizing the code generation with strict constraints.
4. **Crystallization:** Updating the Master Guide to reflect the new reality.

---

## Phase 1: Ingestion (Start of Session)

**Trigger:** Start of a new chat or after a massive code change.
**Goal:** Ensure the AI creates code based on the *actual* file structure, not its training memory.

**Action:** Upload `Master Build Guide v3.3.docx` and a full text dump of the codebase.

**Prompt:**

```text
I am providing the updated Master Build Guide (v3.3) and a complete source code dump.

The Goal:
1. Internalize Architecture: Ingest the current file structure, contexts (Auth, Layout, Encryption), and libraries.
2. Code Verification: Review the source code against the Master Guide to ensure the implementation matches the documentation.
3. Readiness Check: Confirm strict typing and safety guards are present.

Please confirm you have processed both the guide and the code, and provide a high-level summary of the "Source-to-Doc" integrity before we begin the next feature build.

```

---

## Phase 2: Definition (The Strategy)

**Trigger:** You want to build a new feature or refactor an existing one.
**Goal:** Force the AI to think about *Architecture* and *Risks* before writing a single line of code.

**Prompt Template (Feature Kickoff):**

```text
Subject: Feature Kickoff Request - [Feature Name]
Context: [Brief description of what you want to achieve]

Your Instructions:
1. Architectural Analysis (Context First):
   - Review the Master Build Guide and current file structure.
   - Identify which existing components, hooks, or contexts will be impacted.
   - Safety Check: Identify risks (e.g., PWA offline syncing, Firebase rules, Auth state).

2. Modernization Scan:
   - Check related code for "Tech Debt" (e.g., loose typing, unused imports).
   - Are there newer React or Firebase patterns we should utilize?

3. Strategy Proposal (The Rule of 3):
   - Option A (Conservative): Quickest implementation, minimal impact.
   - Option B (Refactored/Modern - RECOMMENDED): Best balance of clean code and maintenance.
   - Option C (Robust/Scalable): High-performance/Over-engineered approach.

4. The Recommendation:
   - Select the best option.
   - Explain why it fits our "Production Readiness" standard.

5. STOP AND WAIT:
   - DO NOT generate code yet.
   - Present the analysis and wait for my formal approval.

```

---

## Phase 3: Execution (The Build)

**Trigger:** The AI has presented a plan, and you have chosen an option.
**Goal:** Generate copy-paste safe code that passes Linting/TypeScript checks on the first try.

**Prompt Template (The Approval Validator v2.1):**

```text
I formally approve the recommended approach. Please proceed with implementing the approved changes.

Instructions for Code Generation:

1. Alignment & Strategy:
   - Briefly restate the core objective to confirm alignment.

2. Full File Output (CRITICAL):
   - No Snippets: Provide the entire content of every modified file from top to bottom.
   - No Placeholders: Do NOT use "// ... rest of code" or "// ... imports".
   - Context: I need the complete, copy-pasteable file state.

3. Strict TypeScript & Linting Compliance (Zero-Tolerance):
   - Type-Only Imports: You MUST use `import type { ... }` for interfaces/types (Fixes verbatimModuleSyntax).
   - No Explicit 'any': Do NOT use `any`. Use `unknown`, generics, or specific interfaces.
   - Return Types: Ensure `useEffect` cleanups return `void` or `undefined`. Ensure `setInterval` is typed as `ReturnType<typeof setInterval>` or `number` (browser context).
   - Icon Verification: Double-check that every Icon component used in JSX is actually imported in the header.
   - React Refresh: If exporting a Provider and Hook in the same file, append `// eslint-disable-next-line react-refresh/only-export-components` above the Hook export.

4. Anti-Regression Protocol:
   - React Hooks: Functions inside `useEffect` dependencies must be wrapped in `useCallback` or defined inside the effect.
   - Guard Clauses: Always include `if (!user)` or `if (!db)` guards before Firebase calls.
   - Integrity Check: Compare against the previous file version to ensure NO existing logic, helper functions, or state variables are accidentally dropped.

5. Quality Assurance:
   - Linting Simulation: Fast-check for conflicts (e.g., Tailwind `sticky` vs `relative` parent).
   - Syntax: Verify that all closing brackets `})` and XML tags are matched.
   - Unused Code: Rigorously remove unused variables and imports.

6. Deliverable:
   - Include the file path/name at the top of each code block.
   - Provide a relevant GitHub commit message at the end.

Please generate the complete updated files now.

```

---

## Phase 4: Crystallization (Documentation)

**Trigger:** The code is implemented and tested.
**Goal:** Update the "Source of Truth" so the next AI session doesn't hallucinate based on old data.

**Prompt:**

```text
The feature is now implemented and verified.

Please generate an update entry for the "Master Build Guide v3.3".
1. Identify which section (Architecture, Features, or Backlog) needs updating.
2. Provide the exact text to insert/replace.
3. Update the "Change Log" table with today's date and a summary of the [Feature Name] release.
4. Mark the item as "Done" in the Roadmap table if applicable.

```

---

## ⚙️ The Meta-Process: Updating the Workflow

How do we improve these prompts when things go wrong? This is the **Root Cause Analysis (RCA)** loop.

**When a Build Fails (Lint Error / Bug / Hallucination):**

1. **Isolate the Error:** Copy the exact error message (e.g., `Error: 'SparklesIcon' is not defined`).
2. **Identify the Category:**
* *Import Error?* -> Update "Strict TypeScript" section in Phase 3.
* *Logic Error?* -> Update "Anti-Regression" section in Phase 3.
* *Styling Conflict?* -> Update "Quality Assurance" section in Phase 3.


3. **Patch the Prompt:** Edit the **Approval Validator** prompt immediately.
* *Example:* If we keep forgetting to export types, add a line: "Ensure all interfaces are exported."


4. **Version Up:** Change the prompt version (v2.1 -> v2.2) and save it to your notes.

### Example Scenario:

**Error:** The AI generated a file that cut off halfway through.
**Action:** Update Phase 3 Prompt -> Section 2 (Full File Output) -> Add: *"Check token limits. If the file is too long, stop and ask to continue, do not truncate."*
