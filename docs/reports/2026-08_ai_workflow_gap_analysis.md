# 🤖 AI-Assisted Workflow Gap Analysis

**Date:** 2026-08-31
**Scope:** Every tool and convention MRT uses to let AI agents write code and docs — Claude Code (`.claude/`), Gemini CLI / Antigravity (`GEMINI.md`, `.agents/`), the docs-as-code pipeline (`docs/projects/`, `docs/prompts/`, `scripts/`), and where Firebase/MCP fit in — benchmarked against 2025–2026 external best practice.
**Result:** No critical/security-shaped gaps. Several real drift and inconsistency findings (below), all mechanical to fix. Two larger structural opportunities (AGENTS.md consolidation, Firebase MCP) worth a deliberate decision rather than default-adopting.

This document is self-contained — it assumes no prior context from the session that produced it.

---

## How to use this doc

1. **Phase A is already done** (this session) — four dead scripts removed, `GEMINI.md` drift fixed, one stale reference in `.agents/SUBAGENTS.md` corrected. Documented in §3 for the record.
2. **Phase B/C/D are tracked, not built** — logged in `docs/ROADMAP.md`/`docs/BACKLOG.md` as `NEW`, each needs its own `docs/projects/XX_FEATURE.md` spec before implementation starts, per this repo's own spec-first rule (`CLAUDE.md`).
3. §1 and §2 below are the actual gap analysis (current state vs. best practice). §4 is two corrections to findings this report's own research surfaced but that turned out to be wrong on closer inspection — kept visible deliberately, as a model for not repeating unverified claims.

---

## 1. Cross-tool instruction files (CLAUDE.md / GEMINI.md / AGENTS.md)

**Current state:** Two hand-maintained, independently-edited instruction files — `CLAUDE.md` (Claude Code) and `GEMINI.md` (Gemini CLI/Antigravity) — covering the same ground (stack, ZK boundary, coding standards, personas, deployment) with no automated sync check between them.

