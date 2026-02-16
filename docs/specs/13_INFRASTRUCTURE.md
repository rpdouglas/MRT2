# 🏗️ Feature Spec: Infrastructure & DevOps

**Status:** Live (v4.0)
**Stack:** React 19, Vite, Firebase, GitHub Actions, Codespaces.
**Context:** The invisible machinery that powers development, security, and deployment.

## 1. Development Environment (Codespaces)
We utilize a containerized development environment to ensure zero "works on my machine" issues.

* **Base Image:** `mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye`
* **Configuration:** `.devcontainer/devcontainer.json`
* **Lifecycle:**
    1.  **Post-Create:** Runs `setup.sh` to install global `firebase-tools` and local `npm` dependencies.
    2.  **Secret Injection:** Codespaces secrets are read and written to a local `.env` file automatically on boot.
* **Port Forwarding:**
    * `5173`: Vite Dev Server (App).
    * `9099`: Firebase Auth Emulator.
    * `8080`: Firestore Emulator.

## 2. Build Pipeline (Vite)
**Config:** `vite.config.ts`
We use advanced build optimizations to ensure performance on low-end mobile devices.

### A. Chunk Splitting (ManualChunks)
To prevent a massive `vendor.js` file, we explicitly split dependencies:
* **`firebase`**: Isolated to its own chunk (heavy SDK).
* **`gemini`**: AI libraries isolated (`@google/generative-ai`).
* **`recharts`**: Data visualization libraries isolated.
* **`vendor`**: All other node_modules.

### B. PWA Service Worker (Workbox)
* **Strategy:** `autoUpdate` (Updates apply immediately upon download).
* **Caching Rules:**
    * **Google Fonts:** `CacheFirst` (1-year expiration).
    * **Firebase Storage:** `StaleWhileRevalidate` (Images/Personas).
    * **Exclusions:** Firebase Auth endpoints are explicitly denied caching to prevent login loops.

## 3. CI/CD & Secrets (The "Nuclear" Protocol)
**Pipeline:** GitHub Actions (`.github/workflows/deploy.yaml`)

We use a "Nuclear" strategy for environment variables to support Vite's build process securely.
1.  **Injection:** GitHub Actions does *not* pass secrets as shell variables.
2.  **Materialization:** The workflow writes a physical `.env` file to the runner's disk immediately before `npm run build`.
3.  **Destruction:** The runner is ephemeral; the file is destroyed post-build.

## 4. Database Infrastructure
**Platform:** Cloud Firestore (NoSQL)

### A. Security Rules (`firestore.rules`)
* **RBAC:** Admin access is verified via Custom Claims (`request.auth.token.admin == true`).
* **Tenancy:** Standard users can only read/write documents where `resource.data.uid == request.auth.uid`.

### B. Indexing (`firestore.indexes.json`)
Composite indexes are required for complex queries:
* **Journals:** `uid` (Asc) + `createdAt` (Desc) [For Timeline].
* **Insights:** `uid` (Asc) + `createdAt` (Desc) [For Log].

## 5. Automation Systems

### A. Automated Versioning
* **Script:** `scripts/generate-build-info.js`
* **Trigger:** Pre-build.
* **Logic:** Calculates an MD5 hash of the `src/` directory and injects it into `src/build-info.json`.
* **UI:** Displayed in `VersionBadge.tsx`.

### B. Persona Seeding
* **Script:** `scripts/seed-personas.js`
* **Purpose:** Resets the demo environment with 4 distinct user archetypes.
* **Crypto:** Generates valid PBKDF2 salts and keys so encrypted features work in demo mode.

## 6. Verification Checklist
* [ ] **Container:** Does `npm run dev` start without manual config?
* [ ] **PWA:** Does the Service Worker cache Google Fonts? (Check Network Tab).
* [ ] **Build:** Run `npm run build`. Does `dist/assets` contain split chunks (e.g., `firebase-xxxx.js`)?
* [ ] **Secrets:** Deploy to DEV. Does `import.meta.env.VITE_GEMINI_API_KEY` exist in the console?

## 7. Build Optimizations (Vite)
We use `manualChunks` to isolate heavy dependencies, improving initial load time:
* **Firebase:** Isolated SDK chunk.
* **Visualization:** Recharts isolated.
* **AI:** Gemini SDK isolated.
