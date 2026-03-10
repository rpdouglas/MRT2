# 🗺️ Master Project Plan & Sprint Architecture

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
