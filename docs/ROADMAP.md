# 🗺️ MRT Product Roadmap: "The 4 Waves"

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
