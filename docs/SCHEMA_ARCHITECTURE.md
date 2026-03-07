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
* **Purpose:** Profile, Auth, Billing, & Settings.
* **Fields:** `encryptionSalt`, `pinVerifier`, `sobrietyDate`, `role`, `tier`, `sponsorName`, `lastExportAt`, `usage_limits` (Map).

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, and reflections.
* **Fields:** `uid`, `content` (**ENCRYPTED BLOB**), `isEncrypted`, `moodScore` (Unencrypted), `sentiment`, `tags` (Unencrypted Array), `weather`.

### `tasks/{taskId}`
* **Purpose:** Gamification, Habits, and AI Action Plans.
* **Encryption:** Unencrypted to allow background stats and streak evaluations.
* **Fields:** `title`, `category`, `source` ('manual' | 'ai'), `priority`, `status`, `currentStreak`, `recurrence` (Map), `dueDate`, `lastCompletedAt`.

### `insights/{insightId}`
* **Purpose:** AI-generated analysis of journals/workbooks.
* **Fields:**
    * `type` (String): 'journal' | 'workbook'.
    * `scope_context` (String): e.g., 'Deep Pattern Recognition'.
    * `summary` (String): The AI's output narrative.
    * `pillars` (Map): Legacy structural breakdown (understanding, growth, blind_spots).
    * `key_themes` & `hidden_correlations` & `core_triggers` (Arrays): Extracted behavioral patterns.
    * `relapse_risk_level` (String): 'Low' | 'Moderate' | 'High' | 'Critical'.
    * `trajectory` (String): 'Improving' | 'Stable' | 'Declining' | 'Fluctuating'.
    * `strengths` & `risks` (Arrays): Listed points for UI rendering.
    * `suggested_actions` (Array): 3 specific strings to be converted into Tasks.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).
* **Fields:** `category`, `buildHash`, `environment`, `vaultUnlocked`, `route`, `userAgent`, `message`.

## 3. Query Strategy
* **Journal History:** Query by `uid`, order by `createdAt`. Requires client-side decryption loop.
* **Stats:** Query `moodScore` (Journal) or `completed` (Tasks) directly for dashboards (fast, no decrypt needed).
