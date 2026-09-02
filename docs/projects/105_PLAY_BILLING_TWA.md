# 📁 Project 105: Google Play Billing for the Android TWA

**Status:** ⚪ Planned — strategy proposal below, awaiting approval before any code
**Primary Persona:** All (monetization infrastructure — no persona-specific UX beyond the purchase flow itself)
**Objective:** Let users subscribe to Premium ($3.99/mo) with a native, one-tap purchase from inside the Android TWA, instead of the current zero-purchase-path state (`PROJ-68` amendment, 2026-09-01).

---

## 1. The Executive Summary
**User Story:** As an Android user who wants Premium features, I want to subscribe without leaving the app, so that upgrading feels as easy as it does on the web.
**Source:** `docs/projects/68_STRIPE_TWA_GATING.md` §8 — re-examined 2026-09-01 during `PROJ-07` Play Store submission. The original PROJ-68 decision (avoid Play Billing entirely, gate purchases out of the TWA) traded engineering cost for a real revenue gap on what the account owner has identified as the app's biggest platform. Re-running the numbers: Play Billing's 15% total fee (10% service + 5% billing) is actually comparable-or-better than the "cheaper-looking" alternative (External Content Links: 10% Google + Stripe's own ~2.9%+$0.30, which lands worse than 15% at a $3.99 price point once Stripe's flat fee is priced in). The blocker was never really economics — it's the engineering lift of a second entitlement source. This spec exists to plan that properly instead of avoiding it.
**Competitive Gap:** Table stakes, not a differentiator — "I Am Sober," "Reframe," and "Sober Grid" all support native in-app purchase on Android.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No recovery content involved — this is billing/entitlement metadata only (`users/{uid}.tier`/`tierSource`, already unencrypted per `CLAUDE.md`'s collection table — "Needed for streak/feature-gating evaluation," same rationale already applied to Stripe). No new sensitive data category introduced.
* [x] **Encryption Strategy:** N/A — no `src/lib/crypto.ts` involvement, matching the existing Stripe pipeline.
* [x] **Key Rotation:** N/A — `tier`/`tierSource` are already excluded from `executePinRotation`/`executeCryptoShredding` (they're not encrypted fields), and a Play-Billing-sourced entitlement doesn't change that.

---

## 3. Schema & Architecture 🗄️ (current state — read before proposing changes)

**Existing pattern (Stripe), to extend not replace:**
- `users/{uid}.tier?: 'free' | 'premium'` and `tierSource?: 'stripe' | 'manual'` (`src/lib/db.ts:29-30` — note the live Cloud Function actually writes the string `"Stripe-Managed"`, not `'stripe'`; the TS union is already out of sync with reality, worth fixing in the same PR that adds a third source rather than compounding the drift).
- `users/{uid}/subscriptions/{id}` — Stripe Firebase Extension–managed subcollection, `allow write: if false` in `firestore.rules:116-119` (Admin SDK / extension only).
- `functions/src/index.ts:844-880` (`syncStripeSubscription`) — `onDocumentWritten` trigger on that subcollection. On status change, computes `isPremium` from Stripe's `status` field, writes `tier`/`tierSource` onto the user doc, and sets `{ premium: isPremium }` as an Auth custom claim.
- `PremiumUpgrade.tsx` — `handleSubscribe` creates a `checkout_sessions` doc (extension picks it up, returns a Stripe Checkout URL); `isAndroidTWA()` (`src/lib/platform.ts`) currently hides this entirely in the TWA (post-`PROJ-68` amendment: plain text, no link at all).

**What a Play Billing integration adds, following the same shape:**
- Client: Digital Goods API (`window.getDigitalGoodsService('https://play.google.com/billing')`) + Payment Request API — this is the TWA-specific bridge (not the native Android Billing Library; there is no native Android code in a TWA). Feature-detected and only functional when actually launched from the Play-installed TWA — same detection precedent as `isAndroidTWA()`.
- Server: a new Cloud Function verifying purchase tokens against the Google Play Developer API (`purchases.subscriptions.get`), and a Pub/Sub-triggered function receiving **Real-time Developer Notifications (RTDN)** for renewal/cancellation/refund events — the Play-side equivalent of the Stripe extension's webhook plumbing.
- Both write the *same* `tier`/`tierSource` fields the rest of the app already reads everywhere — `tierSource` gains a third value (e.g. `'play-billing'`), and every existing `tier === 'premium'` check in the codebase needs zero changes. This is the key de-risking fact: the hard part isn't "teaching the app about a second payment system," it's correctly verifying and syncing Play's side into a schema that already exists and is already proven.

**New Firestore surface needed:** a home for the raw Play purchase record (mirroring `subscriptions/{id}`'s role for Stripe) — e.g. `users/{uid}/playPurchases/{purchaseToken}`, same `allow write: if false` client-side pattern.

---

## 4. Three Strategies (Planning Protocol, per `.claude/skills/planning/SKILL.md`)

### Dependency Impact Table
| File/Module | Type | Impact | Confidence |
|---|---|---|---|
| `src/lib/db.ts` | schema | MODIFY (`tierSource` union: add `'play-billing'`, fix `'stripe'` vs `"Stripe-Managed"` drift) | HIGH |
| `src/pages/PremiumUpgrade.tsx` | UI | MODIFY (real purchase button in TWA branch, replacing today's plain text) | HIGH |
| `src/lib/platform.ts` | logic | READ (`isAndroidTWA()` reused, no change) | HIGH |
| New: `src/lib/playBilling.ts` | logic | NEW (Digital Goods API wrapper, feature detection, purchase flow) | HIGH |
| `functions/src/index.ts` | backend | MODIFY (new purchase-verification + RTDN handler functions, alongside existing `syncStripeSubscription`) | HIGH |
| `firestore.rules` | security | MODIFY (new `playPurchases` subcollection, same locked-down shape as `subscriptions`) | HIGH |
| `docs/SCHEMA_ARCHITECTURE.md` | docs | MODIFY (Protocol A schema sync, per `docs/governance/DEVELOPER_GUIDE.md`) | HIGH |
| Google Play Console | external | NEW (create the subscription product, `com.myrecoverytoolkit.premium.monthly` or similar, priced $3.99/mo; enable RTDN topic) | HIGH |
| `docs/legal/PLAY_STORE_DATA_SAFETY_DRAFT.md` | docs | UNCERTAIN — Financial info section may need a line for Play-processed payment data | LOW (inferred, needs a real look once built) |

### Strategy A — Conservative: Play Billing only for new TWA subscribers, no cross-platform linking
- **Effort:** ~4-5 days.
- **Trade-off:** Simplest to reason about — a TWA user's subscription lives entirely in Play; a web/iOS-PWA user's lives entirely in Stripe. No account ever has both. Cheapest to build, but a user who subscribes via Android and later opens the web app on desktop just... works (same `tier` field), so this isn't actually a UX gap — it's a *data* simplification (never write conflicting entitlement sources for one account) achieved by product policy, not code: don't offer the Stripe purchase button in the TWA-detected client the way it already doesn't today, and don't worry about a user somehow ending up with both subscription types active (edge case, not designed for).
- **Persona fit:** David (crisis state) — no impact, this is a settings-adjacent flow he never touches during crisis. Walt (reflective, values data sovereignty/traceability) — fine, `tierSource` stays a clear, auditable single value per account.
- **Scores (1-5):** speed 5 / persona 4 / ZK complexity 5 (none) / maintenance 4 / test surface 4.

### Strategy B — Refactored/Modern (RECOMMENDED): Play Billing as a first-class second `tierSource`, explicit dual-source handling
- **Effort:** ~7-9 days.
- **Trade-off:** Handles the real edge case Strategy A ignores — a user who already has an active Stripe subscription (from the web) opening the Android app shouldn't be shown a Play purchase button that would double-charge them, and vice versa. Requires the sync function to *check* the existing `tierSource` before writing, and `PremiumUpgrade.tsx` to render "Manage Subscription" (pointing at whichever platform actually owns it) instead of "Become a Supporter" for either source. More correct, moderately more code, but not architecturally novel — it's the same "one `tier` field, multiple writers, last-writer-wins with a guard" pattern `syncStripeSubscription` already establishes; this just adds the guard.
- **Persona fit:** David — unaffected. Walt — better fit than Strategy A; a Walt-type long-term user who started on web/Stripe years ago and later installs the Play Store app must never see a confusing "upgrade" prompt when he's already Premium, which Strategy A doesn't explicitly guard against — a real correctness gap, not just polish.
- **Scores (1-5):** speed 3 / persona 5 / ZK complexity 5 (none) / maintenance 4 / test surface 3.

### Strategy C — Robust/Scalable: Full billing abstraction layer (`BillingProvider` interface, Stripe and Play as interchangeable implementations)
- **Effort:** ~12-15 days.
- **Trade-off:** Cleanest long-term architecture if a third payment platform (e.g. Apple IAP, if `PROJ-**` iOS/Capacitor wrapper ever ships per `docs/BACKLOG.md`) becomes likely — but MRT has no iOS app today and no concrete plan to build one soon (that Backlog item is itself trigger-gated, not scheduled). Building an abstraction for a hypothetical third platform now is speculative engineering against CLAUDE.md's own "don't design for hypothetical future requirements" rule.
- **Persona fit:** Same as B, no persona benefit over B — the abstraction is invisible to users.
- **Scores (1-5):** speed 1 / persona 5 / ZK complexity 5 (none) / maintenance 3 (more moving parts, harder to onboard a future contributor to an abstraction with only one real implementation behind it today) / test surface 2.

**Recommendation: Strategy B.** Strategy A is genuinely faster but leaves a real correctness gap (double-entitlement confusion for any user who's cross-platform) that will surface the first time a long-term subscriber installs the Android app — not a hypothetical edge case for this specific app, given `PROJ-91`'s Walt persona is explicitly a multi-year-sobriety, data-sovereignty-conscious user type likely to have started on web before Android ever existed as an option. Strategy C solves a problem MRT doesn't have yet. Strategy B is the smallest change that's actually correct.

---

## 5. Technical Impact (Strategy B)
1. **Schema:** `src/lib/db.ts` — `tierSource?: 'stripe' | 'play-billing' | 'manual'` (fix the `'stripe'`/`"Stripe-Managed"` string-value drift in the same change). New interface for a `playPurchases/{purchaseToken}` doc (raw Play purchase record, mirrors `subscriptions/{id}`'s shape/role for Stripe).
2. **Firestore rules/indexes/Functions:** `firestore.rules` — new `users/{userId}/playPurchases/{token}` match block, `allow create, read: if isOwner`, `allow update, delete: if false` (client registers the purchase token it received from the Digital Goods API; only the backend verifies and finalizes it) — mirrors the `checkout_sessions` pattern (client-initiated, backend-completed), not the fully-locked `subscriptions` pattern, since the client does need to hand the token to the backend somehow. New Cloud Functions: one HTTPS callable (client calls after purchase, backend verifies via Play Developer API before granting `tier`), one Pub/Sub trigger (RTDN topic, for renewals/cancellations after the fact).
3. **Metadata to preserve:** `uid` (obviously), and the raw Play `purchaseToken`/`orderId` for future refund/support lookups — same spirit as Stripe's `subscriptions/{id}` doc ID.
4. **Date normalization:** Play purchase expiry comes back as an epoch-millis string from the Developer API; convert to Firestore `Timestamp` at write time, same as every other write path per `CLAUDE.md`.
5. **ZK boundary:** No encrypted fields touched — confirmed in §2.
6. **Test contract:**
   - Unit: `playBilling.ts`'s feature-detection (mock `window.getDigitalGoodsService` present/absent), purchase-flow happy path and cancellation.
   - Integration: the new Cloud Function's token-verification logic (mock Play Developer API response), the RTDN handler's status-change → `tier` write logic (mirrors `syncStripeSubscription`'s existing test coverage shape, if any exists — check before assuming a pattern to copy).
   - Security: raw Firestore doc check confirming a client cannot write `tier`/`tierSource` directly via a crafted `playPurchases` doc (same test shape as existing `firestore.rules` tests, `vitest.rules.config.ts`).
   - Regression: existing Stripe purchase flow (web/iOS-PWA) must be provably unaffected — full existing `PremiumUpgrade.test.tsx` suite plus the dual-source guard from Strategy B (a user with `tierSource: 'stripe'` already active must not see a Play purchase prompt in the TWA).
7. **Bundle check:** Digital Goods API is a browser-native API (no new npm dependency, zero bundle-size cost) — confirm this before assuming, some reference implementations use a helper library; prefer the native API directly if it's sufficient, consistent with `CLAUDE.md`'s "reuse existing patterns, don't reinvent" and avoiding unnecessary deps.
8. **Rollback:** `git revert` is possible for all client/Function code. The one non-revertible piece is the Play Console subscription product itself (once created and purchased against, can't be deleted, only deactivated) — standard Play Console behavior, not specific to this build; document as a one-way external action same as `mrt-release.keystore` generation was.

---

## Stop Gate
**STOP.** This is the strategy proposal — no code has been written. Per `.claude/skills/planning/SKILL.md`, waiting for explicit approval (or a chosen strategy / requested changes) before any implementation begins.
