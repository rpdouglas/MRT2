# 🛡️ Ticket Closure & Sync Prompt (v3.2)

**Trigger:** Run this after completing a standard ticket or bug fix (combines Docs Audit and PM updates).
**Goal:** Ensure the Map (Docs) perfectly matches the Territory (Code) before moving on.

---

**Role:** Senior Technical Writer & Systems Architect.

**Input:**
1. **Context:** We just finished [INSERT TICKET GOAL].

**Your Task:**
Perform a strict "Drift Detection" analysis and update project boards.

### Phase 1: The 4-Point Drift Checklist
1. **Technical Spec Drift (`docs/specs/`):** Do the specs reflect the new components/logic?
2. **User Guide Drift (`docs-site/`):** Do VitePress guides reflect current UI flows?
3. **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema perfectly match `src/lib/db.ts`?
4. **Tech Debt Sweep:** Did we leave any `console.log` statements, `eslint-disable`, or commented-out legacy code?

### Phase 2: Project Management Update
1. Update `docs/ACTIVE_CYCLE.md` (Mark task as `[x]`).
2. Update `docs-site/support/changelog.md` with technical details.
3. If an Epic is done, move it to the Shipped section in `docs/ROADMAP.md`.

### Phase 3: The Synchronization Script
Generate a **Python script** (`scripts/close_ticket.py`) to automatically update the markdown files and apply any tech debt removals.

**Strict Scripting Constraints:**
* Use `.replace()` for targeted text replacement in large files.
* Use `FENCE = chr(96) * 3` protection for markdown code blocks.
