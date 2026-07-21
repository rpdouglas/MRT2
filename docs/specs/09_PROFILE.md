# 📐 Feature Spec: Profile & Data Sovereignty

**Status:** Live (v2.1)
**Context:** User identity, settings, security, and data portability.

## 1. UI Architecture (The Tabbed View)
The Profile is split into three distinct horizontal tabs to manage complexity and isolate sensitive flows:
* **General:** Display Name, Sobriety Date, Sponsor Info. Also includes the prominent link to the external User Guide. *(Note: During initial onboarding, the app forces the user into this tab and hides the navigation until saved).*
* **Security:** PIN Management and Vault Rotation flows.
* **Data:** Google Drive Auto-Sync status, JSON Export, PDF Export, Legacy Data Import, and Account Deletion.

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
    * Fetches ALL collections (`journals`, `tasks`, `workbooks`, `game_progress` — PROJ-72 Phase 7).
    * **Decryption:** Decrypts all content client-side before generation, including Recovery Games' `encryptedStats`/`encryptedReflection` fields via the same chunked-decrypt helper (`processInChunks`) used for journals/workbooks.
    * **Output:** Plain text JSON file. *User is warned in the UI to store this securely.*
* **PDF Export:**
    * Generates a formatted report of Journals, Tasks, and (if any exist) Recovery Games history, suitable for printing or sharing with a therapist, utilizing `jsPDF` and `jspdf-autotable`.

## 5. The Import Engine
* **Logic:** Parses JSON backups (both legacy formats and new full-schema formats).
* **Legacy Support:** Maps older data structures to the current schema automatically.
* **Safety:** Flags imported entries as `isEncrypted: false`. The next time the user edits and saves them, they are encrypted with the active vault key.

## 6. The Annihilation Engine (Account Deletion)
**Philosophy:** The "Right to be Forgotten."
* **Location:** `src/lib/deletion.ts` -> `executeTotalAccountAnnihilation`
* **Firebase Constraint:** Firebase Auth throws `auth/requires-recent-login` for destructive actions if the session is stale.
* **The Flow:**
    1. User clicks "Request Account Deletion" in the Danger Zone.
    2. A modal intercepts the request and forces **Re-Authentication** (Email/Password or Google OAuth) to refresh the token.
    3. The client-side script recursively queries and chunks `batch.delete()` operations across `journals`, `tasks`, `insights`, `ai_logs`, `feedback`, `game_progress`, `game_saves` (PROJ-72 Phase 7), and all user subcollections.
    4. Once Firestore is completely scrubbed, `deleteUser()` is called to destroy the Auth record.

## 7. Verification
* [x] **Onboarding Lock:** Does a new user get forced to the General tab with the other tabs hidden?
* [x] **Export:** Unlock vault -> Export JSON. Is the content readable (not ciphertext)?
* [x] **Auto-Sync:** Sign in with Google, manually change `lastExportAt` in Firestore to 8 days ago, refresh, unlock vault. Does the file appear in Google Drive?
* [x] **Deletion:** Ensure deleting an account does not leave orphaned records in the `feedback`, `ai_logs`, `game_progress`, or `game_saves` collections.
