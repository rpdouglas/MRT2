# 🔐 Project 01: Security Hardening

**Objective:** Eliminate critical vulnerabilities found in the Feb 2026 Audit.
**Status:** 🟢 Done
**Personas Involved:** The Architect, Walt (The Zen Master)

## 🛑 Phase 1: Access Control (The Gate)
* [x] **Delete Backdoors:** Remove `src/components/AdminGrant.tsx`.
* [x] **Fix Rules:** Update `firestore.rules` to remove hardcoded emails. Use Custom Claims logic instead.
* [x] **Lock Button:** Add a "Lock Vault" button to the UI that clears `globalKey` from memory instantly.

## 🛡️ Phase 2: Pipeline Safety (The Guard)
* [x] **CI/CD Gates:** Update `.github/workflows/deploy.yaml`.
    * [x] Add `npm install`
    * [x] Add `npm run lint`
    * [x] Add `npm run test` (Make sure it fails the build if tests fail).

## 🧪 Phase 3: Integrity Verification (The Proof)
* [x] **Unit Tests:** Create `src/lib/crypto.test.ts`.
    * [x] Test: `encrypt('hello')` -> `decrypt(result)` === `'hello'`.
    * [x] Test: Decrypting with wrong key throws specific error.
