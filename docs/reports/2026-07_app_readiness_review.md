# App Readiness Review — Scale & Google Play Store Submission

**Audit Date:** July 2026
**Scope:** Full-codebase honest assessment of readiness to (a) submit to the Google Play Store via TWA/Bubblewrap and (b) scale past the current trusted-beta userbase.
**Trigger:** DUNS number received, unblocking Sprint 9.2 of `docs/projects/07_PLAY_STORE_TWA.md`.
**Method:** Live verification against the running codebase — `npm run check` (lint, spec-quality, tests, build) executed from a clean install, `npm audit`, direct inspection of `firestore.rules`, `vite.config.ts`, `firebase.json`, git history, and cross-reference against the team's own prior audits (`docs/reports/archive/google_play_readiness_report.md`, `docs/projects/65_VAULT_KEY_HARDENING.md`, `docs/ACTIVE_CYCLE.md`).

---

## Bottom Line

**Not yet ready to submit.** The engineering foundation is genuinely strong — clean lint, 453/453 passing tests, a well-enforced zero-knowledge boundary, and unusually mature governance hygiene. But there is one hard security blocker, one real Play Store policy risk, and several gaps the team already scoped but hasn't shipped. None of this requires re-architecture — realistically 1-2 focused sprints to close.

---

## 🔴 Critical — Fix Before Anything Else

### 1. The Android signing keystore is committed to git
`mrt-release.keystore` — described in `docs/projects/07_PLAY_STORE_TWA.md` as "the root key" for signing — is tracked in the repository (`git ls-files` confirms it) and present in git history. A `.gitignore` entry (`*.keystore`, `mrt-release.keystore`) exists but was added *after* the file was already tracked, so it has no effect — git continues tracking a file its own ignore rule targets.

Anyone with read access to this repo — every collaborator, every CI runner, every fork — holds the app's signing credential. Under Google Play App Signing this becomes an "upload key," not the final signing key, but a leaked upload key is still a real incident requiring Google's key-reset process. This was not flagged in the prior `docs/reports/archive/google_play_readiness_report.md`, which treats pointing Bubblewrap at the existing keystore as a routine step.

**Action:** Generate a new keystore, store it in a secrets manager (never the repo), and purge the old one from git history (`git filter-repo` or BFG). Treat the existing key as already compromised.

### 2. Stripe checkout runs inside what will become the installed Android app
`src/pages/PremiumUpgrade.tsx` opens a Stripe Checkout session (`checkout_sessions` subcollection, `ext-firestore-stripe-payments`) with no Android/TWA detection or gating. Google Play's Payments policy generally requires Google Play Billing for digital subscriptions purchased for use within an app installed from the Play Store. A TWA does not automatically exempt this. This risk is not addressed anywhere in the existing readiness documentation.

**Action:** Get a policy read (or legal review) on whether MRT qualifies for an exemption before submitting. If not, either gate the purchase flow out of the Android build or integrate Play Billing.

### 3. The vault-hardening ticket is self-flagged as not externally reviewed
`docs/projects/65_VAULT_KEY_HARDENING.md` and `docs/ACTIVE_CYCLE.md` are explicit: the PIN-brute-force server-pepper design (PROJ-65) shipped and was manually verified against real emulators, but the team's own notes state "a full external security review is still recommended before this is treated as final" — and it remains unchecked in the Priority-1 triage list. This is the load-bearing claim behind MRT's "zero-knowledge, mathematically private" positioning; it should be closed before meaningfully growing the userbase.

### 4. Seven known npm vulnerabilities, including a production dependency
A clean `npm install` + `npm audit` surfaced 7 vulnerabilities (2 critical, 3 high, 2 moderate), including `react-router-dom` (a direct production dependency) in the vulnerable range 7.0.0–7.15.0. A fix is available in-range (`^7.10.1` resolves to 7.18.1 with no breaking change). Cheap to fix — `npm audit fix` and redeploy — before submission.

---

## 🟡 High — Already Scoped by the Team, Not Yet Shipped

Verified against live code, not just docs:

