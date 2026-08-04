---
name: governance
description: MRT project governance alignment audit. Reads all docs/ governance files (ROADMAP.md, BACKLOG.md, ACTIVE_CYCLE.md) and all docs/projects/ spec files, then verifies claimed project statuses against the actual source code using targeted evidence checks (routes, hooks, pages, Firestore rules). Produces a structured drift report. Run before sprint planning or after a sprint close.
---

# MRT Governance Alignment Audit

You are performing a governance alignment audit. Your job is to read, cross-reference, and report — not to fix anything. Do not modify any file. Do not generate a Python script. Produce a structured report only.

---

## Step 1: Ingest All Governance Files

Read every file listed below in full. If any file is absent or unreadable, note it as MISSING in your report — do not proceed with incomplete data.

**Governance files (read all four):**
- `docs/ROADMAP.md`
- `docs/BACKLOG.md`
- `docs/ACTIVE_CYCLE.md`
- `docs/SCHEMA_ARCHITECTURE.md`

**Project specs (read every file in the directory):**
- `docs/projects/` — list all files, then read each one in full

**Reference files (read for context — do not audit these):**
- `docs/PERSONAS.md` — used to validate persona assignments
- `docs/CLAUDE.md`, `CLAUDE.md`, or `GEMINI.md` — used to understand current sprint priorities

After reading, confirm: `"Ingested N governance files and M project specs. All files readable."` If anything is missing: `"WARNING: [filename] not found — audit may be incomplete."`

---

## Step 1.5: Targeted Codebase Evidence Gathering

**Do not read source files in full.** Reading the full codebase would consume your context window before the audit begins. Instead, run the four narrow evidence checks below for every project in the governance files that claims a status of `🟢 Done`, `🟡 Active / Queued`, or `[x] COMPLETED`.

For projects with status `⚪ Planned`, `⏸️ Paused`, or `⛔ Blocked`, skip the codebase checks — they are not expected to have shipped code.

### The Four Evidence Checks (run for each active/done project)

**Evidence 1 — Route existence**
```bash
grep -r "PROJ-[ID]\|[ProjectName]\|[expected-route-path]" src/App.tsx src/router* 2>/dev/null | head -5
```
A project claiming `🟢 Done` should have its primary route registered. If no route is found, that is a `BUILT_CLAIM_UNVERIFIED` flag.

**Evidence 2 — Hook existence**
```bash
ls src/hooks/ | grep -i [projectKeyword]
```
Most MRT features have a dedicated hook (e.g., `useTaskOperations`, `useServiceFriends`). If a Done project has no hook, note it — some features use existing hooks, so this is a soft signal not a hard violation.

**Evidence 3 — Page/component existence**
```bash
ls src/pages/ src/components/ | grep -i [projectKeyword]
```
A shipped feature should have a page component or a named component directory.

**Evidence 4 — Firestore rules coverage**
```bash
grep -i "[collectionName]" firestore.rules | head -5
```
If the project spec defines a new Firestore collection, that collection should appear in `firestore.rules`. A collection in the spec but absent from the rules is a security gap — flag it regardless of project status.

### Evidence Result Classification

For each active/done project, record one of:

| Result | Meaning |
|---|---|
| `✅ VERIFIED` | At least 2 of 4 evidence checks passed — code exists matching the spec |
| `⚠️ PARTIAL` | 1 of 4 checks passed — code may be incomplete or under different naming |
| `❌ UNVERIFIED` | 0 of 4 checks passed — project claims Done/Active but no matching code found |
| `⏭️ SKIPPED` | Project is Planned/Paused/Blocked — codebase check not applicable |

Record these results in the Project Registry (Step 2) under a `Code Evidence` column. Do not make assumptions about missing code — only report what the filesystem confirms.

---

## Step 2: Build the Project Registry

From everything you have read and verified, construct an internal registry of every project that appears *anywhere* in the governance system. For each project, record:

```
Project ID | Name | Status in ROADMAP | Status in ACTIVE_CYCLE | Spec file exists? | Spec status field | Wave | Persona | Code Evidence
```

A project may appear in multiple places with conflicting data — record all versions. This is the source of truth for Step 3.

---

## Step 3: Run the Alignment Checks

For each check category below, identify every violation. A violation is any inconsistency between two or more governance files. Report violations even if they seem minor — alignment is binary.

