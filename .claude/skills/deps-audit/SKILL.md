---
name: deps-audit
description: Dependency vulnerability audit. Runs npm audit across the root app and functions/, summarizes CVEs by severity and production-vs-dev impact, and recommends a fix path. Use before merging a dependency bump, periodically as hygiene, or when asked to check for vulnerable packages.
---

# MRT Dependency Vulnerability Audit

You are auditing dependencies for known vulnerabilities. Your job is to run the scans, classify findings, and recommend — not to silently patch anything. `npm audit fix` (and especially `--force`) rewrites `package-lock.json` and can bump majors; that always needs explicit approval before you run it.

---

## Step 1: Run the scans

```bash
npm audit --json > /tmp/audit-root.json 2>&1 || true
(cd functions && npm audit --json > /tmp/audit-functions.json 2>&1) || true
```

Also capture the human-readable summary of each (`npm audit` without `--json`) for the severity counts table — the JSON is for per-package detail, the text output is faster for the top-line count.

If `package-lock.json` doesn't match `package.json` (npm will complain), note that as a finding itself — an out-of-sync lockfile means the audit isn't scanning what's actually installed.

## Step 2: Classify every finding

For each vulnerability reported in either scan, record:

| Package | Severity | Prod or Dev dependency? | Vulnerable range | Patched version | Fix available via |
|---|---|---|---|---|---|

- **Prod vs Dev** matters a lot here: a `devDependencies`-only vulnerability never ships to users — lower priority. A `dependencies` vulnerability (root app) or anything in `functions/dependencies` (server-side, runs in Cloud Functions) ships to production or executes server-side — higher priority.
- **Fix available via**: `npm audit fix` (non-breaking, safe to recommend running), `npm audit fix --force` (may bump a major version — flag exactly which package and what the major bump implies before recommending), or "no fix available" (note the advisory and whether the vulnerable code path is actually reachable from MRT's usage, if you can tell from a quick read of how the package is used).

## Step 3: Cross-check severity thresholds

- Any **critical** or **high** severity finding in a **production** dependency (root `dependencies` or `functions/dependencies`) is a 🔴 blocker — flag it prominently.
- **Moderate/low** in production, or **any severity** in dev-only, is 🟡 advisory — worth fixing but not blocking.
- This project has precedent for exactly this triage — see the `npm audit fix` entry in `docs/ACTIVE_CYCLE.md`'s Chores/Resolved history (2 critical + 3 high fixed in production deps, 13 dev-only vulnerabilities knowingly deferred). Follow that same judgment: fix what ships, log what doesn't as a known deferral rather than silently ignoring it.

## Step 4: Report

```
### 📦 Dependency Audit — [date]

**Root app:** N vulnerabilities (C critical / H high / M moderate / L low)
**functions/:** N vulnerabilities (C critical / H high / M moderate / L low)

#### 🔴 Blockers (production, critical/high)
[Package] | [severity] | [vulnerable range] → [patched version] | Fix: [npm audit fix | npm audit fix --force (major bump: X→Y) | no fix available]

#### 🟡 Advisory (dev-only, or moderate/low in production)
[same table format]

#### Recommendation
State the exact command(s) to run, in order, and whether any require `--force` (and therefore a major-version bump the user should confirm before you run it).
```

## Step 5: Wait for approval before running any fix

Do not run `npm audit fix` or `npm audit fix --force` without explicit approval — even the non-force version rewrites the lockfile. After a fix is applied, re-run `npm run check` to confirm nothing broke, and note the before/after vulnerability counts in `docs/ACTIVE_CYCLE.md` under Chores & Tech Debt, following the existing entry's format.
