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
| 🟢 **Done** | `PROJ-09` | **The GTM Engine** | All | VitePress rewrite, `/links` Native routing, and App Identity. |
| 🟡 **Active** | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex + "Secure Drop" P2P Sharing (`PROJ-12`). |
| ⚪ Planned | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep) & Push Notifications (`PROJ-11`). |

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
*Current Focus: Transitioning from The GTM Engine to The Service Network.*

### ✅ Completed in this Sprint
- [x] **PROJ-09.1:** Native `/links` Route (Social Media funnel bypassing Linktree).
- [x] **PROJ-09.2:** Account Deletion Flow (The "Right to be Forgotten" recursive Firestore wipe).
- [x] **PROJ-09:** The GTM Engine (VitePress Rewrite, Personas, & Public Landing Page).

### 🏃 In Progress (Active Focus)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)

### 🧊 Backlog (Up Next)
- [ ] **PROJ-07:** The Launch Engine (TWA Wrapper + Push Notifications)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media support)
- [ ] **PROJ-15:** The Checkout Engine (Stripe Integration & Paywalls)
'''

# =============================================================================
# 3. docs/specs/17_ONBOARDING.md
# =============================================================================
onboarding_content = r'''# 📐 Feature Spec: Onboarding & The Gates

**Status:** Live (Sprint 5)
**Access Level:** Free / Public

## 1. The "Why" (User Story)
* **As a:** New user ("David" or "Ned")
* **I want to:** Understand the app's value quickly and set up my profile without friction.
* **So that:** I can start tracking my sobriety and journaling securely.

## 2. User Experience (The Flow)
### A. The Landing Page (The Interactive Showcase)
* **Visuals:** 60/40 Asymmetrical Layout on Desktop. Stacks vertically on Mobile.
* **Left Column:** MRT Branding, Empathetic Blurb, and a primary "Begin Journey" CTA. Features a large, glassmorphism-wrapped Notebook LM YouTube Demo embed.
* **Right Column:** Interactive Persona Grid.
    * *Desktop:* Hovering transitions headshots to bios.
    * *Mobile:* Tapping opens a clean modal with the Bio image stacked above the Persona's YouTube Video.

### B. The Auth Consolidation
* A single, clean tabbed glassmorphism card in `Login.tsx`. 
* Users can cleanly toggle between "Sign In" and "Create Account".
* The "Create Account" tab dynamically reveals "Confirm Password" and "Privacy Guarantee" trust badges.

### C. The Native Link Tree (`/links`)
* **Purpose:** A standalone, database-free public route designed to capture social media traffic (Instagram/TikTok bio links) and direct them to the app, the VitePress guide, or support.
* **Architecture:** Bypasses the `PrivateRoute` wrapper. Uses hardcoded `LinkItem` data to ensure instantaneous load times even on poor 3G connections.

### D. The Forced Redirect (The Trap)
* **Logic:** Upon successful login/signup, the app checks `userProfile.hasCompletedOnboarding`.
* **Action:** If `false` (or missing), the user is routed to `/profile`.
* **Requirement:** They must enter a Display Name and Sobriety Date. Once saved, `hasCompletedOnboarding` is set to `true`, releasing them to the Dashboard.

## 3. Technical Architecture
* **Data Model:** Checks and updates `users/{uid}` collection.
* **Routing:** Uses React Router DOM inside a `useEffect` authentication listener for private routes.
'''

# =============================================================================
# 4. docs-site/support/changelog.md
# =============================================================================
changelog_content = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.3.1 (The Privacy & Marketing Update)
* **New:** **Right to be Forgotten:** You now have complete, automated control over your data. You can permanently delete your account directly from the Profile Data tab. The system will cryptographically shred all your encrypted journals, tasks, and analytics before removing your identity.
* **New:** **Native Link Tree:** Added a beautifully designed public `/links` page to easily share the app and educational resources from social media profiles without needing a third-party service.
* **Security:** Added a forced re-authentication step before account deletion to protect against unauthorized data destruction.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model for incredibly deep, highly accurate pattern recognition.
* **New:** **Lightning Fast Coaching:** The "AI Insight" coach in workbooks now utilizes *Flash-Lite*, providing near-instantaneous feedback.
* **Improvement:** **Timeline Navigation:** The Insights Log now groups your AI history by Year and Month using smooth, collapsible accordions.
* **Improvement:** **Rich Insights Log:** Redesigned the AI Insights output into a vibrant "Bento Grid".
* **Improvement:** **Library Hub Restructure:** Reorganized the Workbooks page with a clean tabbed navigation system.

### v1.2.0 (The Pulse Polish Update)
* **New:** **Somatic Breathwork Engine:** Upgraded the breathing tool with a fluid "Organic Halo" visualization.
* **New:** **Haptic Grounding:** The app now gently vibrates at every breath change.

### v1.1.1 (The Ledger Polish Update)
* **New:** **Future Task Safety:** Added a warning modal to prevent accidentally completing tasks scheduled for later dates.

### v1.1.0 (The Visuals & Hardening Update)
* **New:** **Gradient Insights:** Replaced basic charts with a beautiful "Emotional Velocity" area chart.

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
    print("🚀 Running Post-Sprint Documentation Sync for GTM Completion...")
    write_file("docs/ROADMAP.md", roadmap_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs/specs/17_ONBOARDING.md", onboarding_content)
    write_file("docs-site/support/changelog.md", changelog_content)
    print("✨ Audit and Synchronization Complete! The GTM Engine (PROJ-09) is officially closed.")