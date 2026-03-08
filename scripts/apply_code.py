import os

# FENCE pattern to protect markdown backticks
FENCE = chr(96) * 3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# =============================================================================
# 1. INSIGHTS SPEC
# =============================================================================
insights_spec_content = r'''# 📐 Feature Spec: Insights Log

**Status:** Live (v2.1)
**Context:** A timeline of AI-generated coaching and pattern analysis.

## 1. Data Structure (Expanded Schema)
**Collection:** `insights`
The log handles polymorphic data types with rich, AI-extracted arrays:

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | 'journal' \| 'workbook' |
| `summary` | String | AI narrative |
| `relapse_risk_level` | String | 'Low' \| 'Moderate' \| 'High' \| 'Critical' |
| `trajectory` | String | 'Improving' \| 'Declining' etc. |
| `hidden_correlations` | Array | Hidden links identified by Deep Pattern AI |
| `key_themes` | Array | Recurring topics from Comparative analysis |
| `suggested_actions` | Array | List of 3 recommended habits |

## 2. UI Architecture & Navigation
* **Collapsible Timeline:** To prevent cognitive overload, insights are passed through `groupItemsByYearAndMonth` and rendered as a grouped timeline. 
* **Accordion Rows:** Each insight is wrapped in a `@headlessui/react` `<Disclosure>`. The collapsed header displays the Date, Scope Context, and Risk/Trajectory badges. 
* **Bento Grid Panels:** Expanding the accordion reveals the high-density "Bento Grid" (Strengths, Risks, Key Themes, Hidden Links) using vibrant background colors (`bg-purple-50`, `bg-rose-50`) aligned with the "Vibrant Momentum" design system.

## 3. Action Integration
* "Add to Quest" buttons allow users to convert AI advice into tracked `Tasks` with a 7-day due date and the `ai` source tag. The UI explicitly disables these buttons upon click to prevent accidental duplicate task creation.
'''

# =============================================================================
# 2. SPRINT BOARD
# =============================================================================
sprint_board_content = r'''# 🏃 Active Sprint Board

**Current Phase:** Sprint Planning & Backlog Grooming

## ✅ Completed Sprints
- [x] **Sprints 1-3:** Foundation, Auth, Journal Engine, Encryption.
- [x] **Sprint 4.0:** Sector 4: The Ledger (Tasks) fully scaled and time-zone hardened.
- [x] **Sprint 4.5:** Sector 5: The Pulse (Vitality) organic engine and haptics deployed.
- [x] **Sprint 4.8:** "The Crucible: Dogfooding & Polish". Fixed mobile UX, grouped Insights UI, and aligned Gemini models.

## 🟡 Sprint 5.0: The Expansion (Pending Initialization)
*We are selecting the next major focus from the backlog.*

### 🧊 Backlog (Up Next)
- [ ] **PROJ-09:** The GTM Engine (VitePress Rewrite & Public Landing Page)
- [ ] **PROJ-05:** The Service Network (Encrypted Rolodex + Secure Drop)
- [ ] **PROJ-10:** Crisis & Momentum (Urge Surfer + Freedom Calculator)
- [ ] **PROJ-14:** The Deep Mind (Local RAG + Rich Media support)
- [ ] **PROJ-07:** The Launch Engine (TWA Wrapper + Push Notifications)
'''

# =============================================================================
# 3. CHANGELOG
# =============================================================================
changelog_content = r'''# 🚀 Changelog

Stay up to date with the latest features, fixes, and improvements to My Recovery Toolkit.

### v1.3.0 (The Wisdom & Intelligence Update)
* **New:** **Gemini 3.1 Pro Upgrade:** The "Analysis Wizard" and "Compass" now utilize Google's latest Gemini 3.1 Pro model for incredibly deep, highly accurate pattern recognition across your journal and workbook history.
* **New:** **Lightning Fast Coaching:** The "AI Insight" coach in workbooks now utilizes *Flash-Lite*, providing near-instantaneous feedback and guidance while you write.
* **Improvement:** **Timeline Navigation:** The Insights Log now groups your AI history by Year and Month using smooth, collapsible accordions to protect your screen real estate and prevent scrolling fatigue.
* **Improvement:** **Rich Insights Log:** Redesigned the AI Insights output into a vibrant "Bento Grid" that visually highlights your Relapse Risk Level, Hidden Triggers, and Emotional Velocity.
* **Improvement:** **Library Hub Restructure:** Reorganized the Workbooks page with a clean tabbed navigation system to prepare for upcoming reading materials.
* **Fix:** **Mobile Keyboard UX:** Resolved an issue where opening the virtual keyboard on mobile phones would push the workbook question off the screen.

### v1.2.0 (The Pulse Polish Update)
* **New:** **Somatic Breathwork Engine:** Upgraded the breathing tool with a fluid "Organic Halo" visualization that perfectly matches real-world seconds.
* **New:** **Haptic Grounding:** The app now gently vibrates at every breath change (Inhale, Hold, Exhale) so you can close your eyes and stay grounded during a crisis.
* **Improvement:** **Smart Mood Scoring:** Breathwork logs now automatically inherit your 7-day average mood, preventing your charts from being artificially skewed.

### v1.1.1 (The Ledger Polish Update)
* **New:** **Future Task Safety:** Added a warning modal to prevent accidentally completing tasks scheduled for later dates, keeping your daily stats accurate.
* **Fix:** **Timezone Stability:** Recurring tasks no longer accidentally show up as overdue on the exact day they are created due to timezone calculation bugs.

### v1.1.0 (The Visuals & Hardening Update)
* **New:** **Gradient Insights:** Replaced basic charts with a beautiful "Emotional Velocity" area chart and a "Baseline vs Reality" weekly rhythm tracker.
* **New:** **Template Library:** Upgraded journal templates with structured, recovery-focused prompts (e.g., HALT check, Morning Intention).

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
'''

def write_file(relative_path, content):
    absolute_path = os.path.join(PROJECT_ROOT, relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as f:
        f.write(content.replace("__FENCE__", FENCE).strip() + "\n")
    print(f"✅ Synced: {absolute_path}")

if __name__ == "__main__":
    print("🚀 Running Post-Sprint 4.8 Documentation Sync...")
    write_file("docs/specs/10_INSIGHTS.md", insights_spec_content)
    write_file("docs/SPRINT_BOARD.md", sprint_board_content)
    write_file("docs-site/support/changelog.md", changelog_content)
    print("✨ Audit and Synchronization Complete! Sprint 4.8 is officially closed.")