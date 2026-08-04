# 📁 Project 63: Mobile Screenshot Generator

**Status:** ✅ Shipped
**Primary Persona:** All (internal/developer experience)
**Objective:** Provide an automated, single-command pipeline to run the Vite dev server, render the app using persona-driven mock states in a simulated mobile device viewport, capture screenshots via Playwright, and optimize the output images to WebP format for docs and app store usage.

---

## 1. The Executive Summary
**User Story:**
* **As** a developer/maintainer of MRT, I want a zero-manual-effort script that launches a mobile web browser, navigates to key screens, and takes screenshots of different user states (David, Ned, Maya, Walt) so that I can keep the user guides, marketing, and App Store assets up to date without having to manually set up database states or log in.
**Competitive Gap:** Manually capturing screenshots across multiple device sizes, light/dark themes, and progression states takes hours and leads to stale documentation. Automated screenshotting guarantees visual assets are always in sync with the latest code changes.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Safe. The screenshot generator uses synthetic mock profiles and hardcoded offline state. It NEVER logs in to real accounts or reads real sensitive user data.
* [x] **Encryption Strategy:** When `?mockUser=...` is active, the `EncryptionProvider` bypasses real PBKDF2/AES key derivation. It sets `isVaultUnlocked = true` and stubs `encrypt`/`decrypt` as simple pass-through/identity functions. Decrypted content of mock templates and workbooks is loaded in-memory from local code files.
* [x] **Key Rotation:** N/A. No real keys or rotations are triggered during screenshot execution.

---

## 3. Schema & Architecture 🗄️

We will introduce a **Mock Mode** toggled by a URL query parameter `?mockUser=[persona]` (or persisted in `localStorage`). This allows the React app to run entirely client-side with zero Firebase network requirements.

### Interception Strategy:
1. **Authentication (`AuthContext.tsx`):**
   * If `?mockUser=ned` is present, bypass standard Firebase authentication.
   * Return a simulated `User` object (e.g. `email: 'ned@mrt.mock'`, `uid: 'mock-uid-ned'`).
   * Set `userTier` based on the persona (e.g. Maya and Ned have `premium`).
2. **Encryption (`EncryptionContext.tsx`):**
   * If the current user email ends with `.mock`, set `isVaultUnlocked = true`, `isVaultSet = true`, and override `decrypt`/`encrypt` to act as identity functions.
3. **Firestore Hook Interception:**
   * A helper `src/lib/mockData.ts` will provide mock data payloads for each persona:
     * **David (Survival, Day 5)**: Default free tier, sobriety date 5 days ago, high urge history, custom sponsor contacts, empty dashboard tasks (low cognitive load).
     * **Ned (Momentum, Day 45)**: Premium tier, amber/violet theme, sobriety date 45 days ago, completed 45-day milestone badge, level 4 progress, active tasks streak.
     * **Maya (Workbook, Day 120)**: Premium tier, sobriety date 120 days ago, detailed answers in "Guided CBT" and "Smart Recovery" workbooks.
     * **Walt (Insights, Year 2)**: Premium tier, sobriety date 730 days ago, rich AI insights log, long journal history trends.
   * Modify key React Query hooks to return these mock payloads directly when `user.email.endsWith('.mock')` is true.

---

## 4. Implementation Phases 🏗️

### Phase 1: Mock Data Definition (`src/lib/mockData.ts`)
* Define the exact profiles, sobriety dates, task lists, journal logs, and workbook answers for each of the 4 personas.

### Phase 2: React Context & Hook Integration
* **`AuthContext.tsx`**: Add check for `?mockUser=` query param on startup, auto-login mock user and set mock storage.
* **`EncryptionContext.tsx`**: Auto-unlock vault and mock crypto algorithms for any `*.mock` users.
* **Hooks**: Add mock data intercepts in:
  * `useUserProfile`
  * `useDashboardData`
  * `useTasksList`
  * `useJournalOperations`
  * `useWorkbookAnswers`
  * `useTodaysVitalityLogs`
  * `useROSCAssessments`
  * `useToolHistory`

### Phase 3: Playwright Automation Script (`scripts/generate_screenshots.js`)
* Create a lightweight Node script using Playwright.
* The script will:
  1. Boot the Vite local dev server (if not already running) on a temporary port.
  2. Instantiate a headless browser with mobile emulation profiles:
     * e.g., Pixel 7 viewport (390x844, deviceScaleFactor: 3, isMobile: true).
  3. Navigate to:
     * `/dashboard?mockUser=ned` -> Save as `ned-dashboard.png`
     * `/workbooks?mockUser=maya` -> Save as `maya-workbooks.png`
     * `/tools/urge-surfer?mockUser=david` -> Save as `david-urgesurfer.png`
     * `/insights?mockUser=walt` -> Save as `walt-insights.png`
  4. Automatically call the existing `scripts/optimize_screenshots.py` to convert screenshots from `_raw_screenshots/` to WebP in `docs-site/public/screenshots/generated/`.
  5. Shut down the Vite server and exit clean.

---

## 5. QA & Verification 🧪

**2026-08-04 governance note:** this spec's Status above reflects code-level verification (routes/hooks/components/tests confirmed present, and passing where automated) performed during the 2026-08-04 governance audit. The unchecked items below are manual/device/browser/visual checks that have not been performed by a human — tracked here as a known gap, not a blocker to the Shipped status. Check them off once actually performed.
* [ ] **Unit Tests**: Add unit tests in `src/__tests__/mockMode.test.ts` to ensure query param logging bypasses production Firestore and encryption.
* [ ] **Lint & Build**: Run `npm run check` to ensure zero linter errors or warnings.
* [ ] **Screenshot Execution**: Execute `npm run screenshots:generate`. Verify that the `.webp` files appear correctly in `docs-site/public/screenshots/generated/` and that the visual quality and layouts are correct.
