# Welcome — `/`

**Source:** `src/pages/Welcome.tsx`
**Personas:** All 6 (David, Ned, Lisa, Walt, Maya, Jordan) — both the "Find Your Recovery Season" quiz (`RecoveryQuiz.tsx`) and the trimmed showcase carousel cover all six, sourced from `src/data/welcomePersonas.ts` (`WELCOME_PERSONAS`). This is the pre-auth, public-facing surface, so it targets prospective users broadly rather than any one persona's in-app UX; David's crisis-first floor governs the crisis-bypass link specifically.
**Tier:** N/A — unauthenticated, public marketing/landing page. No tier concept applies.
**Zero-knowledge status:** N/A — no Firestore reads or writes. The page only calls `signupWithEmail`/`loginWithEmail`/`loginWithGoogle` from `AuthContext`. The quiz result (a persona label only) lives in component state + `sessionStorage`, never Firestore — see `docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md`.

## What it does

The public splash/landing page shown at `/` before login — trust bar, hero, feature-summary strip, a persona-matching quiz, a trimmed-but-expandable persona showcase, a trust statement, and an embedded auth form (sign up / sign in) at the bottom, rather than a separate page the user must navigate to. Functionally this is a second, marketing-flavored entry point into the same auth flow that `Login.tsx` (`/login`) provides on its own page. PROJ-116 (2026-09) restructured the page per `docs/reports/SPEC-WELCOMEPAGE-002.md` — added the quiz, unified the CTA copy, and added a standalone crisis-bypass panel.

## How it works

