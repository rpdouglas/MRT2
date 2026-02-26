import os

# =============================================================================
# 1. ROADMAP (Full Restore + PROJ-08)
# =============================================================================
roadmap = r'''# 🗺️ MRT Product Roadmap

**Vision:** To build the world's most secure, persona-aware digital recovery companion.

## 📅 Q1 2026: Foundation & Security (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |

## 📅 Q2 2026: The "Core Polish" Phase (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search, and VitePress |

## 📅 Q3 2026: Hardening & Expansion (Active)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-04.5`| **The Crucible (Hardening & QA)** | Admin | Unit Testing & Bug Bash |
| ⚪ Planned | `PROJ-05` | **The "Lisa" Service Module**| Admin | Sponsee Management (Encrypted) |

## 📅 Q4 2026: Business & Distribution (Planned)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-06` | **The Freemium Engine** | Admin | Stripe Links, Tier Locks, Paywalls |
| ⚪ Planned | `PROJ-07` | **The Launch** | Admin | TWA Android Wrapper & Play Store |
| ⚪ Planned | `PROJ-08` | **Recovery Games** | Admin | Interactive gamified tools |
'''

# =============================================================================
# 2. SPRINT BOARD (Full Update to 3-Sprint Plan)
# =============================================================================
sprint_board = r'''# 🏃 Active Sprint Board
**Sprint:** 4.5.3 "Triage Execution"
**Start Date:** 2026-02-26
**Goal:** Execute the 3-Sprint Triage plan from the Sector 1 Bug Bash.

## 🚧 Sprint 1: The Gates & Onboarding (Active)
- [ ] **1.1 Landing Page:** Add MRT icon, persona headshots/bios, Notebook LM video link.
- [ ] **1.2 Auth UI:** Consolidate to a single login/create account view.
- [ ] **1.3 Onboarding Redirect:** Force new users to Profile to set Name, Sponsor, and Sobriety Date.

## 📌 Sprint 2: The Horizon & Identity (Planned)
- [ ] **2.1 Sidebar/Header:** Add "My" to icon, balance header layout, rename Quest -> Tasks.
- [ ] **2.2 Reactivity:** Fix "Hello friend" bug; update Dashboard when Profile name changes.
- [ ] **2.3 Dashboard UI:** Move XP tracker to Sobriety Counter; add Service/Games placeholders.
- [ ] **2.4 Profile Tabs:** Split Profile into General / Security / Data tabs.
- [ ] **2.5 PIN Management:** Add secure Change PIN / Reset PIN flows.

## 📌 Sprint 3: The Core Polish (Planned)
- [ ] **3.1 Journal Cache:** Fix UI state so journal edits appear without page refresh.
- [ ] **3.2 Tasks UI:** Allow text wrapping for long Action Plan titles instead of truncation.

## ✅ Done (Previous Sprint)
- [x] Gathered 13 bugs across Sector 1.
- [x] Built Triage Generator script.
- [x] Restructured VitePress Knowledge Base.
'''

