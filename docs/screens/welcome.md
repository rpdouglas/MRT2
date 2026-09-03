# Welcome — `/`

**Source:** `src/pages/Welcome.tsx`
**Personas:** Displays David, Ned, Lisa, and Walt as marketing carousel cards (`PERSONA_CONTENT`) — Maya and Jordan are not represented here. This is the pre-auth, public-facing surface, so it targets prospective users broadly rather than any one persona's in-app UX.
**Tier:** N/A — unauthenticated, public marketing/landing page. No tier concept applies.
**Zero-knowledge status:** N/A — no Firestore reads or writes. The page only calls `signupWithEmail`/`loginWithEmail`/`loginWithGoogle` from `AuthContext`.

## What it does

The public splash/landing page shown at `/` before login — a marketing page (trust bar, hero, persona carousel) with an embedded auth form (sign up / sign in) at the bottom, rather than a separate page the user must navigate to. Functionally this is a second, marketing-flavored entry point into the same auth flow that `Login.tsx` (`/login`) provides on its own page.

## How it works

- **Smart redirect:** on mount, a `useEffect` watches `user`/`loading` from `useAuth()`; once a session exists it immediately calls `navigate('/dashboard')` — an already-authenticated visitor never sees the marketing content, they're bounced straight past it. Note this redirect target is `/dashboard` unconditionally, unlike `Login.tsx`'s onboarding-aware redirect (see `docs/screens/login.md`) — a logged-in-but-not-onboarded user landing here would be sent to `/dashboard` rather than `/profile`.
- **Trust bar:** a sticky top banner ("Zero-Knowledge Encryption. Even our developers can't read your journal.") — always visible while scrolling the page.
- **Hero section:** headline copy, a "Begin Journey" CTA that smooth-scrolls down to `#auth-section` (not a route change), and a hero image bento (`ASSETS.marketing.screenshots.scn_dashboard` + a floating "Clean Time Chip" screenshot), each with an inline `onError` fallback to a gray placeholder SVG data URI if the asset fails to load.
- **Persona carousel:** a horizontally scrollable (CSS scroll-snap, no library) set of cards for David, Ned, Lisa, and Walt — headshot, title, a quote, and a linked app screenshot per persona, sourced from `src/data/assets.ts` (`ASSETS.personas.*`, `ASSETS.marketing.screenshots.*`).
- **Auth card** (`#auth-section`): a single form toggled between sign-up and sign-in via `isSignUp` state (defaults to `true`, i.e. sign-up is the default mode on this page — the opposite emphasis from `/login`, which defaults to `isLogin: true`).
  - Email/password fields, both `required`. Submit calls `signupWithEmail(email, password)` or `loginWithEmail(email, password)` from `AuthContext` depending on `isSignUp`.
  - A separate "Continue with Google" button calls `loginWithGoogle()`.
  - Errors from either path are mapped through a local `describeAuthError()` helper to short, non-technical, "David-safe" copy (e.g. `auth/weak-password` → "Please use a password with at least 6 characters.") rather than surfacing raw Firebase error codes.
  - No client-side redirect call after a successful submit — the page relies entirely on the `useEffect` above firing once `AuthContext`'s `onAuthStateChanged` listener updates `user`.
  - Footer links to an external Privacy Policy and Terms of Service (`rpdouglas.github.io/MRT2/privacy` and `/tos`), plus a fixed disclaimer that MRT is "a self-help peer support tool and is not a medical device, diagnostic tool, or replacement for professional clinical addiction treatment."

## Data model

None. This page performs no Firestore reads or writes of its own — only Firebase Auth calls (`signupWithEmail`, `loginWithEmail`, `loginWithGoogle`) via `AuthContext`.

## Gating & limits

None — public, unauthenticated page, no tier or rate-limit logic.

## Known gaps / debt

- Duplicates `Login.tsx`'s auth form almost entirely (email/password + Google, same `AuthContext` calls) but with its own separate local state and its own separate error-copy mapping (`describeAuthError` here vs. inline `switch`/`if` logic in `Login.tsx`) — a second place to keep in sync if auth error handling changes.
- The post-login redirect here always targets `/dashboard`, while `Login.tsx` checks `hasCompletedOnboarding` and can redirect to `/profile` instead. A user who signs up from this page rather than `/login` is sent straight to `/dashboard` without the onboarding-completeness check — worth confirming whether `PrivateRoute`/`Profile.tsx` elsewhere enforces onboarding completion, since this page's redirect logic doesn't.

## Related docs

- `docs/screens/login.md` — the dedicated `/login` auth page, with onboarding-aware redirect logic.
- `docs/PERSONAS.md` — full detail on the David/Ned/Lisa/Walt personas shown in the carousel.
