import os

roadmap_content = """# 🗺️ MRT Product Roadmap

**Vision:** To build the world's most secure, persona-aware digital recovery companion.

## 📅 Q1 2026: Foundation & Security (Completed)
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-01` | **Security Hardening** | Admin | Critical Security Fixes |
| 🟢 **Done** | `PROJ-02` | **Task List Revamp** | Admin | High-Dopamine UX, Optimistic UI |

## 📅 Q2 2026: The "Core Polish" Phase
| Status | ID | Project Name | Owner | Impact |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **Done** | `PROJ-03` | **Wisdom (Workbook) Polish** | Admin | Premium Reading Experience |
| 🟡 **Active** | `PROJ-04` | **The Frictionless Core** | Admin | Auth, UX Bugs, Search, and VitePress |
| ⚪ Planned | `PROJ-05` | **The "Lisa" Service Module**| Admin | Sponsee Management (Encrypted) |
"""

sprint_board_content = """# 🏃 Active Sprint Board
**Sprint:** 19.1 "The Vault & Gate"
**Start Date:** 2026-02-19
**Goal:** Resolve the Journal decryption refresh bug and modernize the Auth/Login UI with Trust Badges.

## 📌 To Do (Project 04 - Sprint 1)
- [ ] **Bug Fix:** Wire `isVaultUnlocked` to trigger reactive re-render of Journal History without a hard refresh.
- [ ] **Auth UX:** Redesign `Login.tsx` into a modern, split Sign-In/Sign-Up flow.
- [ ] **Auth UX:** Add Zero-Knowledge Trust Badges to the sign-up screen.

## 🚧 In Progress
- [ ] Planning phase for Journal refresh bug.

## ✅ Done (Previous Sprint)
- [x] **Project 03:** Wisdom (Workbook) Polish - Zen Mode, Gamification, Auto-Save.
- [x] **Project 03:** Mobile Keyboard UX fix for Workbook Session.
- [x] **Project 03:** Documentation sync for Phase 2.

---
## 🧊 Backlog (Upcoming Sprints)
- [ ] **Project 04 - Sprint 2:** The "Memory Engine" (Client-side search, Insights polish).
- [ ] **Project 04 - Sprint 3:** The "Knowledge Base" (VitePress setup, User Guide migration).
"""

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Updated: {path}")

if __name__ == "__main__":
    print("🔄 Synchronizing Project Management Documents...")
    write_file("docs/ROADMAP.md", roadmap_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    print("✨ Roadmap and Sprint Board are now up to date.")