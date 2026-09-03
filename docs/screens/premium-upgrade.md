# Premium Upgrade — `/premium`

**Source:** `src/pages/PremiumUpgrade.tsx` (lazy-loaded route) + `src/lib/platform.ts` (`isAndroidTWA`) + `src/lib/playBilling.ts` (`isPlayBillingSupported`, `purchasePlaySubscription`)
**Personas:** None targeted specifically — a universal upsell surface for any free-tier user. Per CLAUDE.md, this is explicitly not a crisis-adjacent feature, so David's crisis-first floor doesn't constrain it the way it does SOS/Urge Surfer/journaling.
**Tier:** The page itself gates nothing — it's the mechanism by which `tier` moves from `'free'` to `'premium'`. Shows different content/CTA depending on the visitor's current `userTier`/`userTierSource` from `AuthContext`.
**Zero-knowledge status:** N/A — this page reads/writes only billing metadata (`checkout_sessions`, `playPurchases`, `playPurchaseIndex`), never recovery content. None of the fields it touches are AES-GCM encrypted.

## What it does

The "Supporter Tier" upsell page — a two-card pricing comparison (Free vs. $3.99/mo Supporter) with a purchase or subscription-management CTA that adapts to three different platform/billing paths: Stripe (web/iOS-PWA), Google Play Billing (Android TWA), and a **Play Console-blocked** TWA fallback state.

## How it works

### Platform branching (the CTA button)
Three mutually exclusive purchase-path branches, evaluated in this order once `userTier !== 'premium'`:

1. **`canUsePlayBilling` (via `isPlayBillingSupported()`)** — true when running as a real Android TWA (`isAndroidTWA()`, detected by `document.referrer.startsWith('android-app://')`) with the Digital Goods API available, **or** when a `?mockPlayBilling=1` dev/emulator query param is set (PROJ-105's test path, folded into `isPlayBillingSupported()` itself — deliberately *not* additionally gated by `isTWA` in this component, so the mock can be exercised outside a real TWA). Shows a "Become a Supporter" button that calls `handlePlayPurchase()`:
   - `purchasePlaySubscription(productId)` (Digital Goods API + Payment Request API — not native Android Billing Library, since a TWA has no native Android code) returns a `purchaseToken`.
   - The raw token is persisted immediately, *before* server verification, to `users/{uid}/playPurchases/{purchaseToken}` (`verified: false`) — so it survives an app close mid-flow — plus a second pointer doc at `playPurchaseIndex/{purchaseToken} → { uid }` so the backend RTDN (Real-Time Developer Notification) handler can later resolve a bare token back to a uid without a collection-group query.
   - Calls the `verifyPlayPurchase` Cloud Function (onCall) with `{ productId, purchaseToken }`, which re-verifies against the real Play Developer API before granting `tier`.
   - On success, does a **full page navigation** (`window.location.assign('/dashboard')`, not an SPA route change) — a deliberate choice per an inline comment, since `AuthContext` only re-derives `userTier`/`userTierSource` from a fresh profile fetch on auth-state re-entry, not from a live Firestore listener on the tier field.
2. **`isTWA` (real TWA, but `canUsePlayBilling` is false)** — e.g. an old WebView or non-Play sideload where the Digital Goods API isn't available. Shows a deliberately **non-clickable** "Upgrade on the Web" block (plain `<div>`, not a `<button>` or `<a>`) with text "Visit myrecoverytoolkit.ca to become a Supporter." An inline comment explains this is intentional: Google Play's "External Content Links Program" (declaration + API integration + Play Console review + a 10–20% fee starting 2026-10-01) governs in-app *links* to external purchase pages — plain informational text with no clickable target stays outside that program's scope entirely.
3. **Neither (regular web / iOS PWA / desktop browser)** — the original Stripe flow, `handleSubscribe()`:
   - Writes a doc to `users/{uid}/checkout_sessions` with `price: VITE_STRIPE_PREMIUM_PRICE_ID`, `success_url: <origin>/dashboard`, `cancel_url: <origin>/premium`.
   - Listens via `onSnapshot` for the Stripe Firebase Extension to fill in either `data.url` (redirect via `window.location.assign`) or `data.error` (shown via `alert()`).
   - A 10-second client-side timeout aborts the wait with an alert if neither resolves in time.

### Already-premium state
If `userTier === 'premium'`, a green success banner replaces the CTA area, and the Supporter card's button becomes "Manage Subscription" (`handleManageSubscription`), which itself branches on `userTierSource`:
- `'play-billing'` → redirects to the native Google Play subscriptions management URL (`play.google.com/store/account/subscriptions?sku=...&package=ca.myrecoverytoolkit.app`) — explained inline as necessary because a Play-Billing-sourced subscription has no Stripe customer record, so the Stripe billing portal would simply fail for it.
- Otherwise (Stripe-managed or manual) → calls the `ext-firestore-stripe-payments-createPortalLink` callable to get a Stripe customer-portal URL and redirects there. A failure here shows a specific hint: "If you haven't subscribed yet, please use 'Become a Supporter' first to create your Stripe customer record."

### Emulator wiring
`getFunctionsInstance()` lazily creates a single `northamerica-northeast1`-region Functions instance, connecting to the local emulator (`127.0.0.1:5001`) only when `import.meta.env.DEV && VITE_USE_EMULATORS === 'true'`. A code comment notes this file previously had no emulator wiring at all (unlike `gemini.ts`/`vaultAuth.ts`), which blocked exercising the PROJ-105 dev-mock Play Billing path locally — since fixed.

## Data model

| Path | Encrypted? | Written by | Notes |
|---|---|---|---|
| `users/{uid}/checkout_sessions/{id}` | ❌ | This page (`addDoc`) | Client creates with `price`/`success_url`/`cancel_url`; Stripe Firebase Extension fills in `url` or `error`. Rules: client `create`/`read` only, `update`/`delete: false`. |
| `users/{uid}/playPurchases/{purchaseToken}` | ❌ | This page (`setDoc`) | `{ purchaseToken, productId, createdAt, verified: false }` written client-side pre-verification; only `verifyPlayPurchase` (Cloud Function) or the RTDN handler can mark it verified — rules: client `create`/`read` only. |
| `playPurchaseIndex/{purchaseToken}` | ❌ | This page (`setDoc`) | `{ uid }` — a root-collection pointer doc for the RTDN handler; rules: client `create` only, never readable/writable afterward. |
| `users/{uid}.tier` / `.tierSource` | ❌ | **Not** this page directly — only `syncStripeSubscription` or `verifyPlayPurchase` (both Cloud Functions, admin SDK) | This page never writes `tier`/`tierSource` itself, consistent with CLAUDE.md's "never add a client-side path that writes these fields" rule. |

## Gating & limits

- Route-level: `PrivateRoute` only (auth required) — no `VaultGate` wrapper (confirmed via `App.tsx`), consistent with this page touching no encrypted content.
- No premium-gating *on this page itself* (it would be circular — this is the page that grants premium).
- `posthog.capture('premium_upgrade_clicked', ...)` fires on both the Stripe and Play Billing purchase-initiation paths (with `{ platform: 'play-billing' }` distinguishing the latter).

## Known gaps / debt

- **TWA gap is not "unhandled"** — contrary to a naive reading of CLAUDE.md's framing ("Android TWA cannot use this flow... in-progress"), this page has full three-way platform detection and a working Play Billing purchase path (PROJ-105). Per `docs/projects/105_PLAY_BILLING_TWA.md`, the code is complete and deployed to prod (as of 2026-09-02) but the *feature is currently unusable end-to-end in production* because the project is paused on external Play Console payment-method verification (account-side, no ETA) — the subscription product can't be created yet, so a real TWA user hitting `canUsePlayBilling` would call `purchasePlaySubscription` against a non-existent product. CLAUDE.md's own text describing this as still "in-progress" is accurate as of this doc's writing, but understates how far along the code actually is — worth a CLAUDE.md refresh once Play Console unblocks.
- `handleManageSubscription`'s Stripe-portal error path assumes any failure means "no Stripe customer record yet" — that's a plausible but not verified cause for every possible `createPortalLink` failure (network errors, misconfiguration, etc. would surface the same generic hint).
- The 10-second Stripe checkout timeout is a fixed client-side value with no retry/backoff — a slow-but-eventually-successful Stripe Extension response past 10s would show a spurious timeout alert even if `checkout_sessions` later resolves.

## Related docs

- `docs/projects/105_PLAY_BILLING_TWA.md` — full Play Billing implementation history, current pause reason, and the dev-mock (`?mockPlayBilling=1`) testing path.
- `docs/projects/68_STRIPE_TWA_GATING.md` — earlier-stage TWA/Stripe gating work referenced by CLAUDE.md.
- CLAUDE.md's "Premium Tier & Billing" section — `tierSource` value drift note (`'Stripe-Managed'` literal vs. the `'stripe'` TS union) applies to this page's `userTierSource` checks.