### Check A — Status Consistency
For every project in the registry:
- Does the status in `ROADMAP.md` match the status in `ACTIVE_CYCLE.md`?
- Does the status in either governance file match the `**Status:**` field in the project's spec file?
- Known status values: `⚪ Planned`, `🟡 Active / Queued`, `🟢 Done`, `⏸️ Paused`, `⛔ Blocked`, `[x] COMPLETED`

Flag every project where these three sources disagree.

### Check B — Orphan Projects
- **Orphan in ROADMAP:** A project ID or name appears in `ROADMAP.md` but has no corresponding file in `docs/projects/`.
- **Orphan spec file:** A file exists in `docs/projects/` but the project ID/name does not appear in `ROADMAP.md`, `ACTIVE_CYCLE.md`, or `BACKLOG.md`.
- **Orphan in ACTIVE_CYCLE:** A project is in the active cycle but not in `ROADMAP.md`.

### Check C — Persona Mismatches
- Every project in `ROADMAP.md` is tagged with a Persona column.
- Every project spec has a `**Primary Persona:**` or `**Personas Involved:**` field.
- Does the persona in the ROADMAP row match the persona in the spec?
- Validate persona names against `docs/PERSONAS.md` — only `David`, `Ned`, `Lisa`, `Walt`, `Maya`, `Jordan`, and `All` are valid for user-facing specs. For internal/infrastructure specs, also accept the 4 named stakeholders from `docs/governance/INTERNAL_PERSONAS.md` (`Alex`, `Dev / AI Partner`, `Morgan`, `Taylor`) plus a generic `Internal` fallback when no single stakeholder fits. Flag any persona name that is not in one of these two sets.

### Check D — Completed Projects Not Archived
- Any project with status `🟢 Done` or `[x] COMPLETED` should appear in the `✅ RECENTLY SHIPPED` section of `ROADMAP.md`.
- Flag any project that is marked done/completed in its spec or ACTIVE_CYCLE but is absent from RECENTLY SHIPPED.

### Check E — Active Cycle vs Roadmap Wave Alignment
- Projects in `ACTIVE_CYCLE.md` should be in the Roadmap Wave that corresponds to the current sprint.
- Flag any project in the active cycle that belongs to a later Wave than the current sprint suggests (i.e., Wave 3 or 4 work appearing in Wave 1/2 sprints without explanation).

### Check F — Spec File Quality
For every spec file in `docs/projects/`:
- Does it have a `**Status:**` field?
- Does it have a `**Primary Persona:**` or `**Personas Involved:**` field?
- Does it have an `**Objective:**` field?
- Does it have at least one implementation section (any of: Phase 1, Schema, Architecture, or Implementation)?
- Does it have a QA / Verification section?

Flag any spec file that is missing required fields. Note: `00_TEMPLATE.md` is exempt from this check.

### Check G — Backlog Completeness
- Every item in `BACKLOG.md` should have a status note (`Deferred`, `Planned`, project ID, etc.).
- Flag any backlog item with no status indicator.
- Flag any backlog item that references a project ID that has already shipped (status: Done) — it should be removed from the backlog.

### Check H — Blocked Items
- Any item marked `⛔ Blocked` in any governance file should have a stated blocker reason.
- Flag blocked items with no stated reason.
- Flag blocked items where the stated blocker reason references an external dependency — note these as needing a manual check (e.g., "waiting on DUNS number" — is this resolved?).

### Check I — Code Reality vs Governance Claims
Using the evidence results from Step 1.5, cross-reference against governance status:

- **False Done:** Any project with `Code Evidence = ❌ UNVERIFIED` but governance status of `🟢 Done` or `[x] COMPLETED`. The governance files claim it is shipped but no code was found. This is the most important check.
- **Undocumented shipping:** Any project with `Code Evidence = ✅ VERIFIED` but governance status of `⚪ Planned` or `⏸️ Paused`. Code exists but the governance files think it hasn't been built yet.
- **Security gap:** Any project spec that defines a Firestore collection that does not appear in `firestore.rules`. Flag regardless of project status — an unprotected collection is a live security issue.
- **Partial builds:** Any project with `Code Evidence = ⚠️ PARTIAL` and governance status of `🟢 Done`. The code evidence suggests the project may be incomplete despite being marked finished.

