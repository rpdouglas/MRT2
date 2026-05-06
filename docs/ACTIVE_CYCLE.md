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
- [ ] **PROJ-05:** The Service Network -> Build encrypted Sponsee Rolodex to unblock organic viral growth.
- [⛔ BLOCKED] **PROJ-07:** Play Store TWA (Waiting on DUNS Number for Google Play Developer Account verification).

## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.

## ✅ Resolved This Cycle
- [x] **PROJ-47:** The Ledger — Precision, Resilience & Tab Redesign. Monthly day-drift fix (`originalDayOfMonth`), 2-hour midnight grace window, `missedCountHistory` append, Today/Later/Log tab redesign (Action Plan tab removed), "From yesterday" overdue label.
- [x] **PROJ-48:** User Guide Synchronization Sprint — new Daily Readings page (09), Dynamic Anchor rewrite (2-button bar, time-of-day table, notify toggles), Voice-to-Vault full section, recurrence schedule table, Smart Reset / Lazy Evaluation expansion.
- [x] **PROJ-46:** The Ledger — Frictionless Task Module Upgrade. Sprint 1: swipe-to-complete (green reveal + haptic), Forgiveness Tap (amber swipe-left, "Let today go" sheet), Pull-to-Add Quick Capture. Sprint 2: Rhythm Score (14-day ring), AI Context Cards (sourceContext + sourceRef deep-links), Gemini prompt updates for action_contexts.
- [x] **PROJ-41:** Dynamic Anchor -> Replaced static 'Daily Pledge' with a circadian-aware, 3-column quick action bar on the dashboard.
- [x] **PROJ-40:** Test Suite Audit -> Comprehensive review of Vitest pipeline.
- [x] **PROJ-31:** Crypto Chunking Pipeline -> Refactor PIN rotation to handle 10k+ docs without UI thread locking.
- [x] **PROJ-39:** Deferred Vault Lock -> Added 'Skip for Now' onboarding bypass.
*(Queue Empty)*
*(Queue Empty)*
