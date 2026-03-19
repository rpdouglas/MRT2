import os

FENCE = chr(96) * 3

def sync_sprint_state():
    # 1. Update Roadmap to reflect PROJ-24 completion
    roadmap_path = "docs/ROADMAP.md"
    roadmap_content = r"""# 🗺️ MRT Product Roadmap: "Forged in Fire"

## 📅 Q4 2026: The Road to 5,000 (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition & Scaling strategy. |
| 🟡 **Active** | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |
| 🟢 **Done** | `PROJ-24` | **The Asset Engine** | Admin | Centralized Typed Asset Dictionary & Medallion Pipeline. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright). |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |
"""

    # 2. Update Sprint Board
    sprint_board_path = "docs/SPRINT_BOARD.md"
    sprint_board_content = r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 8.3 (Infrastructure & QA)

## ✅ Completed Sprints
- [x] **Sprint 8.1:** Virality & Polish (PROJ-20). Milestone confetti, AI task badges.
- [x] **Sprint 8.2:** Medallion Pipeline (PROJ-24). Refined circular chips + transparency automation.

## 🟡 Sprint 8.0: The Road to 5,000 (Active)
- [ ] **Admin:** Receive $50,000 funding tranche.
- [ ] **PROJ-07:** Finalize Android App Store deployment.
"""

    # 3. Update Changelog
    changelog_path = "docs-site/support/changelog.md"
    changelog_content = r"""# 🚀 Changelog

### v1.8.0 (The Medallion Update)
* **New:** **Monthly Milestones:** Added unique, high-fidelity circular recovery medallions for every month of the first year of sobriety.
* **Improvement:** **Reliable Sharing:** Implemented an image pre-loader in the Sobriety Hero to ensure medallions appear perfectly in social media exports.
* **Dev:** **Asset Pipeline:** Created Python-based automation for segmenting and processing transparent PWA assets.

""" + open("docs-site/support/changelog.md").read().split("# 🚀 Changelog")[1]

    files = {
        roadmap_path: roadmap_content,
        sprint_board_path: sprint_board_content,
        changelog_path: changelog_content
    }

    for path, content in files.items():
        with open(path, "w", encoding="utf-8") as f:
            f.write(content.replace('__FENCE__', FENCE))
        print(f"✅ Synced: {path}")

if __name__ == "__main__":
    sync_sprint_state()