### Check J — Stale Reports & Archive Pointer Hygiene
Read every file in `docs/reports/` (main tree, not `archive/`) and every file in `docs/projects/archive/`.
- **Archivable report:** A `docs/reports/*.md` file where every finding it raised is now cited as shipped by a `docs/projects/*.md` spec's `**Source:**`/`**Status:**` line, or where a newer report in the same folder explicitly supersedes it (e.g. says it "cross-references and updates" the older one). Flag it as an archive candidate — do not move it yourself.
- **Missing pointer:** A file in `docs/projects/archive/` with no `> Superseded by ...` (or equivalent) pointer line at the top, and no citation anywhere in `docs/projects/` or `docs/reports/` explaining why it was archived rather than left in place with `Status: ✅ Shipped` like every other done spec.
- **Misfiled non-markdown:** A non-`.md` file in `docs/reports/` (main tree) that is not cited by path from anywhere in `src/` (`grep -rn "docs/reports/<file>" src/`). Per `docs/reports/README.md`'s documented exception, a `.jsx`/`.tsx` design-reference mockup cited from a shipped component's comments is *not* a violation — only flag files with no such citation.
- **Stale citation:** Any doc that cites a `docs/reports/<file>` path where `<file>` no longer exists at that path (e.g. it was archived but the citing doc wasn't updated) — a broken pointer, not just an archive candidate.

## Step 4: Produce the Report

Output the full report in the following structure. Do not summarise violations — list every one individually.

---

### 📋 MRT Governance Alignment Report
**Audit date:** [today's date]
**Files read:** [list all files, confirm count]

---

### 🔴 Critical Misalignments (Fix before next sprint)

List every violation from Checks A, B, D, and I here. These affect sprint planning accuracy and — in the case of Check I security gaps — are live issues.

For each violation:
```
[PROJ-ID or File] | Check [A/B/D/I] | [Violation description]
Example: PROJ-05 | Check A | ROADMAP shows ⏸️ Paused, ACTIVE_CYCLE shows 🟡 Active, spec shows ⚪ Planned — three-way mismatch.
Example: PROJ-24 | Check I | Governance status 🟢 Done but 0/4 code evidence checks passed — no matching routes, hooks, or pages found.
Example: PROJ-05 | Check I | Spec defines 'service' Firestore collection but collection is absent from firestore.rules — security gap.
```

---

### 🟡 Medium Issues (Fix this sprint)

List every violation from Checks C, E, and H here.

---

### 🔵 Quality Issues (Fix when touching the file)

List every violation from Checks F, G, and J here — except a Check J **stale citation** finding (a broken `docs/reports/<file>` path pointer), which goes in Critical instead, since a broken pointer misleads whoever follows it next.

---

### ✅ Clean Items

List every project that passed all applicable checks with no violations. Include the Code Evidence result for each.

```
[PROJ-ID] | [Name] | All governance checks: PASS | Code evidence: [VERIFIED/SKIPPED]
```

---

### 📊 Summary Table

| Check | Violations Found | Clean |
|---|---|---|
| A — Status Consistency | N | N |
| B — Orphan Projects | N | N |
| C — Persona Mismatches | N | N |
| D — Completed Not Archived | N | N |
| E — Wave Alignment | N | N |
| F — Spec Quality | N | N |
| G — Backlog Completeness | N | N |
| H — Blocked Items | N | N |
| I — Code vs Governance | N | N |
| J — Stale Reports & Archive Pointers | N | N |
| **Total** | **N** | **N** |

---

### 🛠️ Recommended Fix Order

List the top 5 highest-priority fixes in the order they should be applied, with a one-line action for each. Format each as:

```
1. [File to edit] → [Specific change needed]
```

Do not generate Python scripts. Do not make the changes. This report is the output.

---

## Step 5: Confirm and Wait

End the report with:

```
GOVERNANCE AUDIT COMPLETE.
[N] violations found across [N] files.
Ready to apply fixes — instruct me which items to update, or type APPLY ALL to fix every violation in order.
```

If the user types `APPLY ALL` or specifies items to fix, generate a single Python script (`scripts/sync_governance.py`) using the standard MRT Safe Delivery Protocol:
- `DRY_RUN = True` at the top
- `FENCE = chr(96) * 3` for markdown protection
- Targeted `.replace(old, new)` patches only — no full file rewrites
- Confirm dry run output with user before setting `DRY_RUN = False`