# 🛡️ Security Model: Zero-Knowledge Architecture

**Philosophy:** "We cannot leak what we cannot read."

## 1. The Encryption Lifecycle

### A. Setup (Vault Creation)
1. User enters 4-digit PIN.
2. App generates random 16-byte `Salt`.
3. App derives `Key` using PBKDF2 (100k iterations).
4. App creates `Verifier` = Hash(PIN + Salt).
5. App sends `Salt` and `Verifier` to Firestore. 
6. **Session Caching:** The user's PIN is temporarily cached in the browser's `sessionStorage`. This prevents the user from having to re-enter their PIN every time they navigate between pages, while ensuring the PIN is automatically wiped by the OS the moment the browser tab is closed.

### B. Storage (Writing Data)
1. User types "I feel anxious today."
2. App checks memory for `Key`. (If missing, it attempts to derive it from the `sessionStorage` PIN, or prompts the user).
3. App generates random `IV` (Initialization Vector).
4. App encrypts text via AES-GCM -> `Ciphertext`.
5. App sends string `IV:Ciphertext` to Firestore.

### C. Retrieval (Reading Data)
1. App fetches document from Firestore.
2. App splits `IV:Ciphertext`.
3. App uses `Key` to decrypt.
4. Plain text renders in React.

## 2. Vault Control Features

### 🔒 Vault Locking (Memory Clearing)
* **Trigger:** User clicks "Lock Vault" in the sidebar or closes the tab.
* **Action:** The `EncryptionContext` sets `globalKey = null` and explicitly deletes the PIN from `sessionStorage`.
* **Result:** Even if an attacker gains physical access to the unlocked computer or browser console after the fact, they cannot decrypt data without the user re-entering the PIN.

### 🧨 Emergency Reset (Crypto-Shredding)
* **Trigger:** User forgets PIN or wants a hard reset.
* **Action:**
    1. The app deletes the `encryptionSalt` and `pinVerifier` from Firestore.
    2. **Consequence:** Without the salt, the original key can never be derived again. All existing encrypted data becomes mathematical garbage (permanently inaccessible).
    3. **Recovery:** The user must establish a new PIN and start fresh (or import a backup).

## 3. AI Privacy Boundary
When a user asks for AI Analysis:
1. Data is decrypted **in the browser**.
2. Plain text is sent to Gemini API via HTTPS.
3. Gemini processes data statelessly.
4. Response is returned.
5. **Critical:** We do NOT train models on this data.

## 4. Third-Party Data (The Service Model)
* **Context:** Users like "Lisa" store data about *other people* (Sponsees).
* **Rule:** This is a **Digital Rolodex**, not a Social Network.
* **Mechanism:** * "Sponsee" data is encrypted with **Lisa's Key**. 
    * The actual Sponsee (if they use the app) has no access to Lisa's notes about them.
    * **Zero-Knowledge applies:** If Lisa loses her PIN, the names and notes of her sponsees are lost.

## 5. PIN Management & Rotation Protocol (Sprint 2)
Because the user's PIN mathematically derives their encryption key, changing a PIN is a highly sensitive operation.

### A. Changing a Known PIN (Rotation)
If the user knows their current PIN and wants to change it:
1.  **Unlock:** User enters *Current PIN* to derive *Current Key*.
2.  **Fetch & Decrypt:** App downloads ALL encrypted documents (`journals`, `workbooks`, `service`) and decrypts them into memory.
3.  **Generate:** User enters *New PIN*. App generates a *New Salt* and derives a *New Key*.
4.  **Re-Encrypt:** App re-encrypts all in-memory plain text with the *New Key*.
5.  **Commit:** App uploads the *New Salt*, *New Verifier*, and all *New Ciphertext* documents to Firestore in a batched transaction.

### B. Resetting a Lost PIN (Crypto-Shredding)
If the user forgot their PIN, rotation is mathematically impossible.
1.  **Warning:** The app must display a severe warning that resetting will permanently destroy existing secure data.
2.  **Action:** App deletes `encryptionSalt` and `pinVerifier` from the user profile, AND deletes all existing documents in `journals` and `workbook_answers`.
3.  **Result:** The user starts completely fresh. (If they set up Google Drive Auto-Sync, they still possess a plain-text JSON backup off-platform).
