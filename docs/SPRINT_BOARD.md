# 🏃 Active Sprint Board
**Sprint:** 4.6 "The Crucible & The Polish"
**Start Date:** 2026-03-03
**Goal:** Lock down logic stability (Tests) and eradicate high-friction UX bugs (Journal Polish).

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

## 🟡 Sprint 4: Hardening & UX Polish (Active)

### 🛠️ Category A: System Hardening
- [x] **4.1 Hook Testing:** Write Vitest specs for `useJournalOperations` and `useTaskOperations`.
- [x] **4.2 Critical Path QA:** Manual verification of Export, PIN Rotation, and Crypto-Shredding.

### 🎨 Category B: Journal UX Polish
- [ ] **4.3 Editor Ergonomics:**
    - Fix Mic icon blocking text (padding).
    - Move Mood Slider to Sticky Header/Footer.
    - Set default mood to "Last 7 Days Average" instead of 5.
- [ ] **4.4 List Efficiency:**
    - Fix missing Sidebar Icon.
    - Implement "Month/Year" collapsible headers in History list.

### 🧠 Category C: Intelligence & Analytics
- [ ] **4.5 Visuals & Logic:**
    - Revamp Chart to Gradient Area Chart (Mon-Sun axis).
    - Filter "Template Words" from Word Cloud.
    - Tune AI Prompt for "Emotional Velocity".
- [ ] **4.6 Template Refresh:** Update default templates (Somatic Urge Log, Evening Inventory).

## 🧊 Backlog (Sprint 5+)
- [ ] **Photo Attachments:** Requires Firestore Storage + Client-Side Encryption.
- [ ] **Demo Mode:** Anonymous Auth flow for "Try before you buy".
