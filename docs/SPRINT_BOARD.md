# 🏃 Active Sprint Board
**Sprint:** 5.0 "The Service Module (Lisa)"
**Start Date:** 2026-03-04
**Goal:** Implement the "Digital Rolodex" for sponsors to securely manage sponsees (The "Lisa" Persona).

## ✅ Sprint 1: The Gates & Onboarding (Completed)
- [x] **1.1 Landing Page:** Add MRT icon, persona headshots/bios.
- [x] **1.2 Auth UI:** Consolidate to a single login/create account view.
- [x] **1.3 Onboarding Redirect:** Force new users to Profile setup.

## ✅ Sprint 2: The Horizon & Identity (Completed)
- [x] **2.1 Sidebar/Header:** Brand alignment.
- [x] **2.2 Reactivity:** Dashboard updates when Profile name changes.
- [x] **2.3 Dashboard UI:** Move XP tracker to Sobriety Counter.
- [x] **2.4 Profile Tabs:** Split Profile into General / Security / Data tabs.
- [x] **2.5 PIN Management:** Add secure Change PIN / Reset PIN flows.

## ✅ Sprint 3: The Core Polish (Completed)
- [x] **3.1 Journal Cache:** Fix History tab staleness on save/delete.
- [x] **3.2 Tasks UI:** Fix text wrapping for long Action Plan titles.

## ✅ Sprint 4: Hardening & UX Polish (Completed)
- [x] **4.1 Hook Testing:** Write Vitest specs for `useJournalOperations` and `useTaskOperations`.
- [x] **4.2 Critical Path QA:** Manual verification of Export, PIN Rotation, and Crypto-Shredding.
- [x] **4.3 Editor Ergonomics:** Fix Mic icon, move Mood Slider, set smart default mood.
- [x] **4.4 List Efficiency:** Implement Month/Year grouping for Journal History.
- [x] **4.5 Visuals:** Upgrade Insights to Gradient Area Chart and "Baseline vs Reality" Weekly Rhythm.
- [x] **4.5.1 Filters:** Add "Manage Ignored Words" modal for Word Cloud.
- [x] **4.6 Template Refresh:** Extract templates to `src/data/` and upgrade content to recovery-focused prompts.

## 🟡 Sprint 5: The "Lisa" Service Module (Active)
- [ ] **5.1 Schema & Types:** Define `Sponsee` interface and Firestore security rules.
- [ ] **5.2 Service Hook:** Build `useServiceOperations` (CRUD with encryption).
- [ ] **5.3 Sponsee List UI:** Create "Active" and "Alumni" tabs.
- [ ] **5.4 Secure Card:** Build the detail view for encrypted notes.

## 🧊 Backlog (Sprint 6+)
- [ ] **Photo Attachments:** Requires Firestore Storage + Client-Side Encryption.
- [ ] **Demo Mode:** Anonymous Auth flow for "Try before you buy".
