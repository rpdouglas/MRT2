# 📁 Project PROJ-07: Play Store TWA

**Status:** ⏸️ **Paused 2026-09-03 — by choice, not blocked.** User is pausing Play Store submission work to focus on marketing materials; nothing below is a hard blocker on resuming, this is a deliberate hold. Sprint 9.1 implemented and code-verified 2026-07-19 (Epics 1-3; see §4/§5). Sprint 9.2 (Epic 4) substantially complete: TWA built, signed, uploaded to Internal Testing (release 6, v1.9.11), device-verified working (correct icon, no URL bar — a real `www`-subdomain-redirect Digital Asset Links bug was found and fixed along the way).

**Resume-here checklist (2026-09-03):**
- ✅ App-content checklist (11/11), Health apps declaration, TWA build/upload/device verification, most of Store Listing (description/icon/feature graphic/screenshots/category drafted and walked through live in Play Console).
- ⬜ **Content rating questionnaire (IARC)** — not started. See `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` Phase 9 for prep guidance (expect a "Teen" rating outcome due to substance-reference content, discussed in a recovery/non-glamorized framing).
- ⬜ **Confirm every Data Safety category is actually saved** in the live Play Console form (Personal info, Financial info, Device/other IDs, Location) — top-level questions and a couple of categories were entered live 2026-09-03 per `docs/legal/PLAY_STORE_DATA_SAFETY_DRAFT.md`, but full completion wasn't confirmed.
- ⬜ **The Subway Test** (offline/airplane-mode check) — not yet performed.
- ⬜ **PROJ-105 (Play Billing)** — separately blocked (not paused) on Play Console payment-method verification, account-side, no ETA; check back periodically. A dev/emulator mock purchase path now exists to test the full flow without waiting — see `docs/projects/105_PLAY_BILLING_TWA.md`.
- **Key 2026 policy finding, still valid on resume:** this Play Console account is an Organization account, exempt from the "12 testers / 14 days" closed-testing gate Google requires of new personal accounts — the promotion path is Internal Testing → Production directly. See `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` Phase 9 for the full researched breakdown.
- ✅ **Android 15/16 App Vitals hardening (2026-09-05):** Play Console flagged 4 recommendations against release 6 (v1.9.11) — edge-to-edge not handled, deprecated status/nav-bar color APIs, a locked-orientation restriction Android 16 will start ignoring on large screens, and R8 optimization not enabled. All 4 fixed directly in `~/mrt-android` (bumped `androidbrowserhelper` 2.6.2→2.7.3, `orientation` "portrait"→"default", `minSdkVersion` 21→23 required by the library bump, added `proguardFiles`/`proguard-rules.pro`) and verified with a real `./gradlew bundleRelease` build — R8 `mapping.txt` now present, `androidbrowserhelper:2.7.3`'s bytecode confirmed calling `WindowCompat.enableEdgeToEdge()`. Bumped to `appVersionCode` 7 / `appVersionName` "1.9.12" (synced with `package.json`). Full steps now in `docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md` Phase 3.5 — **must be re-applied after every future `bubblewrap update`**, since two of the four fixes are manual overrides Bubblewrap's own template reverts/deletes. ⬜ **Still needed:** run `bubblewrap build` (interactive keystore password, not done in-session) to produce the final signed AAB, then a real-device install/verification pass before uploading — the unsigned build was verified by static/compile checks only, no emulator available in this environment.
**Primary Persona:** All (David, Ned, Maya, Walt, Lisa)
**Objective:** Package the My Recovery Toolkit (MRT) Progressive Web App into an Android package (AAB/APK) using Google Bubblewrap (TWA) and resolve all Google Play Store compliance and mobile UX requirements.

---

## 1. The Executive Summary
**User Story:**
* **As** any MRT user (from David in acute crisis to Lisa supervising sponsees),
* **I want to** install My Recovery Toolkit directly from the Google Play Store,
* **so that** I can launch the app instantly from my app drawer without browser chrome, access tools offline, and receive milestone notifications seamlessly.

