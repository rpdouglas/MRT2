# 📐 Feature Spec: User Guide & Onboarding

**Status:** Live (v4.0)
**Context:** In-app education and PWA installation support.
**Primary Code:** `src/pages/UserGuide.tsx`, `src/components/PWAInstallBanner.tsx`

## 1. The Interactive Handbook
A native, scrollable guide available via the Profile page.
* **Visuals:** Uses architectural placeholders (CSS-styled containers) to represent Pixel 9 Pro XL screenshots, ensuring the guide evolves with the design system without needing constant image updates.
* **Content:** Covers the "4 Pillars" of the app:
    1.  **The Horizon:** Dashboard & Clean Time.
    2.  **The Vault:** Security & Encryption.
    3.  **The Deep Dive:** Journaling & AI.
    4.  **The Pulse:** Vitality & Breathwork.

## 2. PWA Installation Engine
* **Component:** `PWAInstallBanner.tsx`.
* **Logic:**
    * **Android/Desktop:** Listens for the `beforeinstallprompt` event and triggers the native install modal.
    * **iOS:** Detects User Agent (`iPhone|iPad`) + `!navigator.standalone`. Renders custom instructions ("Tap Share -> Add to Home Screen").
* **Persistence:** Uses `localStorage` to dismiss the banner permanently if the user opts out.

## 3. Verification
* [ ] **iOS Detection:** Open in Safari Dev Tools (User Agent iPhone). Does the custom iOS instruction appear?
* [ ] **Navigation:** Does the "Back" button in the Guide return to Profile?
