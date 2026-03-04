import os

# The ultimate safe way to generate markdown backticks in a Python script
# without breaking the LLM's output block.
FENCE = chr(96) * 3

# =============================================================================
# 1. INITIALIZATION.md
# =============================================================================
init_content = r'''# 🤖 AI Session Initialization Prompt (v3.1)

**Role:** Principal Software Architect & Product Manager.

**1. Load Technical Context:**
* **Stack:** React 19, Vite, Tailwind v4, Firebase, Gemini 2.5, VitePress (Docs).
* **Security:** Zero-Knowledge (AES-GCM). *Never output user data in plain text.*
* **Reference:** Read `docs/CONTEXT_DUMP.md`.

**2. Core Technical Values (The MRT Standard):**
* **Type Strictness (CRITICAL):** NO `any` types. Use `unknown` and cast via interfaces.
* **Linting strictness:** Prefix intentionally unused arguments with an underscore (e.g., `_index`). Delete all unused imports immediately.
* **Date Safety:** Use JS `Date` for logic/UI and Firestore `Timestamp` for storage. Always normalize using `toDate()` helpers.
* **Safe Delivery Protocol:** Always use Python scripts with `r"""` to generate files. Never use Bash.

**3. Load Project Context:**
* **Reference:** Read `docs/SPRINT_BOARD.md` to see active tasks.
* **Reference:** Read `docs/ROADMAP.md` for high-level goals.

**Your Goal:**
You are executing a specific **Phase** of an active **Project**. Do not deviate from the active Sprint goals or compromise the Technical Core Values.

**Reply:** 'MRT Platform Loaded. Technical guardrails active. Ready for Task.'
'''

# =============================================================================
# 2. PLANNING.md
# =============================================================================
planning_content = r'''# 📐 Technical Design & Planning Prompt (v3.1)

**Role:** Senior Staff Engineer & Systems Architect.
**Objective:** Provide 3 distinct implementation strategies with a formal recommendation.

---

### PHASE 1: CODEBASE INGESTION & CONTEXT MAPPING
1.  **Ingestion:** Review the provided `src/`, `docs/`, and `docs-site/` directories.
2.  **Dependency Mapping:** Identify existing components, hooks, and lib functions impacted. 
3.  **Interface Audit:** Quote the specific interface from `src/lib/db.ts` that this feature will interact with.

### PHASE 2: STRATEGY PROPOSAL (The Rule of 3)
*Approach A (Minimalist), Approach B (Balanced - Recommended), Approach C (Robust).*

### PHASE 3: TECHNICAL IMPACT ANALYSIS (Mandatory for Recommended)
1.  **Data Schema:** Explicit Firestore field changes. 
2.  **Metadata Persistence Audit:** List every metadata field (e.g., `uid`, `source`) that must be preserved.
3.  **Date Normalization (CRITICAL):** Firestore returns `Timestamp`. UI expects JS `Date`. Explicitly state where `val instanceof Timestamp ? val.toDate() : val` conversions will occur.
4.  **Zero-Knowledge Security Check:** Verify encryption boundary (`src/lib/crypto.ts`). Declare if the data payload requires AES-GCM encryption before writing to Firestore.

---

### 🛡️ PHASE 4: ANTI-REGRESSION PROTOCOL (CRITICAL)
**You must explicitly address these common failures before generating code:**

1.  **The "Unused Variable" Trap:**
    * *Rule:* Delete unused variables. Prefix intentionally unused callback args with `_` (e.g., `_event`).
2.  **The "Implicit Any" Trap:**
    * *Rule:* Use specific interfaces, never `any`. If casting from Firebase, use `as unknown as MyInterface`.
3.  **The "Icon Taxonomy" Trap:**
    * *Rule:* Do not mix icon libraries. `src/pages/AdminDashboard.tsx` and its subcomponents use `lucide-react`. The rest of the app uses `@heroicons/react/24/outline`. Verify your imports.
4.  **The "Safe Delivery" Protocol (CRITICAL):**
    * *Rule:* **DO NOT USE BASH.** You MUST plan to use a Python script. To protect Markdown backticks, you must use the `FENCE = chr(96) * 3` replacement strategy.

---

**Output Format:**
1.  The Analysis (Phases 1-3).
2.  The Anti-Regression Checklist (Phase 4).
3.  **STOP:** Wait for approval.
'''

