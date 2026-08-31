# Sub-Processor Disclosure

**Last Verified:** 2026-08-31, against actual code (not assumed) — see file references below. Compiled per `docs/reports/2026-08_finalreview_synthesis_and_playstore_plan.md`, which flagged this as undocumented (`docs/finalreview/07_GAP_ANALYSIS.md` §I). Directly feeds `PRIVACY_POLICY.md` §4 and the Google Play Console Data Safety questionnaire (`docs/legal/PLAY_STORE_DATA_SAFETY_DRAFT.md`).

**Scope:** every third party MRT's client or Cloud Functions code sends any user data to, verified against the actual call sites, not inferred from intent. Five processors, not two — `PRIVACY_POLICY.md` currently lists only the first two and needs updating (tracked separately).

---

## 1. Google Firebase / Google Cloud Platform

**Role:** Core infrastructure — the only processor that's structurally unavoidable; everything else is feature-specific.
**Services used:** Authentication, Firestore (database), Cloud Functions, Hosting, Cloud Messaging (FCM, push notifications). Cloud Storage is **not** used anywhere in the codebase (verified — no `getStorage`/`firebase/storage` import exists).
**Data received:** Email address, Firebase UID, all Firestore documents — encrypted ciphertext for `journals`/`workbook_answers`/`service`/`game_saves` and the `encryptedStats`/`encryptedReflection` fields of `game_progress`; plaintext for account metadata and non-sensitive fields per the collection table in `CLAUDE.md` (tasks, insights, mood scores, streaks, FCM device tokens). Firebase/Google Cloud **cannot decrypt** the encrypted fields — MRT's zero-knowledge architecture means the encryption key is derived client-side from the user's PIN and never transmitted (see `docs/SECURITY_ZERO_KNOWLEDGE.md`).
**Purpose:** hosting, auth, data storage, push delivery.
**User control:** account deletion (`executeTotalAccountAnnihilation`/`executeCryptoShredding`, `src/lib/deletion.ts`/`rotation.ts`) purges all of it, encrypted and unencrypted.

## 2. Google Gemini (Generative AI)

**Role:** AI analysis/coaching, strictly scoped.
**Data received:** Decrypted journal/workbook/game-reflection text, but **only** from the nine approved flows enumerated in `CLAUDE.md`'s "Approved Gemini exception" list (`useDeepPatternAnalysis.ts`, `useROSCAssessments.ts`, `JournalAnalysisWizard.tsx`, `WorkbookDetail.tsx`, `GuidedWorkflowEngine.tsx`, `CBATool.tsx`, `WorkbookSession.tsx`, `AudioRecorder.tsx`, `ErrorLogViewer.tsx`) plus two zero-user-data editorial flows (nightly crossword generation, `functions/src/index.ts`; models used: `gemini-2.5-flash` for analysis, `gemini-3.5-flash-lite` for editorial content per the same file). All nine flows route through the `generateAIInsights` Cloud Functions proxy (PROJ-64) — never directly from the client — and the proxy does not log or persist the decrypted payload; `ai_logs` stores metadata only.
**Purpose:** AI-generated insights, coaching prompts, and analysis the user explicitly requests.
**User control:** opt-in per action (button click), not passive; no training on user content (per existing `PRIVACY_POLICY.md` §3, "stateless" API calls).

## 3. PostHog

**Role:** Product analytics.
**Data received:** Event names + non-sensitive properties only — verified by reading every `safeCapture()` call site in `src/lib/telemetry.ts`: domain names, error names, game IDs/scores, durations, category tags, Core Web Vitals metric name/value/rating. The Firebase UID is sent as PostHog's `distinct_id` via `posthog.identify(uid, { tier })` (`src/contexts/AuthContext.tsx`) — a stable pseudonymous identifier, not email or name. **No decrypted journal/workbook content is ever captured** — `safeCapture()` is the only call path into PostHog and every call site was checked.
**Purpose:** usage analytics, error/performance monitoring.
**Open verification item:** `posthog.init()` (`src/main.tsx`) uses PostHog's dated `defaults: '2026-01-30'` preset with no explicit override for session recording, autocapture, or IP capture found in code. **Before finalizing the Data Safety declaration, confirm what that preset actually enables** — this document does not assume either way.

## 4. Stripe

**Role:** Payment processing for premium subscriptions, via the official "Run Payments with Stripe" Firebase Extension — not a direct integration.
**Data received:** Checkout is initiated by writing to `users/{uid}/checkout_sessions` (`src/pages/PremiumUpgrade.tsx`), which the Stripe extension picks up server-side; the extension creates a real Stripe Checkout Session (email is passed via the extension's standard Firebase Auth linkage) and syncs subscription status back to `customers/{uid}` in Firestore, which `syncStripeSubscription` (`functions/src/index.ts`) reads to update the user's tier. **Payment card details never touch MRT infrastructure** — entered directly into Stripe's hosted Checkout page.
**Purpose:** subscription billing.
**Note:** Android TWA installs have this flow gated out entirely (`PROJ-68`, `isAndroidTWA()` check) — Play Store users see an "Upgrade on the Web" link instead, so Stripe never processes a new purchase originating from the Play Store app itself, only from web/existing subscribers.

## 5. Google Drive

**Role:** User-initiated personal backup — meaningfully different in kind from the other four, since MRT's own servers are never in the data path.
**Data received:** A decrypted JSON backup (`mrt_backup.json`) uploaded directly from the user's browser to **their own Google Drive**, using an OAuth access token obtained via their own Google Sign-In (`driveAccessToken` in `AuthContext.tsx`). Confirmed via `src/lib/exporter.ts` that the export is built by client-side decrypting journals/workbook answers/game progress before upload — so yes, this is genuinely decrypted personal content leaving the zero-knowledge boundary, but by explicit user action, to storage the user (not MRT) controls.
**Purpose:** user-controlled backup/portability (`DataExportPanel.tsx`), part of the "Data Sovereignty Engine" (`PROJ-30`).
**User control:** entirely opt-in; the user can revoke Drive access via their own Google Account permissions at any time; MRT never reads this file back from Drive.
