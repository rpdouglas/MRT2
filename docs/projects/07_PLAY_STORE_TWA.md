# 📁 Project PROJ-07: Play Store TWA

**Status:** 🟡 Active (Sprint 9.1 is Active; Sprint 9.2 is Blocked)
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

### 🏃 Sprint 9.1: Pre-Submission & PWA Optimizations (UNBLOCKED)

#### Epic 1: PWA Manifest Hardening
*   Update [vite.config.ts](file:///workspaces/MRT2/vite.config.ts) to define full installability properties.
*   Properties to add:
    *   `display: 'standalone'`
    *   `start_url: '/'`
    *   `background_color: '#f8fafc'`
    *   `id: 'ca.myrecoverytoolkit.app'`
    *   `orientation: 'portrait'`

#### Epic 2: Mobile UX & Native Overrides
*   Prevent browser "pull-to-refresh" gestures globally (which resets `sessionStorage` PIN caches) by adding `overscroll-behavior-y: contain` to `body` in `src/index.css`.
*   Disable browser text-selection highlights on interactive components (`user-select: none`).
*   Verify and resize all touch targets (like color swatches in [Profile.tsx](file:///workspaces/MRT2/src/pages/Profile.tsx)) to satisfy the minimum `44px` (design system) / `48px` (Android accessibility) floor.

#### Epic 3: Google Play Policy Compliance
*   **UI Footers:** Add clickable links to the Login and Profile screens referencing the hosted privacy policy and terms.
*   **Web Deletion Link:** Implement an interactive `/delete-account` web route. When visited, it should prompt the user for their email and password, authenticate, and call the existing account deletion logic (wiping Firestore and Auth records) client-side.

---

### 🚧 Sprint 9.2: TWA Compilation & Release (BLOCKED ON DUNS)

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

*   **[ ] Unit Tests:** Write tests for the `/delete-account` route to ensure it runs authentication checks and triggers profile deletions without exceptions.
*   **[ ] The Subway Test (Offline Resilience):** Load the app in Airplane mode. Verify the service worker serves static pages and routes cleanly, and the app warns of offline mode without crashing or hanging.
*   **[ ] TWA Verification:** Build the TWA shell locally. When running in the Android Emulator, verify that the browser URL bar is hidden, indicating that the local `assetlinks.json` verification was successful.
