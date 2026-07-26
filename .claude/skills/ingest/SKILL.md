---
name: ingest
description: Phase 1 (Ingestion) of the Recursive Build Protocol. Regenerates the llm-export/ codebase chunks and surfaces the master index so a new session (or one after a large refactor) starts from real file structure instead of stale memory. Use at the start of a session tackling unfamiliar or recently-changed code.
---

# MRT Ingestion Protocol

Per `docs/governance/DEVELOPER_GUIDE.md` §Phase 1: force ingestion of actual file structures and rules rather than relying on training data or a stale mental model, at the start of a new session or after a large refactor.

## When invoked, do this

1. Run:
   ```bash
   npm run export:llm
   ```
   This regenerates `llm-export/00-MASTER-INDEX.md` plus the per-area chunk files (`01-root-config-manifest.md`, `02-src-app-entry.md`, `03-src-lib.md`, `04-src-hooks-contexts.md`, and any others the script produces — read the master index to see the current full list, don't assume the chunk names above are exhaustive).
2. Read `llm-export/00-MASTER-INDEX.md` in full.
3. Based on what the session is actually about to work on, read the specific chunk file(s) covering that area (don't read every chunk — the master index exists so you can pick the relevant ones).
4. State back, briefly, what changed since the last ingestion if this isn't the first run this session (new files, moved directories, new hooks/contexts) — this is the signal that Phase 1 caught something a stale mental model would have missed.

## When to skip

Don't re-run this mid-session for a small, targeted fix where the relevant files are already known and already read — Phase 1 exists to catch drift at the *start* of unfamiliar work, not to be re-run before every edit.