# =============================================================================
# 3. APPROVAL.md
# =============================================================================
approval_content = r'''# ✅ Execution Prompt (The Builder v3.1)

**Instructions:** Execute ONLY after the Plan is approved.

---

**Decision:** I approve the plan. Proceed with **Phase Execution**.

**Strict Constraints (The "Clean Code" Protocol):**

1.  **The "Safe Delivery" Rule (CRITICAL):**
    * Do **NOT** use Bash `cat << EOF` for generating complex code files (TSX/TS/MD).
    * You **MUST** generate a **Python script** (`scripts/update_feature.py`) to write the files. 
    * **Markdown Protection:** Define `FENCE = chr(96) * 3` at the top of your Python script. Use `__FENCE__` inside your raw strings where markdown code blocks go. In your write function, use `.replace('__FENCE__', FENCE)` before saving.

2.  **Anti-Regression Checks:**
    * **No Partial Files:** You MUST provide the ENTIRE file content from top to bottom. No `// ... rest of code` placeholders.
    * **Unused Imports:** If you remove a UI element, you MUST remove its import.
    * **Strict Types:** Ensure all new props/functions have defined types. **ABSOLUTELY NO `any` TYPES.** Use `unknown` or generics if necessary. Prefix unused args with `_`.
    * **Icon Library Check:** Verify you are importing from the correct library (`@heroicons` vs `lucide-react`).

3.  **Deliverable:**
    * The Python Script (`scripts/update_feature.py`).
    * **Manual Verification:** List `npm run build` and `npm run check` as required steps.

**Go.**
'''

# =============================================================================
# 4. FIX.md
# =============================================================================
fix_content = r'''# 🚑 Error Resolution Prompt (The Surgical Engineer v3.1)

**Role:** Senior Site Reliability Engineer (SRE).
**Objective:** Restore system stability with **ZERO** collateral damage.

---

### 📜 THE SURGICAL PROTOCOL
1.  **Analyze:** Identify the exact line and character causing the error (especially strict linting errors like `any` or unused variables).
2.  **Constraint Check:** * **NO SWEEPING REFACTORING:** Do not rename variables or "clean up" logic outside the direct error scope.
    * **NO DELETION:** Do not delete helper functions, comments, or UI sections unless they are the direct source of the error.
    * **STRICT TYPES:** If fixing an `any` type, use `unknown` or a proper interface.
    * **UNUSED VARS:** If a variable is truly unused, remove it. If it's a required callback argument, prefix it with `_` (e.g. `_index`).
3.  **Interface Alignment:** Compare the file against the provided `src/lib/db.ts` interface to ensure type parity.

### 📥 INPUT DATA
* **Error Log:**
__FENCE__text
[PASTE ERROR HERE]
__FENCE__
* **File to Fix:** [PASTE COMPLETE FILE CONTENT]

### 📤 REQUIRED OUTPUT FORMAT
1.  **Root Cause Analysis:** One sentence identifying exactly why the error occurred.
2.  **Integrity Audit:** List what code was **preserved**.
3.  **Surgical Fix:** Provide a **Python script** (`scripts/fix_error.py`) using raw strings (`r"""`) to rewrite the complete file. 
    * **CRITICAL:** Define `FENCE = chr(96) * 3` in Python, use `__FENCE__` in the raw string, and `.replace()` it before writing to protect markdown syntax.
4.  **Verification:** Specific command to run (e.g., `npm run check`).
'''

