# 🏃 Active Sprint Board
**Sprint:** 4.6 "The Crucible" (Hardening)
**Start Date:** 2026-03-03
**Goal:** Finalize unit testing and prepare for the Service Module (Lisa Persona).

## ✅ Sprint 1: The Gates & Onboarding (Completed)
- [x] **1.1 Landing Page:** Add MRT icon, persona headshots/bios, Notebook LM video link.
- [x] **1.2 Auth UI:** Consolidate to a single login/create account view.
- [x] **1.3 Onboarding Redirect:** Force new users to Profile to set Name, Sponsor, and Sobriety Date.

## ✅ Sprint 2: The Horizon & Identity (Completed)
- [x] **2.1 Sidebar/Header:** Add "My" to icon, balance header layout, rename Quest -> Tasks.
- [x] **2.2 Reactivity:** Fix "Hello friend" bug; update Dashboard when Profile name changes.
- [x] **2.3 Dashboard UI:** Move XP tracker to Sobriety Counter; add Service/Games placeholders.
- [x] **2.4 Profile Tabs:** Split Profile into General / Security / Data tabs.
- [x] **2.5 PIN Management:** Add secure Change PIN / Reset PIN flows.

## ✅ Sprint 3: The Core Polish (Completed)
- [x] **3.1 Journal Cache:** Implemented `useJournalOperations` hook to fix History tab staleness on save/delete.
- [x] **3.2 Tasks UI:** Refactored `TaskRow` to support multi-line text wrapping for long AI-generated titles.

## 🟡 Sprint 4: Unit Testing & Hardening (Active)
- [ ] **4.1 Hook Testing:** Add comprehensive tests for `useTaskOperations` and `useJournalOperations`.
- [ ] **4.2 Critical Path QA:** Run full manual regression on PIN rotation and Export flows.

## ✅ Done (Previous Sprint)
- [x] Gathered 13 bugs across Sector 1.
- [x] Built Triage Generator script.
- [x] Restructured VitePress Knowledge Base.
