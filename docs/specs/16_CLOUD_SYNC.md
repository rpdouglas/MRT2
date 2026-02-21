# ☁️ Feature Spec: Network Resilience & Cloud Sync

**Status:** Live (v1.5)
**Context:** How MRT handles offline usage, state detection, and automated data backups.

## 1. Offline-First Architecture (Firestore)
* MRT relies on Firebase Firestore's built-in local persistence mechanism.
* If a user is offline (e.g., in a basement meeting room), they can still create Tasks, save Journal entries, and check off Workbook questions.
* The data is written to the local IndexedDB cache and seamlessly syncs to the cloud once the network connection is restored.

## 2. Network State Detection
**Location:** `src/contexts/LayoutContext.tsx`
* The context uses `window.addEventListener` for `online` and `offline` events to maintain an `isOnline` boolean.
* **UI Feedback:** If `!isOnline`, a red persistent banner appears at the top of the screen (`AppShell.tsx`), assuring the user that their data is still saving locally.

## 3. Google Drive Auto-Sync (The Sentinel)
**Location:** `src/components/AppShell.tsx` & `src/lib/googleDrive.ts`

### The Authorization
* Users opt-in by clicking "Sign in with Google" and granting the `https://www.googleapis.com/auth/drive.file` scope.
* This restricted scope ensures the app can *only* read and write the specific `mrt_backup.json` file it creates, providing strong security isolation.

### The Trigger
* Handled by a `useEffect` inside `AppShell`.
* It requires three conditions: `isVaultUnlocked == true`, `isOnline == true`, and a valid `driveAccessToken`.
* It checks the user's `lastExportAt` timestamp. If it is older than 7 days, a silent background backup is triggered 10 seconds after the app loads.

### The Payload (Data Sovereignty)
* The app fetches all data (Journals, Tasks, Workbooks).
* It **decrypts** the ciphertexts back into plain text in-memory.
* The JSON is uploaded to Drive. *This is a deliberate architectural choice to ensure the user always has a readable copy of their data in case they permanently forget their MRT Vault PIN.*
