# 📁 Project 31: The Crypto Chunking Pipeline

**Status:** ✅ Completed (2026-04-28)
**Post-Sprint Audit:** [`archive/31_CRYPTO_SCALING_AUDIT.md`](./archive/31_CRYPTO_SCALING_AUDIT.md)
**Primary Persona:** All (internal/architecture — no primary end-user persona)
**Objective:** Scale the AES-GCM Key Rotation engine so it can seamlessly decrypt and re-encrypt 10,000+ records without crashing mobile browsers or freezing the UI.

---

## 1. The Executive Summary
**User Story:** * **As** the System Architect, I want to ensure that a power-user with 5 years of daily entries can securely change their PIN without their phone running out of memory and corrupting their database.
**Competitive Gap:** Scaling true Zero-Knowledge encryption is notoriously difficult. By solving this, we create a massive technical moat against competitors who rely on simple server-side DB encryption.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Critical. This touches the master PIN rotation cycle.
* [x] **Encryption Strategy:** Uses `src/lib/crypto.ts`. Requires handling the `Old Key` and `New Key` simultaneously in memory.

---

## 3. Implementation Phases 🏗️

### Phase 1: The Chunking Algorithm
* Rewrite `executePinRotation` in `src/lib/rotation.ts` to utilize a Generator function or recursive `setTimeout`/`requestAnimationFrame` loop.
* **Batch Size:** Set hard limit to processing 50 documents per tick.

### Phase 2: UI Feedback (The Progress Bar)
* Update the Security Profile tab to listen to a new `rotationProgress` state.
* If a user has a massive database, the UI must show "Encrypting batch 4 of 200... Please keep app open."

### Phase 3: Transaction Safety (Rollbacks)
* If the app closes midway through a rotation, the database is in a split state (some docs use Key A, some use Key B).
* **Migration Flag:** Add a `keyVersion` field to documents during rotation. If a failure occurs, the app must detect the split state on next login and resume the chunking process automatically.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** Cursor-based pagination and 500-op batch-write cap, per the post-sprint audit (`archive/31_CRYPTO_SCALING_AUDIT.md`).
* [ ] **The Subway Test:** Not documented in the post-sprint audit — needs a follow-up verification pass if revisited.
* [ ] **The "Lost PIN" Test:** Not documented in the post-sprint audit — needs a follow-up verification pass if revisited.