# =============================================================================
# 3. SCHEMA ARCHITECTURE (Full Restore + Onboarding Flag)
# =============================================================================
schema = r'''# 🗄️ Schema Architecture & Data Graph

**Storage Engine:** Cloud Firestore (NoSQL)
**Encryption Strategy:** Client-Side AES-GCM (Content fields only)

## 1. High-Level Topology

~~~mermaid
graph TD
    root[🔥 Firestore Root]
    
    root --> users[📂 users]
    users --> userDoc[📄 User Profile]
    userDoc --> workbook_progress[📂 workbook_progress]
    userDoc --> templates[📂 templates]
    
    root --> journals[📂 journals]
    root --> tasks[📂 tasks]
    root --> insights[📂 insights]
    root --> ai_logs[📂 ai_logs]
    root --> feedback[📂 feedback]
    root --> service[📂 service (Planned)]
~~~

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, Billing, & Settings.
* **Fields:**
    * `encryptionSalt` (String): Public salt needed to derive key.
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness without storing it.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `role` (String): 'user' | 'admin'. Controls UI access.
    * `tier` (String): 'free' | 'premium'. Controls feature access.
    * `stripeCustomerId` (String): Reference for subscription management (Optional).
    * `sponsorName` & `sponsorPhone` (String): Unencrypted. Used for SOS dialer.
    * `hasCompletedOnboarding` (Boolean): Determines if user needs forced routing to Profile setup.
    * `lastExportAt` (Timestamp): Used for the 7-day Backup Reminder.
    * `usage_limits` (Map): Timestamps (`lastWeeklyInsight`, `lastDeepDive`) to throttle AI costs.

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, and reflections.
* **Fields:**
    * `uid` (String): Owner ID.
    * `content` (String): **ENCRYPTED BLOB** (format: `iv:ciphertext`).
    * `isEncrypted` (Boolean): Flag for legacy plain text data handling.
    * `moodScore` (Int): **UNENCRYPTED** (Allows fast dashboard stats).
    * `sentiment` (String): AI-derived sentiment (e.g. 'Positive', 'Negative').
    * `tags` (Array): **UNENCRYPTED** (e.g., `["Vitality", "Movement"]`).
    * `weather` (Map): Snapshot of environment `{ temp, condition }`.

### `tasks/{taskId}`
* **Purpose:** Gamification, Habits, and AI Action Plans.
* **Encryption:** Unencrypted to allow background stats and streak evaluations.
* **Fields:**
    * `title` (String): Task name.
    * `category` (String): 'Recovery' | 'Health' | 'Life' | 'Work'.
    * `source` (String): 'manual' | 'ai'. (AI tasks map to the Action Plan tab).
    * `priority` (String): 'High' | 'Medium' | 'Low'.
    * `status` (String): 'pending' | 'completed'.
    * `currentStreak` (Int): Consecutive completions.
    * `recurrence` (Map): Logic for repetition.
    * `dueDate` & `lastCompletedAt` (Timestamp).

### `insights/{insightId}`
* **Purpose:** AI-generated analysis of journals/workbooks.
* **Fields:**
    * `type` (String): 'journal' | 'workbook'.
    * `summary` (String): The AI's output.
    * `pillars` (Map): Structured breakdown (understanding, growth, blind_spots).
    * `strengths` & `risks` (Array): Listed points for UI rendering.
    * `suggested_actions` (Array): 3 specific strings to be converted into Tasks.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).
* **Fields:**
    * `category`: 'bug' | 'suggestion' | 'content'.
    * `buildHash`: Commit hash for version tracing.
    * `environment`: 'DEV' | 'UAT' | 'PRODUCTION'.
    * `vaultUnlocked`: Boolean.
    * `route` & `userAgent`: Strings.

### `service/{serviceId}` (Planned - Project 05)
* **Purpose:** "Digital Rolodex" for sponsors to manage sponsees/commitments.
* **Fields:**
    * `type` (String): 'sponsee' | 'commitment'.
    * `name`, `contactInfo`, `notes` (Strings): **ENCRYPTED**.
    * `status` (String): 'Active' | 'Alumni' (Unencrypted for filtering).
    * `nextMeeting` (Timestamp): **UNENCRYPTED** (Allows push notifications).

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
'''

# =============================================================================
# 4. SECURITY (Full Restore + PIN Rotation Protocol)
# =============================================================================
security = r'''# 🛡️ Security Model: Zero-Knowledge Architecture

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
'''

# =============================================================================
# 5. PROFILE SPEC (Full Restore + Tab & PIN Updates)
# =============================================================================
profile_spec = r'''# 📐 Feature Spec: Profile & Data Sovereignty

**Status:** Live (v1.5) -> Updating to v2.0 (Sprint 2)
**Context:** User identity, settings, security, and data portability.

## 1. UI Architecture (The Tabbed View)
The Profile is split into three distinct tabs to manage complexity:
* **General:** Display Name, Sobriety Date, Sponsor Name, Sponsor Phone.
* **Security:** PIN Management (Change PIN, Hard Reset).
* **Data Management:** Google Drive Sync, JSON Export, PDF Export, Account Deletion.

## 2. Support Network
* **Fields:** `sponsorName`, `sponsorPhone`.
* **Storage:** Stored unencrypted in `users/{uid}`.
* **Usage:** Populates the "SOS Modal" for one-tap calling or WhatsApp messaging.

## 3. Cloud Auto-Sync (Google Drive)
**Philosophy:** Automated resilience without vendor lock-in.
* **Authentication:** Uses Firebase GoogleAuthProvider with the restricted `https://www.googleapis.com/auth/drive.file` scope. This ensures MRT can only see and modify the specific backup file it creates, not the user's entire drive.
* **The Background Engine:** * Hosted in `AppShell.tsx`.
    * Checks if `isVaultUnlocked`, `isOnline`, and `driveAccessToken` are active.
    * Compares `userProfile.lastExportAt` to the current date. If > 7 days, it silently triggers a background export 10 seconds after the vault is unlocked.
    * It searches Google Drive for `mrt_backup.json`. If found, it issues a `PATCH` request to overwrite it; otherwise, a `POST` request to create it.
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
* **Safety:** Flags imported entries as `isEncrypted: false` (since they come from a plain text file). The next time the user edits and saves them, they are encrypted with the active vault key.

## 6. Verification
* [ ] **Export:** Unlock vault -> Export JSON. Is the content readable (not ciphertext)?
* [ ] **Auto-Sync:** Sign in with Google, manually change `lastExportAt` in Firestore to 8 days ago, refresh, unlock vault. Does the file appear in Google Drive?
'''

