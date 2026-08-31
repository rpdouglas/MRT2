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
| **DEV** | `feature/*` | `mrt2-app-dev` | (Preview URLs) |
| **UAT** | `release/*` | `mrt2-app-uat` | `mrt2-app-uat.web.app` |
| **PROD** | `main` | `mrt2-app-prod` | `www.myrecoverytoolkit.ca` |

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
