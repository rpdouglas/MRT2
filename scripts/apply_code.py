import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. docs/SCHEMA_ARCHITECTURE.md
# =============================================================================
schema_content = r'''# 🗄️ Schema Architecture & Data Graph

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
    userDoc --> checkout_sessions[📂 checkout_sessions - STRIPE]
    userDoc --> subscriptions[📂 subscriptions - STRIPE]
    
    root --> journals[📂 journals]
    root --> tasks[📂 tasks]
    root --> insights[📂 insights]
    root --> ai_logs[📂 ai_logs]
    root --> feedback[📂 feedback]
__FENCE__

## 2. Collection Definitions

### `users/{uid}`
* **Purpose:** Profile, Auth, & Settings.
* **Fields:**
    * `encryptionSalt` (String): Public salt needed to derive key.
    * `pinVerifier` (String): Hash(PIN + Salt) to verify PIN correctness.
    * `sobrietyDate` (Timestamp): Metrics base.
    * `role` (String): 'user' | 'admin'.
    * `tier` (String): 'free' | 'premium'. (Monetization status).
    * `usage_limits` (Map): AI throttling caps.
* **Subcollections (Stripe Managed):**
    * `checkout_sessions`: Client writes here to trigger Stripe Checkout.
    * `subscriptions`: Webhook writes here to verify active payment status.

### `journals/{entryId}`
* **Purpose:** Daily logs, Vitality logs, and reflections.
* **Fields:** `uid`, `content` (**ENCRYPTED BLOB**), `moodScore` (Unencrypted), `tags` (Array), `weather`.

### `tasks/{taskId}`
* **Purpose:** Gamification, Habits, and AI Action Plans.
* **Encryption:** Unencrypted to allow background stats and streak evaluations.

### `insights/{insightId}`
* **Purpose:** AI-generated analysis of journals/workbooks.
* **Fields:** `type`, `summary`, `relapse_risk_level`, `trajectory`, `suggested_actions`.

### `feedback/{reportId}`
* **Purpose:** User bug reports and suggestions.
* **Encryption:** **NONE** (To allow debugging without user PIN).
'''

# =============================================================================
# 2. docs/MASTER_PLAN.md
# =============================================================================
master_plan_content = r'''# 🗺️ Master Project Plan & Sprint Architecture

**Vision:** To build the world's most secure, persona-aware clinical recovery operating system.
**Current Phase:** V2 Commercial Launch (Monetization Rollout).

---

## 🏗️ PART 1: The Macro Roadmap (Quarterly View)

| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01-09` | **Foundation & GTM** | Universal | Core app, Crypto, Account Deletion, Landing Pages. |
| 🟡 **Active**| `PROJ-15` | **The Checkout Engine**| Universal | Stripe Integration, Tier Management, & PROD Rollout. |
| ⚪ Planned | `PROJ-07` | **The Launch Engine** | Universal | TWA Android Wrapper, Play Store Assets, & Compliance. |
| 🧊 **V3** | `PROJ-05` | **The Service Network** | Lisa (Sponsor) | *V3:* Encrypted Sponsee Rolodex + Step-work tracking. |
| 🧊 **V3** | `PROJ-10` | **Crisis & Momentum** | David / Ned | *V3:* Interactive Urge Surfer + Financial Freedom Calculator. |
| 🧊 **V3** | `PROJ-14` | **The Deep Mind** | Walt (Zen) | *V3:* Local RAG (Chat with your Journal) + Encrypted Photo Media. |

---

## 🔬 PART 2: Project Deep Dives & Sprint Projections

### 💳 PROJ-15: The Checkout Engine (Active)
*Implementing the Freemium model to cover AI and server costs.*
* **Sprint 6.0: Stripe & Webhooks (Backend - DEV)** (🟢 Done)
* **Sprint 6.1: Paywall & Graceful Degradation (Frontend)** (🟢 Done)
* **Sprint 6.2: Production Rollout & PR (Active)**
  * Merge feature branch into `main`.
  * Create Live Mode Products in Stripe Dashboard.
  * Install Firebase Stripe Extension in PROD Firebase Project.
  * Configure Live Webhooks and update PROD GitHub Action Secrets.

### 🚀 PROJ-07: The Launch Engine (Next)
*Moving from a browser PWA to the Google Play Store.*
* **Sprint 7.0: Android TWA Wrapping (Engineering)**
  * Generate and host the `/.well-known/assetlinks.json` file.
  * Compile the React PWA into a signed Android `.aab` via Bubblewrap.
* **Sprint 7.1: Play Store Compliance & Assets (Ops)**
  * Draft the Play Store Data Privacy declarations.
  * Generate feature graphics and localized screenshots.

---

## 📋 PART 3: Current Sprint Board (Micro View)

**Current Phase:** Sprint 6.0 (Active)

### ✅ Recently Completed 
- [x] **PROJ-15:** DEV Stripe Webhooks & Firebase Extension Integration.
- [x] **PROJ-15:** Paywall UI (`<PremiumGate>`) & Frontend Logic.
- [x] **PROJ-15:** Hardened Firestore Rules against client-side spoofing.

### 🏃 In Progress (Sprint 6.2 - Production Rollout)
- [ ] **PROJ-15:** PR `feature/stripe_integration` into `main`.
- [ ] **PROJ-15:** Setup Stripe "Live Mode" (Product & Live Price ID).
- [ ] **PROJ-15:** Install Firebase Stripe Extension in PROD project (`mrt2-app-prod`).
- [ ] **PROJ-15:** Configure Live Webhook Secrets in PROD.
'''

