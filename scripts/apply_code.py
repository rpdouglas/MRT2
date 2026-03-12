import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. docs/SCHEMA_ARCHITECTURE.md (Updated for tierSource)
# =============================================================================
schema_content = r'''# 🗄️ Schema Architecture & Data Graph

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `tier` (String): 'free' | 'premium'.
    * `tierSource` (String): 'stripe' | 'manual'. // NEW: Differentiates between paid and comped.
    * `role` (String): 'user' | 'admin'.
    * `lastLogin` (Timestamp): Tracked for retention metrics.
    * `createdAt` (Timestamp): Date the user joined the platform.
'''

# =============================================================================
# 2. docs/MASTER_PLAN.md (Updated for Admin Rollout)
# =============================================================================
master_plan_content = r'''# 🗺️ Master Project Plan

## 📋 PART 3: Current Sprint Board

### ✅ Recently Completed (Sprint 6.2)
- [x] **PROJ-15:** Stripe Webhooks & Firebase Extension Integration.
- [x] **PROJ-15:** Admin VIP Dashboard (Approach C: Tier Source Architecture).
- [x] **PROJ-15:** Interactive Role Management (Promote/Demote triggers).

### 🏃 In Progress (Sprint 6.3 - Final Production Prep)
- [ ] **PROJ-15:** Create Pull Request from `feature/monetization` to `main`.
- [ ] **PROJ-15:** Deploy Live Stripe Products and update PROD Secrets.
'''

# =============================================================================
# 3. docs/projects/15_MONETIZATION_ENGINE.md
# =============================================================================
monetization_content = r'''# 📁 Project 15: The Checkout Engine (Freemium)

## 4. Implementation Phases

### Phase 4: Admin VIP & Production Rollout - [🟡 IN PROGRESS]
* [x] **Admin Override:** Implement Approach C (Tier Source) to allow manual comping.
* [x] **Retention Monitoring:** Surface `lastLogin` and `createdAt` in Admin UI.
* [x] **Role Security:** Hardened Admin promotion/demotion workflow with safety confirms.
* [ ] **Final PR:** Merge Stripe & Admin features into `main`.
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Running Post-Sprint Documentation Sync...")
    write_file("docs/SCHEMA_ARCHITECTURE.md", schema_content)
    write_file("docs/MASTER_PLAN.md", master_plan_content)
    write_file("docs/projects/15_MONETIZATION_ENGINE.md", monetization_content)
    print("✨ Documentation successfully updated with Admin VIP context.")