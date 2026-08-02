# 🚨 Operational Runbook

This is the "something just broke in production" doc — grab this during an active incident, not for general deployment architecture (see [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) for that).

**Scope:** `mrt2-app-prod` (the `main` branch's deploy target). The same procedures apply to `mrt2-app-uat`/`mrt2-app-dev` with the project ID swapped.

---

## 1. How you'll find out

There is no dedicated Slack/Discord alerting configured (PROJ-96 evaluated this and, per product decision, deferred it — see §4). The current signal is **GitHub's built-in failure notification**: GitHub emails whoever pushed the commit that broke a workflow, provided their personal notification settings have Actions emails enabled.

**One-time check, not something this repo can verify for you:** confirm this is actually on at [github.com/settings/notifications](https://github.com/settings/notifications) → "Actions" → "Send notifications for failed workflows only" (or broader). If that's off, a failed deploy currently produces *no* alert at all beyond someone noticing the app is broken.

The CI `verify` job (see §4 below and `.github/workflows/deploy.yml`) will also now fail loudly — and email you — if a production dependency introduces a new high/critical vulnerability, not just on a broken deploy.

---

## 2. Firebase Hosting rollback

**Fastest path — Firebase Console:**
1. Go to the [Firebase Console](https://console.firebase.google.com/) → select the project (`mrt2-app-prod`) → **Hosting**.
2. The **Release history** table lists every past deploy with a timestamp and version.
3. Find the last known-good release, open its "⋮" menu, and choose **Rollback**. Firebase serves that exact prior version immediately — no rebuild, no CI run.

**CLI alternative** (if you already know the target version ID from the console's release history):
```bash
firebase hosting:clone mrt2-app-prod:live@<PREVIOUS_VERSION_ID> mrt2-app-prod:live --project mrt2-app-prod
```
There is no CLI command to *list* version IDs in this project's current `firebase-tools` version — get the version ID from the Console's release history first, then use the CLI only if you need to script the rollback (e.g., cloning a known-good version into a preview channel to double check it before promoting).

**Important:** a Hosting rollback only reverts the static site (the built React app). It does **not** revert Firestore rules/indexes or Cloud Functions — those are deployed by the same pipeline but have no equivalent one-click rollback (see §3). If the incident is caused by a rules/Functions change rather than a frontend bug, a Hosting-only rollback won't fix it.

---

## 3. Cloud Functions / Firestore rules rollback

Cloud Functions and Firestore rules/indexes have **no atomic rollback** — confirmed in `CLAUDE.md`'s deployment section and in `.github/workflows/deploy.yml`'s final step, which deploys both via `firebase deploy --only firestore:rules,firestore:indexes,functions`. The only rollback path is:

1. `git revert <bad-commit-sha>` on `main` (or open a revert PR if the bad change is more than one commit — don't hand-edit history on `main`).
2. Push the revert. The existing `deploy.yml` pipeline runs the full `verify` job (including the new PROJ-96 audit gates and the e2e golden-path suite) and, if it passes, redeploys hosting + rules + indexes + functions from the reverted state.
3. This takes as long as a normal deploy (full CI run), not an instant rollback — there is no faster path for Functions/rules today. If the incident is severe enough to need something faster than a full CI cycle, `firebase deploy --only firestore:rules --project mrt2-app-prod` from a local checkout of the last-known-good commit is the emergency manual fallback (bypasses CI — only do this if you've personally verified the reverted code locally first).

---

## 4. CI Dependency Vulnerability Gate (PROJ-96)

The `verify` job's `Dependency Vulnerability Audit` steps hard-fail the build on new **production**-dependency vulnerabilities (`--omit=dev`, so dev-only tooling like eslint/jest doesn't red the pipeline over issues that never ship):

| Workspace | Threshold | Why |
|---|---|---|
| root | `critical` | One documented exception below the `critical` line — see next paragraph. |
| `functions/` | `high` | Genuinely clean at this threshold as of PROJ-96 (2 critical + 4 high fixed; see that spec). |

**Known accepted exception (root):** `react-router`/`react-router-dom` carry a high-severity advisory (`GHSA-qwww-vcr4-c8h2`, "RSC Mode CSRF Bypass"). This app never uses React Router's RSC/framework mode — no `createBrowserRouter`/`RouterProvider`, just component-based `<Routes>` — and the only real fix is an untested v7→v8 major bump, out of scope for a CI-tooling ticket. It's still visible in every CI log (`npm audit` prints all matching findings regardless of `--audit-level`), just doesn't block the build. Revisit if this app ever adopts RSC/framework-mode routing.

If the gate fails on a **future** advisory: run `npm audit --omit=dev` (root) or `npm audit --prefix functions --omit=dev` (functions) locally, and follow the same triage precedent as PROJ-90/96 — non-force `npm audit fix` first; if only a forced major bump resolves it, evaluate the actual blast radius (is the vulnerable code path even reachable the way this app uses the library?) before deciding whether to bump, accept-and-document, or replace the dependency.

---

## 5. Incident communication checklist

1. Confirm the blast radius: is it hosting only (frontend down/broken), Functions only (AI insights/vault-pin verification/crossword generation failing), or both?
2. Check the relevant Firebase Console page (Hosting release history, or Functions logs) for the exact error before acting.
3. Roll back per §2/§3 above.
4. Once stable, open a PR with the real fix rather than leaving `main` on a reverted commit indefinitely.
5. This is currently a solo-maintainer project — there's no external stakeholder notification list to page. If that changes (e.g., Lisa-type collaborators join), add a real contact list here.
