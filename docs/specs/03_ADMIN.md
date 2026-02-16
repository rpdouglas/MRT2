# 📐 Feature Spec: Admin Dashboard

**Status:** Live (v1.2)
**Access:** Restricted (Custom Claims `admin: true`)

## 1. Overview
The internal tool for monitoring system health, managing users, and debugging AI usage.

## 2. Sub-Features

### A. Analytics (Gemini Metrics)
* **Source:** `ai_logs` collection.
* **Visuals:**
    * Pie Chart: Model distribution (Flash vs Pro).
    * Bar Chart: Token usage stream.
* **Purpose:** Cost monitoring.

### B. User Directory
* **Source:** `users` collection.
* **Capabilities:**
    * View all users (Paginated).
    * **Promote/Demote:** Toggle admin status via Custom Claims.

### C. System Health
* **Source:** `client_errors` collection.
* **AI Analysis:** Uses Gemini to aggregate raw error logs into a "System Health Report" with suggested fixes.

### D. Maintenance Tools
* **Deduplicator:** Scans for duplicate journal entries (common import bug) and cleans them.
* **Schema Migration:** Updates legacy documents to match current type definitions.