- **Smart redirect:** on mount, a `useEffect` watches `user`/`loading` from `useAuth()`; once a session exists it immediately calls `navigate('/dashboard')` — an already-authenticated visitor never sees the marketing content, they're bounced straight past it. Note this redirect target is `/dashboard` unconditionally, unlike `Login.tsx`'s onboarding-aware redirect (see `docs/screens/login.md`) — a logged-in-but-not-onboarded user landing here would be sent to `/dashboard` rather than `/profile`.
- **Trust bar:** a sticky top banner ("Zero-Knowledge Encryption. Even our developers can't read your journal.") — always visible while scrolling the page.
- **Hero section:** headline copy, a single unified "Begin your toolkit" CTA that smooth-scrolls down to `#auth-section` (not a route change), a compact medical-device disclaimer, a "Need help right now?" crisis-bypass link (opens `CrisisResourcesPanel`, no auth required), and a hero image bento (`ASSETS.marketing.screenshots.scn_dashboard` + a floating "Clean Time Chip" screenshot), each with an inline `onError` fallback to a gray placeholder SVG data URI if the asset fails to load.
- **Feature-summary strip:** three short columns (Journal · Track habits · Find patterns) between the hero and the quiz, so a skimming visitor learns what the app actually does before any persona storytelling.
- **"Find Your Recovery Season" quiz** (`src/components/welcome/RecoveryQuiz.tsx`): 4 questions, scored by `src/lib/welcomeQuizScoring.ts` per the locked matrix in `SPEC-WELCOMEPAGE-002` §7.3 (with a documented tie-break: highest Q1 score, then combined Q3+Q4, then a fixed persona-priority fallback for the fully-tied case the spec doesn't define). Resolves to one of the 6 personas and renders a result card with a dual CTA (`PersonaCtaButtons`).
- **Persona showcase:** a horizontally scrollable (CSS scroll-snap, no library) set of cards for all 6 personas — headshot, title, quote, the existing `PersonaBioCard` expand-to-full-story (kept per `docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md` §6 Decision 3, not removed), a screenshot, and the same dual CTA (`PersonaCtaButtons`) as the quiz result — so a visitor who skips the quiz and clicks straight on a persona gets the same funnel-continuity tagging as a quiz completion.
- **Dual CTA (`PersonaCtaButtons.tsx`):** primary "Begin your toolkit — built for {Persona}" scrolls to `#auth-section` and tags the persona in `sessionStorage` (`mrt_welcome_quiz_persona`, read back to personalize the auth-section headline); secondary "or get it on Google Play" links out via `src/lib/playStoreLink.ts`, which tags the outbound URL's `referrer` param with the persona. Reading that referrer on first app launch is explicitly out of scope here — see the lib file's own header comment and `docs/projects/105_PLAY_BILLING_TWA.md`.
- **Trust statement:** a plain-language zero-knowledge explanation between the showcase and the auth card — not only the header's one-line claim.
- **Crisis bypass (`CrisisResourcesPanel.tsx`):** a modal reachable with zero taps from the hero, deliberately independent of `SOSModal.tsx` (which requires an authenticated, vault-unlocked session this page's visitor doesn't have) — 988/911 call links + a meeting-finder accordion only, no sponsor-contact or vault-gated deep links.
- **Auth card** (`#auth-section`): a single form toggled between sign-up and sign-in via `isSignUp` state (defaults to `true`). The signup headline personalizes to "Begin your toolkit — built for {Persona}" if a quiz/showcase persona tag is present in `sessionStorage` for this session.
  - Email/password fields, both `required`. Submit calls `signupWithEmail(email, password)` or `loginWithEmail(email, password)` from `AuthContext` depending on `isSignUp`.
  - A separate "Continue with Google" button calls `loginWithGoogle()`.
  - Errors from either path are mapped through a local `describeAuthError()` helper to short, non-technical, "David-safe" copy (e.g. `auth/weak-password` → "Please use a password with at least 6 characters.") rather than surfacing raw Firebase error codes.
  - No client-side redirect call after a successful submit — the page relies entirely on the `useEffect` above firing once `AuthContext`'s `onAuthStateChanged` listener updates `user`.
  - Footer links to an external Privacy Policy and Terms of Service, plus the full-text medical-device disclaimer (the compact version near the hero is new, per PROJ-116).
- **Telemetry (`src/lib/telemetry.ts`):** `trackQuizStarted`, `trackQuizQuestionAnswered`, `trackQuizCompleted`, `trackShowcaseCardClicked`, `trackCrisisResourcesOpened` — persona labels only, never quiz-answer transcripts.

## Data model

None. This page performs no Firestore reads or writes of its own — only Firebase Auth calls (`signupWithEmail`, `loginWithEmail`, `loginWithGoogle`) via `AuthContext`. The quiz result persona tag lives in `sessionStorage` only (key `mrt_welcome_quiz_persona`, exported as `QUIZ_PERSONA_STORAGE_KEY` from `PersonaCtaButtons.tsx`) — never written to `users/{uid}` or any other Firestore document.

## Gating & limits

None — public, unauthenticated page, no tier or rate-limit logic.

## Known gaps / debt

- Duplicates `Login.tsx`'s auth form almost entirely (email/password + Google, same `AuthContext` calls) but with its own separate local state and its own separate error-copy mapping (`describeAuthError` here vs. inline `switch`/`if` logic in `Login.tsx`) — a second place to keep in sync if auth error handling changes.
- The post-login redirect here always targets `/dashboard`, while `Login.tsx` checks `hasCompletedOnboarding` and can redirect to `/profile` instead. A user who signs up from this page rather than `/login` is sent straight to `/dashboard` without the onboarding-completeness check — worth confirming whether `PrivateRoute`/`Profile.tsx` elsewhere enforces onboarding completion, since this page's redirect logic doesn't.
- Jordan's showcase screenshot (`scn_tasks_log`) is a same-app stand-in, not a real MAT/dose-tracking feature capture — flagged content gap, see `docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md` §5.
- The Google Play install-referrer tag is outbound-only — nothing in this repo reads it back at first app launch to personalize the native first-run experience. That's tracked as a `docs/projects/105_PLAY_BILLING_TWA.md`-adjacent follow-up, not done here.
- Quiz Q1's "Calm, low friction" wording (David's option) is a known placeholder pending a persona-safe copy pass (`SPEC-WELCOMEPAGE-002` §9 item 1).

## Related docs

- `docs/projects/116_WELCOME_PAGE_PERSONA_QUIZ.md` — the project spec for this restructure, including the planning-protocol dependency table and decisions.
- `docs/reports/SPEC-WELCOMEPAGE-002.md` — original design spec this was built from.
- `docs/screens/login.md` — the dedicated `/login` auth page, with onboarding-aware redirect logic.
- `docs/PERSONAS.md` — full detail on all 6 personas shown in the quiz and showcase.
