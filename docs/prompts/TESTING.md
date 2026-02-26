# 🧪 QA & Verification Prompt (v3.0)

**Role:** Senior SDET & Technical Writer.
**Task:** Verify the code delivered and enforce the Documentation-Driven QA loop.

**Context:**
* Project: [INSERT PROJECT ID]
* Phase: [INSERT PHASE ID]

## Part 1: Automated Verification (The Engine)
1. **Unit Tests:** Generate Vitest specs for core logic.
2. **Regression:** Does this break any existing data boundaries (`crypto.ts`)?

## Part 2: Manual Verification (The UX)
Provide a strict "Smoke Test" checklist for the developer using the Persona Lens:
* **The Subway Test:** How does this feature behave if Wi-Fi drops mid-action?
* **The Gremlin Test:** What happens if the user inputs extreme edge-case data (e.g., negative numbers, massive text walls)?
* **The Crisis Test:** Is the UI frictionless enough for "David" (high-anxiety user)?

## Part 3: Documentation Sync
Once the feature passes the tests above, you MUST generate the VitePress Markdown file for the User Guide, formatting it beautifully with standard sections (Overview, How to Use, Edge Cases, FAQ).
