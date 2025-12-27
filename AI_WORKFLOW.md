
# 🚀 The Recursive Build Protocol (v1.2)

**Project:** My Recovery Toolkit (MRT)
**Objective:** Maintain high-velocity, error-free feature delivery by enforcing strict context ingestion, architectural planning, and anti-regression coding standards.

---

## 🔁 The Core Loop

The workflow follows a 4-phase cycle. **Do not skip phases.**

1. **Ingestion:** Loading the AI with the current state of reality.
2. **Definition:** Stating the intent and asking for strategy.
3. **Execution:** Authorizing the code generation with strict constraints.
4. **Crystallization:** Updating the Master Guide and Decision Records.

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
**Goal:** Force the AI to think about *Architecture*, *Data Shapes*, and *Risks* before writing code.

**Prompt Template (Feature Kickoff):**

```text
Subject: Feature Kickoff Request - [Feature Name]
Context: [Brief description of what you want to achieve]

Your Instructions:
1. Architectural Analysis (Context First):
   - Review the Master Build Guide and current file structure.
   - Identify which existing components, hooks, or contexts will be impacted.
   - Safety Check: Identify risks (e.g., PWA offline syncing, Auth state, Legacy Data compatibility).

2. Data & Query Analysis:
   - Will this require a new Firebase Query? If using complex filters (where + orderBy), explicitly state if a Composite Index is needed.
   - Are we changing a data model? (e.g., `mood` vs `moodScore`). How will we handle old data that lacks this field?

3. Modernization Scan:
   - Check related code for "Tech Debt" (e.g., loose typing, unused imports).
   - Are there newer React or Firebase patterns we should utilize?

4. Strategy Proposal (The Rule of 3):
   - Option A (Conservative): Quickest implementation, minimal impact.
   - Option B (Refactored/Modern - RECOMMENDED): Best balance of clean code and maintenance.
   - Option C (Robust/Scalable): High-performance/Over-engineered approach.

5. The Recommendation:
   - Select the best option.
   - Explain why it fits our "Production Readiness" standard.

6. STOP AND WAIT:
   - DO NOT generate code yet.
   - Present the analysis and wait for my formal approval.

```

---

## Phase 3: Execution (The Build)

**Trigger:** The AI has presented a plan, and you have chosen an option.
**Goal:** Generate copy-paste safe code that passes Linting/TypeScript checks on the first try.

**Prompt Template (The Approval Validator v2.2):**

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
   - Discriminating Unions: If handling Union types (e.g., `Journal | Workbook`), check the `type` property BEFORE accessing unique fields.
   - Intermediate Casting: If spreading raw DB data into a strict type, cast to `unknown` first (e.g., `as unknown as JournalEntry`) to avoid "insufficient overlap" errors.
   - Icon Verification: Double-check that every Icon component used in JSX is actually imported.
   - React Refresh: If exporting a Provider and Hook in the same file, append `// eslint-disable-next-line react-refresh/only-export-components`.

4. Anti-Regression & Fail-Safe Protocol:
   - Fail-Safe Lists: When mapping over external data (e.g., `snapshot.docs.map`), wrap the logic in a `try/catch` block or return a fallback object so one bad entry does not crash the whole list.
   - Legacy Data Support: Always provide fallbacks for missing fields (e.g., `entry.moodScore || 0`) to support older data.
   - Guard Clauses: Always include `if (!user)` or `if (!db)` guards before Firebase calls.

5. Quality Assurance & Layout:
   - Layout Stability: If using Flexbox with Graphs/Charts (Recharts), apply `min-w-0` to the container to prevent layout collapse.
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
**Goal:** Update the "Source of Truth" and capture "Why" decisions.

**Prompt:**

```text
The feature is now implemented and verified.

1. Master Build Guide Update:
   - Provide the exact text to insert/replace in the current Master Build Guide.
   - Update the "Change Log" table.

2. Architectural Decision Record (ADR):
   - IF this feature involved a significant architectural choice (e.g., choosing a specific library, data structure, or pattern):
   - Generate a short markdown entry titled "ADR-[00X]-[Decision Name]".
   - Context: What was the problem?
   - Decision: What Option did we choose?
   - Consequences: What are the trade-offs?

3. Status:
   - Mark the item as "Done" in the Roadmap table if applicable.

```

```

```