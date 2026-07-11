# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W17 (Sprint 9.0)
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [x] **Overdue Task Completion Fix:** Fixed a bug where overdue recurring tasks calculated their next due date relative to their past due date instead of today.
- [x] **PROJ-26 Hotfix:** FCM SW token migration — fixed notification click-through (absolute URL) and stale token re-registration on SW version bump.
*(Queue Empty)*

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [⛔ BLOCKED] **PROJ-07:** Play Store TWA (Waiting on DUNS Number for Google Play Developer Account verification).

## ⏸️ Paused (Not in this cycle)
- **PROJ-05:** The Service Network -> Build encrypted Sponsee Rolodex to unblock organic viral growth. Paused per ROADMAP.md (Wave 3) to focus on Wave 1 Onboarding — no code exists yet beyond a Firestore rules stub; `Dashboard.tsx` still shows a "Coming Soon" placeholder. Was previously listed here as an active Priority-2 item, which didn't match its Wave-3/Paused status elsewhere — moved here to keep this file honest about what's actually being worked on.

## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **Remove debug logging:** Leftover `console.log("DEBUG: Current Auth Domain:", ...)` ships to production — `src/lib/firebase.ts:5`. (Source: `docs/reports/2026-07_codebase_deep_review.md` §4)
- [ ] **Firestore rules — uid-match gap:** `ai_logs`, `client_errors`, and `feedback` allow `create` for any authenticated user without checking `request.resource.data.uid == request.auth.uid`, unlike `journals`/`tasks`/`insights`/`service`. Add the existing `isCreatingOwnedResource()` check to all three (`firestore.rules:103-124`) and deploy with `firebase deploy --only firestore:rules`. Low severity (reads stay admin-only; this is a log/report-integrity gap, not a confidentiality leak). (Source: §4)
- [ ] **Delete duplicate Firestore read/write paths:** `src/pages/Tasks.tsx:60-86` (raw `onSnapshot`) and `src/pages/Vitality.tsx:87-104,141` (raw `onSnapshot` + `addDoc`) duplicate what `useTaskOperations`/`useJournalOperations` already do correctly elsewhere in the app — delete the duplicate path, no new code needed. (Source: §1 — see also PROJ-59 for the rest of the Firestore-bypass cleanup)
- [ ] **Fix `any`-type suppressions:** `JournalHistory.tsx:129`, `Dashboard.tsx:141-146` (file-level `eslint-disable`, broader than intended), `UrgeSurfer.tsx:46,49`, `DebugTools.tsx:13` — all inference gaps, not fundamentally untypeable data. Remove the suppressions once fixed. (Source: §3)
- [ ] **Harden CI secret handling:** `.github/workflows/deploy.yml` pipes the Firebase service-account JSON into `$GITHUB_ENV` via a heredoc — a documented GH Actions anti-pattern. Use a random delimiter or pass via a step `env:` input instead. (Source: §4)
- [ ] **Tighten `tsconfig.app.json`:** add `noUncheckedIndexedAccess` (catches real out-of-bounds-index bugs at compile time). Separately evaluate `exactOptionalPropertyTypes` — may surface a batch of new type errors to clean up first. (Source: §6)
- [ ] **Document `syncStripeSubscription` trust dependency:** the function has no in-function auth check and is safe *only* because `subscriptions` writes are rules-locked to `if false` (admin SDK only) — add a one-line code comment so a future rules change doesn't silently reopen it. (Source: §4)
- [ ] **Converge the three "admin" definitions:** `AuthContext.tsx:50` hardcodes `currentUser.email === 'rpdouglas@gmail.com'` as a client-side admin-UI bypass alongside the real custom claim and the `role` field — no privilege-escalation risk (every real admin read/write still requires the custom claim), but three informal definitions of "admin" should converge on one. (Source: §4)
- [ ] **Align Cloud Functions lint tooling:** `functions/package.json` pins ESLint `^8.9.0` / `@typescript-eslint/*` `^5.12.0`, noticeably older than root (`^9.39.2`/`^8.50.0`). Dev-tooling drift only. (Source: §7)
- [ ] **Add bundle/dead-code tooling:** install `rollup-plugin-visualizer` (dev-only, wire into `vite.config.ts`, run on demand) and `knip` or `depcheck` (one-time dead-export sweep — also resolves the `journal.ts` vs `useJournalOperations.ts` question feeding PROJ-59). Restructuring the `vendor` chunk in `vite.config.ts:93-110` is intentionally **not** scoped yet — do that only after the visualizer shows what's actually driving its size. (Source: §6, §7)

