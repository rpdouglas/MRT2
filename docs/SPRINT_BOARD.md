# 🏃 Active Sprint Board
**Sprint:** 4.8 "The Crucible: Dogfooding & Polish"
**Start Date:** 2026-03-04
**Goal:** Perform rigorous manual QA ("Dogfooding") to identify and eradicate UX friction in Tasks, Vitality, Wisdom, and Insights before beginning the Service Module.

## ✅ Sprints 1-3: Foundation & Core Polish (Completed)
- [x] Auth UI, Onboarding Redirect, Dashboard Identity, Journal Cache, and basic UI density.

## ✅ Sprint 4.0 - 4.7: Hardening & Visuals (Completed)
- [x] Unit Tests (`useJournalOperations`, `useTaskOperations`).
- [x] Wake Lock API for Breathwork.
- [x] Gradient Charts & Word Cloud Filters.
- [x] Triage Inbox Rework (Accordion Grouping).

## 🟡 Sprint 4.8: The Dogfooding Phase (Active)
- [x] **Sector 4: The Ledger (Tasks):**
  - [x] The Timezone Test: Due dates now anchor to local Noon to prevent UTC midnight shifts.
  - [x] The "Debt" Test: Smart Resets decouple visual completion from background lifecycle status.
  - [x] The Overflow Test: Task titles wrap elegantly; mobile layout is stable.
  - [x] The "Future Task" Test: Injected Headless UI safety intercept modal for premature completions.
  - [x] The "Log Scalability" Test: Migrated History tab to `react-virtuoso` with Year/Month hierarchical grouping.
- [ ] **Sector 5: The Pulse (Vitality):** Test real-world feel of the breathwork pacer, mobile rendering, and bio-rhythm edge cases.
- [ ] **Sector 6: The Compass (Wisdom):** Test auto-save latency, mobile keyboard UX, and AI coaching prompt quality.
- [ ] **Sector 7: Insights Log:** Test rendering of long AI responses, markdown parsing, and filter interactions.

## 🧊 Backlog (Sprint 5+)
- [ ] **PROJ-05:** The "Lisa" Service Module (Encrypted Rolodex).
- [ ] **PROJ-06:** Rich Media & Memory (Photo Attachments).
- [ ] **PROJ-07:** The Launch Engine (Stripe, Demo Mode).
- [ ] **PROJ-08:** Recovery Tools (CBT & Mindfulness aids).
