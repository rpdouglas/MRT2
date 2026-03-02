# 📐 Feature Spec: Profile & Data Sovereignty

**Status:** Live (v2.0)
**Context:** User identity, settings, security, and data portability.

## 1. UI Architecture (The Tabbed View)
The Profile is split into three distinct horizontal tabs to manage complexity and isolate sensitive flows:
* **General:** Display Name, Sobriety Date, Sponsor Info. Also includes the prominent link to the external User Guide. *(Note: During initial onboarding, the app forces the user into this tab and hides the navigation until saved).*
* **Security:** PIN Management and Vault Rotation flows.
* **Data:** Google Drive Auto-Sync status, JSON Export, PDF Export, and Legacy Data Import.

## 2. Support Network
* **Fields:** `sponsorName`, `sponsorPhone`.
* **Storage:** Stored unencrypted in `users/{uid}`.
* **Usage:** Populates the "SOS Modal" for one-tap calling or WhatsApp messaging.

## 3. Cloud Auto-Sync (Google Drive)
**Philosophy:** Automated resilience without vendor lock-in.
* **Authentication:** Uses Firebase GoogleAuthProvider with the restricted `https://www.googleapis.com/auth/drive.file` scope. This ensures MRT can only see and modify the specific backup file it creates.
* **The Background Engine:** * Hosted in `AppShell.tsx`.
    * Checks if `isVaultUnlocked`, `isOnline`, and `driveAccessToken` are active.
    * Compares `userProfile.lastExportAt` to the current date. If > 7 days, it silently triggers a background export 10 seconds after the vault is unlocked.
    * It searches Google Drive for `mrt_backup.json` and issues a `PATCH` request to overwrite it, or a `POST` request to create it.
* **Security Note:** The synced JSON file contains **decrypted (plain text)** data. This ensures the user retains access to their history even if they permanently forget their MRT PIN.

## 4. The Manual Export Engine
**Philosophy:** The user owns their data.
* **JSON Export:**
    * Fetches ALL collections (`journals`, `tasks`, `workbooks`).
    * **Decryption:** Decrypts all content client-side before generation.
    * **Output:** Plain text JSON file. *User is warned in the UI to store this securely.*
* **PDF Export:**
    * Generates a formatted report of Journals and Tasks suitable for printing or sharing with a therapist, utilizing `jsPDF` and `jspdf-autotable`.

## 5. The Import Engine
* **Logic:** Parses JSON backups (both legacy formats and new full-schema formats).
* **Legacy Support:** Maps older data structures to the current schema automatically.
* **Safety:** Flags imported entries as `isEncrypted: false`. The next time the user edits and saves them, they are encrypted with the active vault key.

## 6. Verification
* [ ] **Onboarding Lock:** Does a new user get forced to the General tab with the other tabs hidden?
* [ ] **Export:** Unlock vault -> Export JSON. Is the content readable (not ciphertext)?
* [ ] **Auto-Sync:** Sign in with Google, manually change `lastExportAt` in Firestore to 8 days ago, refresh, unlock vault. Does the file appear in Google Drive?
