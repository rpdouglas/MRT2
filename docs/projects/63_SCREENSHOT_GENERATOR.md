# 📁 Project 63: Mobile Screenshot Generator

**Status:** ✅ Shipped (core pipeline) — 🟡 Coverage completion in progress, see Phase 6
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

---

## 6. Coverage Completion (2026-09-04 audit)

**Trigger:** the user asked to cross-check every screenshot against the full `docs/screens/` reference set (built in a prior session, 55 files) — one screenshot per documented screen, refreshed for screens that have since changed, with realistic (not empty) data everywhere.

### 6.1 Audit findings

- **Coverage gap:** `scripts/generate_screenshots.js`'s `targets` array covers **27 of 55** documented screens. No target exists for: 3 of 4 Admin sub-tabs (Analytics, Health, Maintenance — only Users is captured), 8 of 9 individual CBT tool screens (only Thought Record is captured), Tools History, Profile → Achievements, the 3 Recovery Capital/ROSC sub-screens split out of Insights this session, Workbook Detail/Session, Tasks → Later, Welcome/Login/Links, Delete Account, and Debug Tools.
- **Legacy/current split:** `docs-site/public/screenshots/` holds 45 files across two conventions — 27 in the current `<persona>-<screen>.webp` naming (this pipeline) and **18 orphaned `scn_*.webp` files** predating PROJ-63's mock-data approach. Several of those 18 are the *only* existing coverage for a screen (`scn_workbook_question.webp`, `scn_workbook_section_intro.webp`, `scn_profile_data.webp`, `scn_tasks_log.webp`) and were never ported into the current pipeline or indexed consistently in `docs/SCREENSHOTS_INDEX.md` alongside the newer set.
- **Root cause of "empty" screenshots, confirmed in code:** `src/lib/mockData.ts`'s `getMockProfile()`/`getMockTasks()`/`getMockJournals()`/etc. only branch on `ned`/`maya`/`david`/`walt` — every other case falls through to `null`/`[]`. `AuthContext.tsx`'s mock-login bypass, by contrast, accepts *any* `?mockUser=<name>` and logs the user in regardless. So **Jordan, Lisa, and Admin can reach any route in mock mode but get no profile/task/journal data** — the 3 existing Jordan/Lisa screenshots happen to be self-contained game screens that don't need that data, which is why the gap hasn't surfaced yet. Any new non-game screenshot for those three personas would render blank without first extending `mockData.ts`.

### 6.2 Approach considered and rejected

Generating screenshot-style images directly with an AI image model was considered and rejected — `CLAUDE.md`'s Asset Protocol section explicitly prohibits this ("Never use it to... fabricate app-screenshot-style UI imagery — Play Store listing screenshots must be real captures"), and it would defeat the purpose: `docs/screens/` is code-verified against live source, and an AI-drawn image stops being accurate the moment a real component changes.

### 6.3 Chosen approach

Extend the existing mock-data + Playwright pipeline (this project) rather than build a new mechanism:

1. Fill the `mockData.ts` gaps — add Jordan/Lisa/Admin profile+task+journal fixtures, plus new fixtures needed for previously-uncovered screens (tool-history entries per CBT tool, ROSC trend/snapshot data, achievements data, admin sub-tab data, workbook detail/session answers). This is where AI-authored *content* (realistic-sounding journal snippets, tool reflections, ROSC narrative text) is the right use of "AI generation" here — populating real data structures the real app renders, not drawing fake pixels.
2. Add the ~28 missing routes to `generate_screenshots.js`'s `targets` array (including any `action` callbacks needed to reach sub-states, per the existing `david-sos-modal`/`walt-journal-ai-wizard` pattern).
3. Run the real pipeline (`npm run screenshots:generate`) — genuine Playwright captures of the real running app, zero fabrication.
4. Retire the 18 orphaned `scn_*.webp` files once their screens are re-captured under the current naming convention; delete rather than leave both sets live.
5. Update `docs/SCREENSHOTS_INDEX.md` so every `docs/screens/*.md` file maps to exactly one current screenshot, and add a cross-reference from each `docs/screens/*.md` file back to its screenshot (mirroring how `docs/marketing/` briefs already cross-reference `docs/screens/`).

Tracked as `TD-31` in `docs/ACTIVE_CYCLE.md`.