**Competitive Gap:**
Unlike competitors (e.g., *I Am Sober*, *Reframe*) which require downloading heavy native applications that store unencrypted personal disclosure data in server-side databases, MRT's TWA delivers zero-knowledge, client-side encrypted recovery tracking (via AES-GCM) with the simplicity and automated updates of a PWA.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section must be completed before any code is written.*
*   **[x] Data Sensitivity:** This feature handles the user profile metadata, push tokens, and account deletion requests. It does NOT touch, log, or expose unencrypted journal or workbook contents.
*   **[x] Encryption Strategy:** All sensitive user disclosures remain protected by `src/lib/crypto.ts`. Deletion scripts must wipe local credentials and trigger Firestore deletion rules to purge encrypted user records.
*   **[x] Key Rotation:** No modifications to the key rotation system are required. Pin rotation will execute normally inside the TWA wrapper.

---

## 3. Schema & Architecture 🗄️

This project requires configuration adjustments but no new database collections.

**Files Impacted:**
*   [vite.config.ts](file:///workspaces/MRT2/vite.config.ts): Updating the `VitePWA` manifest settings.
*   [firebase.json](file:///workspaces/MRT2/firebase.json): Confirming headers for `/.well-known/assetlinks.json`.
*   [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json): Appending Play Store signatures.
*   [Login.tsx](file:///workspaces/MRT2/src/pages/Login.tsx): Adding Privacy and Terms footer links.
*   [Profile.tsx](file:///workspaces/MRT2/src/pages/Profile.tsx): Adding Privacy and Terms footer links.
*   `src/index.css`: Injecting native mobile overrides.

---

## 4. Implementation Phases (Epics & Sprints)

The project is structured into **4 Epics** split across two development sprints to accommodate the Google Play Developer account DUNS verification block.

```mermaid
gantt
    title PROJ-07 Project Schedule
    dateFormat  YYYY-MM-DD
    section Sprint 9.1 (Active)
    Epic 1: PWA Manifest Updates    :active, ep1, 2026-07-17, 3d
    Epic 2: Mobile UX Overrides     :active, ep2, 2026-07-18, 3d
    Epic 3: Play Policy Compliance  :active, ep3, 2026-07-19, 4d
    section Sprint 9.2 (Blocked on DUNS)
    Epic 4: TWA Build & Submission  :milestone, ep4, 2026-07-24, 5d
```

### 🏃 Sprint 9.1: Pre-Submission & PWA Optimizations — ✅ Implemented 2026-07-19

#### Epic 1: PWA Manifest Hardening — ✅ Done
*   `vite.config.ts`'s `VitePWA` manifest now includes `display: 'standalone'`, `start_url: '/'`, `background_color: '#f8fafc'`, `id: 'ca.myrecoverytoolkit.app'`, `orientation: 'portrait'`. Confirmed via build output: `manifest.webmanifest` grew from 0.50 kB to 0.56 kB.

#### Epic 2: Mobile UX & Native Overrides — ✅ Done
*   `overscroll-behavior-y: contain` added to `body` in `src/index.css`.
*   `user-select: none` + `-webkit-tap-highlight-color: transparent` added, scoped to `button`, `a`, `[role="button"]` — deliberately excludes text inputs/textareas, which still need normal text selection.
*   Touch targets: the Profile.tsx hero-color swatches this Epic originally flagged were already fixed to `h-11 w-11` (44px) by PROJ-58 — confirmed still in place, not re-broken. No broader touch-target regression found during this pass.

#### Epic 3: Google Play Policy Compliance — ✅ Done
*   **UI Footers:** Privacy Policy / Terms of Service links added to `Login.tsx` (below the Google sign-in button) and `Profile.tsx` (General tab, below the "View User Guide" card) — both link to the already-published `docs-site` pages (`https://rpdouglas.github.io/MRT2/privacy` / `/tos`), the same GitHub Pages base PROJ-17's changelog link already established, rather than duplicating the legal text into a new static file.
*   **Web Deletion Link:** New public route `/delete-account` (`src/pages/DeleteAccount.tsx`) — prompts for email/password or Google sign-in, authenticates fresh (distinct from `AccountDeletionModal.tsx`'s re-auth of an *already active* session, since a visitor here may have no session on this browser/device at all), shows an explicit confirmation step, then runs `executeTotalAccountAnnihilation()` (Firestore shred) before `deleteAccount()` (Auth deletion) — same order and same underlying functions `AccountDeletionModal.tsx` already uses, not a parallel deletion implementation.

---

### 🚧 Sprint 9.2: TWA Compilation & Release (unblocked 2026-08-31 — Google Play Console verification complete)

#### Epic 4: Bubblewrap Wrapper and Submission
*   **Full step-by-step guide:** [`docs/PLAY_STORE_BUBBLEWRAP_GUIDE.md`](../PLAY_STORE_BUBBLEWRAP_GUIDE.md) — the complete Phase 0-9 walkthrough (install, init, signing, `assetlinks.json`, Play Console upload, store listing, submission). This section stays a summary; that doc is the one to follow when actually running the build.
*   **Local Build:** Initialize the Android project using Bubblewrap:
    ```bash
    bubblewrap init --manifest=https://www.myrecoverytoolkit.ca/manifest.webmanifest
    ```
*   **Signature Signing:** Configure Bubblewrap to sign the package using the root key `mrt-release.keystore`.
*   **App Integrity:** Upload the generated `.aab` (Android App Bundle) to the Google Play Console Internal Track, retrieve Google's signing fingerprint, and append it to [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json) to establish full verification.
*   **Production Deployment:** Submit to production review on the Google Play Store Console.

##### Pre-Submission Asset Audit (2026-08-31)
Repo-side review ahead of the local `bubblewrap init`/`build` steps — no build was run (no Android SDK/Play Console access in this environment), this only confirms what's already in the repo:
*   **[x] PWA manifest:** `vite.config.ts`'s `VitePWA` config is submission-ready — `id: 'ca.myrecoverytoolkit.app'`, `display: 'standalone'`, correct theme/background colors, portrait orientation.
*   **[x] Hi-res icon:** `public/pwa-512x512.png` — confirmed 512×512, 8-bit RGBA PNG. Meets Play Console's high-res icon spec as-is.
*   **[!] `assetlinks.json` fingerprint is a placeholder, not a real signing cert:** the `sha256_cert_fingerprints` value currently in [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json) was introduced incidentally in the PROJ-82 PostHog telemetry commit (`efe6ad0`), not from an actual signed build. It must be overwritten with the real upload-key fingerprint after Phase 3's `keytool -list`, then overwritten again with the Play App Signing cert fingerprint after Play Console enrollment (two separate deploys of `firebase deploy --only hosting`).
*   **[!] Store listing screenshots exist but are the wrong file format:** `public/Marketing/Screenshots/` has 40+ persona-driven, correctly-portrait-aspect (e.g. 800×1629, 1008×2244) screenshots generated by `npm run screenshots:generate` — but all as `.webp`. Play Console's store listing uploader only accepts PNG or JPEG. Convert a representative subset (recommend 4-8 covering Dashboard, Journal, Tools, Insights, Vitality) before the Store Listing step, e.g. `cwebp -d` reverse via `dwebp file.webp -o file.png`, rather than re-running the Playwright capture script.
*   **[ ] Feature graphic (1024×500) does not exist anywhere in the repo.** Required by Play Console's Store Listing page and not produced by `scripts/generate_screenshots.js`. Needs to be designed/exported separately (brand assets like `public/Marketing/MRT_Logo_Transparent.webp` are a starting point, but it's a distinct asset, not a resize of an existing one) before Phase 8 (Store listing compliance) can be completed.

---

## 5. QA & Verification 🧪

*   **[x] Unit Tests (2026-07-19):** `src/pages/__tests__/DeleteAccount.test.tsx` (5 tests) — sign-in form shown before confirmation; advances to confirm step on successful login; specific error message on wrong-password without proceeding; `executeTotalAccountAnnihilation()` confirmed called before `deleteAccount()` (assertion on `invocationCallOrder`, not just "both were called"); Google sign-in path calls `loginWithGoogle`. Full suite: 464/464 passing, `npm run check` clean (lint, 31/31 spec-quality, build).
*   **[ ] The Subway Test (Offline Resilience):** Not performed — needs a real device/emulator in Airplane mode; not exercisable in this sandboxed environment.
*   **[ ] TWA Verification:** Not performed — needs an actual built TWA shell (Sprint 9.2, not yet reached) to confirm the manifest/CSS changes produce a hidden URL bar in practice. Everything in this QA section up to this point is code-level verification (tests, build output, `tsc`), not a live-device confirmation.
*   **[x] Pre-Submission Asset Audit (2026-08-31):** See Epic 4 above — confirmed manifest/icon readiness, flagged the `assetlinks.json` placeholder fingerprint and the WebP-format/missing-feature-graphic store-listing gaps as open items ahead of Play Console submission.
