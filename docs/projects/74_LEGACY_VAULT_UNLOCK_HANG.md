# 📁 Project 74: Legacy Vault Unlock Hang on Decrypt-Mismatch

**Status:** ⚪ Planned
**Primary Persona:** David (High anxiety, acute crisis — a frozen, unexplained PIN screen is close to worst-case UX for this persona) and Walt (long-term users are the ones most likely to still be on a pre-verifier legacy account)
**Objective:** Fix `performUnlock`'s legacy pre-verifier discovery path so a decrypt mismatch against the sampled journal entry fails closed with a visible error, instead of silently hanging the PIN-entry screen forever.

---

## 1. The Executive Summary
**User Story:** As a long-time user whose vault predates PROJ-65's `pinVerifier` field, when I unlock my vault I want either success (into the app) or a clear "wrong PIN" error — not an unexplained, permanently spinning unlock button with no feedback and no way to retry.

**Competitive Gap:** N/A — bug fix, internal correctness.

**Source:** Found while writing `docs/projects/73_TEST_SUITE_HARDENING.md` Phase 2's direct unit coverage of `EncryptionContext.tsx` (`src/contexts/__tests__/EncryptionContext.test.tsx`, test: "documents the existing decrypt-mismatch quirk"). Not a hypothetical — traced end-to-end through both `EncryptionContext.tsx` and its only caller, `VaultGate.tsx`, confirming real user-facing impact below.

**Root cause, traced end-to-end:**
1. `performUnlock` (`src/contexts/EncryptionContext.tsx:56-119`) has a legacy discovery path for accounts with an `encryptionSalt` but no stored `pinVerifier` yet (pre-dates PROJ-65's verifier field). Since there's no verifier to check the PIN against, it opportunistically decrypts a sampled journal entry to confirm the PIN is correct:
   ```ts
   try {
       const result = await decrypt(testDoc.content);
       if (result.includes("Locked Content")) throw new Error("Key mismatch");
       const newVerifier = await computePinHash(pin, currentSalt);
       ...
       setVerifier(newVerifier);
   } catch (e) { console.warn("Legacy Verification Failed", e); return true; }
   ```
2. On a decrypt mismatch, the `catch` block **returns `true` directly** — before the function reaches `setIsVaultUnlocked(true)` and `sessionStorage.setItem(SESSION_PIN_KEY, pin)` a few lines below (line 110-111), which only run on the path that falls through normally. So the resolved boolean (`true`, meaning "success" to the caller) and the actual `isVaultUnlocked` state (still `false`) disagree.
3. `VaultGate.tsx`'s `handleUnlock` (`src/components/VaultGate.tsx:139-162`) only handles the `!success` branch:
   ```ts
   const success = await unlockVault(pin);
   if (!success) {
       setError("Improper PIN. Access Denied.");
       setPin('');
       setIsSubmitting(false);
   }
   ```
   When `success` is `true`, this branch does nothing — no error, no `setIsSubmitting(false)`. The component expects `isVaultUnlocked` to flip to `true` and unmount this view (line 31: `if (isVaultUnlocked) { ... }`). Since it never does, the user is left staring at a PIN screen with a permanently disabled/spinning submit button, no error message, and no way to retry short of a full page reload.

**Who's actually affected:** only accounts that (a) predate PROJ-65 (no `pinVerifier` ever written) **and** (b) have at least one existing encrypted journal entry that fails to decrypt with the entered PIN — either a genuinely wrong PIN, or a corrupted/edge-case entry. Narrow blast radius, but a real hang for whoever hits it, with zero diagnostic signal.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** Low. This is a control-flow fix in an already-ZK-compliant path — no new data touches the boundary, no new Firestore fields, no plaintext exposure change either way.
* [x] **Encryption Strategy:** No change to `crypto.ts`/derivation logic. The fix only changes what `performUnlock` does *after* a decrypt attempt already completed — specifically, ensuring a failed one reports failure consistently instead of a mismatched true/false-but-not-really state.
* [x] **Key Rotation:** N/A — this path only runs pre-verifier, pre-rotation.

**Open design question before implementation (needs a decision, not just a fix):** should a decrypt mismatch here fail closed (report `false`, like the normal verifier-mismatch path does) or should it preserve today's apparent original intent — treat "can't verify" as fail-open, since a sampled journal entry could itself be corrupted/legacy-unencrypted and wrongly blame a correct PIN? The `console.warn("Legacy Verification Failed", ...)` naming and the deliberate `return true` (rather than an unguarded exception) both suggest the original author intended fail-open, not fail-closed — the bug is that the fail-open path doesn't actually *open* the vault (state never flips), not that fail-open is the wrong policy. Recommendation: keep fail-open intent, fix the implementation to match — i.e. treat this exactly like the "no journals yet" branch (trust-on-first-use, adopt the entered PIN as canonical, write a fresh `pinVerifier`), rather than switching to fail-closed. Confirm before implementing.

---

## 3. Schema & Architecture 🗄️
No schema changes. Single-function control-flow fix.

**Target file:** `src/contexts/EncryptionContext.tsx`'s `performUnlock` (the `catch` block around line 100).

---

## 4. Implementation Phases 🏗️

### Phase 1: Fix the state/return-value mismatch
* Pending the design-question answer in §2, the likely fix: on decrypt mismatch, fall through to the same trust-on-first-use behavior as the "no journals" branch — derive and persist a fresh `pinVerifier` for the entered PIN, then actually unlock (`setIsVaultUnlocked(true)`, cache the PIN) — rather than silently no-op'ing.
* Alternative (if the design question resolves toward fail-closed instead): `return false` from the catch block, and confirm `VaultGate.tsx`'s existing `if (!success)` branch already handles it correctly (it should, unchanged).
* Either way: the fix must make the resolved boolean and `isVaultUnlocked` state agree, so `VaultGate.tsx` never needs its own changes to handle this branch correctly.

### Phase 2: Regression test
* Update the existing test in `src/contexts/__tests__/EncryptionContext.test.tsx` ("documents the existing decrypt-mismatch quirk") from a documentation-of-current-behavior test into a real regression test asserting the fixed behavior (`isVaultUnlocked` matches the resolved boolean, whichever policy is chosen).
* Rename the test to reflect the fix, not the quirk.

---

## 5. QA & Verification 🧪
* [ ] **Unit test:** Updated `EncryptionContext.test.tsx` passes with the new expected behavior.
* [ ] **Manual check:** Simulate a legacy pre-verifier account (Firestore emulator doc with `encryptionSalt` but no `pinVerifier`, one journal entry encrypted under a different PIN) against the real `VaultGate.tsx` UI — confirm the unlock button no longer hangs and either succeeds or shows a clear error.
* [ ] **Run Suite:** `npm run check` — all green.
