import os

FENCE = chr(96) * 3

def write_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Generated: {filepath}")

def rebuild_governance():
    print(f"[{FENCE}] Initiating Governance Restructure (The 4 Waves) [{FENCE}]")

    # -------------------------------------------------------------------------
    # 1. BUSINESS_OPS.md (Replaces MASTER_PLAN.md)
    # -------------------------------------------------------------------------
    business_ops_content = r"""# 🏢 Business Operations & Scaling (PROJ-19)

**Focus:** Non-software tasks required to reach 5,000 users.

## 📋 The "Road to 5,000" Strategy
1. **Capital Allocation:** How much of the $50k goes to paid acquisition (TikTok/Reddit Ads) vs. operations (servers, APIs, legal).
2. **Viral Loops:** Leveraging the newly built "Sobriety Hero Watermark" to drive organic social sharing.
3. **Frictionless Onboarding:** Continuously monitoring the drop-off rate between `/login` and `/dashboard`.

## 🏃 Immediate Administrative Action Items
- [ ] Open Corporate Bank Account.
- [ ] Secure incoming capital transfer.
- [ ] Acquire DUNS Number to unblock Google Play Developer Account creation.
- [ ] Procure Cyber Liability Insurance (Crucial before onboarding 5,000 users).
- [ ] Procure Professional Liability (E&O) Insurance.
- [ ] Schedule Legal Review of `TERMS_OF_SERVICE.md` and `PRIVACY_POLICY.md` for Canadian/US compliance.
"""
    write_file("docs/BUSINESS_OPS.md", business_ops_content)

    # Clean up the old MASTER_PLAN.md to prevent AI confusion
    if os.path.exists("docs/MASTER_PLAN.md"):
        os.remove("docs/MASTER_PLAN.md")
        print("🗑️ Removed deprecated: docs/MASTER_PLAN.md")

    # -------------------------------------------------------------------------
    # 2. ROADMAP.md (The Unified Master Plan - 4 Waves)
    # -------------------------------------------------------------------------
    roadmap_content = r"""# 🗺️ MRT Product Roadmap: "The 4 Waves"

**Methodology:** Strategic Waves (Prioritizing User Acquisition & Retention)

## 🌊 Wave 1: Acquisition & Friction (Weeks 1–6)
*The immediate goal: Stop users from abandoning the app on Day 1 by removing the "Security Tax."*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Queued** | `NEW` | **Deferred Vault Lock** | David | Allow "Skip PIN initially" during onboarding. Let users experience the app before forcing Zero-Knowledge setup. |
| 🟡 **Queued** | `NEW` | **The Daily Pledge** | David / Ned | A simple, unencrypted daily check-in to build habit loops instantly. |
| 🟡 **Queued** | `NEW` | **Changelog Beacon** | All | Keep users informed of rapid updates without modal fatigue. |
| ⛔ **Blocked** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. (Waiting on DUNS). |

## 🌊 Wave 2: Retention & Community (Weeks 7–16)
*The secondary goal: Keep users past Day 30 through peer support and shame-free resets.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `NEW` | **Privacy-Preserving Community** | All | Opt-in, pseudonymized social feed moderated by Gemini. (Requires heavy Zero-Knowledge schema design). |
| ⚪ Planned | `PROJ-35` | **The Autopsy Engine** | David | A shame-free CBT reset flow that captures triggers immediately following a relapse. |
| ⚪ Planned | `NEW` | **Multi-Addiction Clocks** | All | Tracking multiple habits/substances simultaneously. |

## 🌊 Wave 3: Platform Maturity & Sponsors (Weeks 17–26)
*The third goal: Capture the "Lisa" (Sponsor) and "Walt" (Long-term) demographics.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⏸️ **Paused** | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. (Paused to focus on Wave 1 Onboarding). |
| ⏸️ **Paused** | `PROJ-31` | **Crypto Chunking Pipeline** | Admin | Refactor PIN rotation to handle 10,000+ encrypted documents via background chunking. |
| ⚪ Planned | `PROJ-33` | **Predictive Relapse Engine** | Walt / Lisa | AI analysis of Insights collection to generate proactive warning tasks. |
| ⚪ Planned | `PROJ-34` | **Aggregated Stats Engine** | Admin | Cloud Functions to calculate stats on-write to reduce Firestore read costs. |

## 🌊 Wave 4: Enterprise & Ecosystem (Weeks 27–52)
*The final goal: Defensible technical moats and B2B expansion.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-30` | **Data Sovereignty Engine** | Walt | Formalize the local decryption and structured export (JSON/PDF) protocol. |
| ⚪ Planned | `PROJ-37` | **Secure Handshake Protocol** | Lisa | Local QR-code generation to share encrypted 4th-step inventory directly to a sponsor. |

## ✅ RECENTLY SHIPPED
* `PROJ-19` The Landing Page (Vibrant Momentum & Persona Showcase)
* `PROJ-24` The Asset Engine (Strict-Typed Image Dictionary)
* `PROJ-18` Command Center (AI Telemetry Dashboard & SRE Rate Limiting)
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
"""
    write_file("docs/ROADMAP.md", roadmap_content)

    # -------------------------------------------------------------------------
    # 3. BACKLOG.md (The Persona Icebox)
    # -------------------------------------------------------------------------
    backlog_content = r"""# 🧊 Feature Backlog (The Persona Icebox)

**Storage:** Ideas and feature requests that are approved but deferred. Tagged by Persona to ensure we are building for specific psychological needs, not just adding features.

## 👤 David (The User in Crisis)
* **Feature:** Harm Reduction Mode.
  * **Concept:** A toggle that shifts the app's language from "Abstinence" to "Management" (e.g., tracking drinks per week instead of days since last drink).
  * **Status:** Deferred to post-Wave 2.
* **Feature:** Clinical Telehealth Off-Ramps (MAT Resources).
  * **Concept:** Direct links to Medication-Assisted Treatment if the SOS button is pressed multiple times.

## 👤 Ned (The Pink Cloud)
* **Feature:** "90 in 90" Meeting Tracker & Friend Challenges (PROJ-21).
  * **Concept:** Gamified attendance tracking.
  * **Complexity:** High (Requires secure multiplayer networking). Deferred to 5,000 user milestone.
* **Feature:** Sleep Log / Wearable Integration.
  * **Concept:** Apple HealthKit API integration to correlate sleep debt with cravings.
  * **Complexity:** Extremely High. Deferred to Wave 4.

## 👤 Lisa (The Service Superstar)
* **Feature:** Accountability Partner Mode.
  * **Concept:** A read-only "Listener" view where a sponsor can see a sponsee's clean time and public mood graph (without seeing encrypted journal entries).

## 👤 Walt (The Zen Master)
* **Feature:** Photo Attachments in Journal.
  * **Complexity:** High (Requires Blob -> ArrayBuffer -> AES-GCM -> Base64). Deferred indefinitely.
"""
    write_file("docs/BACKLOG.md", backlog_content)

    print(f"\n🚀 Governance documentation successfully restructured.")

if __name__ == "__main__":
    rebuild_governance()