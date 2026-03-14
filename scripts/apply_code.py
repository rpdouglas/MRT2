import os

FENCE = chr(96) * 3

FILES_TO_UPDATE = {
    "docs/SCHEMA_ARCHITECTURE.md": r"""# 🗄️ Schema Architecture & Data Graph

**Storage Engine:** Cloud Firestore (NoSQL)
**Encryption Strategy:** Client-Side AES-GCM (Content fields only)

## 1. High-Level Topology

__FENCE__mermaid
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
__FENCE__

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `tier` (String): 'free' | 'premium'.
    * `tierSource` (String): 'stripe' | 'manual'. // NEW: Differentiates between paid and comped.
    * `role` (String): 'user' | 'admin'.
    * `lastLogin` (Timestamp): Tracked for retention metrics.
    * `createdAt` (Timestamp): Date the user joined the platform.
    * `encryptionSalt` (String): Public salt needed to derive key.
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness without storing it.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `sponsorName` & `sponsorPhone` (String): Unencrypted. Used for SOS dialer.
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

### `service/{serviceId}` [PLANNED - Sprint 7]
* **Purpose:** "Digital Rolodex" for sponsors to manage sponsees/commitments.
* **Fields:**
    * `type` (String): 'sponsee' | 'commitment'.
    * `name`, `contactInfo`, `notes` (Strings): **ENCRYPTED**.
    * `status` (String): 'Active' | 'Alumni' (Unencrypted for filtering).
    * `nextMeeting` (Timestamp): **UNENCRYPTED** (Allows push notifications).

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
""",

    "docs-site/guide/06-workbooks.md": r"""# 🧭 The Library & The Compass

The Workbooks module is your centralized hub for structured, deep-dive recovery literature (like the 12-Steps and Recovery Dharma). **All answers are Zero-Knowledge Encrypted.**

## The Library Hub
When you open the Workbooks page, you will see two tabs:
* **Workbooks:** Interactive step-work and cognitive behavioral therapy (CBT) exercises.
* **Literature:** (Coming Soon) A repository of classic reading materials and daily meditations.

## Zen Mode & Auto-Save
* When you open a section, the app enters a distraction-free reading mode.
* The interface is optimized for mobile devices; the question will always stay pinned to the top of your screen even when your keyboard is open.
* As you type your answers, look at the top right of the screen. The app **Auto-Saves** and encrypts your work every 2 seconds.

## The Insight Engine
Stuck on a tough question (like Step 4 resentments)? Type your initial thoughts, then click the **"AI Insight"** button in the sticky toolbar. The Insight Engine will provide gentle, instantaneous reflection to help you dig deeper.

## Asking the Compass
From the main Workbook menu, click the floating **"Consult Compass"** button.
1. Select a specific section (e.g., Step 1), or the entire workbook.
2. The AI will decrypt your answers in-memory, analyze them, and generate a comprehensive Wisdom Report highlighting your **Strengths**, **Blind Spots**, and a 3-step **Action Plan**.
3. Click the `+` icon next to any Action Plan item to instantly add it to your Tasks ledger!
""",

    "docs-site/guide/04-tasks-habits.md": r"""# 📋 The Ledger (Tasks & Habits)

The Tasks module helps you build consistent routines and track actionable recovery steps.

## Smart Tabs
Your tasks are automatically routed into four distinct lanes to reduce overwhelm:
1. **This Week:** Tasks due today or within the next 6 days.
2. **Later:** Tasks scheduled exactly 7 days from now or further in the future.
3. **Action Plan:** Tasks generated automatically by the AI Compass (indicated by a purple Sparkles icon).
4. **Log:** Your history of completed tasks. 
   * *Note:* To keep the app running smoothly, your completed tasks are grouped by Year and Month. Tap a month to expand and view your historical wins!

## The "Smart Reset" System
We don't believe in "Schedule Debt" or guilt. 
* If you miss a daily recurring habit (like "Morning Meditation"), MRT doesn't leave it in the past. 
* It automatically drops your current streak to 0 (a gentle penalty) and **moves the due date to Today** so you can try again immediately.

## Creating a Task
Click the floating `+` button to add a task. You can set Priorities (High, Medium, Low) and advanced Recurring schedules (e.g., "The Last Friday of every month").

### Task Categories
To help maintain balance in your recovery, tasks can be tagged with specific categories:
* **Recovery:** Step-work, meetings, calling your sponsor.
* **Health:** Gym, water intake, meal prep.
* **Life:** Chores, finances, errands.
* **Work:** Professional or educational goals.

## Completing Future Tasks
If you attempt to check off a task that is scheduled for a future date (e.g., Tomorrow), the app will display a warning modal asking you to confirm. This prevents you from accidentally clearing out tasks you actually need to do later in the week.
""",

    "docs/SECURITY_ZERO_KNOWLEDGE.md": r"""# 🛡️ Security Model: Zero-Knowledge Architecture

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

## 5. PIN Management & Rotation Protocol
Because the user's PIN mathematically derives their encryption key, changing a PIN is a highly sensitive operation managed by `src/lib/rotation.ts`.

### A. Changing a Known PIN (Rotation)
If the user knows their current PIN and wants to change it:
1.  **Unlock:** User enters *Current PIN* to validate against the `pinVerifier`.
2.  **Fetch & Decrypt:** App downloads ALL encrypted documents (`journals`, `workbooks`) into memory.
3.  **Generate:** User enters *New PIN*. App generates a *New Salt* and derives a *New Key*.
4.  **Re-Encrypt & Chunking:** App re-encrypts all data. **Crucially**, it utilizes `processInChunks` to process 20 documents at a time. This yields the main thread to update the React progress bar, preventing UI freezing on mobile devices.
5.  **Commit:** App uploads the new documents to Firestore in batches of 450 to respect Firebase transactional limits.
6.  **Rollback:** If the network drops mid-flight, the `catch` block restores the old `globalKey` in memory to prevent session corruption.

### B. Resetting a Lost PIN (Crypto-Shredding)
If the user forgot their PIN, rotation is mathematically impossible.
1.  **Warning:** The user triggers "Reset Vault" in the Profile Security tab. The app displays a severe warning.
2.  **Action/Shredding:** App executes a massive batch-delete of all existing documents in `journals` and `workbook_answers`, AND deletes the `encryptionSalt` from the user profile.
3.  **Result:** The old ciphertexts are destroyed, preventing orphaned, unreadable data from bloating the database. The user starts completely fresh.
"""
}

def sync_documentation():
    # Ensure script is run from project root
    if not os.path.exists("docs") or not os.path.exists("docs-site"):
        print("⚠️  Warning: Make sure you are running this from the project root directory.")
        
    for filepath, raw_content in FILES_TO_UPDATE.items():
        # Replace the __FENCE__ placeholders with actual markdown backticks
        content = raw_content.replace('__FENCE__', FENCE)
        
        # Ensure target directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Write the file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Synchronized: {filepath}")

if __name__ == "__main__":
    print("🚀 Initiating Post-Audit Documentation Sync...")
    sync_documentation()
    print("✨ Documentation successfully aligned with Codebase state.")