# =============================================================================
# 3. docs/SPRINT_BOARD.md
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board

**Current Phase:** Sprint 6.0 (Active)

## ✅ Completed Sprints
- [x] **Sprints 1-4:** Foundation, Auth, Journal Engine, Encryption, Tasks, Vitality.
- [x] **Sprint 5.0:** The GTM Engine (Links Route, Account Deletion, VitePress).

## 🟡 Sprint 6.0: The Checkout Engine (Active)
*Current Focus: Moving the Stripe Integration from DEV to PRODUCTION.*

### ✅ Completed in this Sprint
- [x] **PROJ-15:** Phase 1: Stripe Configuration & Webhooks (Backend DEV).
- [x] **PROJ-15:** Phase 2: Checkout UI & Portal (Frontend).
- [x] **PROJ-15:** Phase 3: The Paywall Enforcers (Logic & Context).

### 🏃 In Progress (Active Focus)
- [ ] **PROJ-15:** Phase 4: Create Pull Request to `main`.
- [ ] **PROJ-15:** Phase 4: Configure Stripe "Live Mode" (Get Live Price ID).
- [ ] **PROJ-15:** Phase 4: Install Firebase Stripe Extension to `mrt2-app-prod`.
- [ ] **PROJ-15:** Phase 4: Set Live Webhook and update GitHub Action `.env` secrets.

## 🧊 Backlog (Up Next)
- [ ] **PROJ-07:** The Launch Engine (Android TWA & Play Store)
- [ ] **PROJ-05:** The Service Network (V3 Release)
'''

# =============================================================================
# 4. docs/projects/15_MONETIZATION_ENGINE.md
# =============================================================================
monetization_content = r'''# 📁 Project 15: The Checkout Engine (Freemium)

**Status:** 🟡 Active
**Primary Persona:** All 
**Objective:** Implement Stripe billing, manage user subscription tiers (Free vs Premium), and gracefully enforce feature paywalls without inducing user stress.

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Stripe manages all credit card data off-platform. We only store the `stripeCustomerId` and `tier` status.
* [x] **Encryption Strategy:** Billing metadata is unencrypted to allow server-side webhooks to update the account status without needing the user's PIN.
* [x] **Firestore Rules:** Subcollections `checkout_sessions` and `subscriptions` strictly locked down to prevent client-side spoofing.

## 4. Implementation Phases 🏗️

### Phase 1: Stripe Configuration & Webhooks (DEV Backend) - [x] DONE
* [x] Create Stripe products (Monthly / Annual) in Test Mode.
* [x] Set up Firebase "Run Payments with Stripe" Extension in DEV.
* [x] Configure Stripe Webhook Secrets to securely update `subscriptions` subcollection.

### Phase 2: Checkout UI & Portal (Frontend) - [x] DONE
* [x] Create a `/premium` upgrade page outlining the benefits.
* [x] Implement Stripe Checkout redirect via `checkout_sessions`.
* [x] Implement Stripe Customer Portal redirect via `ext-firestore-stripe-payments-createPortalLink`.

### Phase 3: The Paywall Enforcers (Logic) - [x] DONE
* [x] **The Compass:** Updated `JournalAnalysisWizard.tsx` to check `userTier`. Bypasses limits for premium users.
* [x] **Data Sovereignty:** Wrapped PDF Generation button in `<PremiumGate>` wrapper.
* [x] **Auth Context:** Real-time `onSnapshot` listener attached to the user's `subscriptions` collection for instant unlocks.

### Phase 4: Production Rollout (Active) - [ ] IN PROGRESS
* [ ] **PR:** Merge feature branch into `main`.
* [ ] **Live Stripe Data:** Toggle Stripe to Live Mode, create Product, extract Live `price_` ID.
* [ ] **PROD Infrastructure:** Deploy Firebase rules to PROD and install the Stripe Extension in the PROD Firebase project.
* [ ] **CI/CD Secrets:** Update GitHub Actions with the Live Stripe Price ID.
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Running Post-Sprint Documentation Sync (v2: Production Staging)...")
    write_file("docs/SCHEMA_ARCHITECTURE.md", schema_content)
    write_file("docs/MASTER_PLAN.md", master_plan_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs/projects/15_MONETIZATION_ENGINE.md", monetization_content)
    print("✨ Documentation perfectly aligned. Staged for Production Rollout.")