# =============================================================================
# 6. DASHBOARD SPEC (Full Restore + XP UI Updates)
# =============================================================================
dashboard_spec = r'''# 📐 Feature Spec: Dashboard (The Hub)

**Status:** Live (v1.5) -> Updating to v2.0 (Sprint 2)
**Architecture:** Client-Side Aggregator
**Primary Code:** `src/pages/Dashboard.tsx`

## 1. Overview
The Dashboard is the central landing page. It does not store its own data; instead, it queries all other modules (Journal, Tasks, Workbooks, Profile) to generate a real-time "Health Snapshot" of the user's recovery.

## 2. Technical Architecture

### A. Data Aggregation
The Dashboard executes 4 concurrent queries on mount:
1.  **Profile:** Fetches `sobrietyDate` and `lastExportAt`.
2.  **Journals:** Fetches *all* history to calculate streaks and consistency.
3.  **Tasks:** Fetches active tasks to calculate "Fire" scores.
4.  **Workbooks:** Fetches answer count for "Wisdom" score.

**Performance Note:** Queries are set to `refetchOnMount: 'always'` to ensure gamification stats update immediately after a user performs an action in another tab.

### B. The Calculation Engine
Inside a `useMemo` hook, the Dashboard passes raw data to the **Gamification Engine** (`src/lib/gamification.ts`) to derive:
* **User Level:** Based on total XP from all sources.
* **Archetype:** (Scholar, Doer, Monk, etc.) based on activity distribution.
* **Streaks:** Current consecutive activity chains.

### C. The Backup Sentinel
* **Logic:** Compares `userProfile.lastExportAt` to `Date.now()`.
* **Trigger:** If > 7 days since last export.
* **UI:** Displays an amber "Backup Needed" alert card that links to the Profile.

## 3. UI Components
* **Floating Hero:** Displays "Clean Time" (Years/Months/Days). *Sprint 2 update: XP Tracker and Level progress bar moved here from the bottom card.*
* **Bento Grid:** 6-quadrant layout linking to core modules with live stats:
  * Journal
  * Tasks
  * Vitality
  * Workbooks
  * Service Portal (Placeholder UI)
  * Recovery Games (Placeholder UI)

## 4. Verification Checklist
* [ ] **Clean Time:** Change sobriety date in Profile. Does Dashboard update?
* [ ] **Gamification:** Complete a task. Does the "Fire" score in the Bento Grid increment?
* [ ] **Backup Alert:** If new user (no export), is the amber alert visible?
* [ ] **Reactivity:** Does changing the display name in the Profile instantly update the greeting on the Dashboard?
'''

# =============================================================================
# 7. NEW ONBOARDING SPEC
# =============================================================================
onboarding_spec = r'''# 📐 Feature Spec: Onboarding & The Gates

**Status:** Draft (Sprint 1)
**Access Level:** Free

## 1. The "Why" (User Story)
* **As a:** New user ("David" or "Ned")
* **I want to:** Understand the app's value quickly and set up my profile without confusion.
* **So that:** I can start tracking my sobriety and journaling immediately.

## 2. User Experience (The Flow)
### A. The Landing Page
* **Visuals:** Full MRT branding ("My Recovery Toolkit" + App Icon).
* **Content:** Features headshots and brief bios of our 4 Core Personas to help the user identify their journey stage. Includes a prominent link to the Notebook LM overview video.
* **Action:** Unified "Login / Create Account" button.

### B. The Auth Consolidation
* A single, clean interface replacing the two-step login. 

### C. The Forced Redirect
* **Logic:** Upon successful login/signup, the app checks `userProfile.hasCompletedOnboarding`.
* **Action:** If `false` (or missing), the user is routed to `/profile`.
* **Requirement:** They must enter a Display Name and Sobriety Date. Once saved, `hasCompletedOnboarding` is set to `true`, and they are routed to the Dashboard.

## 3. Technical Architecture
* **Data Model:** Checks and updates `users/{uid}` collection.
* **Routing:** Uses React Router DOM inside a protected route wrapper or an authentication listener effect.
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Replace the ~~~ placeholder with real markdown backticks
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Restored and Updated: {path}")

if __name__ == "__main__":
    print("🚀 Restoring full files and applying Triage Execution Plan...")
    
    write_file("docs/ROADMAP.md", roadmap)
    write_file("docs/SPRINT_BOARD.md", sprint_board)
    write_file("docs/SCHEMA_ARCHITECTURE.md", schema)
    write_file("docs/SECURITY_ZERO_KNOWLEDGE.md", security)
    write_file("docs/specs/09_PROFILE.md", profile_spec)
    write_file("docs/specs/11_DASHBOARD.md", dashboard_spec)
    write_file("docs/specs/17_ONBOARDING.md", onboarding_spec)
    
    print("✨ Documentation successfully restored and upgraded. Ready to code.")