# =============================================================================
# 5. DOC_AUDIT.md
# =============================================================================
doc_audit_content = r'''# 🔍 Documentation Consistency Audit Prompt (v3.1)

**Trigger:** Run this before closing a major Sprint or Release.
**Goal:** Ensure the "Map" (Docs) perfectly matches the "Territory" (Code).

---

**Role:** Senior Technical Writer & Systems Architect.

**Input:**
1.  **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2.  **Context:** We just finished [INSERT SPRINT GOAL].

**Your Task:**
Perform a strict "Drift Detection" analysis. Cross-reference our documentation sources of truth against the actual living code.

**The 4-Point Checklist:**
1.  **Technical Spec Drift (`docs/specs/`):** Do the specs reflect current React components, logic, and component names?
2.  **User Guide Drift (`docs-site/`):** Do VitePress guides reflect the current UI tabs and features?
3.  **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema match `src/lib/db.ts` perfectly?
4.  **Project Management Drift (`docs/SPRINT_BOARD.md`, `docs/ROADMAP.md`):** Are completed tickets checked off? Have scopes expanded?

**Phase 1: The Audit Report**
Produce a table of discrepancies:
| Document | Code Reference | Discrepancy | Suggested Fix |

**Phase 2: The Synchronization Script**
Generate a **Python script** (`scripts/sync_docs.py`) to automatically update the markdown files. 

**Strict Scripting Constraints:**
* **Full Files Only:** Provide the *entire* content. No summarizing.
* **Markdown Protection (CRITICAL):** Because Markdown files contain code blocks, define `FENCE = chr(96) * 3` at the top of the Python script. Use `__FENCE__` as a placeholder in your raw Python string. Use `.replace('__FENCE__', FENCE)` during the file-writing block.
'''

# =============================================================================
# 6. TESTING.md
# =============================================================================
testing_content = r'''# 🧪 QA & Verification Prompt (v3.1)

**Role:** Senior SDET & Technical Writer.
**Task:** Verify the code delivered and enforce the Documentation-Driven QA loop.

**Context:**
* Project: [INSERT PROJECT ID]
* Phase: [INSERT PHASE ID]

## Part 1: Automated Verification (The Engine)
1. **Unit Tests:** Generate Vitest specs for core logic.
    * **React Query Async Rule (CRITICAL):** If testing an optimistic UI update (`onMutate`), you MUST wrap your assertions in `await waitFor(() => { ... })` to account for the microtask gap. Synchronous checks will fail.
    * **Strict Types:** Do not mock with `as any`. Use `as unknown as MyType`.
2. **Regression:** Does this break any existing data boundaries (`crypto.ts`)?

## Part 2: Manual Verification (The UX)
Provide a strict "Smoke Test" checklist for the developer using the Persona Lens:
* **The Subway Test:** How does this feature behave if Wi-Fi drops mid-action?
* **The Gremlin Test:** What happens if the user inputs extreme edge-case data?
* **The Crisis Test:** Is the UI frictionless enough for "David" (high-anxiety user)?

## Part 3: Documentation Sync
Generate the VitePress Markdown file for the User Guide, formatting it with standard sections (Overview, How to Use, FAQ). Use the Python `FENCE` variable trick to output the markdown safely.
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    
    # We replace the __FENCE__ placeholder with actual backticks for FIX.md which shows an example
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Upgraded Prompt: {path}")

if __name__ == "__main__":
    write_file("docs/prompts/INITIALIZATION.md", init_content)
    write_file("docs/prompts/PLANNING.md", planning_content)
    write_file("docs/prompts/APPROVAL.md", approval_content)
    write_file("docs/prompts/FIX.md", fix_content)
    write_file("docs/prompts/DOC_AUDIT.md", doc_audit_content)
    write_file("docs/prompts/TESTING.md", testing_content)
    print("✨ All Prompts Upgraded to v3.1 (Strict Linting & Python `chr(96)` FENCE protocols active).")