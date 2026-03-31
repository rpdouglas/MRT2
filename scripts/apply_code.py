import os

FENCE = chr(96) * 3

FILES = {
    "docs-site/guide/08-cbt-tools.md": r"""
# 🧩 The Toolbox (SMART CBT)

Recovery is about interrupting automatic reactions with intentional logic. The **Tools Hub** contains interactive Cognitive Behavioral Therapy (CBT) exercises, adapted from evidence-based models like SMART Recovery and REBT.

## Accessing the Tools
From the Dashboard, tap the **Tools** tile in the Bento Grid. This will open the Tools Hub, where you can select an exercise based on your current emotional state.

---

## 🔥 The Resentment Burner
**When to use it:** When you are experiencing acute anger, resentment, or a toxic thought loop that you need to physically release.

This tool is a completely **ephemeral safe space**. Type your resentment onto the physical notebook paper. When you click "Burn", a hardware-accelerated combustion engine literally burns the paper and text into ash. 
* **Zero Traces:** This tool explicitly bypasses the Vault. No data is ever synced, saved, or stored. Once it burns, it is permanently wiped from your device's memory.

---

## ⚖️ Cost Benefit Analysis (CBA)
**When to use it:** When you are experiencing a strong urge to relapse and your brain is telling you "it won't be that bad."

The CBA tool helps you see the big picture by forcing you to list out the short-term and long-term consequences of your actions. 

---

## 🔄 ABC Coping Tool
**When to use it:** When you are feeling overwhelming anxiety, anger, or resentment and you don't know why.

The ABC model teaches us that events don't cause our feelings; our *beliefs* about the events cause our feelings. This tool guides you through a sequential flow to challenge those beliefs.

---

## 🛡️ D.E.N.T.S. Strategy Tool
**When to use it:** When you are preparing to enter a high-risk situation.

This is a pre-planning safety tool. Fill it out *before* the urge strikes so you have a concrete action plan ready (Deny, Escape, Neutralize, Tasks, Swap).

---

## 🎭 Personify & Disarm
**When to use it:** When you notice a recurring, manipulative internal voice trying to convince you to abandon your recovery.

This tool uses Narrative Therapy to create emotional distance from addiction. Build a "Rogue's Gallery" of your addictive urges, record the lies they tell, and disarm them with the truth.

---

## 🎡 Lifestyle Balance (Wheel of Life)
**When to use it:** Weekly or monthly, to check in on your holistic recovery and prevent burnout.

Recovery isn't just about not using; it's about building a life. This tool asks you to rate your satisfaction across 6 categories (Physical, Mental, Relationships, Work, Spiritual, Leisure). 
* **The Flat Tire:** The interactive radar chart will immediately show you the "shape" of your life. If your career is a 10 but your relationships are a 2, your wheel is lopsided. A bumpy ride creates stress, which makes you vulnerable to relapse.

---

## 🌊 Urge Surfer
**When to use it:** When you are in acute crisis, panicking, or physically craving and cannot focus on writing.

A 5-minute interactive grounding timer that uses the 5-4-3-2-1 somatic method to help you regulate your nervous system.

---

## 🔒 Privacy & Saving
Every time you complete a CBT tool (except the Resentment Burner), click **Save to Journal**. 
The app wraps your answers in **Zero-Knowledge Encryption** and saves them to your Journal History. Tools like *Personify* and *Lifestyle Balance* will securely load your previous session so you can update them over time.
""",

    "docs-site/support/changelog.md": r"""
# 🚀 Changelog

### v1.12.0 (The Catharsis Update)
* **New:** **The Resentment Burner:** A secure, ephemeral safe space to vent toxic thoughts. Watch your resentments literally burn away into ash and embers through a hardware-accelerated combustion engine. Zero data is ever saved to the cloud or your device.

### v1.11.0 (The CBT Engine Update)
* **New:** **The Tools Hub:** We've built a centralized directory for interactive recovery exercises, accessible directly from the Dashboard.
* **New:** **Cost Benefit Analysis (CBA):** A beautifully redesigned 4-quadrant interactive grid to help you logically weigh the pros and cons of an urge before acting on it.
* **New:** **ABC Coping Tool:** A guided, step-by-step REBT exercise to help you identify activating events, dispute irrational beliefs, and create effective new coping philosophies.
* **New:** **D.E.N.T.S. Strategy Planner:** A colorful, vertical planning tool to help you pre-plan escape routes and distractions before entering high-risk situations.
* **New:** **Personify & Disarm:** A "Rogue's Gallery" tool leveraging Narrative Therapy. Give your addictive urges a name, record the lies they tell, and disarm them with the truth.
* **New:** **Lifestyle Balance:** An interactive "Wheel of Life" radar chart. Adjust your satisfaction scores across 6 core categories and instantly visualize imbalances in your life that could lead to relapse vulnerability.
* **Security:** **Zero-Knowledge State Rehydration:** We've upgraded the CBT Engine to support ongoing sessions! Tools like the *Personify* gallery and *Lifestyle Balance* chart will automatically (and securely) fetch and decrypt your previous work so you can continue building on it without cluttering your journal history.

### v1.10.0 (The Beacon Update)
* **New:** **Daily Reminders & Milestone Alerts:** You can now opt-in to receive gentle, daily push notifications directly to your device! 
* **Security:** **Zero-Knowledge Push Engine:** Our new notification engine only knows *that* you have tasks to do, never *what* those tasks are.
* **Improvement:** **Dead-Token Pruning:** Added automated database hygiene routines to respect the right-to-be-forgotten.

### v1.9.1 (The Polish Update)
* **Fix:** **Wisdom Log Synchronization:** Resolved an issue where Workbook AI Compass insights were successfully generating but failing to render visually.
* **UX Polish:** **Smart Backup Alerts:** The Dashboard will now intelligently hide the "Manual Backup Needed" warning for users who have Cloud Auto-Sync enabled via Google Drive.

### v1.9.0 (The Content Expansion Update)
* **New:** **Women for Recovery Workbook:** Added a completely new, 8-section specialty workbook focused on self-discovery, emotional awareness, boundaries, and overdose survival reframing.

### v1.8.0 (The Medallion Update)
* **New:** **Monthly Milestones:** Added unique, high-fidelity circular recovery medallions for every month of the first year of sobriety.

### v1.7.0 (The Virality Update)
* **New:** **Milestone Celebrations:** Hitting major clean-time milestones (30 days, 6 months, 1 year) now triggers a celebratory confetti burst on your dashboard and transforms your Sobriety Hero card into a highly shareable badge.

### v1.5.0 (The Supporter Update)
* **New:** **MRT Supporter Tier:** We have officially launched our Premium "Supporter" tier to unlock unlimited AI Deep Dives and PDF Exports.

### v1.0.0 (Initial Launch)
* **Feature:** Initial Public Release with Zero-Knowledge Client-Side Encryption (AES-GCM).
""",

    "docs/specs/18_CBT_ENGINE.md": r"""
# 📐 Feature Spec: The CBT Engine (SMART Tools)

**Status:** Live (v1.12.0)
**Architecture:** Virtual Module (Abstracted Journal Interface) + Render Props
**Primary Code:** `src/components/smart_tools/`

## 1. Overview
The CBT Engine digitizes evidence-based SMART Recovery worksheets into interactive, responsive React components. 

## 2. Technical Architecture

### A. The Virtual Module Storage Strategy
To avoid schema bloat, CBT tools do not have their own Firestore collections. 
* They are saved directly to the `journals` collection.
* **The Payload:** The tool's state is wrapped in a metadata object, passed through `JSON.stringify()`, encrypted via AES-GCM, and stored in the `content` field.
* **Tags:** They are flagged with `['SMART Tool', toolType]` so the `JournalHistory` timeline can render them and the `JournalAnalysisWizard` can read them.

### B. The `SmartToolContainer` (HOC / Render Prop)
A generic wrapper component (`SmartToolContainer<T>`) handles all complex logic, allowing the individual tools to remain pure UI layers.
* **Encryption Gate:** Enforces `isVaultUnlocked`.
* **Session Rehydration:** Accepts a `resumeSession` boolean. If true, it queries the DB on mount for the most recent entry tagged with that tool, decrypts the payload, and hydrates the UI.
* **Idempotent Saves:** Exposes a "Save to Journal" button. If the session was resumed, it triggers `updateJournal` to prevent DB bloat. Otherwise, it triggers `addJournal`.

## 3. Tool Implementations
* **Cost Benefit Analysis (CBA):** A responsive 2x2 Bento Grid using Emerald and Rose tints.
* **ABC Coping Tool:** A sequential, vertical flow (A -> B -> C -> D -> E) designed to map to the cognitive behavioral chain.
* **D.E.N.T.S. Strategy:** An Acronym Vertical Stack with distinct, vibrant background tints for pre-planning escape routes.
* **Personify & Disarm:** A "Rogue's Gallery" card grid leveraging Narrative Therapy to externalize the addictive voice.
* **Lifestyle Balance:** An interactive "Wheel of Life" radar chart (powered by `recharts`) that maps 6 core life categories to geometric shapes, immediately highlighting holistic imbalances.
* **The Resentment Burner:** An ephemeral journaling tool featuring a layer-based SVG combustion engine. **Crucial Difference:** This tool explicitly bypasses `SmartToolContainer` and Firestore entirely to guarantee absolute zero-knowledge data destruction upon execution.

## 4. Routing
* **Tools Hub (`/tools`):** A centralized directory routing to all cognitive behavioral tools and ephemeral grounding exercises.
""",

    "docs/ROADMAP.md": r"""
# 🗺️ MRT Product Roadmap: "Forged in Fire"

## 📅 Q4 2026: The Road to 5,000 (Active)
| Status | ID | Project Name | Persona Focus | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition & Scaling strategy. |
| 🟢 **Done** | `PROJ-28` | **The Resentment Burner** | David | Ephemeral cathartic journaling tool with a hardware-accelerated SVG combustion engine. |
| 🟢 **Done** | `PROJ-27` | **The CBT Engine** | Ned / Walt | Migrate legacy SMART Recovery tools to TS/Tailwind v4 with Zero-Knowledge auto-save integration. |
| 🟢 **Done** | `PROJ-07` | **The Launch Engine** | All | TWA Android Wrapper (Play Store Prep). |
| 🟢 **Done** | `PROJ-24` | **The Asset Engine** | Admin | Centralized Typed Asset Dictionary & Medallion Pipeline. |
| 🟢 **Done** | `PROJ-26` | **The Beacon** | All | Firebase Cloud Messaging, push notifications, and PWA permission flows for retention. |
| ⚪ Planned | `PROJ-25` | **The Daily Oracle** | Walt / Ned | Daily prompted recovery reflections and journaling guides. |
| ⚪ Planned | `PROJ-22` | **Insights Stats** | Walt | Data visualization tab within the Insights module. |
| ⚪ Planned | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI and user metrics. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright). |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. |
""",

    "docs/SPRINT_BOARD.md": r"""
# 🏃 Active Sprint Board

**Current Phase:** Sprint 8.0 (The Road to 5,000)

## ✅ Completed Sprints
- [x] **Sprint 8.3:** Content Expansion. Integrated "Women for Recovery".
- [x] **Sprint 8.4:** The Polish Update. Implemented PROJ-26 The Beacon.
- [x] **Sprint 8.5:** The CBT Engine. Built the Tools Hub, Zero-Knowledge Rehydration, and 5 interactive SMART tools (CBA, ABC, DENTS, Personify, Lifestyle).
- [x] **Sprint 8.6:** The Ephemeral Update. Built PROJ-28 The Resentment Burner with an SVG combustion engine and notebook UI.

## 🟡 Sprint 8.0: The Road to 5,000 (Active)
- [ ] **Admin:** Receive $50,000 funding tranche.
- [ ] **PROJ-07:** Finalize Android App Store deployment (Asset Links, Play Console compliance).

## 🧊 Product Backlog (Future Epics)

### Core Product Enhancements
- [ ] **PROJ-29: The Sponsor Passport (Selective Dashboard Sharing)** * *Target:* Ned & Lisa / Network Growth. 
  * *Scope:* A secure, time-boxed read-only view of a user's Vitality and Streak dashboard to share with sponsors. Generates organic B2B/Network viral growth.
- [ ] **PROJ-30: Predictive Trigger Heatmapping (AI Compass Upgrade)** * *Target:* Walt / Long-Term Insight. 
  * *Scope:* Upgrade the AI layer to correlate time-of-day, day-of-week, and Vitality deficits with low mood scores to predict relapse risk before it happens.
- [ ] **PROJ-31: The Amends Workshop (Step 8 & 9 Assistant)** * *Target:* Lisa & Walt / Mid-to-Late Stage. 
  * *Scope:* A dedicated sandbox for drafting apologies with an AI "Tone Checker" to ensure accountability without slipping into defensiveness or expectations.
"""
}

def sync_docs():
    os.makedirs("scripts", exist_ok=True)
    
    for path, content in FILES.items():
        # Safely un-escape markdown code blocks
        safe_content = content.replace('__FENCE__', FENCE)
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        with open(path, "w", encoding="utf-8") as f:
            f.write(safe_content.strip() + "\n")
            
        print(f"✅ Synced: {path}")

if __name__ == "__main__":
    sync_docs()
    print("\n🚀 Documentation Audit & Sync Complete.")