**Best practice (2025–2026):**
- Keep the instruction file lean; prune anything the agent already does correctly, and convert deterministic rules into hooks instead of prose. ([Anthropic, Claude Code best practices](https://code.claude.com/docs/en/best-practices))
- **`AGENTS.md` is now the actual cross-tool standard** — formalized August 2025 by OpenAI/Google/Cursor/Sourcegraph/Factory, donated to the Linux Foundation's Agentic AI Foundation in December 2025, adopted by 60,000+ repos and 20+ tools including Claude Code and Antigravity. Google Antigravity reads `AGENTS.md` natively alongside `GEMINI.md` as of IDE 1.20.5. ([Morphllm AGENTS.md guide](https://www.morphllm.com/agents-md-guide); [thepromptshelf.dev](https://thepromptshelf.dev/blog/google-antigravity-agents-md-rules-guide-2026/))
- Recommended drift-prevention pattern: make `AGENTS.md` the single file humans edit, and turn tool-specific files into thin imports (or a CI check that fails on divergence). A March 2026 survey found 70% of engineers now use 2-4 AI coding tools simultaneously, making this table-stakes hygiene rather than a nice-to-have. ([getunblocked.com](https://getunblocked.com/blog/keeping-claude-md-agents-md-cursorrules-in-sync/); [DEV — agent-kit](https://dev.to/hassanzohdy/one-agentsmd-for-every-coding-agent-auto-derive-claudemd-geminimd-copilot-instructions-2053))

**Gap found (confirmed drift, fixed in Phase A):** `GEMINI.md` was missing content present in `CLAUDE.md` that changes agent behavior on the same task:
- The vault-PIN SHA-256 exception (PROJ-65, `computePinHash`/`verifyVaultPin`) — entirely absent. An Antigravity agent had no documented basis for this carve-out.
- The **Icons** section (`@heroicons/react/24/outline|solid`, verify-before-use) — entirely absent.
- The explicit "treat Gemini as an untrusted boundary, sanitize before every call, `ai_logs` stays metadata-only" sanitization rule — folded into the exceptions list in reduced form, losing the explicit prohibition sentence.

**Verdict:** Partial gap, now fixed at the content level (see §3). The *structural* gap — no automated mechanism preventing this from recurring — remains open. **Recommendation (Phase B, tracked):** adopt `AGENTS.md` as the single source of truth, per the pattern above.

---

## 2. Claude Code & Antigravity agent architecture

### 2.1 Skills (`.claude/skills/`)
13 skills, all well-maintained and cross-referenced to real files: `debt-ledger`, `deps-audit`, `design`, `fix`, `zk-audit`, `review`, `ticket-close`, `governance`, `release-scribe`, `integration-react-react-router-6`, `secrets-scan`, `ingest`, `planning`. Most are read-only/analysis skills that only edit on explicit approval — matches best practice ("use a Skill for contextual/procedural knowledge loaded into the same context"). One foreign/vendor skill (`integration-react-react-router-6`, authored by PostHog) is along for the ride from a prior integration — not broken, just worth a periodic check that it's still needed.

**No `.claude/agents/` directory** — no persistent custom subagents on the Claude Code side; this project relies on Skills plus ad-hoc `Agent` tool fan-out (e.g. the three research passes behind this report). That's aligned with best practice: reserve subagents for tasks that need an isolated context window (long review, deep research), not as a default posture — multi-agent runs cost roughly 15x the tokens of single-agent chat and are only worth it when the task is genuinely parallelizable. ([ZenML LLMOps DB](https://www.zenml.io/llmops-database/building-production-multi-agent-research-systems-with-claude))

### 2.2 Hooks & settings (`.claude/settings.json`)
- `PreToolUse` on `Bash` → `secrets-scan.sh` (blocks `git commit` with likely secrets in the staged diff). `PostToolUse` on `Edit|Write` → `eslint --fix` + async `tsc --noEmit` on the touched file. Both real, both working, both narrowly scoped — matches best-practice guidance to keep hooks fast and specific rather than running the full suite on every edit. ([DataCamp, Claude Code hooks](https://www.datacamp.com/tutorial/claude-code-hooks))
- `.claude/settings.local.json` (gitignored, machine-local) has accreted ~100+ one-off Bash allow-list entries over time — noisy but not a real leak (the one Firebase API key value in there is a public client key, non-secret by design per the secrets-scan hook's own comment). Left untouched in Phase A: it's a personal file, and pruning it risks removing permissions the user actually relies on. **Recommendation:** periodic manual review, not automated cleanup.

### 2.3 Antigravity subagents (`.agents/SUBAGENTS.md`)
Describes four subagent roles (`zk-auditor`, `governance-auditor`, `debt-sweeper`, `design-reviewer`) whose system prompts reference `.agents/skills/<name>/SKILL.md`. **Initial research pass flagged these paths as broken/pointing at empty directories — this was wrong, see §4.1.** They resolve correctly via a git-tracked symlink (`.agents/skills -> ../.claude/skills`) to the real, canonical skill files — a genuinely clean piece of engineering (one skills tree, shared by both tools, no duplication).

The one real finding: external research indicates Antigravity's actual subagent mechanism is a **built-in runtime feature** ("Asynchronous Subagents"), not something configured via a hand-authored roles document — meaning `.agents/SUBAGENTS.md`'s `define_subagent`/`invoke_subagent` JSON example may not reflect Antigravity's real current API. ([ai.google.dev — antigravity-agent](https://ai.google.dev/gemini-api/docs/antigravity-agent)) This needs verification against Antigravity's live docs before deciding whether to rewrite or retire the document — **not done in this pass**, flagged as a Phase C follow-up rather than acted on speculatively.

The `zk-auditor` prompt also hardcoded a stale "7 approved exceptions" count (current count has grown twice since). **Fixed in Phase A** by rewording it to point at GEMINI.md's live section instead of a number that will drift again.

### 2.4 MCP (Model Context Protocol)
**No MCP servers configured anywhere in the repo.** Current 2026 consensus is hybrid, not either/or: CLI for local/script-composable operations (which is how this project already uses `firebase`, `git`, `gh` via Bash), MCP for stateful/live-resource integrations — with the caveat that MCP tool definitions carry a permanent context-token cost whether used or not. ([getunblocked.com — MCP vs CLI](https://getunblocked.com/blog/when-to-use-mcp-vs-cli/)) Google now ships an official **Firebase MCP server** plus **"Agent Skills for Firebase"** (Feb 2026), explicitly designed to pair with Claude Code, Antigravity, Cursor, and VS Code Copilot, for live introspection of deployed rules/functions/App Check state. ([firebase.blog](https://firebase.blog/posts/2026/02/ai-agent-skills-for-firebase/)) **Verdict:** real, applicable gap given this is a Firebase-heavy app — but adopting it is a deliberate opt-in decision, not a default (Phase D, tracked).

---

## 3. Docs-as-code pipeline

### 3.1 What exists and works
- **`scripts/check_spec_quality.mjs`** — validates every `docs/projects/XX_*.md` against `00_TEMPLATE.md`, wired into CI (`.github/workflows/deploy.yml` "GATE 3: Spec Quality Check"). Real, enforced, working.
- **`scripts/sync_ticket_docs.py`** — generic, parameterized (`--proj`, `--summary`, `--apply`, dry-run default) mechanism for closing a ticket: flips spec status, updates `ACTIVE_CYCLE.md`/`ROADMAP.md`, optionally the public changelog. This is the *evolved* version of an older pattern (see below) and matches best practice for keeping a spec "living" rather than write-once. ([TrueFoundry, spec-driven development](https://www.truefoundry.com/blog/spec-driven-development-ai-agents))
- **The "MRT Safe Delivery Protocol"** (`docs/prompts/APPROVAL.md`, `TICKET_CLOSE.md`): a deliberate pattern predating Skills — generate a one-off Python script to apply a batch AI-authored edit, run it once, leave it as an audit trail. Both source docs are explicitly marked "Legacy — superseded by the `planning`/`ticket-close` Claude Code skill." Confirmed via grep that `planning` and `ticket-close` have in fact migrated off this pattern.
- **GitHub's Spec Kit** (`/specify → /plan → /tasks`, 90k+ stars) validates the general shape of this project's docs-before-code gate as sound, current practice — "specifications do not serve code, code serves specifications." ([InfoWorld](https://www.infoworld.com/article/4062524/spec-driven-ai-coding-with-githubs-spec-kit.html))

### 3.2 Gaps found
- **`governance/SKILL.md:246` has not migrated off the one-off-script pattern** — it still instructs generating a fresh `scripts/sync_governance.py` on "APPLY ALL," while `ticket-close` moved to the reusable `sync_ticket_docs.py`. Not a bug (it's DRY-run-gated, deliberate, currently working), but an internal inconsistency: one skill graduated to the better pattern, the other didn't. **Recommendation (Phase C):** align `governance` with `ticket-close`'s precedent.
- **`check_spec_quality.mjs` is regex/substring-only, not structural.** Confirmed two specs (`docs/projects/26_THE_BEACON.md`, has no markdown formatting at all; `docs/projects/42_DAILY_READINGS.md`, uses an entirely different header schema than `00_TEMPLATE.md`) still pass the CI gate despite real structural drift, because the checks only look for keyword substrings, not heading structure or order. External best practice is moving toward anchoring specs to source (AST/tree-sitter fingerprinting) for stricter drift detection. ([Fiberplane drift linter](https://fiberplane.com/blog/drift-documentation-linter/)) **Recommendation (Phase C):** tighten validation to at least check section headings match the template's shape.
- **Living docs have no in-file recency signal.** `SYSTEM_OVERVIEW.md` and `SCHEMA_ARCHITECTURE.md` both describe themselves as "living documents" but carry no "last updated" field — recency is only inferable via `git log`. Minor; cheap to fix (Phase C).
- **Four scripts in `scripts/` were genuinely dead** (not part of the deliberate Safe Delivery Protocol above — fully superseded, zero live references): `close_ticket.py` (hardcoded one-off, replaced by `sync_ticket_docs.py`), `apply_code.py` + its generated output `update_feature.py` (a generator-of-a-generator for one historical PROJ-54 component rewrite, superseded per `APPROVAL.md`'s own note), `setup_docs.py` (references `docs/SPRINT_BOARD.md`, which no longer exists — an early bootstrap artifact). **Deleted in Phase A.** `scripts/sync_governance.py` was *not* deleted — it's the expected, working artifact of `governance/SKILL.md`'s current (if not-yet-modernized) design, not debt.

---

## 4. Corrections to this report's own research

Two findings from the initial internal-inventory research pass turned out to be wrong on independent re-verification, before any file was touched on their basis. Recorded here deliberately — a gap-analysis report repeating an unverified claim would be a worse outcome than a shorter report.

### 4.1 `.agents/skills` and `.agents/hooks` are not broken
Initial finding: "`.agents/skills/` and `.agents/hooks/` are empty directories; `.agents/SUBAGENTS.md`'s references to `.agents/skills/governance/SKILL.md` etc. are stale/dead paths." **This was wrong.** `git ls-tree` shows both are git-tracked **symlinks** (`.agents/skills -> ../.claude/skills`, `.agents/hooks -> ../.claude/hooks`) — an `ls` in the sandbox that produced the original finding evidently didn't resolve them. The references in `.agents/SUBAGENTS.md` resolve correctly to the real, canonical skill files. No fix was needed here beyond the stale exception-count wording (§2.3).

### 4.2 `docs/templates/` misplaced-file claim was wrong
Initial finding: "`docs/templates/27_SMART_TOOLS.md` and `31_CRYPTO_SCALING_AUDIT.md` look misplaced — spec-shaped filenames in a templates directory." **This was wrong** — neither file exists. `docs/templates/` contains only `USER_GUIDE.md`. No action taken.

---

## 5. Phased closing plan

### Phase A — done this session (mechanical, no spec needed)
- Deleted `scripts/close_ticket.py`, `scripts/apply_code.py`, `scripts/update_feature.py`, `scripts/setup_docs.py`.
- Restored the vault-PIN exception, Icons section, and AI-sanitization framing to `GEMINI.md`.
- Fixed the stale "7 approved exceptions" count in `.agents/SUBAGENTS.md`'s `zk-auditor` prompt.

### Phase B — AGENTS.md consolidation (tracked, spec required)
Adopt root `AGENTS.md` as the single human-edited source of truth; turn `CLAUDE.md`/`GEMINI.md` into thin imports or add a CI divergence check. Directly closes the drift class found in §1. See `docs/ROADMAP.md`/`docs/BACKLOG.md`.

### Phase C — Spec-quality & tooling-consistency hardening (tracked, spec required)
Structural validation in `check_spec_quality.mjs`; migrate `governance/SKILL.md` off the one-off-script pattern onto `sync_ticket_docs.py`'s precedent; add "last updated" fields to living docs; verify Antigravity's actual current subagent API before deciding `.agents/SUBAGENTS.md`'s fate.

### Phase D — Firebase MCP evaluation (tracked, spec required)
Deliberate opt-in decision on adding the official Firebase MCP server for live rules/functions/App Check introspection, weighed against its permanent context-token cost.
