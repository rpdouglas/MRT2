# 🤝 Project 05: The "Lisa" Service Module

**Objective:** Build the "Digital Rolodex" for sponsors to manage sponsees securely.
**Status:** ⏸️ Paused (paused per ROADMAP.md Wave 3 to focus on Wave 1 Onboarding — see docs/ACTIVE_CYCLE.md)
**Personas Involved:** Lisa (The Service Superstar)

> **Note (2026-07-21):** The Dashboard's "Service — Coming Soon" placeholder tile (`Dashboard.tsx:347-359`, referenced below in Phase 3) is being reassigned to `PROJ-72` Recovery Games. When this project resumes, its Phase 3 "Dashboard: Create `ServiceWidget`" item will need a different entry point (e.g. a sidebar/nav item) rather than reclaiming that dashboard slot. See `docs/projects/72_RECOVERY_GAMES.md`.

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

## 🧪 Phase 5: QA & Verification
* [ ] **Unit Tests:** `useServiceData()` CRUD operations (`addSponsee`, `updateSponseeNote`), crypto-shredding on sponsee delete.
* [ ] **The Subway Test:** Rolodex list and sponsee detail view render from cached data when offline.
* [ ] **The "Lost PIN" Test:** Confirm all sponsee notes are unreadable after PIN rotation without the new key, and confirm inclusion in `executePinRotation`.
* [ ] **Anonymity Check:** Confirm no sponsee full name, photo, or identifying detail is ever included in a shareable/exportable format (per Lisa's anti-13th-stepper safeguards in `docs/PERSONAS.md`).
