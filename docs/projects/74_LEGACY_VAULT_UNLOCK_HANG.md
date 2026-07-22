# 📁 Project 74: Legacy Vault Unlock Hang on Decrypt-Mismatch

**Status:** ✅ Shipped
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

**Design decision (resolved 2026-07-22):** fail closed — `return false` instead of `return true`, matching the normal verifier-mismatch path a few lines above it in the same function.

Initial analysis (above, superseded) leaned toward preserving an apparent fail-open intent. On closer inspection that was wrong: by the time this branch runs, `generateKey(pin, currentSalt)` has already derived a key from the entered PIN, and the decrypt failure is *positive evidence* that key doesn't match the one that encrypted the user's existing journal content — this is not the same "no evidence either way" situation as the "no journals yet" branch, which legitimately trusts-on-first-use. Fail-open here would let the user into the app with a wrong key in memory, so every existing encrypted entry would silently render as `"[Locked Content - Verify PIN]"` placeholder garbage with no error shown — for David (acute crisis persona), that reads as "my recovery journal is corrupted," which is worse than a hang, not better. It happens to be non-destructive under today's exact code (this catch path never persists a new `pinVerifier`, so nothing is permanently corrupted and the user gets another chance next session) — but only by accident, not by design, and isn't something to build a fix around.

Fail-closed is also simpler and more internally consistent: `VaultGate.tsx`'s existing `if (!success) { setError("Improper PIN. Access Denied."); ... }` already handles it correctly with zero changes needed there, and the rest of `performUnlock` already fails closed on any *positive* evidence of a wrong PIN (the verifier-mismatch branch above it) — only the true no-evidence case ("no journals yet") should trust blindly. One accepted cost: a legitimate user whose *correct* PIN happens to fail against a single corrupted/edge-case sampled entry will incorrectly see "wrong PIN" — narrow, and far less harmful than silently unlocking with the wrong key.

---

## 3. Schema & Architecture 🗄️
No schema changes. Single-function control-flow fix.

**Target file:** `src/contexts/EncryptionContext.tsx`'s `performUnlock` (the `catch` block around line 100).

---

## 4. Implementation Phases 🏗️

### Phase 1: Fix the state/return-value mismatch
* `return false` from the catch block instead of `return true`, so the resolved boolean and `isVaultUnlocked` state finally agree (both "not unlocked").
* Confirm `VaultGate.tsx`'s existing `if (!success) { setError(...); setIsSubmitting(false); }` branch handles this correctly with no changes of its own — it should, since it's the same code path a normal wrong-PIN already takes.

### Phase 2: Regression test
* Update the existing test in `src/contexts/__tests__/EncryptionContext.test.tsx` ("documents the existing decrypt-mismatch quirk") from a documentation-of-current-behavior test into a real regression test asserting the fixed behavior (`isVaultUnlocked` matches the resolved boolean, whichever policy is chosen).
* Rename the test to reflect the fix, not the quirk.

---

## 5. QA & Verification 🧪
* [x] **Unit test:** `EncryptionContext.test.tsx`'s regression test updated to assert `unlockVault` resolves `false` and `isVaultUnlocked` stays `false` on a decrypt mismatch (was: documented the mismatched-true/false quirk). 579/579 suite-wide.
* [ ] **Manual check:** Simulate a legacy pre-verifier account (Firestore emulator doc with `encryptionSalt` but no `pinVerifier`, one journal entry encrypted under a different PIN) against the real `VaultGate.tsx` UI — confirm the unlock button no longer hangs and shows "Improper PIN. Access Denied." Not yet performed against a live emulator/browser in this pass — the fix and its unit-level regression coverage are verified; this is the one remaining manual-QA step.
* [x] **Run Suite:** lint, unit suite, and build all clean.
