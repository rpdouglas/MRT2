import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. docs/ROADMAP.md
# =============================================================================
roadmap_content = r'''# 🗺️ MRT Product Roadmap: "Forged in Fire"

**Vision:** To build the world's most secure, persona-aware clinical recovery operating system.

## 📅 Q1/Q2 2026: Foundation & Polish (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search |
| 🟢 **Done** | `PROJ-04.5`| **The Crucible** | Admin | Dogfooding, QA, & Virtuoso Log |

## 📅 Q3 2026: Launch & The Service Network (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-09` | **The GTM Engine** | All | VitePress rewrite, `/links` Native routing, and App Identity. |
| ⚪ Planned | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep) & Push Notifications (`PROJ-11`). |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex + "Secure Drop" P2P Sharing (`PROJ-12`). |

## 📅 Q4 2026: Crisis, Momentum, & Monetization (Planned)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-10` | **Crisis & Momentum**| David / Ned | Interactive Urge Surfer + Financial Freedom Calculator (`PROJ-13`). |
| ⚪ Planned | `PROJ-14` | **The Deep Mind** | Walt | Local RAG (Chat with your Journal) + Encrypted Photo Media (`PROJ-06`). |
| ⚪ Planned | `PROJ-15` | **The Checkout Engine**| All | Stripe Integration, Tier Management (Free vs Premium), & Paywalls. |
'''

# =============================================================================
# 2. docs/SPRINT_BOARD.md
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
- [ ] **PROJ-09.2:** Account Deletion Flow (The "Right to be Forgotten" recursive Firestore wipe).

### 🧊 Backlog (Up Next)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media support)
- [ ] **PROJ-07:** The Launch Engine (TWA Wrapper + Push Notifications)
- [ ] **PROJ-15:** The Checkout Engine (Stripe Integration & Paywalls)
'''

# =============================================================================
# 3. docs/projects/15_MONETIZATION_ENGINE.md
# =============================================================================
monetization_content = r'''# 📁 Project 15: The Checkout Engine (Freemium)

**Status:** ⚪ Planned
**Primary Persona:** All 
**Objective:** Implement Stripe billing, manage user subscription tiers (Free vs Premium), and gracefully enforce feature paywalls without inducing user stress.

---

## 1. The Executive Summary
**User Story:** * **As** David (Crisis), I want the core tools (Journal, SOS, Pulse) to be completely free so I can get immediate help without a credit card.
* **As** Walt/Lisa (Maintenance), I am willing to pay for advanced, cost-heavy features like unlimited AI pattern recognition, PDF exports, and the Service Rolodex to support the app's development.

**Business Alignment:** Matches the `freemium.md` marketing strategy. Free users get 1 "Analysis Wizard" run per week. Premium users get unlimited access.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Stripe manages all credit card data off-platform. We only store the `stripeCustomerId` and `tier` status in our database.
* [x] **Encryption Strategy:** Billing metadata is unencrypted to allow server-side webhooks to update the account status without needing the user's PIN.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:**
* `users`: New fields for subscription management.

**Types (`src/lib/db.ts`):**
__FENCE__typescript
export interface UserProfile {
  // ... existing fields
  tier?: 'free' | 'premium';
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
  subscriptionPeriodEnd?: Timestamp;
}
__FENCE__

---

## 4. Implementation Phases 🏗️

### Phase 1: Stripe Configuration & Webhooks (Backend)
* Create Stripe products (Monthly / Annual).
* Set up a Firebase Cloud Function to listen for Stripe Webhooks (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
* Write webhook logic to update the `tier` and `subscriptionStatus` on the user's Firestore document.

### Phase 2: Checkout UI & Portal (Frontend)
* Create a `/premium` upgrade page outlining the benefits.
* Implement Stripe Checkout redirect.
* Implement Stripe Customer Portal redirect so users can easily cancel or update cards.

### Phase 3: The Paywall Enforcers (Logic)
* **The Compass:** Update `JournalAnalysisWizard.tsx` to check `userProfile.tier`. If `free`, enforce the `lastWeeklyInsight` timestamp check. If `premium`, bypass the check.
* **The Rolodex:** Lock the `/service` route behind a Premium check.
* **Data Sovereignty:** Ensure the JSON export remains free (core right), but PDF generation is restricted to Premium.

### Phase 4: Graceful Degradation
* **Somatic Check:** If a user's card fails and they drop to `free`, do NOT delete their Premium data (like Sponsee notes). Simply lock the UI to "Read Only" mode until they reactivate.
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Patching Strategic Gaps...")
    write_file("docs/ROADMAP.md", roadmap_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs/projects/15_MONETIZATION_ENGINE.md", monetization_content)
    print("✨ Documentation successfully updated. Gaps patched.")