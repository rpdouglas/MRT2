# 🗄️ Schema Architecture & Data Graph

**Storage Engine:** Cloud Firestore (NoSQL)
**Encryption Strategy:** Client-Side AES-GCM (Content fields only)

## 1. High-Level Topology

```mermaid
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
```

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `encryptionSalt` (String): Public salt needed to derive key.
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `role` (String): 'user' | 'admin'. Controls UI access.
    * `sponsorName` & `sponsorPhone` (String): Unencrypted. Used for SOS dialer.
    * `lastExportAt` (Timestamp): Used for the 7-day Backup Reminder.
    * `usage_limits` (Map): Timestamps (`lastWeeklyInsight`, `lastDeepDive`) to throttle AI.
    * `tier` / `tierSource`: Monetization access tracking.
    * `substanceCost` (Number): Used for Financial Freedom calculator.
    * `costFrequency` (String): 'daily' | 'weekly' | 'monthly'.
    * `currencySymbol` (String): User's local currency symbol.

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, Urge Surfing reflections.
* **Fields:**
    * `uid` (String): Owner ID.
    * `content` (String): **ENCRYPTED BLOB** (format: `iv:ciphertext`).
    * `isEncrypted` (Boolean): Flag for legacy plain text data handling.
    * `moodScore` (Int): **UNENCRYPTED** (Allows fast dashboard stats).
    * `sentiment` (String): AI-derived sentiment.
    * `tags` (Array): **UNENCRYPTED** (e.g., `["Vitality", "Crisis Avoided"]`).
    * `weather` (Map): Snapshot of environment.

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
    * `pillars` (Map): Structured breakdown.
    * `strengths` & `risks` (Array): Listed points for UI rendering.
    * `suggested_actions` (Array): Recommended tasks.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
