# Profile → General — `/profile/general`

**Source:** `src/pages/Profile.tsx` (inline JSX, `activeTab === 'general'` block) + `ModalitySelector.tsx` (Daily Reading section) + `AutosaveStatus.tsx`
**Personas:** All — default tab, and the only tab reachable during onboarding (David/Ned/all new users).
**Tier:** Free/premium status is *displayed* here (Account Tier card), but nothing on this tab is itself gated.
**Zero-knowledge status:** Everything on this tab writes to `users/{uid}` (plaintext per CLAUDE.md's ZK table — profile metadata, not recovery content). Nothing here touches the vault key or `encrypt()`/`decrypt()`.

## What it does

Identity and account-level settings: display name, sobriety date, sponsor/support contact, financial-tracker inputs, dashboard-badge and push-notification toggles, hero color theme, and daily-reading tradition selection. It's also the forced landing tab during onboarding (see `README.md`) and the one place in normal navigation that links to `/premium` (every other paywall trigger in the app is reactive — `PremiumGate`, a locked button, etc.).

## How it works

### Two save modes, mutually exclusive by `isOnboarding`
- **Onboarding:** Display Name and Sobriety Date are required (`required={isOnboarding}`), wait for the explicit "Complete Setup" submit button, and are the only two fields that submit accepts — Financial/Sponsor/Badges/Push/Hero/Reading sections still render fully and still autosave individually (their `onBlur`/`onChange` handlers don't check `isOnboarding`), so a user can fill in a sponsor's phone number during onboarding and it saves immediately even though Name/Date do not.
- **Post-onboarding:** every field group autosaves independently on blur/change, no Save button. Each group tracks its own `AutosaveState` (`idle → saving → saved/error/partial → idle`), rendered via `<AutosaveStatus>`.

### Account Tier card (PROJ-107)
Shown only when `!isOnboarding`. Reads `userTier`/`userTierSource` from `AuthContext`:
- `userTier === 'free'` → gray "Free" badge + "Become a Supporter" button → `/premium`.
- `userTier === 'premium' && userTierSource === 'manual'` → purple "VIP · Manual Grant" badge, **no button** (a manual/VIP grant has no Stripe customer or Play purchase token to manage).
- `userTier === 'premium'` and any other source → amber "Supporter · via {Google Play|Stripe}" badge (`userTierSource === 'play-billing' ? 'Google Play' : 'Stripe'` — note this ternary treats anything that isn't `'play-billing'` as Stripe, so it correctly renders the literal `tierSource` value `"Stripe-Managed"` written by the `syncStripeSubscription` Cloud Function without ever comparing against that exact string) + "Manage Subscription" button → `/premium`.
- No Android-TWA-specific messaging appears anywhere on this card — the TWA/Play-Billing gap described in CLAUDE.md and `docs/projects/68_STRIPE_TWA_GATING.md`/`105_PLAY_BILLING_TWA.md` is not surfaced in this UI at all; the card's copy is platform-agnostic.

### Identity
- Display Name, Sobriety Date (`<input type="date">`, bounded client-side only — `min` is 100 years back, `max` is today; no schema-level validation).
- `commitIdentity()` writes `users/{uid}.displayName`/`sobrietyDate` via `updateProfile.mutateAsync` (top-level merge, `useUserProfile`), then best-effort mirrors `displayName` onto the Firebase Auth profile (`updateProfile` from `firebase/auth`) — a failure on that second call reports `AutosaveState: 'partial'`, not `'error'`, since the Firestore write (the field of record) already succeeded.
- The date input's `onChange` passes `{ sobrietyDate: next }` as an override into `commitIdentity` rather than relying on the same-tick `setSobrietyDate` state update, to avoid reading stale state.

### Financial Freedom Tracker (PROJ-10)
`substanceCost`, `costFrequency` (`daily|weekly|monthly`), `currencySymbol` — feeds the Dashboard's savings calculation (not rendered here). Autosaves via `commitFinancial()` on blur/change.

### Support Network
`sponsorName`, `sponsorPhone` — plaintext on `users/{uid}` per CLAUDE.md's ZK table. Explicitly noted in-UI and in `docs/specs/09_PROFILE.md` as populating the SOS modal for one-tap contact.

### Dashboard Badges (formerly "Anchor Notifications")
Two checkboxes (`notifyCheckIn`, `notifyReading`) writing to `anchorSettings.notifyCheckIn`/`notifyReading`. Uses `patchFields.mutateAsync` (dot-path `updateDoc`), **not** `updateProfile`'s top-level merge — a plain `anchorSettings: {...}` merge would silently clobber sibling keys (`lastReadingDate`, `defaultFellowship`) that `useReadingPreferences` owns on the same nested object. In-app badge display only; does not affect push.

### Push Notifications
The **only** control that actually gates server-sent push (the daily Beacon cron, per code comment). Toggling on: `patchFields.mutateAsync({ pushNotificationsEnabled: true })`, then if the browser's `Notification.permission === 'granted'` already, calls `requestNotificationPermission(user.uid)` to (re)register an FCM token. Toggling off: writes `{ pushNotificationsEnabled: false, fcmTokens: [] }` in the same call — clearing `fcmTokens` is what actually excludes the user from the Beacon's `fcmTokens != []` query; `pushNotificationsEnabled` alone is UI state for the toggle. A failed mutation reverts the checkbox to its previous value.

### Hero Appearance (PROJ-56)
A row of color swatches (`HeroColorKey` from `src/lib/heroColors.ts`) calling `useHeroColor().updateHeroColor.mutate(key)` immediately on click — applies without any explicit confirm.

### Daily Reading (PROJ-42)
Renders `<ModalitySelector />` inline — lets the user pick which reading traditions rotate through the daily reading. Not detailed further here; see that component/its own spec if one exists.

### Static content (post-onboarding only)
- "New to MRT?" card linking out to the external user guide (`https://rpdouglas.github.io/MRT2/`, new tab).
- Privacy Policy / Terms of Service footer links (same external site, `/privacy`, `/tos`).

## Data model

All fields below are on `users/{uid}` — unencrypted per CLAUDE.md's ZK table (profile metadata, not recovery content).

| Field | Written by | Notes |
|---|---|---|
| `displayName` | `commitIdentity` / `handleCompleteSetup` | Also mirrored to Firebase Auth profile (best-effort) |
| `sobrietyDate` | same | Stored as Firestore `Timestamp`; UI works in local-date strings |
| `hasCompletedOnboarding` | `handleCompleteSetup` only | Gate for `isOnboarding` — see `README.md` |
| `substanceCost`, `costFrequency`, `currencySymbol` | `commitFinancial` | Feeds Dashboard savings calc |
| `sponsorName`, `sponsorPhone` | `commitSponsor` | Feeds SOS modal |
| `anchorSettings.notifyCheckIn`, `anchorSettings.notifyReading` | `commitBadges` (dot-path patch) | Siblings `lastReadingDate`/`defaultFellowship` owned by `useReadingPreferences` — never touch via top-level merge |
| `pushNotificationsEnabled`, `fcmTokens` | `handleTogglePushNotifications` (dot-... top-level patch) | `fcmTokens: []` on disable is what excludes the user from the Beacon query |
| `heroColor` | `useHeroColor().updateHeroColor` | Dashboard sobriety-hero theme |
| `tier`, `tierSource` | **not** writable from this tab | Read-only display (Account Tier card); see CLAUDE.md — only `syncStripeSubscription` or an admin manual grant can set these |

## Gating & limits

None of this tab's own actions are tier-gated. The Account Tier card is purely informational/navigational (routes to `/premium`), not a gate itself.

## Known gaps / debt

- No client-side or server-side validation beyond the `min`/`max` date bounds — code comment explicitly notes these are "Client-side bounds only (no schema change)."
- During onboarding, non-required sections (Financial, Sponsor, Badges, Push, Hero, Reading) still autosave live even though the user hasn't completed setup — not a bug per se, but worth knowing if you're reasoning about what state a half-onboarded account can be in.

## Related docs

- `docs/screens/profile/README.md` — onboarding-mode behavior (applies here first, since this is the only tab reachable during onboarding).
- `docs/specs/09_PROFILE.md` §1-2 — broadly accurate for this tab.
- CLAUDE.md — Premium Tier & Billing (`tierSource` literal drift, Android TWA gap).
- `docs/projects/68_STRIPE_TWA_GATING.md`, `105_PLAY_BILLING_TWA.md` — referenced for context; neither surfaces in this tab's UI.
