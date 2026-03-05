import os

FENCE = chr(96) * 3
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

sprint_board_content = r'''# 🏃 Active Sprint Board

**Sprint:** 4.8 "The Crucible: Dogfooding & Polish"
**Start Date:** 2026-03-04
**Goal:** Perform rigorous manual QA ("Dogfooding") to identify and eradicate UX friction in Tasks, Vitality, Wisdom, and Insights.

## ✅ Sprints 1-3: Foundation & Core Polish (Completed)
- [x] Auth UI, Onboarding Redirect, Dashboard Identity, Journal Cache, and basic UI density.

## ✅ Sprint 4.0 - 4.7: Hardening & Visuals (Completed)
- [x] Unit Tests (`useJournalOperations`, `useTaskOperations`).
- [x] Wake Lock API for Breathwork.
- [x] Gradient Charts & Word Cloud Filters.
- [x] Triage Inbox Rework (Accordion Grouping).

## 🟡 Sprint 4.8: The Dogfooding Phase (Active)
- [ ] **Sector 4: The Ledger (Tasks):**
  - [x] The Timezone Test: Due dates now anchor to local Noon.
  - [x] The "Debt" Test: Smart Resets decouple visual completion.
  - [x] The Overflow Test: Task titles wrap elegantly.
  - [x] The "Future Task" Test: Injected Headless UI safety intercept.
  - [x] The "Log Scalability" Test: Migrated History tab to `react-virtuoso`.
  - [ ] **Active Focus:** Final edge-case testing, task editing, and UI verification.
- [ ] **Sector 5: The Pulse (Vitality):** Test real-world feel of the breathwork pacer, mobile rendering, and bio-rhythm edge cases.
- [ ] **Sector 6: The Compass (Wisdom):** Test auto-save latency, mobile keyboard UX, and AI coaching prompt quality.
- [ ] **Sector 7: Insights Log:** Test rendering of long AI responses, markdown parsing, and filter interactions.

## 🧊 Backlog (Sprint 5+)
- [ ] **PROJ-09:** The GTM Engine (VitePress Rewrite)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media)
- [ ] **PROJ-07:** The Launch Engine (TWA Wrapper + Push Notifications)
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    dirname = os.path.dirname(absolute_path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    final_content = content.replace("__FENCE__", FENCE).strip() + "\n"
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Reverted: {absolute_path}")

if __name__ == "__main__":
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    print("✨ Sprint Board re-aligned to active Dogfooding state.")