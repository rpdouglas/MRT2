# docs/reports/

One-off analysis and audit reports — architecture reviews, security/scalability audits, readiness checks, gap analyses. Unlike `docs/projects/`, these aren't tracked by a status field; a report is either current or it's archived.

## Naming

`YYYY-MM_topic.md` where the report is a point-in-time audit worth dating; a bare `topic.md` is fine for a narrowly-scoped one-off (e.g. a single-page gap analysis) where the date adds no information. Markdown only — see the one documented exception below.

## When a report gets archived

Move it to `docs/reports/archive/` once **every finding it raised is either shipped (cite the `PROJ-ID` that closed it) or the report itself has been superseded** by a newer report covering the same ground. This is a manual, human-approved move, not automatic — see the `governance` skill's Check J, which flags candidates but never moves files itself.

A report that still has open, cited action items (e.g. it's referenced from `docs/ACTIVE_CYCLE.md`'s open Chores) stays in the main folder even if it's old.

## The non-markdown exception

`DailyCrossword.jsx` and `DailyCrosswordClassic.jsx` are **design-reference mockups**, not reports — executable React used as a build-from spec instead of a Figma file, in the same spirit as an ADR's code sample. They're intentionally kept here because `src/components/games/crossword/DailyCrossword.tsx` and its tests cite them by this exact path in code comments. Don't move or archive a `.jsx`/`.tsx` file found here without first checking `grep -rn "docs/reports/<file>" src/` for a live citation like this — the crossword mockups aren't misplaced, and neither is any future case that follows the same pattern.

Any other non-markdown file showing up here (a rendered `.html` duplicate of a `.md`, a stray component with no citation) is a real misfile — relocate or delete it, don't archive it.