| Gap | Verified Status |
| --- | --- |
| PWA manifest missing `display: 'standalone'`, `start_url`, `background_color`, `id`, `orientation` | Confirmed missing in `vite.config.ts` as of this audit. Without these, the TWA shows a visible browser URL bar — an automatic Play reviewer rejection. |
| Public, unauthenticated `/delete-account` page | Does not exist. In-app deletion (`AccountDeletionModal.tsx`) is well built (reauth → cryptographic Firestore shredding → Auth deletion), but Play's Data Safety policy requires a web-accessible path that doesn't require reinstalling/logging into the app. |
| Privacy Policy / Terms linked in-app | Not linked. `docs-site/privacy.md` and `tos.md` are complete and well-written, but `Login.tsx` only shows a "Privacy Guarantee" trust badge, not a hyperlink. Nothing in `Profile.tsx`. |
| Mobile UX overrides (`overscroll-behavior-y`, `user-select`) | Not applied. Pull-to-refresh will currently wipe the session-cached PIN mid-use — a real bug for the David persona (acute crisis), not just polish. |
| `assetlinks.json` production fingerprint | Only the local dev keystore fingerprint is present (expected at this stage). Must append Google's App Signing fingerprint after first Play Console upload, or the TWA falls back to browser chrome. |

---

## 🟠 Medium — Worth Doing Before Scaling, Not Blocking Submission

- **No E2E test suite.** 453 unit tests pass cleanly and lint/build are clean, but there is zero browser-level regression coverage of golden paths (login → vault unlock → journal encrypt/decrypt round-trip). `PROJ-23` (Playwright E2E) has a spec (`docs/projects/archive/23_QA_SENTINEL.md`) but remains unbuilt.
- **Bundle size.** The `vendor` chunk is 1.8MB (567KB gzipped); the service worker precaches ~19MB total. Heavy first install for a TWA aimed partly at users in acute crisis on mobile connections. Worth further code-splitting.
- **`noUncheckedIndexedAccess` deferred.** Enabling it surfaced 164 compiler errors; correctly triaged in `ACTIVE_CYCLE.md` as needing a dedicated cycle, not an emergency.
- **Three informal definitions of "admin"** (custom claim, `role` field, hardcoded email in `AuthContext.tsx:50`). No privilege-escalation risk today per the team's own audit, but should converge before more admins are added.

---

## ✅ What's Already In Good Shape

- **Full `npm run check` pipeline passes clean**: zero lint warnings, 29/29 spec-quality checks, 453/453 tests, successful production build.
- **Firestore rules are tight and specifically hardened** — tier/role self-escalation blocked on write, `pinAttempts` is server-write-only (protects the rate limiter itself), Stripe subscription documents are client-read-only, `ai_logs`/`client_errors`/`feedback` are scoped to owner + admin.
- **The zero-knowledge boundary is well-designed and consistently enforced** — explicit encryption table in `CLAUDE.md`, Gemini calls proxied server-side so the API key isn't client-exposed (PROJ-64), AI usage rate limiting is server-side and can't be bypassed by editing the JS bundle.
- **Real environment separation**: DEV/UAT/PROD map to three separate Firebase projects with a promotion pipeline, not a shared production database.
- **Unusually mature governance discipline.** `docs/ACTIVE_CYCLE.md` and the project specs are brutally honest — they record a past commit that *claimed* to implement key-derivation hardening but didn't, and note that a governance audit caught the discrepancy. The process catches its own drift instead of trusting commit messages at face value.

---

## Recommended Sequence

1. Rotate the keystore; purge it from git history; store the new one outside the repo.
2. Get a definitive answer on the Stripe-in-TWA billing question before building the Bubblewrap package at all — cheaper to resolve now than after a rejection.
3. Close PROJ-65's external security review.
4. `npm audit fix`, redeploy, confirm `npm run check` still passes.
5. Finish PROJ-07 Sprint 9.1 (manifest/CSS/legal-link items — `docs/reports/archive/google_play_readiness_report.md` already has the exact diffs).
6. Then, and only then, Sprint 9.2: Bubblewrap build, Play Console internal track, `assetlinks.json` fingerprint round-trip.
