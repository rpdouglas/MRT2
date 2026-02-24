import os

# =============================================================================
# PROJECT 04.5: THE CRUCIBLE (UPDATED)
# =============================================================================

proj_4_5_spec = r'''# 🛡️ Project 04.5: The Crucible (Hardening & QA)

**Objective:** Lock down core business logic with unit tests and perform a comprehensive "Bug Bash" to polish the UI/UX before any public launch.
**Status:** 🟡 Active
**Personas Involved:** The Architect (Developer/Admin), Universal Users

## 🏗️ Phase 1: The Logic Ledger (Unit Testing)
* [x] **Setup:** Ensure `vitest` and `@testing-library/react` are fully configured.
* [x] **Gamification (`src/lib/gamification.ts`):** Test XP calculation, streak logic, and Archetype derivation.
* [x] **Tasks (`src/lib/tasks.ts`):** Test the "Smart Reset" logic (moving missed recurring tasks to Today).
* [x] **Dates (`src/lib/dateUtils.ts`):** Ensure timezone logic and "start of day" calculations are bulletproof.
* [x] **Insights (`src/lib/insights.ts`):** Test AI JSON sanitization against hallucinated malformed markdown.

## 🐛 Phase 2: The Bug Bash
* [ ] **Issue Tracking:** Migrate known bugs from Firestore/Memory to GitHub Issues.
* [ ] **UI Polish:** Fix layout shifts, mobile responsiveness issues, and visual glitches.
* [ ] **UX Friction:** Resolve any awkward user flows or state inconsistencies.
* [ ] **Performance:** Address any console warnings or React rendering bottlenecks.
'''

# =============================================================================
# ROADMAP UPDATE
# =============================================================================

roadmap = r'''# 🗺️ MRT Product Roadmap

**Vision:** To build the world's most secure, persona-aware digital recovery companion.

## 📅 Q1 2026: Foundation & Security (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |

## 📅 Q2 2026: The "Core Polish" Phase (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟢 **Done** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search, and VitePress |

## 📅 Q3 2026: Hardening & Expansion (Active)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-04.5`| **The Crucible (Hardening & QA)** | Admin | Unit Testing & Bug Bash |
| ⚪ Planned | `PROJ-05` | **The "Lisa" Service Module**| Admin | Sponsee Management (Encrypted) |
| ⚪ Planned | `PROJ-06` | **The Launch** | Admin | TWA Android Wrapper & Play Store |
'''

# =============================================================================
# SPRINT BOARD UPDATE
# =============================================================================

sprint_board = r'''# 🏃 Active Sprint Board
**Sprint:** 4.5.2 "The Bug Bash"
**Start Date:** 2026-02-23
**Goal:** Triage and resolve all outstanding UI/UX bugs across the application.

## 📌 To Do (Project 04.5 - Sprint 2)
- [ ] List bugs here or transition them to GitHub Issues and link them.

## 🚧 In Progress
- [ ] Gathering bug reports.

## ✅ Done (Previous Sprint)
- [x] **Unit Testing:** Achieved 100% logic test coverage in Vitest for Dates, Tasks, Gamification, and AI Recovery.
'''

def write_file(path, content):
    dirname = os.path.dirname(path)
    if dirname: 
        os.makedirs(dirname, exist_ok=True)
    final_content = content.replace("~~~", "```").strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print(f"✅ Updated: {path}")

if __name__ == "__main__":
    print("🚀 Pivoting to Phase 2: The Bug Bash...")
    write_file("docs/projects/04.5_THE_CRUCIBLE.md", proj_4_5_spec)
    write_file("docs/ROADMAP.md", roadmap)
    write_file("docs/SPRINT_BOARD.md", sprint_board)
    print("✨ Documentation synced. Ready to squash bugs.")