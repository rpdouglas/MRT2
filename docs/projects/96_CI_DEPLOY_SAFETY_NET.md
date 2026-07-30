# 📁 Project 96: CI/Deploy Operational Safety Net

**Status:** ⚪ Planned
**Primary Persona:** Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing impact; this protects the team's ability to notice and respond to a bad deploy.
**Objective:** Close `OBSERVABILITY_AUDIT.md`'s GAP-04 (no deploy-failure alerting) and GAP-08 (no documented rollback procedure), plus `DEPENDENCY_AUDIT.md`'s CI vulnerability-gate recommendation — kept as its own project because it touches the deployment pipeline itself, a different risk profile than application code changes (PROJ-94/95).

---

## 1. The Executive Summary
**User Story:** As the developer/operator, when a deploy fails or a new high-severity vulnerability lands, I want to know immediately instead of finding out from a user report or a manual check.
**Source:** `OBSERVABILITY_AUDIT.md` (2026-07-29) Phase 5, GAP-04/GAP-08, Quick Win #3; `DEPENDENCY_AUDIT.md` (2026-07-29) Capability Gap Analysis, Rank #2.

**Scope note:** verified `.github/workflows/deploy.yml` has zero failure-notification steps and no `npm audit` step — both confirmed absent, matching the audits. No corrections needed here; these are the more straightforwardly-verified findings from both documents.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** N/A — this ticket touches CI/CD pipeline configuration and documentation only, no application data.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes. No Cloud Functions changes.

**Files impacted:**
* `.github/workflows/deploy.yml` — add a notification step (Slack/Discord webhook, or GitHub's own failure-notification mechanism if a webhook secret isn't readily available) triggered on `failure()`; add an `npm audit --audit-level=high` step to the existing `verify`/lint job.
* `docs/RUNBOOK.md` (new) — Firebase Hosting rollback procedure (`firebase hosting:clone`, already supported per the audit's own confirmation), Cloud Functions redeploy procedure (git revert + full CI re-run, since Cloud Functions have no atomic rollback — confirmed in CLAUDE.md's own deployment section), and a basic outage-communication checklist.

---

## 4. Implementation Phases 🏗️

### Phase 1: CI vulnerability gate
* Add `npm audit --audit-level=high` (or `moderate`, to be decided against current noise level — recall PROJ-90 found most of the 38 remaining vulnerabilities are dev-tooling-only and not force-fixable) to the CI verify job. Needs a decision: fail the build on any high/critical, or just report? Given `firebase-tools`' own unfixable-without-a-major-downgrade vulnerabilities (documented in PROJ-90), a hard fail here could permanently red the CI unless scoped to only *newly introduced* vulnerabilities or exclude known-accepted ones.

### Phase 2: Deploy failure notifications
* Add a webhook notification step to `deploy.yml`, gated on `if: failure()`.
* Requires a webhook URL secret — confirm with the user which channel (Slack/Discord/email) before implementation, since this needs an actual external endpoint, not something inferable from the repo.

### Phase 3: Rollback runbook
* Document Firebase Hosting rollback (console + CLI paths).
* Document Cloud Functions redeploy-via-revert procedure.
* Document a basic incident-communication checklist (who to notify, where).

### Phase 4: Edge Cases
* [ ] Confirm the `npm audit` CI gate doesn't immediately fail the build on the 38 currently-known, already-triaged vulnerabilities (PROJ-90's documented accepted risks) — needs either an allowlist or scoping to new advisories only.
* [ ] Confirm the webhook step doesn't leak secrets/tokens into notification payloads.

---

## 5. QA & Verification 🧪
* [ ] **CI dry-run:** verify the `npm audit` gate's actual pass/fail behavior against the current, already-triaged vulnerability set before merging (must not permanently red CI).
* [ ] **Manual:** trigger a deliberate CI failure on a throwaway branch to confirm the notification actually fires and reaches the intended channel.
* [ ] **Docs review:** confirm `docs/RUNBOOK.md` procedures are accurate against the actual current Firebase project setup (not just described in the abstract).
