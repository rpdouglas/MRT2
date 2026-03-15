import os

FENCE = chr(96) * 3

FILES = {
    "docs/ROADMAP.md": r"""# 🗺️ MRT Product Roadmap: "Forged in Fire"

**Vision:** To build the world's most secure, persona-aware clinical recovery operating system.

## 📅 Q1/Q2 2026: Foundation & Polish (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search |
| 🟢 **Done** | `PROJ-04.5`| **The Crucible** | Admin | Dogfooding, QA, & Virtuoso Log |
| 🟢 **Done** | `PROJ-10` | **Crisis & Momentum**| Admin | Urge Surfer + Financial Calculator |

## 📅 Q3 2026: Launch & The Service Network (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-09` | **The GTM Engine** | All | VitePress rewrite, `/links` Native routing. |
| 🟢 **Done** | `PROJ-15` | **The Checkout Engine**| All | Stripe Integration, Tier Management, Supporter Gate. |
| 🟡 **Active** | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |

## 📅 Q4 2026: The Deep Mind (Planned)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-14` | **The Deep Mind** | Walt | Local RAG (Chat with your Journal). |
""",

    "docs/SPRINT_BOARD.md": r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 7.0 (The Launch Engine)

## ✅ Completed Sprints
- [x] **Sprints 1-4:** Foundation, Auth, Journal Engine, Tasks, Vitality.
- [x] **Sprint 5.0:** The GTM Engine (Links Route, Account Deletion, VitePress).
- [x] **Sprint 6.0/6.5:** Crisis Tools (Urge Surfer, Financials) & Monetization Engine (Stripe Live).

## 🟡 Sprint 7.0: Android Play Store TWA
*Current Focus: Compiling the PWA into a native Android App Bundle (.aab).*

### 🏃 In Progress (Active Focus)
- [ ] **PROJ-07:** Initialize Google Bubblewrap CLI.
- [ ] **PROJ-07:** Configure `twa-manifest.json` with correct theme colors and icons.
- [ ] **PROJ-07:** Generate and upload `.well-known/assetlinks.json` to Firebase Hosting to verify ownership and remove the browser URL bar.
- [ ] **PROJ-07:** Build the signed `.aab` file using `mrt-release.keystore`.

## 🧊 Backlog (Up Next)
- [ ] **PROJ-05:** The Service Network (Sponsee Rolodex - "Lisa" Persona)
""",

    "docs/projects/15_MONETIZATION_ENGINE.md": r"""# 📁 Project 15: The Checkout Engine (Freemium)

**Status:** 🟢 Done
**Primary Persona:** All
**Objective:** Integrate Stripe via Firebase Extensions to power a robust Freemium model and Supporter Tier.

---

## 1. The Executive Summary
**User Story:** * **As** a power user (Walt/Lisa), I want to financially support the app and unlock unlimited AI Deep Dives and PDF Exports.
* **As** an Admin, I want to manage subscriptions and manually grant VIP access to beta testers without requiring a credit card.

---

## 4. Implementation Phases

### Phase 1: Firebase & Stripe Plumbing - [🟢 DONE]
* [x] Installed `firestore-stripe-payments` extension.
* [x] Configured webhook endpoints.
* [x] Mapped `VITE_STRIPE_PREMIUM_PRICE_ID`.

### Phase 2: The Subscription UI - [🟢 DONE]
* [x] Built `PremiumUpgrade.tsx` to handle Checkout Session creation.
* [x] Built `PremiumGate.tsx` to elegantly block or blur premium features.

### Phase 3: The Context Layer - [🟢 DONE]
* [x] Updated `AuthContext.tsx` to listen to the `subscriptions` subcollection.
* [x] Handled fallback to static `userProfile.tier`.

### Phase 4: Admin VIP & Production Rollout - [🟢 DONE]
* [x] Implemented Admin Override (Tier Source Architecture) to allow manual comping via `/admin`.
* [x] Configured Stripe "Live Mode".
* [x] Merged to `main` and verified in production.
""",

    "docs-site/support/changelog.md": r"""# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.5.0 (The Supporter Update)
* **New:** **MRT Supporter Tier:** We have officially launched our Premium "Supporter" tier. By upgrading, you not only unlock unlimited AI Deep Dives, custom Journal Templates, and PDF Exports, but you also help keep the core crisis tools completely free for users who need them most.
* **New:** **Manage Subscription:** Seamless, secure integration with Stripe to manage your subscription directly from your Profile.

### v1.4.0 (The Momentum & Crisis Update)
* **New:** **Financial Freedom Tracker:** You can now enter your historical substance cost in your Profile. The dashboard will automatically calculate and display exactly how much money you've saved by staying clean.
* **New:** **The Urge Surfer:** Added a 5-minute interactive somatic grounding tool (accessible via the SOS menu and Tools tile). This feature uses the 5-4-3-2-1 method to help you ride out intense cravings, securely logging your victory to your journal when the wave passes.

### v1.3.1 (The Privacy & Marketing Update)
* **New:** **Right to be Forgotten:** You now have complete, automated control over your data. You can permanently delete your account directly from the Profile Data tab.
* **New:** **Native Link Tree:** Added a beautifully designed public `/links` page to easily share the app.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
"""
}

def apply_fixes():
    for filepath, raw_content in FILES.items():
        content = raw_content.replace('__FENCE__', FENCE)
        
        dir_path = os.path.dirname(filepath)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Synced: {filepath}")

if __name__ == "__main__":
    apply_fixes()
    print("✨ Documentation Drift Resolved. Sprint 7.0 Initialized.")