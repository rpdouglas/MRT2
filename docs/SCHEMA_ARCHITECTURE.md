# 🗄️ Schema Architecture & Data Graph

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `tier` (String): 'free' | 'premium'.
    * `tierSource` (String): 'stripe' | 'manual'. // NEW: Differentiates between paid and comped.
    * `role` (String): 'user' | 'admin'.
    * `lastLogin` (Timestamp): Tracked for retention metrics.
    * `createdAt` (Timestamp): Date the user joined the platform.
