# 📁 Project 67: Signing Key & Secrets Hygiene

**Status:** 🟡 In Progress — Phase 1 complete (2026-07-19): new keystore generated, uploaded to Google Secret Manager (`mrt2-app-prod`), and `assetlinks.json`'s fingerprint updated. Phase 2 (git history purge of the old keystore) is intentionally still pending — held for a separate explicit confirmation given its destructive, coordination-required nature. The old keystore is still tracked in git history as of this writing.
**Primary Persona:** All (internal/architecture — no persona-specific UX; protects the integrity of every user's installed app)
**Objective:** Rotate the compromised Android signing keystore, purge it from git history, and establish a secrets-manager-based storage pattern so no future signing credential is ever committed to the repository.

---

## 1. The Executive Summary
**User Story:** As the System Architect, I want the Android app-signing credential to live outside version control so that a repo leak (a collaborator's compromised laptop, a misconfigured fork, a CI log) can never hand an attacker the ability to publish updates impersonating MRT.
**Competitive Gap:** N/A — internal security hygiene, not a competitive differentiator. The cost of getting this wrong is catastrophic (a malicious update pushed under MRT's identity to a vulnerable, trust-dependent userbase), not competitive.

**Source:** `docs/reports/2026-07_app_readiness_review.md` §1, Critical Finding #1 — found during the July 2026 Play Store submission-readiness audit. `git ls-files` confirms `mrt-release.keystore` is tracked; a `.gitignore` entry exists but was added after the file was already tracked, so it has zero effect.

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

### Phase 2: Purge the Old Keystore From Git History
* **This step rewrites git history — coordinate with every active collaborator before running it. Anyone with an existing clone will need to re-clone or hard-reset after the rewrite, or their local history will silently diverge.**
* Use `git filter-repo` (preferred over BFG per current maintainer guidance) to remove `mrt-release.keystore` from every commit in history.
* Force-push the rewritten history to the remote — **do not run this without explicit, separate confirmation at execution time**, per this repo's guidance on destructive/hard-to-reverse operations.
* Verify via `git log --all --full-history -- mrt-release.keystore` that no commit still references the file after the rewrite.

### Phase 3: Treat the Old Key as Compromised
* Confirm the old keystore was never used to sign a production Play Store release (true as of this audit — PROJ-07 Sprint 9.2 hasn't run yet). If it had been, this phase would also require Google's key-reset process; since it hasn't, no further remediation beyond rotation is needed.
* ✅ **Done 2026-07-19:** `assetlinks.json`'s fingerprint entry replaced with the new keystore's SHA-256 (`7A:BD:0E:9A:76:14:56:03:7D:DB:F0:61:5E:A3:2B:60:7A:9C:12:F0:5A:F1:17:83:C6:7E:15:46:A4:34:C8:45`) — the old fingerprint was removed entirely, not kept alongside the new one, since leaving it would still let anything signed with the compromised key pass domain verification. (A second fingerprint entry will be added in PROJ-07 Sprint 9.2, once Google Play App Signing issues its own production-managed key — that is a legitimate two-fingerprint case, distinct from this old/new rotation.)

### Phase 4: Edge Cases
* [ ] What if a Bubblewrap build was already run against the old keystore before this project starts? Not applicable — confirmed no production build has occurred yet (Sprint 9.2 was blocked on DUNS until this audit cycle).
* [ ] What if a collaborator's local clone still has the old keystore in their working tree after the history purge? The file is untracked going forward but may persist locally — communicate explicitly that the old keystore file should be deleted from every local machine, not just git.

---

## 5. QA & Verification 🧪
* [ ] **Verification:** `git log --all --full-history -- mrt-release.keystore` returns zero results after the history rewrite.
* [ ] **Verification:** `git ls-files | grep keystore` returns zero results in the current working tree (new keystore lives only in the secrets manager).
* [x] **Verification (2026-07-19):** `keytool -list -v -keystore <new-keystore>` fingerprint matches the updated first entry in `assetlinks.json`.
* [ ] **Verification:** Every active collaborator has confirmed their local clone is reconciled with the rewritten history (re-cloned or hard-reset) before any further pushes to the shared remote.
* [ ] **The Subway Test:** N/A — no runtime/offline behavior affected.
* [ ] **The "Lost PIN" Test:** N/A — unrelated to the vault key system.

---

## 6. Related
* Blocks: `docs/projects/07_PLAY_STORE_TWA.md` Sprint 9.2 (Bubblewrap build cannot proceed on a compromised keystore).
* Source audit: `docs/reports/2026-07_app_readiness_review.md` §1.
