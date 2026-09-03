# 📁 Project 109: CI/CD Branch Strategy & Environment Promotion

**Status:** ⚪ Planned
**Primary Persona:** Dev / AI Partner (CI/CD workflow and deploy-safety concern; see `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing impact, but everything that reaches users passes through this pipeline.
**Objective:** Close the gap where `claude/*` session branches (the actual branch pattern nearly all work happens on) never trigger the DEV deploy pipeline, so work instead lands directly on `main` — deployed to production before CI has gated it. Make `main` PR-only with required CI, keep UAT (`release/*`) wired but documented as dormant-by-default, and formalize (not just leave to memory) that user-facing merges to `main` update the changelog and get checked against the user guide.

---

## 1. The Executive Summary
**User Story:** As the developer/operator working through Claude Code sessions, I want every session's branch to automatically deploy to a real DEV environment so I can test it before it ever reaches production, and I want `main` to refuse a merge that hasn't passed CI or skipped a required changelog/user-guide check — so a bad or undocumented change can't reach `www.myrecoverytoolkit.ca` on a single push the way it can today.
**Source:** User-reported observation that DEV/UAT "aren't being used" despite `.github/workflows/deploy.yml` implementing a 3-environment pipeline — investigated and confirmed: the workflow's branch triggers (`main`, `release/*`, `feature/*`) don't match `claude/*`, the pattern nearly all actual work branches use (70 of the repo's remote branches, almost all `claude/...`). `docs/DEPLOYMENT.md`'s documented environment table has drifted from actual practice.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** N/A — this ticket touches CI/CD workflow configuration, GitHub branch rules, and documentation only. No application data, no Firestore access patterns change.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A. Existing per-environment Firebase service-account secrets (`FIREBASE_SERVICE_ACCOUNT_{DEV,UAT,PROD}_BASE64`) are reused as-is; no new secrets are introduced by adding `claude/*` to an existing DEV trigger condition.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes.

**Files impacted:**
* `.github/workflows/deploy.yml` — add `claude/*` to the `on.push.branches` trigger list and to the `Set Env (DEV)` step's `if: startsWith(github.ref, ...)` condition (mirroring the existing `feature/*` handling exactly — same DEV project, same secrets). Add a `pull_request: { branches: [main] }` trigger so the `verify` job runs as an actual PR check GitHub can require, not only as a post-hoc run on whatever branch happened to push.
* GitHub branch ruleset (via `gh api` / repo settings, not a file in this repo) on `main` — require a pull request before merging, require the `verify` job as a passing status check, keep the existing force-push/deletion block. This is the mechanism that actually stops a direct `git push origin main` — the gap this session hit twice.
* `.github/pull_request_template.md` (existing — already has a "Public Changelog Classification" section mirroring `ticket-close` Check 0 almost verbatim; only genuinely missing piece is a "User Guide Review" section for Check 3, added surgically rather than replacing the file). Correction during implementation: this file already existed on `main` with a thorough AI-authorship-aware template — an early pass overwrote it wholesale without reading it first (a direct violation of this repo's own "targeted patching only" rule), caught before commit, restored from `main`, and fixed with a minimal add instead.
* `docs/DEPLOYMENT.md` — update the Environment Strategy table to include `claude/*`, document the new PR-required rule, and add an explicit "how to reactivate UAT" note (push a `release/*` branch — the trigger already exists and needs no code change, only documenting that it's there and currently unused by design).
* `docs/governance/DEVELOPER_GUIDE.md` — cross-link Protocol C (Release Scribe) and the ticket-close user-guide check from the new PR template section, so the checklist item points back to the actual protocol instead of floating unexplained.
* Branch hygiene: enable `delete_branch_on_merge` on the repo (currently off — the actual cause of 70 accumulated remote branches), and sweep already-merged stale `claude/*` branches.

---

## 4. Implementation Phases 🏗️

### Phase 1: DEV trigger fix
* Add `claude/*` alongside `feature/*` in `deploy.yml`'s push trigger and the DEV env-selection condition.
* Add the `pull_request` trigger for the `verify` job only (not `deploy` — deploys stay tied to actual branch pushes, never to a PR's synthetic merge ref).

### Phase 2: Branch protection on `main`
* Configure a ruleset requiring PR + passing `verify` check before merge; confirm it actually blocks a direct push attempt (test on a throwaway branch/PR, not on real work).

### Phase 3: Changelog & user-guide gate
* Add `.github/pull_request_template.md` with the two checklist items described in §3, referencing `release-scribe` and `ticket-close` by name so future-me (or future Claude) knows exactly which skill to run before checking the box.
* This is intentionally a checklist, not a CI script — classifying "is this user-visible" and "does the guide need an update" needs judgment (per `ticket-close` Check 0/3's own reasoning), which the existing skills already provide; automating a naive file-path heuristic here would give false confidence.

### Phase 4: Documentation
* `docs/DEPLOYMENT.md`: updated environment table, PR-required rule, UAT reactivation note.
* `docs/governance/DEVELOPER_GUIDE.md`: cross-link into the PR template checklist.

### Phase 5: Branch hygiene
* Enable `delete_branch_on_merge`.
* Delete already-merged stale `claude/*` branches (verify each is actually merged into `main` before deleting — never force-delete unmerged work).

### Phase 6: Edge Cases
* [ ] What happens if a `claude/*` branch push races another `claude/*` branch's DEV deploy? Document the known last-write-wins limitation in `docs/DEPLOYMENT.md` rather than solving it (per-branch preview channels are a real but heavier fix, out of scope here).
* [ ] Does the new required PR check block *this session's own* future merges if the check name doesn't match exactly what the ruleset expects? Verify the exact job name GitHub reports before setting it as required — a mismatched required-check name locks out all merges.
* [ ] Confirm `release/*` (UAT) trigger logic is untouched by this change — dormant by disuse, not by removal.

---

## 5. QA & Verification 🧪
* [ ] **Dry run:** push a throwaway `claude/*` test branch, confirm `verify` + DEV `deploy` both fire and succeed against `mrt2-app-dev`.
* [ ] **PR gate test:** open a PR from that branch to `main`, confirm the `verify` job appears as a required check and the merge button is blocked until it passes.
* [ ] **Direct-push block:** confirm `git push origin main` is now rejected (this is the exact gap this session hit — must be verified fixed, not assumed).
* [ ] **UAT untouched:** confirm the `release/*` trigger condition in `deploy.yml` is unchanged (no live UAT push needed to verify this — code review of the diff is sufficient).
* [ ] **PR template renders:** open a real PR and confirm the checklist appears and is legible.
