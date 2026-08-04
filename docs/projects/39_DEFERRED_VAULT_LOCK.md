# 📁 Project 39: Deferred Vault Lock

**Status:** ✅ Completed (2026-04-28)
**Primary Persona:** David (The User in Crisis)
**Objective:** Allow users to skip the initial 4-digit PIN setup during onboarding to experience the app before committing to Zero-Knowledge security.

---

## 1. The Executive Summary
**User Story:** * **As** David, I want to see the dashboard and try the tools immediately so that I can de-escalate my anxiety before being forced to memorize a security PIN.
**Competitive Gap:** Reduces Day-1 abandonment (the "Security Tax") by letting the value of the app sell itself before enforcing strict encryption protocols.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** High. We are temporarily relaxing the encryption gate for specific sessions.
* [x] **Encryption Strategy:** Unencrypted journals/workbooks must be stored as plain text and explicitly flagged with `isEncrypted: false`. When the user eventually sets a PIN, a migration script must encrypt these orphaned plain-text entries.
* [x] **Key Rotation:** Yes. The migration step hooks directly into the existing `executePinRotation` pipeline to secure the data once the user opts-in.

---

## 3. Schema & Architecture 🗄️
**Firestore Collections Impacted:**
* `users`: Add `hasDeferredVault: boolean` (default false).

**Types (`src/lib/db.ts`):**
```typescript
export interface UserProfile {
    // ... existing fields
    hasDeferredVault?: boolean;
}
```

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* Update `EncryptionContext` to allow a "deferred" state where `globalKey` is null, but the app does not forcefully route the user to the Lock Screen.

### Phase 2: UI/UX & Gamification
* **Onboarding Flow:** Add a secondary "Skip for Now (Try the App)" button under the mandatory PIN setup.
* **Dashboard:** Add a persistent, dismissible "Secure Your Vault" warning banner if `hasDeferredVault` is true.

### Phase 3: Edge Cases
* [ ] What happens if a user exports their data while in deferred mode? (It exports as plain text).
* [ ] What happens if they attempt to use AI Analysis? (It should still work, reading the plain text instead of decrypting).

---

## 5. QA & Verification 🧪

**2026-08-04 governance note:** this spec's Status above reflects code-level verification (routes/hooks/components/tests confirmed present, and passing where automated) performed during the 2026-08-04 governance audit. The unchecked items below are manual/device/browser/visual checks that have not been performed by a human — tracked here as a known gap, not a blocker to the Shipped status. Check them off once actually performed.
* [ ] **The "Lost PIN" Test (Inverted):** Skip PIN, write a journal entry, then set a PIN. Verify the journal is successfully converted from plain text to ciphertext in Firestore.
