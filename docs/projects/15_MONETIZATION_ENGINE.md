# 📁 Project 15: The Checkout Engine (Freemium)

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
