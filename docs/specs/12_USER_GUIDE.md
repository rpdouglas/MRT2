# 📐 Feature Spec: User Guide & Onboarding

**Status:** Live (v4.1)
**Context:** External education site and PWA installation support.
**Primary Code:** `docs-site/` (published VitePress site), link-out from `src/pages/Profile.tsx` ("View User Guide") and `src/pages/Links.tsx` ("Install App Guide"), `src/components/PWAInstallBanner.tsx`

## 1. The Published Guide
There is no native in-app guide component — `src/pages/UserGuide.tsx` does not exist in the codebase. The guide is a standalone VitePress static site (`docs-site/`) published to `https://rpdouglas.github.io/MRT2/`. The Profile page and the Links page link out to it in a new tab; the app itself does not render guide content inline.
* **Visuals:** Guide pages embed persona-themed screenshots (e.g. `/screenshots/ned-tasks.webp`) captured from the live app, not architectural placeholders.
* **Content:** Organized by feature page, matching the in-app "My X" nav labels (`src/components/AppShell.tsx`): My Dashboard, My Journal, My Tasks, My Vitality, My Workbooks, My Insights, plus CBT Tools, Daily Readings, Account & Vault setup, and Exports & Data. See `docs-site/.vitepress/config.mts` for the current sidebar structure and `docs/projects/66_USER_GUIDE_RELABEL_SYNC.md` for the terminology-sync history.

## 2. PWA Installation Engine
* **Component:** `PWAInstallBanner.tsx`.
* **Logic:**
    * **Android/Desktop:** Listens for the `beforeinstallprompt` event and triggers the native install modal.
    * **iOS:** Detects User Agent (`iPhone|iPad`) + `!navigator.standalone`. Renders custom instructions ("Tap Share -> Add to Home Screen").
* **Persistence:** Uses `localStorage` to dismiss the banner permanently if the user opts out.

## 3. Verification
* [ ] **iOS Detection:** Open in Safari Dev Tools (User Agent iPhone). Does the custom iOS instruction appear?
* [ ] **Navigation:** Does the "View User Guide" link on Profile and the "Install App Guide" link on Links open the published site in a new tab?
