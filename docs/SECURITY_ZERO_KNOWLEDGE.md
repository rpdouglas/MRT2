# 🛡️ Security Model: Zero-Knowledge Architecture

**Philosophy:** "We cannot leak what we cannot read."

## 1. The Encryption Lifecycle

### A. Setup (Vault Creation)
1.  User enters 4-digit PIN.
2.  App generates random 16-byte `Salt`.
3.  App derives `Key` using PBKDF2 (100k iterations).
4.  App creates `Verifier` = Hash(PIN + Salt).
5.  App sends `Salt` and `Verifier` to Firestore. **PIN and Key are discarded.**

### B. Storage (Writing Data)
1.  User types "I feel anxious today."
2.  App checks memory for `Key`. (If missing, prompt for PIN).
3.  App generates random `IV` (Initialization Vector).
4.  App encrypts text via AES-GCM -> `Ciphertext`.
5.  App sends string `IV:Ciphertext` to Firestore.

## 2. Vault Control Features

### 🔒 Vault Locking (Memory Clearing)
* **Trigger:** User clicks "Lock Vault" in the sidebar or closes the tab.
* **Action:** The `EncryptionContext` sets `globalKey = null`.
* **Result:** The browser memory no longer holds the decryption key. Even if an attacker gains access to the browser console, they cannot decrypt data without the user re-entering the PIN.

### 🧨 Emergency Reset (Crypto-Shredding)
* **Trigger:** User forgets PIN or wants a hard reset.
* **Action:**
    1.  The app deletes the `encryptionSalt` and `pinVerifier` from Firestore.
    2.  **Consequence:** Without the salt, the original key can never be derived again. All existing encrypted data becomes mathematical garbage (permanently inaccessible).
    3.  **Recovery:** The user must establish a new PIN and start fresh (or import a backup).

## 3. AI Privacy Boundary
When a user asks for AI Analysis:
1.  Data is decrypted **in the browser**.
2.  Plain text is sent to Gemini API via HTTPS.
3.  Gemini processes data statelessly.
4.  Response is returned.
5.  **Critical:** We do NOT train models on this data.
