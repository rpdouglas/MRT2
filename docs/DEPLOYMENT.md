# ☁️ Deployment & CI/CD

**Platform:** Firebase Hosting
**Pipeline:** GitHub Actions (Multi-Environment)

## 1. Environment Strategy
We use a **Promotion Pipeline**: `DEV` -> `UAT` -> `PROD`.

| Environment | Branch | Firebase Project | URL |
| :--- | :--- | :--- | :--- |
| **DEV** | `feature/*` | `mrt2-app-dev` | (Preview URLs) |
| **UAT** | `release/*` | `mrt2-app-uat` | `mrt2-app-uat.web.app` |
| **PROD** | `main` | `mrt2-app-prod` | `myrecoverytoolkit.web.app` |

## 2. Secrets Management
Secrets are stored in GitHub Actions Secrets and injected into the build process.
* `VITE_FIREBASE_API_KEY`
* `VITE_GEMINI_API_KEY`
* `FIREBASE_SERVICE_ACCOUNT` (Base64 encoded for deployment)

## 3. Deployment Commands
**Manual Deploy (Emergency only):**
```bash
npm run build
firebase deploy --only hosting
```

**Database Rules:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```