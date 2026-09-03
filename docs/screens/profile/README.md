# Profile — `/profile`, `/profile/:tab`

**Parent page:** `src/pages/Profile.tsx` — a single component that renders all four tabs conditionally (`activeTab === 'general' | 'security' | 'data' | 'achievements'`), not four separate route components. `activeTab` is derived from the URL (`useParams<{ tab?: string }>()`), defaulting to `'general'` for `/profile` itself or any unrecognized `:tab` segment (`isTabType()` guard) — so `/profile/nonsense` silently renders General rather than 404ing or redirecting.

| Tab | File | Route | Component(s) |
|---|---|---|---|
| General | [`general.md`](./general.md) | `/profile/general` (default) | inline JSX in `Profile.tsx` |
| Security | [`security.md`](./security.md) | `/profile/security` | inline JSX in `Profile.tsx` |
| Data | [`data.md`](./data.md) | `/profile/data` | `DataManagement.tsx` (→ `DataExportPanel.tsx`, `DataImportPanel.tsx`, `AccountDeletionModal.tsx`) |
| Achievements | [`achievements.md`](./achievements.md) | `/profile/achievements` | `AchievementsTab.tsx` |

**Personas:** All. General/Security are used by everyone (onboarding, sponsor contact, PIN rotation); Data is Walt's sovereignty/export surface; Achievements is Ned's gamification home (relocated here from the Dashboard by PROJ-76 specifically so it doesn't clutter David's crisis-first Dashboard).

**Tier:** Mixed per tab — see each file. The only tier-gated control anywhere in Profile is the PDF export button on Data (`PremiumGate` `button_swap`).

**Zero-knowledge status:** Profile itself writes only to `users/{uid}` (plaintext profile/settings fields, per CLAUDE.md's ZK table). The Data tab is where the vault's encrypted collections get touched — export decrypts them client-side before writing an unencrypted file to disk, and account deletion crypto-shreds them. See `data.md` and `security.md` for the vault-key mechanics.

## Onboarding mode (applies to all four tabs)

`isOnboarding` is a local `Profile.tsx` state flag, set to `true` on mount whenever the fetched `profile` is missing or `profile.hasCompletedOnboarding` is falsy (`useUserProfile()` → `users/{uid}`). While `isOnboarding` is true:

- The `<TabBar>` navigation itself is not rendered (`{!isOnboarding && <TabBar ... />}`) — there is no way to click into Security/Data/Achievements.
- A dedicated welcome banner ("Welcome to your Toolkit… tell us your name and your sobriety date") replaces it.
- The General tab's form switches from field-by-field autosave to a single explicit "Complete Setup" submit (`handleCompleteSetup`), which writes `displayName`, `sobrietyDate`, and `hasCompletedOnboarding: true` in one `updateProfile.mutateAsync` call, best-effort mirrors `displayName` to the Firebase Auth profile, fires `posthog.capture('profile_saved', { is_onboarding, has_sobriety_date })`, then navigates to `/dashboard`.
- Every other tab is guarded with `activeTab === 'security' && !isOnboarding` (etc.) at the JSX level, so even if `activeTab` somehow resolved to `'security'`/`'data'`/`'achievements'` while onboarding, none of those blocks would render.
- **Deep-link redirect:** a `useEffect` explicitly handles someone landing directly on `/profile/security` or `/profile/data` (bookmark, typed URL, stale link) before onboarding is complete — `if (isOnboarding && activeTab !== 'general') navigate('/profile/general', { replace: true })`. So the URL itself is corrected, not just the rendered content hidden.
- The Account Tier card, "New to MRT?" user-guide card, and Privacy/ToS footer links on General are also suppressed during onboarding (`{!isOnboarding && (...)}` around each) — onboarding shows only the welcome banner and the required-fields form.

Once `hasCompletedOnboarding` is true, this flag never becomes true again for that user — `isOnboarding` is derived once on the populating `useEffect` (`populatedRef.current` guards it to run once per mount), not re-evaluated live against further profile changes.

## Shared building blocks across tabs

- **Autosave pattern (General only):** every field-group on General (Identity, Financial Freedom, Support Network, Dashboard Badges, Push Notifications) has its own `AutosaveState` (`idle | saving | saved | error | partial`) shown via `AutosaveStatus.tsx`, flashed via a shared `flashStatus()` helper (1.8s for success, 3s for error) then reset to `idle`. Security and Data tabs use their own explicit-submit / explicit-button flows instead — no autosave there.
- **Destructive-action modal pattern:** Security's "Reset Vault" and Data's "Delete Account" (`AccountDeletionModal.tsx`) both use the same Headless UI `Dialog`/`Transition` shape — a `confirm` step, a typed-confirmation or re-auth step, and a non-dismissible in-progress step ("Do not close the app/window!"). Reset Vault was deliberately rebuilt onto this pattern to replace an older `window.prompt()`/`alert()` pair, explicitly to match Account Deletion's existing UX.
- **Logout button and app version footer** render unconditionally at the bottom of the page — they live outside all four `activeTab === ...` blocks in `Profile.tsx` and are not onboarding-gated either, so both are visible even mid-onboarding.

## Known drift vs. `docs/specs/09_PROFILE.md`

The spec (`Status: Live (v2.1)`) describes Profile as **three** tabs ("split into three distinct horizontal tabs"): General, Security, Data. The code has a fourth — Achievements — added by PROJ-76 (gamification relocated off the Dashboard). The spec predates that project and has not been updated; this doc layer follows the code. The spec's descriptions of General/Security/Data tab content are otherwise broadly accurate at a high level — see each tab's own file for line-level verification and drift notes.

## Related docs

- `docs/specs/09_PROFILE.md` — existing spec; accurate for General/Security/Data at a high level, silent on Achievements (see drift note above).
- `docs/projects/58_*` (routed-tab pattern origin, "Project 58 Phase 4" per code comments — search `docs/projects/` for the exact filename if needed).
- `docs/projects/65_VAULT_KEY_HARDENING.md` — Security tab's PIN-rotation mechanics.
- `docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md` — Achievements tab's origin, and what it replaced on the Dashboard.
- CLAUDE.md — Zero-Knowledge Encryption Boundary, Premium Tier & Billing.
