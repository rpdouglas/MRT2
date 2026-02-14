# 🔐 Project 01: Security Hardening

**Objective:** Eliminate critical vulnerabilities found in the Feb 2026 Audit.
**Status:** 🟡 Active

## 🛑 Phase 1: Access Control (The Gate)
* [ ] **Delete Backdoors:** Remove `src/components/AdminGrant.tsx`.
* [ ] **Fix Rules:** Update `firestore.rules` to remove hardcoded emails. Use Custom Claims logic instead.
* [ ] **Lock Button:** Add a "Lock Vault" button to the UI that clears `globalKey` from memory instantly.

## 🛡️ Phase 2: Pipeline Safety (The Guard)
* [ ] **CI/CD Gates:** Update `.github/workflows/deploy.yaml`.
    * Add `npm install`
    * Add `npm run lint`
    * Add `npm run test` (Make sure it fails the build if tests fail).

## 🧪 Phase 3: Integrity Verification (The Proof)
* [ ] **Unit Tests:** Create `src/lib/crypto.test.ts`.
    * Test: `encrypt('hello')` -> `decrypt(result)` === `'hello'`.
    * Test: Decrypting with wrong key throws specific error.