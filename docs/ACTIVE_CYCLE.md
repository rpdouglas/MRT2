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

## ✅ Resolved This Cycle
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
