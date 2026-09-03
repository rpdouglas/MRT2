# Login — `/login`

**Source:** `src/pages/Login.tsx` (+ `useUserProfile` hook for the onboarding-redirect check)
**Personas:** Displays David, Ned, Lisa, and Walt as a small "meeting you where you are" persona grid in the left-column branding panel (desktop only, `hidden md:block`) — illustrative, not functional; no persona-specific behavior branches in this page's logic.
**Tier:** N/A — unauthenticated flow, applies before any tier is known.
**Zero-knowledge status:** N/A — no Firestore reads or writes directly. Only calls `loginWithGoogle`/`loginWithEmail`/`signupWithEmail` from `AuthContext`, and reads (does not write) the user's profile via `useUserProfile()` to decide where to redirect.

## What it does

The dedicated sign-in / create-account page, structurally similar to `Welcome.tsx`'s embedded auth card but as its own full route rather than a scroll target on the marketing page. Its distinguishing job beyond authentication itself is the **onboarding redirect**: routing a freshly authenticated user to `/profile` (to complete setup) versus `/dashboard` (if they've already completed it).

**Vault/PIN setup does not happen on this page.** This page only performs Firebase Auth (email/password or Google) sign-in/sign-up. Vault PIN creation is part of the onboarding flow inside `Profile.tsx` (`isOnboarding` state, gated on `profile.hasCompletedOnboarding`) — this page's job ends at getting the user authenticated and pointed at the right next screen.

## How it works

### Auth methods
- **Email/password**, toggled between Sign In and Create Account via `isLogin` state (defaults to `true` — opposite default emphasis from `Welcome.tsx`'s `isSignUp: true`). Sign-up mode adds a "Confirm Password" field and requires it to match; both modes require password length ≥ 6 characters (client-side check, mirrors Firebase Auth's own minimum).
- **Google**, via `loginWithGoogle()` from `AuthContext` — a single button, no separate sign-in/sign-up distinction (Google auth creates the account implicitly on first use).
- Errors are mapped inline (not via a shared helper, unlike `Welcome.tsx`'s `describeAuthError`) to short user-facing copy: `auth/email-already-in-use` → "That email is already in use.", `auth/wrong-password`/`auth/user-not-found`/`auth/invalid-credential` → "Invalid email or password.", Google `auth/popup-closed-by-user` → "Google sign-in was cancelled.", with catch-all fallbacks for anything else.

### Onboarding redirect (`useEffect`)
Runs whenever `user`, `loading`, `profile`, `profileLoading`, or `profileError` changes:
1. If there's no `user`, or auth/profile is still loading — do nothing (wait).
2. If `useUserProfile()` reports `profileError` — redirect to `/dashboard` as a safe fallback (does not block the user on a profile-fetch failure).
3. If `profile?.hasCompletedOnboarding` is true — redirect to `/dashboard`.
4. Otherwise — redirect to `/profile`, described in a code comment as "Force to setup, or safety fallback if no doc exists yet" (i.e. a brand-new user with no profile doc yet also lands here, since `hasCompletedOnboarding` is falsy/undefined on a missing doc).

This means routing after both sign-in and sign-up funnels through the exact same effect — there's no separate "new user" vs. "returning user" code path beyond what `hasCompletedOnboarding` encodes.

## Data model

None written by this page. Reads `profile.hasCompletedOnboarding` via `useUserProfile()` (read-only) purely to decide the post-auth redirect target — no field on this page's own responsibility.

## Gating & limits

None — pre-auth page, no tier or rate-limit concept applies. The only "gate" this page enforces is behavioral (the onboarding redirect), not a tier or usage gate.

## Known gaps / debt

- Duplicates `Welcome.tsx`'s email/password + Google auth form and error-mapping logic almost entirely, as a separate implementation with its own local error copy rather than a shared component/helper — see `docs/screens/welcome.md`'s Known gaps section for the same observation from that side.
- Unlike `Welcome.tsx`, this page's redirect logic is onboarding-aware; `Welcome.tsx`'s is not (always `/dashboard`). If a user can reach `Welcome.tsx`'s embedded auth form and sign up there instead of via `/login`, they'd skip the onboarding-completeness redirect this page provides — see `docs/screens/welcome.md`.

## Related docs

- `docs/screens/welcome.md` — the marketing-page auth entry point, structurally parallel to this page.
- `docs/PERSONAS.md` — full detail on the David/Ned/Lisa/Walt personas shown in the branding panel.
