---
name: debt-ledger
description: Maintenance Protocol B (bi-weekly Debt Ledger) from the Recursive Build Protocol. Sweeps the codebase for TODO/FIXME/HACK comments, `any` types, eslint-disable directives, and @ts-ignore flags, then logs findings to docs/ACTIVE_CYCLE.md's Chores & Tech Debt section. Run bi-weekly, or on request.
---

# MRT Debt Ledger Sweep

Per `docs/governance/DEVELOPER_GUIDE.md` §Protocol B: eliminate codebase noise, loose types, and stale comments before they accumulate silently. This is a read-and-report skill — it proposes ledger entries, it does not fix the underlying debt itself (that's separate work, scoped and approved individually like any other change).

## Step 1: Scan

Run these across `src/` and `functions/src/` (skip `node_modules`, `dist`, `llm-export`, generated files):

```bash
grep -rn "TODO\|FIXME\|HACK" src/ functions/src/ --include="*.ts" --include="*.tsx"
grep -rn ": any\b\|<any>\|as any\b" src/ functions/src/ --include="*.ts" --include="*.tsx"
grep -rn "eslint-disable" src/ functions/src/ --include="*.ts" --include="*.tsx"
grep -rn "@ts-ignore\|@ts-expect-error" src/ functions/src/ --include="*.ts" --include="*.tsx"
```

Note: CLAUDE.md already bans `any` outright as a CI-failing rule, so any hit here is either (a) genuinely new debt that slipped past review, or (b) a pre-existing suppression from before that rule was enforced. Don't assume either — check `git blame` on a sample if it's ambiguous, since that changes urgency.

## Step 2: Filter noise

- Skip matches inside test fixtures or mock data where a loose type is intentional and low-risk (e.g. `as any` in a test-only helper) — but still log them, just mark lower priority.
- Skip `// eslint-disable-next-line react-refresh/only-export-components` — CLAUDE.md's React Patterns section explicitly sanctions this one for Provider+hook co-exports; it's not debt.
- Group by file so the same file with 5 TODOs is one ledger line, not 5.

## Step 3: Cross-check against existing ledger

Read the current `## 🧹 Chores & Tech Debt` section of `docs/ACTIVE_CYCLE.md` first — don't duplicate an entry that's already tracked there (checked `[x]` or still open `[ ]`).

## Step 4: Propose ledger entries

For each genuinely new item, draft an entry matching the file's existing format:

```
- [ ] **[Short title]:** [what and where, one sentence]. (Source: debt-ledger sweep [date])
```

Present the full proposed addition as a diff against `docs/ACTIVE_CYCLE.md` and wait for approval before editing the file — this is a shared governance doc, not a private scratch file.

## Output

```
### 🧹 Debt Ledger Sweep — [date]

**New findings:** N (M TODO/FIXME/HACK, M any-usage, M eslint-disable, M @ts-ignore)
**Already tracked (skipped):** N

[table: file | type | count | sample]

**Proposed additions to docs/ACTIVE_CYCLE.md:**
[diff-style block, ready to apply on approval]
```
