# 📁 Project 15: The Checkout Engine (Freemium)

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
```typescript
export interface UserProfile {
  // ... existing fields
  tier?: 'free' | 'premium';
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
  subscriptionPeriodEnd?: Timestamp;
}
```

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
