# 🏗️ Feature Spec: Infrastructure & DevOps

**Status:** Live (v4.0)
**Stack:** React 19, Vite, Firebase, GitHub Actions, Codespaces.
**Context:** The invisible machinery that powers development, security, and deployment.

## 1. Development Environment (Codespaces)
We utilize a containerized development environment to ensure zero "works on my machine" issues.

* **Base Image:** `mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye`
* **Configuration:** `.devcontainer/devcontainer.json`
* **Lifecycle:**
    1. **Post-Create:** Runs `setup.sh` to install global `firebase-tools` and local `npm` dependencies.
    2. **Secret Injection:** Codespaces secrets are read and written to a local `.env` file automatically on boot.
* **Port Forwarding:**
    * `5175`: Vite Dev Server (App) - *Strictly bound to support Dev Tunnels.*
    * `9099`: Firebase Auth Emulator (If active).
    * `8080`: Firestore Emulator (If active).

## 2. Build Pipeline (Vite)
**Config:** `vite.config.ts`
We use advanced build optimizations to ensure performance on low-end mobile devices.

### A. Chunk Splitting (ManualChunks)
To prevent a massive `vendor.js` file, we explicitly split dependencies. This drastically reduces the initial load time:
* **`firebase`**: Isolated to its own chunk (heavy SDK).
* **`gemini`**: AI libraries isolated (`@google/generative-ai`).
* **`recharts`**: Data visualization libraries isolated.
* **`vendor`**: All other `node_modules`.

### B. PWA Service Worker (Workbox)
* **Strategy:** `autoUpdate` (Updates apply immediately upon download).
* **Caching Rules:**
    * **Google Fonts:** `CacheFirst` (1-year expiration).
    * **Firebase Storage:** `StaleWhileRevalidate` (Images/Personas).
    * **Exclusions:** Firebase Auth endpoints (`/__/auth`) are explicitly denied caching to prevent infinite login loop bugs.

## 3. CI/CD & Secrets (The "Nuclear" Protocol)
**Pipeline:** GitHub Actions (`.github/workflows/deploy.yaml`)

We use a "Nuclear" strategy for environment variables to support Vite's build process securely.
1. **Injection:** GitHub Actions does *not* pass secrets as shell variables.
2. **Materialization:** The workflow writes a physical `.env` file to the runner's disk immediately before `npm run build`.
3. **Destruction:** The runner is ephemeral; the file is destroyed post-build.

**Dependency Vulnerability Gate (PROJ-96):** The `verify` job hard-fails on new high/critical production-dependency vulnerabilities via `npm audit --omit=dev`, scoped separately per npm workspace (root, `functions/`) since each has its own lockfile. Documented, non-forceable exceptions (dependencies where the only fix is a breaking major bump and the vulnerable code path doesn't apply to how this app uses the library) are tracked in `docs/RUNBOOK.md` rather than silently allowlisted.

**Rollback:** See `docs/RUNBOOK.md` for the Firebase Hosting / Cloud Functions / Firestore rules rollback procedure — there is no atomic rollback for the latter two, only git revert + a full CI re-run.

## 4. Database Infrastructure
**Platform:** Cloud Firestore (NoSQL)

### A. Security Rules (`firestore.rules`)
* **RBAC:** Admin access is verified via Custom Claims (`request.auth.token.admin == true`) — `AuthContext.tsx` also currently OR's in a Firestore `role === 'admin'` fallback client-side, deliberately not yet converged (PROJ-99 Phase 5 added telemetry to make that convergence safe to do later, rather than removing the fallback on a guess).
* **Tenancy:** Standard users can only read/write documents where `resource.data.uid == request.auth.uid`.
* **Shape/size validation (PROJ-99):** `journals` and `game_saves` — the two highest-payload collections — additionally validate field types/required-fields on every write, and a byte-size ceiling on create only (50KB/200KB respectively). The remaining collections (`tasks`, `insights`, `service`, `game_progress`) are tenancy-only, same as before.

### B. Indexing (`firestore.indexes.json`)
Composite indexes are required for complex queries:
* **Journals:** `uid` (Asc) + `createdAt` (Desc) [For Timeline].
* **Journals:** `uid` (Asc) + `tags` (Array-contains) + `createdAt` (Desc) [For Tool History — PROJ-99; also serves the tags-only prefix query `useSmartToolCompletions.ts` uses].
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
* [ ] **Container:** Does `npm run dev` start without manual config on port 5175?
* [ ] **PWA:** Does the Service Worker cache Google Fonts? (Check Network Tab).
* [ ] **Build:** Run `npm run build`. Does `dist/assets` contain split chunks (e.g., `firebase-xxxx.js`)?
* [ ] **Secrets:** Deploy to DEV. Does `import.meta.env.VITE_GEMINI_API_KEY` exist in the console?
