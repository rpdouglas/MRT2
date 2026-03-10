# 📁 Project 15: The Checkout Engine (Freemium)

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
