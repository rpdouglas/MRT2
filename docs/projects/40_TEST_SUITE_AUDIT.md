# 📁 Project 40: Core Logic Test Suite Audit

**Status:** 🟢 Completed
**Primary Persona:** All (internal/architecture — no primary end-user persona)
**Objective:** Establish a robust Vitest unit testing pipeline for MRT's uncovered core logic (`milestones`, `grouping`, `rotation`, and `PremiumGate`) to guarantee zero regressions during scaling.

---

## 1. The Executive Summary
**User Story:** 
* **As** the Lead Architect, I want comprehensive automated tests for all missing utility functions and boundary components so that I can confidently deploy rapid updates (like the React 19 refactor) without breaking the UI or corrupting the Zero-Knowledge vault during PIN rotations.
**Competitive Gap:** Indie wellness apps frequently corrupt user data during major framework updates. MRT relies on an enterprise-grade automated safety net to ensure mathematical privacy and gamification accuracy are never compromised.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Safe. This project uses mock data and isolated local environments. No real PII or Firestore databases will be touched.
* [x] **Encryption Strategy:** Tests for `rotation.ts` must successfully mock both `window.crypto.subtle` and Firestore `writeBatch` to simulate a successful decryption/re-encryption cycle, as well as a rollback failure state.

---

## 3. Schema & Architecture 🗄️

**Tools & Frameworks Used:**
* `vitest` (Test Runner)
* `@testing-library/react` (Component rendering)

**Target Files for Coverage (New Files to Create):**
* `src/lib/__tests__/milestones.test.ts`
* `src/lib/__tests__/grouping.test.ts`
* `src/lib/__tests__/rotation.test.ts`
* `src/components/__tests__/PremiumGate.test.tsx`

---

## 4. Implementation Phases 🏗️

### Phase 1: Pure Functions (Milestones & Grouping)
* **Goal:** Verify the data parsing that drives the UI.
* **Target 1 (`milestones.test.ts`):** 
  * Test: `getMilestone(totalDays)` returns the correct milestone number (e.g., 30, 60, 365) and handles non-milestone days (e.g., 42 returns null).
  * Test: `getMilestoneLabel` correctly formats days vs. years.
* **Target 2 (`grouping.test.ts`):**
  * Test: `groupItemsByYearAndMonth` correctly sorts an array of Timestamp/Date objects into the `NestedGroup<T>` structure (Year -> MonthIndex -> Items).

### Phase 2: Boundary Components (PremiumGate)
* **Goal:** Verify the monetization UI boundary.
* **Target (`PremiumGate.test.tsx`):**
  * Setup: Mock the `useAuth` context and `useNavigate`.
  * Test: If `userTier === 'premium'`, it renders children natively.
  * Test: If `userTier !== 'premium'` and `fallbackMode === 'button_swap'`, it renders the lock button.
  * Test: If `fallbackMode === 'lock_overlay'`, it renders the blurred overlay container.

### Phase 3: The Crypto Rotation Engine (High Complexity)
* **Goal:** Ensure the PIN rotation chunking logic behaves safely.
* **Target (`rotation.test.ts`):**
  * Setup: Mock `src/lib/firebase.ts`, Firestore `query`, `getDocs`, and `writeBatch`. Mock `src/lib/crypto.ts` functions (`generateKey`, `encrypt`, `decrypt`).
  * Test: `executePinRotation` successfully iterates through mocked journal docs, calls `decrypt` with the old PIN, and `encrypt` with the new PIN.
  * Test: If decryption fails mid-batch, verify that the catch block throws an error to prevent partial vault corruption.

---

## 5. QA & Verification 🧪
* [ ] **Run Suite:** Execute `npm run test:once`. All suites must pass.
* [ ] **Console Hygiene:** Ensure tests suppress expected console warnings/errors (e.g., intentionally failing a decryption) using `vi.spyOn(console, 'error').mockImplementation(() => {})`.