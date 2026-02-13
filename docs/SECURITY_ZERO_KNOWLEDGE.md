# 🛡️ Security Model: Zero-Knowledge Architecture

**Philosophy:** "We cannot leak what we cannot read."

## 1. The Encryption Lifecycle

### A. Setup (Vault Creation)
1. User enters 4-digit PIN.
2. App generates random 16-byte `Salt`.
3. App derives `Key` using PBKDF2 (100k iterations).
4. App creates `Verifier` = Hash(PIN + Salt).
5. App sends `Salt` and `Verifier` to Firestore. **PIN and Key are discarded.**

### B. Storage (Writing Data)
1. User types "I feel anxious today."
2. App checks memory for `Key`. (If missing, prompt for PIN).
3. App generates random `IV` (Initialization Vector).
4. App encrypts text via AES-GCM -> `Ciphertext`.
5. App sends string `IV:Ciphertext` to Firestore.

### C. Retrieval (Reading Data)
1. App fetches document from Firestore.
2. App splits `IV:Ciphertext`.
3. App uses `Key` to decrypt.
4. Plain text renders in React.

## 2. AI Privacy Boundary
When a user asks for AI Analysis:
1. Data is decrypted **in the browser**.
2. Plain text is sent to Gemini API via HTTPS.
3. Gemini processes data statelessly.
4. Response is returned.
5. **Critical:** We do NOT train models on this data.

## 3. Emergency Access
* **Lost PIN:** Data is lost. There is no backdoor.
* **Legacy Data:** Older unencrypted entries are flagged (`isEncrypted: false`) and can be read/migrated.

## 4. Third-Party Data (The Service Model)
* **Context:** Users like "Lisa" store data about *other people* (Sponsees).
* **Rule:** This is a **Digital Rolodex**, not a Social Network.
* **Mechanism:** * "Sponsee" data is encrypted with **Lisa's Key**. 
    * The actual Sponsee (if they use the app) has no access to Lisa's notes about them.
    * **Zero-Knowledge applies:** If Lisa loses her PIN, the names and notes of her sponsees are lost.