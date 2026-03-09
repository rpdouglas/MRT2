import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. docs/specs/09_PROFILE.md
# =============================================================================
profile_spec_content = r'''# 📐 Feature Spec: Profile & Data Sovereignty

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
    * Fetches ALL collections (`journals`, `tasks`, `workbooks`).
    * **Decryption:** Decrypts all content client-side before generation.
    * **Output:** Plain text JSON file. *User is warned in the UI to store this securely.*
* **PDF Export:**
    * Generates a formatted report of Journals and Tasks suitable for printing or sharing with a therapist, utilizing `jsPDF` and `jspdf-autotable`.

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
    3. The client-side script recursively queries and chunks `batch.delete()` operations across `journals`, `tasks`, `insights`, `ai_logs`, `feedback`, and all user subcollections.
    4. Once Firestore is completely scrubbed, `deleteUser()` is called to destroy the Auth record.

## 7. Verification
* [x] **Onboarding Lock:** Does a new user get forced to the General tab with the other tabs hidden?
* [x] **Export:** Unlock vault -> Export JSON. Is the content readable (not ciphertext)?
* [x] **Auto-Sync:** Sign in with Google, manually change `lastExportAt` in Firestore to 8 days ago, refresh, unlock vault. Does the file appear in Google Drive?
* [x] **Deletion:** Ensure deleting an account does not leave orphaned records in the `feedback` or `ai_logs` collections.
'''

# =============================================================================
# 2. docs-site/guide/07-account-data.md
# =============================================================================
guide_data_content = r'''# ☁️ Data Export & Cloud Sync

You own your recovery data. MRT provides multiple ways to ensure you never lose it, even if you lose your phone, or completely remove it if you wish to leave.

## 1. Google Drive Auto-Sync
If you created your account using **Google Sign-In**, MRT can automatically back up your data.
* Ensure your Vault is unlocked.
* Navigate to the **Profile -> Data** tab to verify your sync status.
* Every 7 days, the app will silently compile a JSON backup of your data and save it to your personal Google Drive in the background.
* *Note: This backup is unencrypted so you can always read it outside the app even if you lose your PIN.*

## 2. Manual Export
You can manually export your data at any time from the **Profile -> Data** tab.
* **JSON Backup:** A raw data file containing your entire history.
* **PDF Document:** A beautifully formatted, readable document containing your Journals and Tasks. Perfect for printing and bringing to a therapy session.

## 3. Import Legacy Data
If you have a JSON backup file, you can upload it in the **Data** tab to merge old entries into your current timeline.

## 4. Account Deletion (The Right to be Forgotten)
If you wish to permanently destroy your account and wipe all data from our servers, you can do so directly from the app.
1. Navigate to **Profile -> Data**.
2. Scroll down to the red **Danger Zone** and click **Request Account Deletion**.
3. To protect against unauthorized deletion, the app will ask you to **verify your password** or **re-verify with Google**.
4. Once verified, the app will cryptographically shred all of your journals, tasks, and settings before permanently deleting your account. **This action cannot be undone.**
'''

# =============================================================================
# 3. docs/SPRINT_BOARD.md
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board

**Current Phase:** Sprint 5.0 (Active)

## ✅ Completed Sprints
- [x] **Sprints 1-3:** Foundation, Auth, Journal Engine, Encryption.
- [x] **Sprint 4.0:** Sector 4: The Ledger (Tasks) fully scaled and time-zone hardened.
- [x] **Sprint 4.5:** Sector 5: The Pulse (Vitality) organic engine and haptics deployed.
- [x] **Sprint 4.8:** "The Crucible: Dogfooding & Polish". Fixed mobile UX, grouped Insights UI, and aligned Gemini models.

## 🟡 Sprint 5.0: The Expansion (Active)
*Current Focus: Finalizing The GTM Engine, Privacy Tools, and Link Routing.*

### 🏃 In Progress (Active Sprint)
- [ ] **PROJ-09.1:** Native `/links` Route (Social Media funnel bypassing Linktree).
- [x] **PROJ-09.2:** Account Deletion Flow (The "Right to be Forgotten" recursive Firestore wipe).

### 🧊 Backlog (Up Next)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media support)
- [ ] **PROJ-07:** The Launch Engine (TWA Wrapper + Push Notifications)
- [ ] **PROJ-15:** The Checkout Engine (Stripe Integration & Paywalls)
'''

# =============================================================================
# 4. docs-site/support/changelog.md
# =============================================================================
changelog_content = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.3.1 (The Privacy & Sovereignty Update)
* **New:** **Right to be Forgotten:** You now have complete, automated control over your data. You can permanently delete your account directly from the Profile Data tab. The system will cryptographically shred all your encrypted journals, tasks, and analytics before removing your identity.
* **Security:** Added a forced re-authentication step before account deletion to protect against unauthorized data destruction.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model for incredibly deep, highly accurate pattern recognition across your journal and workbook history.
* **New:** **Lightning Fast Coaching:** The "AI Insight" coach in workbooks now utilizes *Flash-Lite*, providing near-instantaneous feedback and guidance while you write.
* **Improvement:** **Timeline Navigation:** The Insights Log now groups your AI history by Year and Month using smooth, collapsible accordions to protect your screen real estate and prevent scrolling fatigue.
* **Improvement:** **Rich Insights Log:** Redesigned the AI Insights output into a vibrant "Bento Grid" that visually highlights your Relapse Risk Level, Hidden Triggers, and Emotional Velocity.
* **Improvement:** **Library Hub Restructure:** Reorganized the Workbooks page with a clean tabbed navigation system to prepare for upcoming reading materials.
* **Fix:** **Mobile Keyboard UX:** Resolved an issue where opening the virtual keyboard on mobile phones would push the workbook question off the screen.

### v1.2.0 (The Pulse Polish Update)
* **New:** **Somatic Breathwork Engine:** Upgraded the breathing tool with a fluid "Organic Halo" visualization that perfectly matches real-world seconds.
* **New:** **Haptic Grounding:** The app now gently vibrates at every breath change (Inhale, Hold, Exhale) so you can close your eyes and stay grounded during a crisis.
* **Improvement:** **Smart Mood Scoring:** Breathwork logs now automatically inherit your 7-day average mood, preventing your charts from being artificially skewed.

### v1.1.1 (The Ledger Polish Update)
* **New:** **Future Task Safety:** Added a warning modal to prevent accidentally completing tasks scheduled for later dates, keeping your daily stats accurate.
* **Fix:** **Timezone Stability:** Recurring tasks no longer accidentally show up as overdue on the exact day they are created due to timezone calculation bugs.

### v1.1.0 (The Visuals & Hardening Update)
* **New:** **Gradient Insights:** Replaced basic charts with a beautiful "Emotional Velocity" area chart and a "Baseline vs Reality" weekly rhythm tracker.
* **New:** **Template Library:** Upgraded journal templates with structured, recovery-focused prompts (e.g., HALT check, Morning Intention).

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Running Post-Sprint Documentation Sync...")
    write_file("docs/specs/09_PROFILE.md", profile_spec_content)
    write_file("docs-site/guide/07-account-data.md", guide_data_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs-site/support/changelog.md", changelog_content)
    print("✨ Audit and Synchronization Complete! The board is clean.")