# ☁️ Deployment & Development

**Platform:** Firebase Hosting
**Pipeline:** GitHub Actions (Multi-Environment)
**Dev Environment:** GitHub Codespaces (Recommended)

## 1. Development Environment (Codespaces)
We have migrated to **GitHub Codespaces** to ensure a consistent, secure dev environment.

* **Config:** `.devcontainer/devcontainer.json`
* **Auto-Setup:** The `setup.sh` script automatically installs Node 20, Firebase Tools, and extensions.
* **Secrets:**
    * **Method:** Secrets are injected from GitHub Codespaces Settings.
    * **Boot Logic:** The setup script reads these secrets and generates a local `.env` file automatically.

## 2. Environment Strategy
We use a **Promotion Pipeline**: `DEV` -> `UAT` -> `PROD`.

| Environment | Branch | Firebase Project | URL |
| :--- | :--- | :--- | :--- |
| **DEV** | `feature/*`, `claude/*` | `mrt2-app-dev` | (Preview URLs) |
| **UAT** | `release/*` — dormant by default, see §2a | `mrt2-app-uat` | `mrt2-app-uat.web.app` |
| **PROD** | `main` | `mrt2-app-prod` | `www.myrecoverytoolkit.ca` |

`claude/*` covers Claude Code session branches (nearly all actual work happens here) — treated identically to `feature/*`: same DEV project, same secrets, same trigger. DEV is one shared environment (`channelId: live`, not a per-branch preview) — whichever `claude/*`/`feature/*` branch pushed most recently is what's live there. Fine at this team's pace; if concurrent branches start clobbering each other's test state, per-PR Firebase Hosting preview channels are the real fix, not attempted here (PROJ-109).

### 2a. UAT — documented but dormant
UAT is not in active use and isn't required for the current workflow — but it's fully wired and costs nothing to leave in place. To bring it back into play for a given piece of work: push (or open a PR into) a `release/*` branch. The existing trigger in `.github/workflows/deploy.yml` deploys it to `mrt2-app-uat` exactly like `feature/*`/`claude/*` deploy to DEV — no code or config change needed to reactivate it, only the decision to use it (e.g. before a larger release that warrants a longer soak, or a mobile app store submission needing extra bake time before PROD).

### 2b. `main` is PR-only
As of PROJ-109, `main` is protected: no direct pushes (including from Claude Code sessions) — every change lands via a pull request, gated on the `verify` job (lint, spec-quality, unit tests, functions tests, dependency audit, Firestore rules tests, E2E golden paths) passing as a required status check. Merging the PR is what triggers the PROD deploy, not any push straight to `main`. See `.github/pull_request_template.md` for the merge-time checklist — every user-facing PR must update `docs-site/support/changelog.md` (via `ticket-close`/`release-scribe`) and be checked against `docs-site/guide/*.md` before merge, not just before the fact from memory.

## 3. The Build Pipeline (Secrets Security)
We use a "Nuclear Fix" strategy for environment variables in CI/CD to prevent Vite from missing keys.

* **Logic:** The pipeline does *not* rely on shell variables passing through to the build.
* **Mechanism:** The Action explicitly **writes a physical .env file** to the runner's disk immediately before the build step, populated with secrets from GitHub Actions.
* **Admin Access:** The `FIREBASE_SERVICE_ACCOUNT` is decoded from Base64 into a temporary JSON file for the deploy step, then destroyed.

## 4. Deployment Commands
**Manual Deploy (Emergencies only):**
```bash
npm run build
firebase deploy --only hosting
```

## 5. Something Broke — Rollback & Incident Response
See [`docs/RUNBOOK.md`](./RUNBOOK.md) for the actual "it's down, what do I do" procedure — Firebase Hosting rollback, Cloud Functions/rules rollback (no atomic rollback exists for either), and the CI dependency vulnerability gate added in PROJ-96.

## 6. Android (Google Play Store)
The production PWA is also packaged as a Trusted Web Activity for Play Store distribution — see [`docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md`](./PLAY_STORE_BUBBLEWRAP_GUIDE.md) for the full Bubblewrap build/signing/submission walkthrough, and [`docs/projects/07_PLAY_STORE_TWA.md`](./projects/07_PLAY_STORE_TWA.md) for project status.
