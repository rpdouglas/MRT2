import os

def write_file(filepath, content):
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Safely replace the FENCE placeholder with markdown backticks
    FENCE = chr(96) * 3
    final_content = content.replace('__FENCE__', FENCE)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"✅ Successfully wrote {filepath}")

def main():
    print("🚀 Initiating shift to Continuous Momentum Methodology (2026-W14)...")

    # 1. The Lean Roadmap
    roadmap = r"""# 🗺️ MRT Product Roadmap: "Continuous Momentum"

**Methodology:** Lean (Now / Next / Later)

## 🟢 NOW (Active Cycle Focus)
*Projects currently in active development and unblocking growth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |

## 🟡 NEXT (Up Next)
*Fully scoped projects awaiting engineering bandwidth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-25` | **The Daily Oracle** | Walt / Ned | Universal CBT/Stoic/Mindfulness prompted journaling templates (No fellowship-specific text). |

## ⚪ LATER (Strategic Epics)
*Approved concepts requiring further technical scoping.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-22` | **Insights Stats** | Walt | Data visualization tab within the Insights module. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright) for scaling safety. |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |

## ✅ RECENTLY SHIPPED
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)
* `PROJ-27` The CBT Engine (SMART Tools integration)
* `PROJ-26` The Beacon (Push Notifications)
"""

    # 2. The Active Cycle (Replacing SPRINT_BOARD.md)
    active_cycle = r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W14
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Dashboard load speed optimization (Check Firestore indexes & React Query caching).
- [ ] **[BUG]** PWA Workbox cache collision (Fix deploy refresh requiring 3-4 reloads).
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[UX]** Rename global variables/UI text from "Users" to "Friends" (Peer-to-peer alignment).

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Scaffold `/admin/telemetry` UI to track Gemini API usage and user flow.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) in Workbooks hub.

## 🧹 Chores & Tech Debt
- [ ] Increase Nav Icon sizes by 25% (Accessibility).
- [ ] Fix Nav Logo white background issue.
- [ ] Wire up Changelog Beacon alert in Dashboard.
"""

    # 3. The Re-organized Backlog
    backlog = r"""# 🧊 Feature Backlog (The Icebox)

**Storage:** Ideas and feature requests that are approved but deferred. Do not pull into `ACTIVE_CYCLE.md` until prioritized.

## 🏃 Integrations & Wearables
* **Feature:** HealthConnect / Apple HealthKit API integration for Sleep and Step data.
* **Complexity:** Extremely High. Deferred until post-seed funding/legal review.

## 🎮 Gamification & UI
* **Feature:** Sims-style KPI Gauges (Expanded Vitality Rings).
* **Complexity:** Medium. Deferred to prevent UI clutter during initial growth phase.
* **Feature:** Daily Recovery Puzzles (Crosswords/Word Search).
* **Decision:** Rejected/Deferred indefinitely. We are a toolkit, not a gaming app.

## 🏆 Social & Fellowship
* **Feature:** "90 in 90" Meeting Tracker & Friend Challenges (PROJ-21).
* **Complexity:** High (Requires secure multiplayer networking). Deferred to 5,000 user milestone.

## 📸 Media Support
* **Feature:** Photo Attachments in Journal.
* **Complexity:** High (Requires Blob -> ArrayBuffer -> AES-GCM -> Base64).
"""

    # 4. Updating AI Initialization Prompt
    prompt_init = r"""# 🤖 AI Session Initialization Prompt (v3.2)

**Role:** Principal Software Architect & Product Manager.

**1. Load Technical Context:**
* **Stack:** React 19, Vite, Tailwind v4, Firebase, Gemini 2.5, VitePress (Docs).
* **Security:** Zero-Knowledge (AES-GCM). *Never output user data in plain text.*
* **Reference:** Read `docs/CONTEXT_DUMP.md`.

**2. Core Technical Values (The MRT Standard):**
* **Type Strictness (CRITICAL):** NO `any` types. Use `unknown` and cast via interfaces.
* **Linting strictness:** Prefix intentionally unused arguments with an underscore (e.g., `_index`). Delete all unused imports immediately.
* **Date Safety:** Use JS `Date` for logic/UI and Firestore `Timestamp` for storage. Always normalize using `toDate()` helpers.
* **Safe Delivery Protocol:** Always use Python scripts with raw strings to generate files. Never use Bash.

