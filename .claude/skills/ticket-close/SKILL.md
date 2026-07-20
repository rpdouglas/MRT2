---
name: ticket-close
description: Drift detection and project board sync after completing a ticket or sprint. Checks schema, specs, user guides, and tech debt. Produces sync report.

---

# MRT Ticket Close Protocol

## Drift Checklist

### 0. User-visible classification (PROJ-69)
Before anything else, decide: **did this ticket change anything an end user can see, feel, or experience?** State the answer explicitly in the drift report — don't skip this as implied by the other checks.

**Do not use the ticket's own internal label/category as a proxy for this.** PROJ-69's own retroactive changelog scrub found five entries tagged `(Internal)` that actually described real user-facing fixes (a Dashboard streak bug, a Vitality confirmation toast, a Workbook-page crash, an AI flow hanging indefinitely, and an Android purchase-flow change) — "internal" described the engineering framing, not the user impact. Read what the ticket actually *did*, not what it was filed as.

- **Not user-visible** (pure refactor, tech debt, CI/infra, dependency bump, test coverage) → state this explicitly in the report. Do not pass `--public-note` to `sync_ticket_docs.py`.
- **User-visible** → draft the `--public-note` text inline in the drift report, for review before running the script:
  - Plain language only — no `PROJ-` ID, no file/hook/component/Cloud Function names, no architecture or "why" rationale (that detail belongs in `--summary` and the spec, not here).
  - One sentence per distinct user-facing change; skip anything that's implementation detail even if it was the bulk of the actual work.
- **Hard rule, no exceptions:** a ticket involving a security incident, credential rotation, or vulnerability fix never gets a public changelog note — not even a softened one ("we improved our security posture"). If it has a genuine required end-user action, that's a direct-communication decision, not a changelog entry — flag it to the user rather than drafting one.

If unsure whether something counts as user-visible, err toward drafting a note and asking rather than silently omitting it — the leak guard in `sync_ticket_docs.py` will catch internal detail if the note strays, but nothing catches a missed entry.

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

## Project Board Updates
The mechanical part of this (spec Status field, `ACTIVE_CYCLE.md` Resolved line, `ROADMAP.md` Recently Shipped line, and — only for user-visible tickets per Check 0 — the public changelog entry) is handled by the reusable script — don't hand-generate a one-off script for it:
```
# Internal-only ticket:
python scripts/sync_ticket_docs.py --proj PROJ-XX --summary "One-line internal description of what shipped." --apply

# User-visible ticket — --public-note drafted per Check 0, --version chosen by judgment:
python scripts/sync_ticket_docs.py --proj PROJ-XX --summary "One-line internal description of what shipped." \
    --public-note "Plain-language description for end users." --version 1.9.0 --apply
```
Run it without `--apply` first to preview. `--summary` always feeds the internal record (spec/`ACTIVE_CYCLE`/`ROADMAP`) only; `--public-note` is the *only* thing that reaches `docs-site/support/changelog.md`, and only when passed. The script refuses to run if `--public-note` looks like it contains a ticket ID or file path, but it cannot judge tone or omission — that's Check 0's job.

---

## Output
A structured drift table with one row per check. Use 🔴 NEEDS FIX / 🟡 ADVISORY / ✅ Clean. State exactly which file to edit and what to change for every 🔴 item. Do not mark the ticket closed until all 🔴 items are resolved.