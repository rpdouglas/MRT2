# 🧪 QA & Verification Prompt (v3.1)

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
