# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W14
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[UX]** Rename global variables/UI text from "Users" to "Friends" (Peer-to-peer alignment).

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage and user flow (Recharts already integrated).
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) and Recovery Community Centers (RCCs) for employment/training resources in Workbooks hub.

## 🧹 Chores & Tech Debt
- [ ] Increase Nav Icon sizes by 25% (Accessibility).
- [ ] Fix Nav Logo white background issue.
- [ ] Wire up Changelog Beacon alert in Dashboard.
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.

## ✅ Resolved This Cycle
- [x] **[FEAT]** Admin Inbox Workflow Upgrade -> *Added 'Backlog' status, purple UI tier, and updated TS interfaces.*
- [x] **[BUG]** PWA Workbox cache collision -> *Resolved via PWAUpdateBeacon and Prompt strategy.*
- [x] **[BUG]** Dashboard load speed optimization -> *Resolved via 30-day bounded queries and composite indexing.*
- [x] **[SRE]** Zero-Knowledge Vault Stability -> *Patched void promise chains and TextDecoder exceptions.*
