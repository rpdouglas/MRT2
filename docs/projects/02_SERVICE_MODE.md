# 🤝 Project 02: The "Lisa" Service Module

**Objective:** Build the "Digital Rolodex" for sponsors to manage sponsees securely.
**Status:** ⚪ Planned
**Persona:** Lisa (The Service Superstar)

## 🏗️ Phase 1: Schema & Crypto
* [ ] **Schema:** Create `service` collection structure (See `SCHEMA_ARCHITECTURE.md`).
* [ ] **Crypto:** Verify `src/lib/crypto.ts` can handle small, discrete fields (Name, Phone) individually, rather than just big blobs of text.

## 🧠 Phase 2: Logic Layer
* [ ] **Hook:** Build `useServiceData()` context hook.
* [ ] **CRUD:** Implement `addSponsee()`, `updateSponseeNote()`.
* [ ] **Boundary Check:** Ensure deleting a sponsee deletes their encrypted notes (Crypto-shredding).

## 🎨 Phase 3: UI Implementation
* [ ] **Dashboard:** Create `ServiceWidget` for the main dashboard (replacing Vitality or below it).
* [ ] **List View:** Create `pages/Service.tsx` with "Active" and "Alumni" tabs.
* [ ] **Detail View:** A secure card showing encrypted notes + unencrypted Next Meeting time.

## 🚀 Phase 4: Release
* [ ] Update `UserGuide.tsx` with a section for Sponsors.