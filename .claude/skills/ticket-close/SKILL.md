---
name: ticket-close
description: Drift detection and project board sync after completing a ticket or sprint. Checks schema, specs, user guides, and tech debt. Produces sync report.

---

# MRT Ticket Close Protocol

## Drift Checklist
1. Schema drift: does docs/SCHEMA_ARCHITECTURE.md match src/lib/db.ts changes?
2. Spec drift: do docs/specs/ files reflect the new logic as implemented?
3. User guide drift: do docs-site/guide/ files reflect new user-facing behaviour?
4. Feature spec drift: did the implementation deviate from docs/projects/XX_FEATURE.md?
5. Tech debt: any console.log, eslint-disable, or commented-out code left behind?
6. ZK check: any unencrypted writes to secure collections?

## Project Board Updates (state what needs changing, don't generate a script)
- docs/ACTIVE_CYCLE.md: which task to mark [x]?
- docs-site/support/changelog.md: what to add?
- docs/ROADMAP.md: if an Epic is complete, what moves to Shipped?

## Output
A structured drift table. Flag anything that needs fixing before this ticket is considered closed.