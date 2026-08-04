# 📁 Project 67: Signing Key & Secrets Hygiene

**Status:** ✅ Shipped (2026-07-19) — two separate secrets-hygiene incidents closed in this project. Incident 1: signing keystore rotated, new keystore stored in Google Secret Manager (`mrt2-app-prod`), `assetlinks.json` updated, old compromised keystore purged from all git history via `git filter-repo` + force-push to `origin/main` — verified zero remaining references. Incident 2 (found the same day, during the first post-rotation deploy attempt): the production Firebase Admin SDK service account key was leaking in plaintext into every GitHub Actions deploy log via a CI masking gap — see §7. Both incidents share the same root theme (secrets exposure) and are tracked under this one project rather than fragmenting into a second ticket.
**Primary Persona:** All (internal/architecture — no persona-specific UX; protects the integrity of every user's installed app)
**Objective:** Rotate the compromised Android signing keystore, purge it from git history, and establish a secrets-manager-based storage pattern so no future signing credential is ever committed to the repository.

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want the Android app-signing credential to live outside version control so that a repo leak (a collaborator's compromised laptop, a misconfigured fork, a CI log) can never hand an attacker the ability to publish updates impersonating MRT.
**Competitive Gap:** N/A — internal security hygiene, not a competitive differentiator. The cost of getting this wrong is catastrophic (a malicious update pushed under MRT's identity to a vulnerable, trust-dependent userbase), not competitive.

**Source:** `docs/reports/archive/2026-07_app_readiness_review.md` §1, Critical Finding #1 — found during the July 2026 Play Store submission-readiness audit. `git ls-files` confirms `mrt-release.keystore` is tracked; a `.gitignore` entry exists but was added after the file was already tracked, so it has zero effect.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Critical — this is the credential that proves the Android app came from MRT. It is not user data and does not touch the ZK vault boundary, but its compromise has severity comparable to a master key leak: anyone with repo read access (every collaborator, every CI runner, every fork) currently holds it.
* [x] **Encryption Strategy:** N/A — `src/lib/crypto.ts` is not involved. The new keystore and its passwords must be stored in Google Secret Manager — the same GCP project already used for `GEMINI_API_KEY` (PROJ-64) and `VAULT_PEPPER` (PROJ-65) — never committed to git in any form, including build artifacts. Unlike those two secrets, the keystore is not consumed by any Cloud Function at runtime, so it is not bound via `defineSecret()`; it is a manually-retrieved secret, pulled on demand by whoever runs a local Bubblewrap build (see Phase 1).
* [x] **Key Rotation:** N/A to the vault-key rotation system (`executePinRotation`) — this is a distinct credential (Android app signing) with no relationship to user vault keys. Do not conflate the two rotation concepts during implementation.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No application code changes. This project is entirely repo/infrastructure hygiene.

**Files/Artifacts Impacted:**
* `mrt-release.keystore` (repo root) — to be deleted from the working tree and purged from git history.
* `.gitignore` — already contains a `*.keystore`/`mrt-release.keystore` entry; confirm it stays correct for the replacement file.
* `public/.well-known/assetlinks.json` — the `sha256_cert_fingerprints` entry for the local/dev signature must be regenerated from the **new** keystore. The existing fingerprint (`EA:86:AB:FE:...`) becomes invalid the moment the old keystore is treated as compromised and replaced.
* CI/CD (`.github/workflows/deploy.yml` or equivalent, if Bubblewrap builds are ever automated) — must reference the new keystore via a secrets-manager pull, never a repo path.
* `docs/projects/07_PLAY_STORE_TWA.md` — Sprint 9.2 (Epic 4, Bubblewrap build) must be updated to point at the new keystore before that work resumes; this project (PROJ-67) is a hard dependency of PROJ-07 Sprint 9.2.

---

## 4. Implementation Phases 🏗️

### Phase 1: Generate & Store the Replacement Credential — ✅ Done 2026-07-19
* Generate a new release keystore (`keytool -genkeypair`), matching the alias/validity conventions the original used (confirm exact parameters before regenerating — a mismatched alias or validity period could complicate future Bubblewrap builds).
* Create the secret in the project's existing Google Secret Manager (same GCP project as `GEMINI_API_KEY`/`VAULT_PEPPER`) — split into separate secrets for the keystore binary and each password, rather than one bundled secret, so IAM/audit logging can distinguish access to the file from access to the passwords:
  ```bash
  gcloud secrets create mrt-release-keystore --data-file=mrt-release.keystore
  gcloud secrets create mrt-release-keystore-store-password --data-file=- <<< "<keystore password>"
  gcloud secrets create mrt-release-keystore-key-password --data-file=- <<< "<key password>"
  ```
* This secret is **not** bound via `defineSecret()` like `GEMINI_API_KEY`/`VAULT_PEPPER` — nothing in `functions/` ever needs it at runtime. It is retrieved manually, on demand, immediately before a local Bubblewrap build:
  ```bash
  gcloud secrets versions access latest --secret=mrt-release-keystore > mrt-release.keystore
  ```
  Delete the locally-materialized file again once the build completes — it should exist on disk only for the duration of the `bubblewrap build` invocation, never persist between sessions.
* Grant Secret Manager access only to the specific IAM principals (individuals or a dedicated release-engineering group) who actually run Play Store builds — not necessarily the same broader access level `GEMINI_API_KEY`/`VAULT_PEPPER` may already have, since this credential's blast radius (impersonating the published app to every installed user) is more severe than an API key's.

### Phase 2: Purge the Old Keystore From Git History — ✅ Done 2026-07-19
* A full mirror-clone backup was taken first (`git clone --mirror`) as a rollback safety net before any rewrite.
* Used `git filter-repo --path mrt-release.keystore --invert-paths --force` to remove the file from all 3 commits that contained it. `filter-repo` auto-removed the `origin` remote as its own safety default; re-added afterward.
* Force-pushed the rewritten history to `origin/main` with explicit, separate confirmation at execution time, per this repo's destructive-operation guidance. GitHub accepted the push (`main` moved from `0a34bc2` → `c25c90b`) — no branch protection blocked it.
* Verified via `git log --all --full-history -- mrt-release.keystore` against both local and a fresh `git fetch origin main` — zero results either way.
* **Caveat, not fully closed:** GitHub may retain the purged commits in its own caches for a period (old PR diff views, reflog, any existing forks) independent of this repo's own history. The credential itself is already rotated and non-functional (Phase 1), so this is a residual hygiene/exposure-surface concern, not a live security gap. If a fully guaranteed purge from GitHub's side matters, that requires a support request to GitHub directly — out of scope for what's achievable from the repo alone.

### Phase 3: Treat the Old Key as Compromised
* Confirm the old keystore was never used to sign a production Play Store release (true as of this audit — PROJ-07 Sprint 9.2 hasn't run yet). If it had been, this phase would also require Google's key-reset process; since it hasn't, no further remediation beyond rotation is needed.
* ✅ **Done 2026-07-19:** `assetlinks.json`'s fingerprint entry replaced with the new keystore's SHA-256 (`7A:BD:0E:9A:76:14:56:03:7D:DB:F0:61:5E:A3:2B:60:7A:9C:12:F0:5A:F1:17:83:C6:7E:15:46:A4:34:C8:45`) — the old fingerprint was removed entirely, not kept alongside the new one, since leaving it would still let anything signed with the compromised key pass domain verification. (A second fingerprint entry will be added in PROJ-07 Sprint 9.2, once Google Play App Signing issues its own production-managed key — that is a legitimate two-fingerprint case, distinct from this old/new rotation.)

### Phase 4: Edge Cases
* [ ] What if a Bubblewrap build was already run against the old keystore before this project starts? Not applicable — confirmed no production build has occurred yet (Sprint 9.2 was blocked on DUNS until this audit cycle).
* [ ] What if a collaborator's local clone still has the old keystore in their working tree after the history purge? The file is untracked going forward but may persist locally — communicate explicitly that the old keystore file should be deleted from every local machine, not just git.

---

## 5. QA & Verification 🧪
* [x] **Verification (2026-07-19):** `git log --all --full-history -- mrt-release.keystore` returns zero results, checked against both local history and `origin/main` post-push.
* [x] **Verification (2026-07-19):** `git ls-files | grep keystore` returns zero results in the current working tree (new keystore lives only in Secret Manager).
* [x] **Verification (2026-07-19):** `keytool -list -v -keystore <new-keystore>` fingerprint matches the updated first entry in `assetlinks.json`.
* [ ] **Outstanding:** Confirm every other collaborator with an existing local clone (if any) has reconciled with the rewritten history (re-cloned or hard-reset) — this can't be verified from this session and needs manual follow-up if anyone else has cloned this repo.
* [ ] **The Subway Test:** N/A — no runtime/offline behavior affected.
* [ ] **The "Lost PIN" Test:** N/A — unrelated to the vault key system.

---

## 6. Related
* Blocks: `docs/projects/07_PLAY_STORE_TWA.md` Sprint 9.2 (Bubblewrap build cannot proceed on a compromised keystore).
* Source audit: `docs/reports/archive/2026-07_app_readiness_review.md` §1.

---

## 7. Incident 2: Leaked Production Admin SDK Key via CI Log Exposure (2026-07-19)

**Discovered:** during the first deploy attempt after Incident 1's keystore rotation, the `main` branch deploy failed (`VAULT_PEPPER` secret missing — an unrelated PROJ-65 rollout gap, fixed separately, see below). The user pasted the full failed-run log for diagnosis; it contained the complete `firebase-adminsdk-fbsvc@mrt2-app-prod.iam.gserviceaccount.com` private key in plaintext, printed multiple times.

### Root Cause

`.github/workflows/deploy.yml`'s "Load Service Account" step decoded the properly-masked `FIREBASE_SERVICE_ACCOUNT_PROD_BASE64` GitHub secret to a file (`base64 -d > ./service-account.json`), then wrote that **decoded** content into `$GITHUB_ENV` as `SERVICE_ACCOUNT_JSON` so the `FirebaseExtended/action-hosting-deploy@v0` action's `firebaseServiceAccount` input could consume it. GitHub's automatic log redaction only masks the literal registered secret string (the base64 blob) — the decoded JSON is a *derived* value it doesn't recognize, so it printed unredacted. Because `$GITHUB_ENV` writes persist as an environment variable for every subsequent step in the job, and the runner logs an `env:` debug block per step, the leaked key appeared repeatedly throughout the run. A vestigial job-level `SERVICE_ACCOUNT_JSON: ""` declaration (line 54) meant it even appeared in steps *before* the value was ever set.

### Scope

This pattern is identical for all three environments (`FIREBASE_SERVICE_ACCOUNT_DEV_BASE64`, `_UAT_BASE64`, `_PROD_BASE64`) — every deploy of any environment, since this pattern was introduced, has leaked that environment's Admin SDK key into its own run log. Only the `main` (prod) leak was directly observed and confirmed exposed in this incident.

### Remediation — ✅ Done 2026-07-19

1. Identified the exact leaked key via `gcloud iam service-accounts keys list` — `private_key_id: d4e47ec5568df2e54b3acbde2d9371d57bd5af22`, created 2025-12-16, no expiration set. One of 7 keys accumulated on that service account.
2. Generated a replacement key via `gcloud iam service-accounts keys create`, output written directly to a local file — never printed to any log or chat transcript.
3. New key's base64 set as the `FIREBASE_SERVICE_ACCOUNT_PROD_BASE64` GitHub secret by the user directly via the GitHub web UI (this session's `gh` auth is a GitHub App user-to-server token — identifiable by its `ghu_` prefix and empty `X-Oauth-Scopes` header — scoped by its installation to exclude Secrets and Administration permissions regardless of the user's own repo-admin role; likely an intentional sandbox boundary, not something to route around by widening the App's grant).
4. Old key (`d4e47ec5568df2e54b3acbde2d9371d57bd5af22`) disabled via `gcloud iam service-accounts keys disable`, only after the new secret was confirmed live — disabling first would have broken every deploy in between.
5. Local key file and its base64 export both deleted after use.
6. `.gitignore` hardened with `*firebase-adminsdk*.json` and `*-key.json` patterns, since the newly-generated key file was initially **not** covered by the existing `service-account*.json` pattern — the same category of gap (a protective pattern added too narrowly) that caused Incident 1.
7. `deploy.yml` fixed: the decoded JSON is now masked line-by-line via `::add-mask::` before any reference to it, and delivery switched from a job-wide `$GITHUB_ENV` variable to a step-scoped `$GITHUB_OUTPUT`, so it no longer broadcasts into every subsequent step's logged environment — only the one step that actually consumes it. The dead `SERVICE_ACCOUNT_JSON: ""` job-level declaration was removed.

### Related Gap Found and Fixed: Missing `VAULT_PEPPER` Secret

The actual build failure that surfaced this incident (`Error: In non-interactive mode but have no value for the secret: VAULT_PEPPER`) was a separate, unrelated PROJ-65 rollout gap — `functions/src/index.ts`'s `defineSecret("VAULT_PEPPER")` (line 30) had no corresponding value ever set in Secret Manager for `mrt2-app-prod`. Fixed:
* Generated a random 256-bit value via `openssl rand -base64 32`, piped directly into `firebase functions:secrets:set VAULT_PEPPER --data-file=- --project=mrt2-app-prod` — never written to disk or printed anywhere.
* Found and fixed a second gap along the way: the new secret had zero IAM bindings, which would have failed at runtime even after a successful deploy. Granted `roles/secretmanager.secretAccessor` to `405528797784-compute@developer.gserviceaccount.com`, matching the already-working binding on `GEMINI_API_KEY`.
* **`mrt2-app-dev` — done 2026-07-19:** `VAULT_PEPPER` set with the matching IAM binding (`roles/secretmanager.secretAccessor` on `1040431613138-compute@developer.gserviceaccount.com`), same pattern as prod.
* **`mrt2-app-uat`:** deliberately deferred, not fixed here — uat isn't currently in active use. Moved to `docs/BACKLOG.md` (Parked/Unscheduled) 2026-07-19 rather than left as an open item on this now-closed ticket.

### QA & Verification — Incident 2

* [x] `git log`/repo scan confirms no key material was ever committed (the leak was log-only, not a repo-tracked file — no history rewrite required for this incident).
* [x] Old key confirmed `DISABLED` via `gcloud iam service-accounts keys list`.
* [x] `VAULT_PEPPER` secret existence and IAM binding both confirmed via `gcloud secrets get-iam-policy`.
* [x] `deploy.yml` YAML syntax validated after edits.
* [x] **Verified (2026-07-19):** confirmed against a real `main` deploy run (`29669316182`) — `verify` and `deploy` jobs both green, zero `BEGIN PRIVATE KEY` occurrences in the log, zero `SERVICE_ACCOUNT_JSON:` job-wide env entries, 113 masked redactions confirming the mask engaged, and the `VAULT_PEPPER` step succeeded.
* [x] **`mrt2-app-dev` `VAULT_PEPPER` gap closed (2026-07-19).** `mrt2-app-uat` deliberately deferred to `docs/BACKLOG.md` rather than left open here — see §7 above.
