# 📁 Project PROJ-07: Play Store TWA

**Status:** 🟡 In Progress — Sprint 9.1 implemented and code-verified 2026-07-19 (Epics 1-3; see §4/§5). Sprint 9.2 still blocked on Google Play Console verification steps (DUNS received).
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

### 🚧 Sprint 9.2: TWA Compilation & Release (BLOCKED ON GOOGLE PLAY CONSOLE VERIFICATION)

#### Epic 4: Bubblewrap Wrapper and Submission
*   **Local Build:** Initialize the Android project using Bubblewrap:
    ```bash
    bubblewrap init --manifest=https://www.myrecoverytoolkit.ca/manifest.webmanifest
    ```
*   **Signature Signing:** Configure Bubblewrap to sign the package using the root key `mrt-release.keystore`.
*   **App Integrity:** Upload the generated `.aab` (Android App Bundle) to the Google Play Console Internal Track, retrieve Google's signing fingerprint, and append it to [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json) to establish full verification.
*   **Production Deployment:** Submit to production review on the Google Play Store Console.

---

## 5. QA & Verification 🧪

*   **[x] Unit Tests (2026-07-19):** `src/pages/__tests__/DeleteAccount.test.tsx` (5 tests) — sign-in form shown before confirmation; advances to confirm step on successful login; specific error message on wrong-password without proceeding; `executeTotalAccountAnnihilation()` confirmed called before `deleteAccount()` (assertion on `invocationCallOrder`, not just "both were called"); Google sign-in path calls `loginWithGoogle`. Full suite: 464/464 passing, `npm run check` clean (lint, 31/31 spec-quality, build).
*   **[ ] The Subway Test (Offline Resilience):** Not performed — needs a real device/emulator in Airplane mode; not exercisable in this sandboxed environment.
*   **[ ] TWA Verification:** Not performed — needs an actual built TWA shell (Sprint 9.2, not yet reached) to confirm the manifest/CSS changes produce a hidden URL bar in practice. Everything in this QA section up to this point is code-level verification (tests, build output, `tsc`), not a live-device confirmation.
