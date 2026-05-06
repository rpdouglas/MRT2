---
name: ticket-close
description: Drift detection and project board sync after completing a ticket or sprint. Checks schema, specs, user guides, and tech debt. Produces sync report.

---

# MRT Ticket Close Protocol

## Drift Checklist

### 1. Schema drift
Does `docs/SCHEMA_ARCHITECTURE.md` match every change in `src/lib/db.ts`?
- New collections or subcollections present in Mermaid topology?
- New fields documented with type, encryption status, and purpose?
- `usage_limits` sub-fields listed if changed?

### 2. Spec drift
Do `docs/specs/` files reflect the new logic as implemented? Flag any documented behaviour that the code contradicts.

### 3. User guide drift — READ THE FILES, do not infer
**This check is blocking (🔴 NEEDS FIX), not advisory, when a feature adds new user-facing UI or behaviour.**

Steps:
1. `ls docs-site/guide/` to list all guide pages.
2. Read every guide file that could plausibly cover the feature (journal, dashboard, freemium, account, any new page).
3. For each guide, check:
   - Is the new feature's entry point (CTA, button, page section) documented?
   - Are rate limits, vault-locked states, and offline states explained?
   - Are free-tier vs Premium differences described accurately?
   - Is XP or gamification impact noted if relevant?
4. If any user-facing behaviour introduced by the ticket has no guide coverage, mark it 🔴 NEEDS FIX and state exactly which file needs updating and what to add.
5. If a feature is significant enough to warrant its own guide page (a new module or major workflow), flag that as 🔴 NEEDS FIX too.

### 4. Feature spec drift
Did the implementation deviate from `docs/projects/XX_FEATURE.md`? Note every approved deviation (decisions made during planning that differ from the original spec) so the spec can be updated to match reality.

### 5. Tech debt
Scan all new and modified files for:
- `console.log` (except inside `if (import.meta.env.DEV)` guards)
- `eslint-disable` directives
- `// TODO` or `// FIXME` comments
- Commented-out code blocks

### 6. ZK check
For every Firestore write introduced by the ticket:
- User-generated content in a sensitive collection → confirm `encryptData()` / `encrypt()` is called before the write.
- Plaintext fields in encrypted collections → confirm they are intentional metadata (e.g., scores, timestamps, tags) and documented in `CLAUDE.md`'s ZK boundary table.

---

## Project Board Updates (state what needs changing, don't generate a script)
- `docs/ACTIVE_CYCLE.md`: which task to mark [x]?
- `docs-site/support/changelog.md`: what to prepend?
- `docs/ROADMAP.md`: what moves to Recently Shipped?
- `docs/projects/XX_FEATURE.md`: update Status to ✅ Shipped?

---

## Output
A structured drift table with one row per check. Use 🔴 NEEDS FIX / 🟡 ADVISORY / ✅ Clean. State exactly which file to edit and what to change for every 🔴 item. Do not mark the ticket closed until all 🔴 items are resolved.