> Parked — tracked in [`docs/BACKLOG.md`](../../BACKLOG.md) (Parked / Unscheduled) as of 2026-07-16. The Playwright E2E golden-path suite scoped here has not been built; PROJ-40 covered unit-test coverage only.

# 📁 Project 23: The QA Sentinel

**Status:** ⚪ Planned
**Primary Persona:** The Architect (Admin)
**Objective:** Establish an automated End-to-End (E2E) testing pipeline to guarantee core app functionality during high-velocity scaling.

---

## 1. The Executive Summary
**User Story:** * **As** the CEO/Architect, I want to automatically verify the "Golden Paths" of the app so that I can deploy updates to 5,000+ users without fear of critical regressions.
**Competitive Gap:** Most indie health apps break during scaling. MRT will maintain enterprise-grade reliability using automated headless browser testing.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** This project uses Mock Data via Firebase Emulators. No real PII or user vaults will be touched.
* [x] **Encryption Strategy:** E2E tests will actively verify that `src/lib/crypto.ts` correctly locks and unlocks the vault in a live browser environment.

---

## 3. Schema & Architecture 🗄️

**Tools Introduced:**
* `Playwright`: For headless browser automation and UI interaction testing.
* `Firebase Local Emulator Suite`: To intercept Auth and Firestore calls during CI/CD to prevent polluting the production database.

---

## 4. Implementation Phases 🏗️

### Phase 1: The Missing Logic Tests
* Write `src/lib/__tests__/milestones.test.ts` to mathematically verify the milestone threshold engine (handling leap years and edge cases).

### Phase 2: Emulator Integration
* Initialize `firebase init emulators`.
* Configure `vite.config.ts` and Firebase initialization logic to route traffic to `localhost:8080` (Firestore) and `localhost:9099` (Auth) when `VITE_USE_EMULATORS=true`.

### Phase 3: The Playwright "Golden Paths"
Write exactly 3 resilient E2E tests:
1. **The Gate Test:** Sign up, onboard (set name/date), and reach the Dashboard.
2. **The Vault Test:** Set a PIN, write a journal entry, lock the vault, verify data is unreadable, unlock vault, verify data is restored.
3. **The Ledger Test:** Create a high-priority task, check it off, and verify the Dashboard Streak/Fire increments.

---

## 5. QA & Verification 🧪
* [ ] **CI/CD Pipeline:** Update `.github/workflows/deploy.yaml` to run Playwright tests against the emulators *before* pushing to Firebase Hosting.
