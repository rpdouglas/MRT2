# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W16
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
*(Queue Empty)*

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [x] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [⛔ BLOCKED] **PROJ-07:** Play Store TWA (Waiting on DUNS Number for Google Play Developer Account verification).

## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.

## ✅ Resolved This Cycle
- [x] **[UX]** PROJ-19: Landing Page -> *Overhauled top-of-funnel with Vibrant Momentum scroll-snapping layout and Google Auth.*
- [x] **[DEVOPS]** PROJ-24: Asset Engine -> *Deployed strict-typed ASSETS dictionary and batch WebP compression pipeline.*
- [x] **[COMPLIANCE]** Fellowship Routing -> *Injected 'Find a Meeting' locators into SOSModal and overhauled Workbooks tab into a Fellowship Directory (v1.1.10).*
- [x] **[DEVOPS]** Docs Architecture -> *Migrated VitePress documentation to `docs.myrecoverytoolkit.ca` via GitHub Pages custom domain routing (v1.1.9).*
- [x] **[SRE]** PROJ-18: Admin Telemetry -> *Deployed `/admin/telemetry` with bounded 30-day Firestore queries and Recharts token burn visualization (v1.1.8).*
- [x] **[SRE]** API Rate Limiting -> *Injected optimistic UI lock into `useRateLimits.ts` to prevent race-condition API spam.*
- [x] **[HOTFIX]** Push Notification Engine -> *Resolved PWA routing and timezone boundary bugs in `dailyBeacon` function (v1.1.7).*
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*
- [x] **[BILLING]** Stripe Integration -> *Deployed Firestore trigger to provision premium JWT claims upon successful checkout.*