**3. Load Project Context:**
* **Reference:** Read `docs/ACTIVE_CYCLE.md` to see immediate priorities and hotfixes for the current week.
* **Reference:** Read `docs/ROADMAP.md` for high-level Now/Next/Later goals.

**Your Goal:**
You are executing a specific task within an **Active Cycle**. Do not deviate from the weekly goals or compromise the Technical Core Values.

**Reply:** 'MRT Platform Loaded. Technical guardrails active. Ready for Task.'
"""

    # 5. Updating AI Audit Prompt
    prompt_audit = r"""# 🛡️ Phase Completion & Audit Prompt

**Trigger:** You have finished coding and testing a task or hotfix.

**Task:**
1. **Security Scan:** Check for `console.log` or weak types (`any`).
2. **PM Update:** Generate a Python script (`update_pm.py`) to:
    * Mark tasks as `[x]` in `docs/ACTIVE_CYCLE.md`.
    * If a whole Epic is done, move it to the Shipped section in `docs/ROADMAP.md`.
    * Update `docs/CHANGELOG.md` with technical details.

**Output:**
* Audit Report.
* `update_pm.py` script.
"""

    # 6. Updating Post-Sprint Audit Prompt (Now Post-Cycle)
    prompt_post_cycle = r"""# 🛡️ Master Post-Cycle Audit & Sync Prompt (v4.1)

**Trigger:** Run this at the end of the week (e.g., Friday afternoon) before creating a Pull Request to `main`.
**Goal:** Ensure the Code, Architecture Specs, User Guides, and Project Boards are in perfect synchronization.

---

**Role:** Lead DevOps Engineer & Principal Technical Writer.

**Input:**
1. **Codebase Dump:** I will provide the full `src/`, `docs/`, and `docs-site/` directories.
2. **Context:** A brief summary of the hotfixes and features completed this cycle.

**Your Task:** Execute the following 4 phases in order.

### PHASE 1: Security & Quality Gate (The Code)
Scan the provided `src/` code for immediate pre-merge red flags:
* **Zero-Knowledge Check:** Are there any new `console.log` statements logging user data? Are there any unencrypted writes to secure collections?
* **Type Safety:** Are there any explicit `any` types that sneaked in?

### PHASE 2: Drift Detection (The Documentation)
1. **Schema Drift (`docs/SCHEMA_ARCHITECTURE.md`):** Does the schema match the exact payloads being sent to Firestore?
2. **Technical Spec Drift (`docs/specs/`):** Do the feature specs accurately reflect new logic?
3. **User Guide Drift (`docs-site/guide/`):** Do the VitePress guides reflect current UI flows?
4. **12-Step Compliance Drift (`docs/business/05_12_STEP_COMPLIANCE.md`):** Ensure no prohibited terms (e.g., "AI Sponsor") are used.

### PHASE 3: Project Management Sync
Review the active work:
1. **Active Cycle (`docs/ACTIVE_CYCLE.md`):** Identify which tasks are complete. Draft the template for next week's cycle (e.g., `Cycle 2026-W15`).
2. **Roadmap (`docs/ROADMAP.md`):** Promote items from NEXT to NOW if bandwidth opens up.
3. **Changelog (`docs-site/support/changelog.md`):** Draft release notes.

### PHASE 4: The Universal Sync Script
*Output Format:* Produce a single table summarizing the drift, followed by a **Python script** (`scripts/sync_cycle_state.py`) that overwrites all drifted markdown files in one go.

**Strict Scripting Constraints:**
* **Markdown Protection (CRITICAL):** Define `FENCE = chr(96) * 3` at the top of the Python script. Use `__FENCE__` as a placeholder in your raw Python string. Use `.replace('__FENCE__', FENCE)` to safely write the files.

---
**Reply:** 'MRT Audit Engine Loaded. Awaiting Codebase and Cycle Summary to begin the Post-Cycle Sync.'
"""

    # Execute File Writes
    write_file('docs/ROADMAP.md', roadmap)
    write_file('docs/ACTIVE_CYCLE.md', active_cycle)
    write_file('docs/BACKLOG.md', backlog)
    write_file('docs/prompts/INITIALIZATION.md', prompt_init)
    write_file('docs/prompts/AUDIT.md', prompt_audit)
    write_file('docs/prompts/POST_SPRINT_AUDIT.md', prompt_post_cycle)

    print("\n✅ Shift to 'Continuous Momentum' Methodology Complete.")
    print("⚠️  ACTION REQUIRED: Please manually delete the old 'docs/SPRINT_BOARD.md' file.")

if __name__ == "__main__":
    main()