# Google Play Store Submission Readiness Report

**My Recovery Toolkit (MRT) · Submission Gap Analysis & Action Plan**

*   **Audit Date:** July 2026
*   **Target Package Name:** `ca.myrecoverytoolkit.app`
*   **Target Production Domain:** `https://www.myrecoverytoolkit.ca`
*   **Target Delivery Method:** Trusted Web Activity (TWA) via Google Bubblewrap
*   **Signing Keystore:** `mrt-release.keystore` (located in workspace root)

---

## 1. Executive Summary

This report evaluates the readiness of the My Recovery Toolkit (MRT) codebase for its first submission to the Google Play Store. Because MRT is designed as an offline-first Progressive Web App (PWA) built on Vite, React, and Firebase, the most efficient and native-aligned packaging strategy is deploying a **Trusted Web Activity (TWA)** using Google’s official **Bubblewrap** toolchain. 

Our audit has identified **5 primary gaps** that must be resolved prior to submission to prevent app rejection, compiler errors, or a poor user experience (such as the browser URL bar remaining visible to users).

### Key Gap Findings at a Glance

| Area | Impact | Description | Action Required |
| :--- | :--- | :--- | :--- |
| **PWA Manifest** | 🔴 Critical | `vite.config.ts` lacks core properties (`display`, `start_url`, etc.) required for PWA installation and TWA packaging. | Add missing parameters to the `manifest` block in [vite.config.ts](file:///workspaces/MRT2/vite.config.ts). |
| **AssetLinks Signature** | 🟡 High | The local keystore signature is configured, but Google Play App Signing will replace the signature in production. | Append the Google Play Console certificate SHA-256 fingerprint to [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json). |
| **Account Deletion** | 🟡 High | Google Play requires a web-accessible URL for requesting account deletion alongside the in-app deletion button. | Set up a static route/page (e.g. `/delete-account`) on the hosted domain. |
| **Legal Accessibility** | 🟢 Moderate | Privacy Policy and Terms of Service documents exist in the repo but are not linked anywhere in the active client UI. | Add legal footer links to [Login.tsx](file:///workspaces/MRT2/src/pages/Login.tsx) and [Profile.tsx](file:///workspaces/MRT2/src/pages/Profile.tsx). |
| **Mobile UX Polish** | 🟢 Moderate | Browser-like behaviors (pull-to-refresh, double-tap zoom, small touch targets) interfere with a "native app" feel. | Apply mobile-only CSS overrides and expand color swatch targets to `44px` or `48px`. |

---

## 2. Architectural Path: PWA to TWA (Bubblewrap)

Deploying a Trusted Web Activity (TWA) is the optimal packaging path for MRT:
*   **Zero-Knowledge Integrity:** It leverages the same encrypted client-side IndexedDB caches and Firebase Auth/Firestore pipeline. Sensitive data decrypted at the UI boundary never touches native wrapper layers.
*   **Offline-First Native Loading:** The service worker built via `vite-plugin-pwa` serves cached assets locally instantly, satisfying the Play Store's requirement that apps function offline without displaying browser errors.
*   **Continuous Updates:** Changes deployed to Firebase Hosting are reflected immediately in the installed app without needing to re-submit new builds to the Play Store (unless native configurations or app certificates change).

---

## 3. Web App Manifest Audit

### Current Configuration
In [vite.config.ts](file:///workspaces/MRT2/vite.config.ts#L12-L37), the `VitePWA` plugin defines a basic web app manifest. However, it is missing critical keys that Google Play / Android TWA shells require to identify the app as a valid fullscreen application.

### Identified Gaps
1.  **Missing `display`:** Without `display: 'standalone'`, Android will open the PWA inside a browser window showing a URL bar.
2.  **Missing `start_url`:** The starting URL parameter must be explicitly set to ensure navigation starts at the app root `/`.
3.  **Missing `background_color`:** Necessary for the Android splash screen generator to match the app background while loading.
4.  **Missing `orientation`:** Lock screen orientation to `portrait` to ensure a consistent mobile experience (matching the layouts designed for David, Ned, and Maya).
5.  **Missing `id`:** The identity key ensures that user shortcuts and local storage remain unified.

### Recommended Configuration Update
Modify the `VitePWA` options in [vite.config.ts](file:///workspaces/MRT2/vite.config.ts#L12-L37) to incorporate these properties:

```diff
       manifest: {
         name: 'My Recovery Toolkit',
         short_name: 'MRT',
         description: 'A Buddhist-inspired and 12-step recovery companion toolkit.',
-        theme_color: '#2563eb',
+        theme_color: '#2563eb',
+        background_color: '#f8fafc', // Matching Slate-50 background of the App Shell
+        display: 'standalone',
+        start_url: '/',
+        id: 'ca.myrecoverytoolkit.app',
+        orientation: 'portrait',
         icons: [
           {
             src: 'pwa-192x192.png',
             sizes: '192x192',
             type: 'image/png',
             purpose: 'any'
           },
```

---

## 4. Digital Asset Links (`assetlinks.json`) Verification

Trusted Web Activities use Digital Asset Links to prove that the app creator owns the hosted domain. If this verification fails, the app launches with the browser address bar visible, violating Play Store design requirements.

### Existing Status
The project contains [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json) pointing to:
*   **Package Name:** `ca.myrecoverytoolkit.app`
*   **SHA-256 Certificate Fingerprint:** `EA:86:AB:FE:7E:34:04:A1:00:85:57:F9:8F:7E:5D:82:5C:BA:45:91:7C:27:55:37:28:3D:4D:E2:4D:C8:D9:97`

### Critical Gap: The Google Play App Signing Trap
When building the app locally using `bubblewrap` and the local keystore `mrt-release.keystore`, the generated package will match the fingerprint in [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json). 

However, when submitting to the Play Store:
1.  **Google Play App Signing** is mandatory for new apps. Google strips the local developer signature and replaces it with a Google-managed production signing key.
2.  Users downloading the app from the Play Store will run a version signed by Google's key, causing AssetLinks verification to **fail silently** (since the signatures won't match), and exposing the URL bar.

### Remediation Steps
1.  Upload the initial app bundle (`.aab`) to the Google Play Console (Internal Testing track).
2.  Navigate to **Setup** > **App Integrity** > **App Signing** tab.
3.  Locate the **App signing key certificate** and copy the **SHA-256 fingerprint**.
4.  Update [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json) to contain **both** signatures (the local keystore for local debugging and the Google Play key for production):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ca.myrecoverytoolkit.app",
      "sha256_cert_fingerprints": [
        "EA:86:AB:FE:7E:34:04:A1:00:85:57:F9:8F:7E:5D:82:5C:BA:45:91:7C:27:55:37:28:3D:4D:E2:4D:C8:D9:97",
        "INSERT_GOOGLE_PLAY_CONSOLE_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

---

## 5. Google Play Developer Policy Compliance

### Gap A: Web-Based Account Deletion Link
Google Play’s **Data Safety & Account Deletion Policy** dictates that if your app allows users to create an account, you must provide a web link where users can request their account and associated data be deleted without needing to reinstall the app.
*   **Current Status:** In-app account deletion is implemented cleanly in [DataManagement.tsx](file:///workspaces/MRT2/src/components/profile/DataManagement.tsx) (wipes IndexedDB and triggers Firebase Auth deletion). No web-based path exists.
*   **Remediation:** Create a static, unauthenticated route or HTML file at `/delete-account` on `www.myrecoverytoolkit.ca` featuring a simple form that initiates the account deletion sequence (or provides clear instructions on how users can wipe their data remotely by logging in via a web browser).

### Gap B: Privacy Policy & Terms Link in UI
Google requires the Privacy Policy to be accessible both on the Play Store listing page and **from within the app's user interface**.
*   **Current Status:** [PRIVACY_POLICY.md](file:///workspaces/MRT2/docs/legal/PRIVACY_POLICY.md) and [TERMS_OF_SERVICE.md](file:///workspaces/MRT2/docs/legal/TERMS_OF_SERVICE.md) are saved in the project files but are not exposed in the React application.
*   **Remediation:** 
    1. Place copies of these files in `public/legal/privacy.html` and `public/legal/terms.html` during the build or host them dynamically.
    2. Add text links in [Login.tsx](file:///workspaces/MRT2/src/pages/Login.tsx) below the "Privacy Guarantee" and in the footer of the General section in [Profile.tsx](file:///workspaces/MRT2/src/pages/Profile.tsx).
    
    *Example update in [Login.tsx](file:///workspaces/MRT2/src/pages/Login.tsx) footer area:*
    ```tsx
    <div className="mt-8 text-center text-xs text-slate-500 space-x-4">
      <a href="/legal/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
      <span>•</span>
      <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms of Service</a>
    </div>
    ```

### Gap C: Data Safety Declaration (Zero-Knowledge Explanation)
Since MRT handles sensitive recovery data (journals, urges, sponsors, workbooks), we must be extremely precise in the Play Store Data Safety Questionnaire:
*   **Data Collection & Encryption:** Declare that all sensitive user data (journals, workbook answers, sponsee notes) is **encrypted in transit and encrypted at rest**.
*   **Zero-Knowledge Boundary:** Emphasize that the server holds zero visibility over journal text because it is encrypted client-side via AES-GCM before storage (using the cryptographic key pipeline in [crypto.ts](file:///workspaces/MRT2/src/lib/crypto.ts)).
*   **Unencrypted Metadata:** Clarify that unencrypted data is collected solely for essential app functionality, including:
    *   *Authentication:* User email (Firebase Auth)
    *   *Telemetry:* Anonymized usage events and crash reports (PostHog, verified non-identifiable)
    *   *App Operations:* Push notifications tokens, active timezone, and appearance settings (stored unencrypted as metadata in `users/{uid}`).

---

## 6. Mobile UX & Native Optimizations

To deliver a polished native experience matching the "Vibrant Momentum" design guidelines, we must disable standard browser conventions that detract from the application experience.

### Gap A: Browser Pull-to-Refresh
When swiping downwards near the top of the viewport on Android, Chrome's native pull-to-refresh will reload the SPA, resetting active React state and wiping sessionStorage (which drops the user's unlocked PIN/Pepper cache).
*   **Remediation:** Prevent this gesture globally in CSS. Add the following to `src/index.css`:
    ```css
    body {
      overscroll-behavior-y: contain; /* Prevents pull-to-refresh */
    }
    ```

### Gap B: Text Selection Highlights
Accidental double-taps on navigation items or action buttons (such as check-in triggers or the SOS button) can highlight them with the browser’s blue selection mask, exposing the web-wrapper nature of the TWA.
*   **Remediation:** Apply user-select styling to all interactive components in your global CSS:
    ```css
    button, 
    a, 
    [role="button"],
    .nav-item {
      -webkit-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    ```

### Gap C: Touch Target Sizes
As documented in the [profile-gap-analysis.md](file:///workspaces/MRT2/docs/reports/profile-gap-analysis.md#L69-L71), the hero-color swatches render at `36px` which is below the design system's own `44px` target floor and the Google Accessibility standard of `48px`.
*   **Remediation:** Adjust swatch containers in `src/pages/Profile.tsx` (or custom color-picker lists) to utilize a minimum spacing size of `44px` or `48px` to prevent misclicks on touch devices.

---

## 7. Remediation Action Plan

This plan organizes the necessary adjustments into two manageable phases leading up to the Google Play Store submission.

### Phase 1: Pre-Submission Code Fixes (Next Development Sprint)
1.  **Configure PWA Manifest:** Implement the recommended `background_color`, `display: 'standalone'`, and `orientation` properties in [vite.config.ts](file:///workspaces/MRT2/vite.config.ts).
2.  **Embed Legal Links:** Map routes/links for the Privacy Policy and Terms of Service in [Login.tsx](file:///workspaces/MRT2/src/pages/Login.tsx) and [Profile.tsx](file:///workspaces/MRT2/src/pages/Profile.tsx).
3.  **Deploy Delete-Account Webpage:** Write a simple static HTML file at `public/delete-account.html` that describes how users can delete their accounts (this page will be uploaded automatically to Firebase Hosting during the normal build and deploy pipeline).
4.  **Add CSS Mobile Overrides:** Incorporate `overscroll-behavior-y` and `user-select` modifications into your global style files.

### Phase 2: Bubblewrap Build & Asset Verification (Release Engineering)
1.  **Generate Production Web Assets:** Run `npm run check` and deploy the output to Firebase Hosting (`firebase deploy`).
2.  **Initialize Bubblewrap:** Install bubblewrap CLI (`npm install -g @bubblewrap/cli`) and initialize the Android project:
    ```bash
    bubblewrap init --manifest=https://www.myrecoverytoolkit.ca/manifest.webmanifest
    ```
3.  **Integrate Keystore:** Point Bubblewrap to the existing `/workspaces/MRT2/mrt-release.keystore` and specify the keystore alias and passwords.
4.  **Build Release Artifacts:** Run the build script to produce a production Android App Bundle:
    ```bash
    bubblewrap build
    ```
5.  **Configure Play Console App Signing:** Upload the `.aab` to the Internal Testing track, copy the SHA-256 fingerprint, and update [assetlinks.json](file:///workspaces/MRT2/public/.well-known/assetlinks.json) before doing the final web deploy.

---

## Appendix: Useful Developer Reference Commands

### Verifying Keystore SHA-256 Fingerprint
To check the SHA-256 signature fingerprint of your local keystore to ensure it matches the first entry in your `assetlinks.json`:
```bash
keytool -list -v -keystore mrt-release.keystore
```

### Checking Public AssetLinks Endpoint Headers
Google Play Console verification requires `assetlinks.json` to be served with the correct `application/json` Content-Type and with a HTTP 200 success code. Verify this from the terminal using:
```bash
curl -I https://www.myrecoverytoolkit.ca/.well-known/assetlinks.json
```
*(Verify that the response includes: `Content-Type: application/json`)*
