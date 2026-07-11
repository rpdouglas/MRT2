# docs/projects/

One spec file per feature-sized ticket, named `<PROJ-ID>_<FEATURE_NAME>.md`. Start from [`00_TEMPLATE.md`](./00_TEMPLATE.md) — the `planning` skill will refuse to plan a feature without one, and the `governance` skill's Check F validates every file here against the template's required sections (also enforced in CI via `npm run docs:check-specs`).

## What counts as an orphan PROJ-ID

`PROJ-XX` numbers are assigned sequentially and are **not** contiguous — gaps are expected and do not by themselves indicate lost work. A PROJ-ID has no spec file here for one of two reasons:

1. **Too small to warrant a spec** — a one-line bug fix, copy change, or config tweak got a ticket number for tracking but never needed the full template. This is fine.
2. **It should have a spec but doesn't** — a real feature-sized idea that was never formally planned, or a spec that was written elsewhere (`docs/BACKLOG.md`, an ad-hoc note) and never migrated here.

If you're not sure which case an orphan ID falls into, check `docs/BACKLOG.md` and `docs/ROADMAP.md` for context, or run the `governance` skill's Check B (Orphan Projects).

## Superseded specs

When a spec is replaced by a newer one covering the same module (e.g. `docs/specs/03_ADMIN.md` → `08_ADMIN.md`), leave the old file in place with a one-line `> Superseded by ...` pointer at the top rather than deleting it — it's still useful history.

## Shipped/completed specs

Once a project ships, its `**Status:**` field should read `✅ Shipped` / `✅ Completed`, and it should be added to `docs/ROADMAP.md`'s `RECENTLY SHIPPED` section and `docs/ACTIVE_CYCLE.md`'s `Resolved This Cycle` section. `scripts/sync_ticket_docs.py --proj PROJ-XX --summary "..."` automates these three mechanical edits — see the `ticket-close` skill for the rest of the close-out checklist (user guide, tech debt, ZK check) that still needs a human/LLM judgment pass.