## ✅ Resolved This Cycle
- [x] **PROJ-58:** Profile UX Remediation — unified three incompatible save models (explicit submit, busy-flag, silent optimistic) into one autosave pattern with a shared "Saving… / Saved" indicator; fixed a TanStack Query architecture bypass in `Profile.tsx` that could leave Dashboard badges stale after a save; restyled the vault-reset confirmation from a native `prompt()`/`alert()` into the same Headless UI dialog pattern used for account deletion; made Security/Data settings deep-linkable routes (`/profile/security`, `/profile/data`); replaced a generic "check console" import-failure message with cause-specific ones; surfaced a distinct partial-failure state when the Firestore save succeeds but the Firebase Auth displayName sync fails; and closed a handful of polish gaps (sub-44px swatch touch targets, a duplicated vault-unlocked banner, unbounded sobriety-date input).
- [x] **PROJ-57:** Journal Template Modality Expansion — expanded the default journal template picker from 4 Twelve-Step-only templates to 15 across 11 recovery modalities (CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, General), grouped by modality in the picker. New templates reuse the existing guided multi-prompt form/save path already used for custom templates — no new rendering logic.
- [x] **PROJ-56:** Sobriety Hero Color Themes — swatch button on the dashboard hero (top-left) plus a matching "Hero Appearance" picker in Profile → General. 5 curated presets, stored as a plaintext `heroColor` field on `users/{uid}`, defaulting to today's amber look when unset.
- [x] **PROJ-55:** Workbook Remediation — Rewrote Steps 2-11 of the 12-Step workbook with real, step-specific questions (15 unique literature-grounded contexts each), replacing a templated placeholder. Migrated `WorkbookDetail`/`WorkbookSession`/`useAutoSave` off direct Firestore calls onto a new `useWorkbookAnswers` TanStack Query hook, fixing a fragile string-based decryption heuristic in the process. Deleted an orphaned duplicate data module and made the gamification workbook-completion denominator compute dynamically instead of a stale hardcoded value.
- [x] **PROJ-50:** Guided CBT/REBT Interactive Workflows — Transformed the CBT tool suite from open-form static inputs into guided, step-by-step interactive flows (`GuidedWorkflowEngine`) with contextual coaching, optional AI-assisted prompts, and psychoeducation. Shipped in 6 phases: foundation + guided ABCDE, guided CBA, a brand-new 7-column Thought Record, DENTS Scenario Mode + a brand-new Five Questions self-enquiry tool, and a Tools Hub redesign (Start Fresh / Resume / History entry points, completion tracking, time estimates).
- [x] **PROJ-54:** Journal Insights Momentum UI Redesign — Refactored the Insights tab into an atmospheric, reflection-first "Glass and Glow" interface utilizing Momentum Kinetic v3.0, replacing dry charts with semantic colors and ambient motion.
- [x] **PROJ-53:** ROSC Matrix Visual Upgrade (Pill Capsules) — Replaced Recharts radar chart with custom animated "Pill Capsules" design featuring premium glassmorphic dark theme and longitudinal ghosting.
- [x] **PROJ-49:** The Recovery Capital (ROSC) Matrix — Monthly self-reported check-in + Gemini AI analysis across SAMHSA's four dimensions (Health, Home, Purpose, Community). Animated radar chart with longitudinal overlay. ZK boundary: domain scores unencrypted, AI narrative encrypted. Premium AI insights; free tier self-report scores.
- [x] **PROJ-47:** The Ledger — Precision, Resilience & Tab Redesign. Monthly day-drift fix (`originalDayOfMonth`), 2-hour midnight grace window, `missedCountHistory` append, Today/Later/Log tab redesign (Action Plan tab removed), "From yesterday" overdue label.
- [x] **PROJ-48:** User Guide Synchronization Sprint — new Daily Readings page (09), Dynamic Anchor rewrite (2-button bar, time-of-day table, notify toggles), Voice-to-Vault full section, recurrence schedule table, Smart Reset / Lazy Evaluation expansion.
- [x] **PROJ-46:** The Ledger — Frictionless Task Module Upgrade. Sprint 1: swipe-to-complete (green reveal + haptic), Forgiveness Tap (amber swipe-left, "Let today go" sheet), Pull-to-Add Quick Capture. Sprint 2: Rhythm Score (14-day ring), AI Context Cards (sourceContext + sourceRef deep-links), Gemini prompt updates for action_contexts.
- [x] **PROJ-41:** Dynamic Anchor -> Replaced static 'Daily Pledge' with a circadian-aware, 3-column quick action bar on the dashboard.
- [x] **PROJ-40:** Test Suite Audit -> Comprehensive review of Vitest pipeline.
- [x] **PROJ-31:** Crypto Chunking Pipeline -> Refactor PIN rotation to handle 10k+ docs without UI thread locking.
- [x] **PROJ-39:** Deferred Vault Lock -> Added 'Skip for Now' onboarding bypass.
*(Queue Empty)*
*(Queue Empty)*
