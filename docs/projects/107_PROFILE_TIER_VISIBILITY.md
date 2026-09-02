# 📁 Project 107: Profile Page Tier Visibility & Upgrade Entry Point

**Status:** 🟡 In Progress — Strategy B approved 2026-09-02, implementation underway
**Primary Persona:** All (account/settings surface — no persona-specific UX beyond Walt's traceability expectation, noted below)
**Objective:** Show a user's current premium tier and its source on the Profile page, with a working upgrade/manage-subscription entry point — today there is neither, anywhere in general navigation.

---

## 1. The Executive Summary
**User Story:** As any user (free or premium) opening Settings/Profile to check or change my account, I want to see what tier I'm on and have a button to upgrade or manage it, so that I don't have to accidentally trip a feature paywall just to find the upgrade page.
**Source:** Found live, mid-session, while testing the just-shipped PROJ-105 Play Billing purchase flow — there was no way to reach `/premium` from Profile to even start the test. Independently verified by reading `Profile.tsx` in full (952 lines) and grepping every existing route to `/premium` across the codebase.
**Competitive Gap:** Table stakes — every subscription app ("I Am Sober," "Reframe," "Sober Grid") surfaces current plan + manage/upgrade from its account/settings screen. MRT is the outlier in not doing this.

**Verified finding — the actual gap, precisely:**
Every existing path to `/premium` is a *reactive* paywall trigger, not a *voluntary* entry point:
- `PremiumGate.tsx` (button_swap / lock_overlay fallback on a gated feature)
- `JournalEditor.tsx`'s custom-templates button (`userTier === 'premium' ? navigate('/templates') : navigate('/premium')`)
- `JournalAnalysisWizard.tsx`'s scope-selector `onUpgradeClick`

None of these fire unless a free user happens to reach for a specific gated feature first. `Profile.tsx` — the obvious, expected home for "what plan am I on / how do I upgrade" — has zero mention of `tier`, `tierSource`, or a link to `/premium` anywhere in its 952 lines, across all 4 tabs (General/Security/Data/Achievements). A user who opens Settings specifically to upgrade has no way to do it. This is exactly the same class of gap CLAUDE.md already flags for `JournalEditor.tsx`'s custom-templates button ("gating the button that links to a feature is not the same as gating the feature") — here it's the inverse: nothing *links* to the feature at all.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** None. `tier`/`tierSource` are already unencrypted profile metadata per `CLAUDE.md`'s collection table, already read client-side everywhere (`PremiumUpgrade.tsx`, `PremiumGate.tsx`, `FriendsDirectory.tsx`). No new sensitive data category.
* [x] **Encryption Strategy:** N/A — no `src/lib/crypto.ts` involvement.
* [x] **Key Rotation:** N/A — `tier`/`tierSource` are not encrypted fields, already excluded from `executePinRotation`/`executeCryptoShredding`.

---

## 3. Schema & Architecture 🗄️
**No schema changes.** This is a read-only UI surface over fields that already exist and are already live-synced:
- `useAuth()`'s `userTier` / `userTierSource` (`src/contexts/AuthContext.tsx`) — added this session for PROJ-105, already the source of truth `PremiumUpgrade.tsx` reads from (live-updated via the Stripe `subscriptions` `onSnapshot` listener, with `tierSource` covering `'Stripe-Managed' | 'play-billing' | 'manual'`).
- **Deliberately not** `useUserProfile()`'s raw profile doc, even though `Profile.tsx` already imports that hook for everything else — that read is a one-time/query-cached fetch, not live-synced to the Stripe subscription listener the way `useAuth()`'s values are. Using `useAuth()` here matches `PremiumUpgrade.tsx`'s own precedent and avoids a stale badge right after a purchase completes.

No new Firestore reads, no new Cloud Function calls, no new `firestore.rules` surface.

---

## 4. Three Strategies (Planning Protocol, per `.claude/skills/planning/SKILL.md`)

### Dependency Impact Table
| File/Module | Type | Impact | Confidence |
|---|---|---|---|
| `src/pages/Profile.tsx` | UI | MODIFY (new tier card in the General tab; destructure `userTier`/`userTierSource` from `useAuth()`, already imported) | HIGH |
| `src/pages/PremiumUpgrade.tsx` | UI | READ ONLY — the new card links here, reusing its existing upgrade/manage-subscription logic untouched | HIGH |
| `src/contexts/AuthContext.tsx` | logic | READ ONLY — `userTier`/`userTierSource` already exposed (PROJ-105), no change needed | HIGH |
| `src/components/admin/FriendsDirectory.tsx` | reference | READ ONLY — its `renderTierBadge` is the existing badge-styling precedent (green Supporter / purple VIP / gray Free), reused for visual consistency, not imported (admin table context vs. user-facing card differ enough to warrant separate markup) | MEDIUM |

### Strategy A — Conservative: Single-line tier badge + "Manage/Upgrade" button, no new copy
- **Effort:** ~2-3 hours.
- **Trade-off:** Fastest fix for the actual reported bug (no entry point exists). A single badge ("Free" / "Supporter") plus one button that always says "Manage Plan" and navigates to `/premium` — letting that page's own existing logic (already source-aware post-PROJ-105) decide what to actually show/do. Doesn't surface *which* platform manages an active subscription on the Profile page itself, only after tapping through.
- **Persona fit:** David — unaffected (Profile isn't a crisis surface). Walt — partial fit; he'd likely want the source visible without an extra tap (his whole persona constraint is data traceability/sovereignty), so Strategy A is a real but minor gap for him specifically.
- **Scores (1-5):** speed 5 / persona 3 / ZK complexity 5 (none) / maintenance 5 / test surface 4.

### Strategy B — Refactored/Modern (RECOMMENDED): Source-aware tier card
- **Effort:** ~4-6 hours.
- **Trade-off:** Same single card, same one button to `/premium` (no duplicated billing logic in `Profile.tsx` — it stays a thin, read-only display), but the card itself shows the *source* label inline when premium (e.g., "Supporter · via Stripe" / "Supporter · via Google Play" / "VIP · Manual Grant"), matching `FriendsDirectory.tsx`'s existing 3-way badge distinction. Free users see a plain "Free" badge + "Become a Supporter" button. Button label itself is also source-aware ("Manage Subscription" for premium, "Become a Supporter" for free) rather than a generic "Manage Plan," so it never mismatches what actually happens on the next screen.
- **Persona fit:** David — unaffected. Walt — correct fit; the source is visible at a glance without an extra tap, matching his data-sovereignty expectation. Maya — also benefits (her persona wants auditable, unambiguous state, and "Supporter · via Stripe" is unambiguous where "Manage Plan" is not).
- **Scores (1-5):** speed 4 / persona 5 / ZK complexity 5 (none) / maintenance 4 / test surface 4.

### Strategy C — Robust/Scalable: New dedicated "Billing" tab with subscription history
- **Effort:** ~1.5-2 days.
- **Trade-off:** A 5th Profile tab (`General | Security | Data | Achievements | Billing`) showing not just current tier but a real history — past `payments`/`subscriptions`/`playPurchases` records, next renewal date, receipts. Meaningfully more useful for a long-tenured Supporter wanting a paper trail, but nothing in the user's actual report asked for billing history — the reported problem is "there's no way to see tier or upgrade," which strategies A/B both fully solve. Building a history view now is speculative scope expansion against CLAUDE.md's own "don't design for hypothetical future requirements" rule, and duplicates/queries three separate billing-adjacent subcollections that currently have zero client-side typed read paths (`src/lib/db.ts` has no interface for `subscriptions`/`payments` docs at all — see PROJ-105 spec §3, where even `playPurchases` needed a new interface).
- **Persona fit:** Same as B for the badge/CTA; the history view is a genuine plus for Walt specifically, but speculative until requested.
- **Scores (1-5):** speed 1 / persona 4 (better for Walt alone, no gain for others) / ZK complexity 5 (none) / maintenance 3 (new tab, new queries, new empty/loading/error states to maintain) / test surface 2.

**Recommendation: Strategy B.** Strategy A fixes the reported bug but leaves a real, small persona gap (Walt/Maya's traceability expectation) that Strategy B closes for near-zero extra cost, since the data (`userTierSource`) already exists and is already fetched — it's a display/copy difference, not new plumbing. Strategy C solves a problem nobody has asked for yet.

---

## 5. Technical Impact (Strategy B)

### Phase 1: Logic & State
- No new React Query hooks — `useAuth()` already provides `userTier`/`userTierSource` live.
- No new Firestore security rules — read-only over already-readable fields.

### Phase 2: UI/UX & Gamification
- New card in `Profile.tsx`'s General tab, placed near the top (directly under the Identity form, above Financial Freedom Tracker) — account/plan status belongs with "who am I," not buried under notification/appearance settings.
- Visual language reuses `PremiumUpgrade.tsx`'s own amber/orange Supporter gradient for the premium state and `PremiumGate.tsx`'s amber accent for the free-state CTA, so this reads as the same "premium" visual family already established elsewhere in the app — not a new pattern.
- Badge copy:
  - Free: "Free" (gray, matching `FriendsDirectory`'s free badge).
  - Premium + `tierSource === 'Stripe-Managed'`: "Supporter · via Stripe."
  - Premium + `tierSource === 'play-billing'`: "Supporter · via Google Play."
  - Premium + `tierSource === 'manual'`: "VIP · Manual Grant" (matches `FriendsDirectory`'s purple VIP badge), with the button hidden or disabled for this case specifically — a manually-granted VIP has no Stripe customer record or Play purchase token to "manage," so routing to `/premium`'s `handleManageSubscription` would just hit the same "use Become a Supporter first" error path that already exists for that edge case today. Simplest correct fix: don't show a management action for `tierSource === 'manual'` at all.
- Button: single CTA, `navigate('/premium')` — reuses 100% of the existing upgrade/manage logic already live in `PremiumUpgrade.tsx` (including the PROJ-105 Play Billing purchase flow and the dual-source-aware Manage Subscription routing). Zero new billing logic written in `Profile.tsx`.
- **Somatic Check:** No stress-inducing states — this is informational + an opt-in upgrade path, never a paywall block. Matches the "never gate crisis/safety features" spirit even though Profile isn't a crisis surface — no red "you're missing out" framing, just plain status.
- **Reward:** N/A — not a gamification surface.

### Phase 3: Edge Cases
- [ ] `userTier` briefly `'free'` before the Stripe listener resolves on first load (existing `AuthContext` behavior, not new) — card should render the free state without flicker/layout shift once resolved; no new loading state needed since `Profile.tsx` already gates its whole render on `isLoading` from `useUserProfile()`, and `userTier` defaults safely to `'free'`.
- [ ] `tierSource === 'manual'` — button hidden per above, not a broken "Manage Subscription" tap.
- [ ] `tierSource` undefined while `tier === 'premium'` (a data-consistency edge case that shouldn't happen post-PROJ-105, but the existing `syncStripeSubscription`/`verifyPlayPurchase` functions always write both fields together) — fall back to a generic "Supporter" badge with no source suffix, same button behavior as Stripe/Play cases (routes to `/premium`, which itself has its own fallback behavior for this case already).
- [ ] 320px-wide screen (iPhone SE) — card must not force horizontal scroll; badge + button stack vertically below `sm:` breakpoint, matching the rest of `Profile.tsx`'s existing responsive patterns (e.g. the Financial Freedom Tracker's `grid-cols-1 md:grid-cols-3`).

## 6. QA & Verification 🧪
- [ ] **Unit Tests:** New/updated `Profile.test.tsx` coverage (check whether one already exists) for: free-tier badge+CTA render, Stripe-sourced premium badge+CTA, Play-Billing-sourced premium badge+CTA, manual/VIP badge with no button, and a click-through assertion that the CTA calls `navigate('/premium')`.
- [ ] **The Subway Test:** Offline — `userTier`/`userTierSource` come from already-cached auth state, not a live fetch on this page, so the card should render correctly offline (last-known tier) with no special handling needed.
- [ ] **The "Lost PIN" Test:** N/A — `tier`/`tierSource` are unencrypted and unaffected by vault lock state; this card should render identically whether the vault is locked or unlocked (Profile itself sits inside `VaultGate`, so this is moot in practice, but worth confirming no new dependency on decrypted state was introduced).

---

## Stop Gate
**PASSED 2026-09-02.** Strategy B approved by the account owner. Implementation began the same day.
