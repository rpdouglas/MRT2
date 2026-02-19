# 🤝 Project 05: The "Lisa" Service Module

**Objective:** Build the "Digital Rolodex" for sponsors to manage sponsees securely.
**Status:** ⚪ Planned
**Personas Involved:** Lisa (The Service Superstar)

## 🏗️ Phase 1: Schema & Crypto
* [ ] **Schema:** Create `service` collection structure.
* [ ] **Crypto:** Verify `src/lib/crypto.ts` can handle small, discrete fields individually without breaking decryption.

## 🧠 Phase 2: Logic Layer
* [ ] **Hook:** Build `useServiceData()` context hook.
* [ ] **CRUD:** Implement `addSponsee()`, `updateSponseeNote()`.
* [ ] **Boundary Check:** Ensure deleting a sponsee deletes their encrypted notes (crypto-shredding).

## 🎨 Phase 3: UI Implementation
* [ ] **Dashboard:** Create `ServiceWidget` for the main dashboard.
* [ ] **List View:** Create `pages/Service.tsx` with "Active" and "Alumni" tabs.
* [ ] **Detail View:** A secure card showing encrypted notes + unencrypted Next Meeting time.

## 🚀 Phase 4: Release
* [ ] **Docs:** Update User Guide with a section for Sponsors.
