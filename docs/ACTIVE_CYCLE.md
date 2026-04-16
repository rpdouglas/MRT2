# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W16
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[BUG]** Push Notifications failing to fire (Triage Report 4/16).

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.).

## 🧹 Chores & Tech Debt
- [ ] **[UX]** Journal Insights: Add confirmation toast/modal when adding an AI insight to tasks (Triage Report 4/16).
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07).

## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*
- [x] **[BILLING]** Stripe Integration -> *Deployed Firestore trigger to provision premium JWT claims upon successful checkout.*
- [x] **[UI]** Nav Logo Visibility Polish -> *Fixed background and scaled logo up by 33% (v1.1.2).*
- [x] **[HOTFIX]** Admin Inbox Schema Alignment -> *Restored onSnapshot listener and aligned interface to fix empty rendering (v1.1.1).*
- [x] **[FEAT]** Admin Inbox Workflow Upgrade -> *Added 'Backlog' status, purple UI tier, and updated TS interfaces (v1.1.0).*
- [x] **[BUG]** PWA Workbox cache collision -> *Resolved via PWAUpdateBeacon and Prompt strategy.*
- [x] **[BUG]** Dashboard load speed optimization -> *Resolved via 30-day bounded queries and composite indexing.*
- [x] **[SRE]** Zero-Knowledge Vault Stability -> *Patched void promise chains and TextDecoder exceptions.*
