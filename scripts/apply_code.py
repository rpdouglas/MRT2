import os

FENCE = chr(96) * 3

def update_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.replace('__FENCE__', FENCE))
    print(f"✅ Synchronized: {filepath}")

def main():
    print("🚀 Initiating Project Governance Sync...\n")

    # 1. Update Sprint Board with Sprint 8.4 (The Polish Update)
    update_file('docs/SPRINT_BOARD.md', r"""# 🏃 Active Sprint Board

**Current Phase:** Sprint 8.4 (The Polish Update)

## ✅ Completed Sprints
- [x] **Sprint 8.1:** Virality & Polish (PROJ-20). Milestone confetti, AI task badges.
- [x] **Sprint 8.2:** Medallion Pipeline (PROJ-24). Refined circular chips + transparency automation.
- [x] **Sprint 8.3:** Content Expansion. Integrated "Women for Recovery" specialty workbook with tailored UI routing.

## 🟡 Sprint 8.4: The Polish Update (Active)
- [ ] **Fix:** Journal AI results not saving to Insights Log.
- [ ] **Fix:** S21 mobile template dropdown visibility.
- [ ] **Fix:** Remove distracting flashing pulse from global header icon (keep only on SOS).
- [ ] **Fix:** Add white background to Nav Menu Logo.
- [ ] **Fix:** Suppress "Backup Needed" warning for Google Drive auto-sync users.
- [ ] **Feature:** Admin terminology update ("Users" -> "Friends").

## 🟡 Sprint 8.0: The Road to 5,000 (Active)
- [ ] **Admin:** Receive $50,000 funding tranche.
- [ ] **PROJ-07:** Finalize Android App Store deployment.
- [ ] **Web Infra:** Move VitePress to docs.myrecoverytoolkit.ca.
- [ ] **Web Infra:** Landing page mobile polish & "About Us" section.
- [ ] **Assets:** Create company letterhead and slide deck master.
""")

    # 2. Update Roadmap with PROJ-26 (The Beacon), PROJ-25, PROJ-18, and PROJ-22
    update_file('docs/ROADMAP.md', r"""# 🗺️ MRT Product Roadmap: "Forged in Fire"

## 📅 Q4 2026: The Road to 5,000 (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition & Scaling strategy. |
| 🟡 **Active** | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |
| 🟢 **Done** | `PROJ-24` | **The Asset Engine** | Admin | Centralized Typed Asset Dictionary & Medallion Pipeline. |
| ⚪ Planned | `PROJ-26` | **The Beacon** | All | Firebase Cloud Messaging, push notifications, and PWA permission flows for retention. |
| ⚪ Planned | `PROJ-25` | **The Daily Oracle** | Walt / Ned | Daily prompted recovery reflections and journaling guides. |
| ⚪ Planned | `PROJ-22` | **Insights Stats** | Walt | Data visualization tab within the Insights module. |
| ⚪ Planned | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI and user metrics. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright). |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |
""")

    # 3. Clean up the Backlog (removing promoted items)
    update_file('docs/BACKLOG.md', r"""# 🧊 Feature Backlog

**Storage:** Ideas that are approved but deferred to keep the current Sprint focused.

## 🏆 Social & Fellowship Challenges (PROJ-21)
* **Feature:** "90 in 90" Meeting Tracker & Friend Challenges.
* **Complexity:** High (Requires secure multiplayer networking). Deferred until 5,000 user milestone.

## 📸 Media Support
* **Feature:** Photo Attachments in Journal.
* **Complexity:** High (Requires Blob -> ArrayBuffer -> AES-GCM -> Base64 -> Firestore).
""")

    print("\n🎉 Project Governance Sync Complete.")

if __name__ == "__main__":
    main()