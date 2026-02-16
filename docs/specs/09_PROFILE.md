# 📐 Feature Spec: Profile & Data Sovereignty

**Status:** Live (v1.0)
**Context:** User identity, settings, and data portability.

## 1. Support Network
* **Fields:** `sponsorName`, `sponsorPhone`.
* **Storage:** Stored unencrypted in `users/{uid}`.
* **Usage:** Populates the "SOS Modal" for one-tap calling.

## 2. The Export Engine
**Philosophy:** The user owns their data.
* **JSON Export:**
    * Fetches ALL collections (`journals`, `tasks`, `workbooks`).
    * **Decryption:** Decrypts all content client-side before generation.
    * **Output:** Plain text JSON file. *User must be warned to store this securely.*
* **PDF Export:**
    * Generates a formatted report of Journals and Tasks suitable for printing or sharing with a therapist.

## 3. The Import Engine
* **Logic:** parses JSON backups.
* **Legacy Support:** Maps older data structures to the current schema.
* **Safety:** Flags imported entries as `isEncrypted: false` (since they come from a plain text file) until the user edits/saves them again.

## 4. Verification
* [ ] **Export:** Unlock vault -> Export JSON. Is the content readable (not ciphertext)?
* [ ] **Import:** Import a backup. Do entries appear in History?
