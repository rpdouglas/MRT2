# 📁 Project 68: Gate Stripe Checkout Out of the Android TWA

**Status:** ✅ Shipped (2026-07-19) — Phases 1-2 implemented and tested; Phase 3's manual TWA verification (real referrer check inside a built TWA shell) not yet performed, see §5.
**Primary Persona:** All (monetization/compliance infrastructure — no persona-specific UX beyond the gating itself)
**Objective:** Detect when MRT is running as the Google Play–installed Trusted Web Activity and hide the in-app Stripe purchase flow in that context, so the app doesn't offer a non-Play purchase path for digital goods from inside an app distributed through the Play Store.

---

## 1. The Executive Summary

**User Story:** As the System Architect, I want the Premium upgrade flow to never initiate a Stripe purchase from inside the Play-Store-installed app, so MRT doesn't carry Play Payments policy risk at submission — without building and maintaining a second payment system (Play Billing) just to sidestep that risk.

**Competitive Gap:** N/A — compliance/legal risk mitigation, not a competitive feature.

**Source:** Decision made 2026-07-19 in place of implementing full Google Play Billing (the other option surfaced by `docs/reports/2026-07_app_readiness_review.md` §1's Stripe/TWA billing finding). Chosen because it fully avoids the policy question — a purchase flow gated out of the Android build entirely carries no Play Billing requirement — for a fraction of the engineering cost of standing up Play Billing's receipt verification, real-time developer notifications, and dual entitlement reconciliation with the existing Stripe/`tier` pipeline. This is the cheaper, durable choice; Play Billing remains the fallback if in-app purchase from inside the installed app ever becomes a hard requirement.

**Blocks:** `docs/projects/07_PLAY_STORE_TWA.md` Sprint 9.2 (Play Store submission) — this was the last open item in `docs/ACTIVE_CYCLE.md`'s Triage & Hotfixes blocking it, alongside the now-closed PROJ-67.

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** No. This touches only which UI renders and whether a Stripe Checkout session is created — no journal/workbook/service content, no `src/lib/crypto.ts` involvement.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:** None. No new fields, no new collections. `checkout_sessions` (Stripe Extension–managed) is simply not written to when gated.

**New file:**
```typescript
// src/lib/platform.ts
/**
 * True only when running inside the Google Play–installed Trusted Web
 * Activity — not true for desktop/iOS PWA installs or a regular browser
 * tab, both of which are outside Play's Payments policy entirely.
 */
export function isAndroidTWA(): boolean {
  return document.referrer.startsWith('android-app://');
}
```

This is deliberately narrower than the existing `display-mode: standalone` check in `NotificationBanner.tsx` — that check also matches desktop and iOS home-screen PWA installs, neither of which carries any Play policy obligation. Gating on the broader signal would needlessly cut off legitimate non-Android revenue for zero compliance benefit. `document.referrer` starting with `android-app://` is the standard, Chrome-team-documented signal specific to a TWA launch (confirmed against `developer.chrome.com/docs/android/trusted-web-activity/`).

**Modified file:** `src/pages/PremiumUpgrade.tsx` — gate `handleSubscribe` (the new-purchase flow) behind `!isAndroidTWA()`. See §4 for the exact UI treatment and the `handleManageSubscription` question this raises.

---

## 4. Implementation Phases 🏗️

### Phase 1: Platform Detection Utility
* Add `src/lib/platform.ts` with `isAndroidTWA()` as specified above.
* Unit test: mock `document.referrer` to `'android-app://ca.myrecoverytoolkit.app'` → `true`; mock to `''` or a normal `https://` referrer → `false`.

### Phase 2: Gate the Purchase Flow in `PremiumUpgrade.tsx`
* Where the Supporter-tier card currently renders the `handleSubscribe` button (line ~145-153), branch on `isAndroidTWA()`:
  * **TWA context:** replace the "Become a Supporter" button with a disabled-look informational card: *"Supporter upgrades aren't available in the app right now — visit **myrecoverytoolkit.ca** in your browser to upgrade."* No Stripe session is created; no button triggers `handleSubscribe`.
  * **Non-TWA context (web, desktop/iOS PWA):** unchanged — existing `handleSubscribe` flow.
* **Decided 2026-07-19:** `handleManageSubscription` is NOT gated. Only the new-purchase `handleSubscribe` flow is hidden in the TWA. Existing subscribers can still reach the Stripe billing portal from inside the app to manage/cancel — this is account management of an existing subscription, not initiating a new external purchase, and is a common accepted pattern.
* **Somatic Check:** the gated-state message must not read as a paywall failure or broken feature — it's a redirect, not a dead end. No red/error styling; matches the existing card's calm amber/slate palette.

### Phase 3: Edge Cases
* [ ] `userTier === 'premium'` and in TWA — "Manage Subscription" remains visible and functional (see Phase 2's decision above); only the free-tier "Become a Supporter" purchase button is gated.
* [ ] User opens the app in TWA, no network — `isAndroidTWA()` is a pure synchronous check with no network dependency; works offline identically.
* [ ] Desktop/iOS PWA install — must NOT be gated; confirm `isAndroidTWA()` returns `false` for both (neither sets an `android-app://` referrer).
* [ ] 320px screen — informational card must render cleanly at the same width as the button it replaces.

---

## 5. QA & Verification 🧪

* [x] **Unit Tests:** `isAndroidTWA()` referrer-matching logic (`src/lib/__tests__/platform.test.ts`, 3 tests). `PremiumUpgrade.test.tsx` (new, 3 tests) — confirms the normal purchase button creates a Stripe session outside the TWA; confirms it's replaced by the "Upgrade on the Web" link (correct `href`/`target`/`rel`) with zero Stripe session creation inside the TWA; confirms "Manage Subscription" remains visible and ungated for an existing subscriber inside the TWA, per the Phase 2 decision.
* [ ] **Manual TWA Test:** not yet performed — needs a real built TWA shell (or Chrome's TWA debugging flags) to confirm `document.referrer` actually resolves to `android-app://ca.myrecoverytoolkit.app` in practice. Can't be verified from a normal browser tab or unit test; blocks full confidence until PROJ-07 Sprint 9.2 produces a real build to test against.
* [x] **Regression:** full `npm run check` (lint, spec-quality, 459/459 tests, build) passes clean — no existing behavior broken.
* [x] `npm run check` — zero TypeScript errors, clean build (only the pre-existing, already-tracked vendor-chunk-size warning).

---

## 6. Out of Scope

* Google Play Billing integration — the alternative this project exists to avoid; revisit only if in-app purchase from inside the installed TWA becomes a hard requirement.
* Any change to the Stripe Extension, `syncStripeSubscription`, or the `tier`/`tierSource` Firestore fields — untouched.
* Retroactive handling for any TWA user who somehow already has an active Stripe subscription — not expected to occur before this ships (no production TWA users exist yet, per PROJ-07 Sprint 9.2 not having shipped).

---

## 7. Related
* Unblocks: `docs/projects/07_PLAY_STORE_TWA.md` Sprint 9.2.
* Alternative considered and rejected in favor of this: full Google Play Billing integration (Digital Goods API + Payment Request API) — rejected for cost/complexity, not for any inferiority; may be revisited later.
