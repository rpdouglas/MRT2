import os

# =============================================================================
# 1. SPRINT BOARD (The Plan)
# =============================================================================
sprint_board = r'''# 🏃 Active Sprint Board
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
- [ ] **4.1 Hook Testing:** Write Vitest specs for `useJournalOperations` and `useTaskOperations`.
- [ ] **4.2 Critical Path QA:** Manual verification of Export, PIN Rotation, and Crypto-Shredding.

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
'''

# =============================================================================
# 2. THE CRUCIBLE (QA Strategy)
# =============================================================================
crucible_spec = r'''# 🛡️ Project 04.5: The Crucible (Hardening & QA)

**Objective:** Lock down core business logic with unit tests and perform a comprehensive "Documentation-Driven QA" loop.
**Status:** 🟡 Active
**Context:** We are currently executing the "Bug Bash" phase based on the March 2026 Audit.

## 🏗️ Phase 1: The Logic Ledger (Unit Testing)
* [x] **Setup:** Ensure `vitest` and `@testing-library/react` are fully configured.
* [x] **Auto-Save:** Verified debounce and encryption timing.
* [ ] **Journal CRUD:** Verify `add/update/delete` hooks invalidate cache correctly (Ticket 4.1).
* [ ] **Task CRUD:** Verify Optimistic UI rollbacks (Ticket 4.1).

## 🐛 Phase 2: Documentation-Driven QA (The Bug Bash)

### Sector 1: The Gates (Auth & Onboarding)
* [x] **Status:** Secure.

### Sector 2: The Horizon (Dashboard)
* [ ] **Bug:** Fix missing/broken icon in top-left sidebar navigation.

### Sector 3: The Vault (Journal & Insights)
**Active Focus Area (Sprint 4)**
* [ ] **Editor:** Fix Microphone icon overlapping text area.
* [ ] **Editor:** Move Mood Slider to a position that doesn't require scrolling.
* [ ] **Logic:** Change default mood from 5 to "User's Recent Average".
* [ ] **Visuals:** Replace "Cheap" Recharts bars with professional Gradient Area Chart.
* [ ] **Logic:** Word Cloud must ignore template boilerplate (e.g., "Today", "Grateful").
* [ ] **Performance:** Implement Month/Year grouping for long history lists.

### Sector 4: The Ledger (Tasks)
* [x] **Status:** Stable (Text wrapping fixed in Sprint 3).

### Sector 5: The Pulse (Vitality)
* [ ] **Audit Pending:** Verify Breathwork timer prevents screen sleep.

### Sector 6: The Compass (Workbooks)
* [ ] **Audit Pending:** Verify Auto-save works on slow 3G connections.

### Sector 7: The Settings (Profile)
* [ ] **Critical Path:** Verify JSON Export contains readable data (decrypts correctly).
* [ ] **Critical Path:** Verify PIN Rotation does not corrupt history.

'''

# =============================================================================
# 3. BACKLOG (New File)
# =============================================================================
backlog = r'''# 🧊 Feature Backlog

**Storage:** Ideas that are approved but deferred to keep the current Sprint focused.

## 📸 Media Support
* **Feature:** Photo Attachments in Journal.
* **Complexity:** High (Requires Blob -> ArrayBuffer -> AES-GCM -> Base64 -> Firestore).
* **Dependency:** Firestore Storage Rules.

## 👤 Demo / Trial Mode
* **Feature:** "Try it now" button on Login page.
* **Mechanism:** Firebase Anonymous Auth.
* **Content:** Pre-seeded "Fake" journal entries and tasks to show the dashboard populated immediately.

## 🤝 The Service Module ("Lisa")
* **Feature:** Sponsee Rolodex.
* **Security:** Encrypted Names and Notes.
* **Status:** Planned for Sprint 5.
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    # Ensure markdown backticks remain intact
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Synced: {path}")

if __name__ == "__main__":
    print("🚀 updating Project Management Docs...")
    write_file("docs/SPRINT_BOARD.md", sprint_board)
    write_file("docs/projects/04.5_THE_CRUCIBLE.md", crucible_spec)
    write_file("docs/BACKLOG.md", backlog)
    print("✨ Planning documents updated for Sprint 4.")