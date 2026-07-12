# 🗺️ MRT Product Roadmap: "The 4 Waves"

**Methodology:** Strategic Waves (Prioritizing User Acquisition & Retention)

## 🌊 Wave 1: Acquisition & Friction (Weeks 1–6)
*The immediate goal: Stop users from abandoning the app on Day 1 by removing the "Security Tax."*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ✅ **Shipped** | `PROJ-41` | **The Dynamic Anchor** | David / Ned | A slim, frictionless, 3-column Quick Action Bar replacing the static daily pledge. |
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
| ⚪ Planned | `PROJ-33` | **Predictive Relapse Engine** | Walt / Lisa | AI analysis of Insights collection to generate proactive warning tasks. |
| ⚪ Planned | `PROJ-34` | **Aggregated Stats Engine** | Admin | Cloud Functions to calculate stats on-write to reduce Firestore read costs. |

## 🌊 Wave 4: Enterprise & Ecosystem (Weeks 27–52)
*The final goal: Defensible technical moats and B2B expansion.*

| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-30` | **Data Sovereignty Engine** | Walt | Formalize the local decryption and structured export (JSON/PDF) protocol. |
| ⚪ Planned | `PROJ-37` | **Secure Handshake Protocol** | Lisa | Local QR-code generation to share encrypted 4th-step inventory directly to a sponsor. |

## ✅ RECENTLY SHIPPED
* `PROJ-60` God File Decomposition — Vitality & Data Management (Split Vitality.tsx and DataManagement.tsx along independent concerns, isolating account deletion and fixing a ZK plaintext-write bug in Vitality journal saves.)
* `PROJ-59` Data Access Layer Consolidation (Consolidated Firestore data-access layer onto TanStack Query: fixed two stale-cache bugs, extracted a shared query/mutation factory, migrated all raw CRUD call sites.)
* `PROJ-58` Profile UX Remediation (Unified three incompatible save models into one autosave pattern; fixed a TanStack Query bypass that could desync Dashboard badges after a Profile save; restyled the vault-reset confirmation into a Headless UI dialog; made Security/Data tabs deep-linkable routes; cause-specific import-failure messages; distinct partial-failure state for the displayName auth sync; 44px touch targets)
* `PROJ-57` Journal Template Modality Expansion (Default journal template picker expanded from 4 Twelve-Step-only templates to 15 templates across 11 recovery modalities — CBT/SMART, DBT, Mindfulness, Harm Reduction, Reset, Trauma-Informed, ACT, Motivational, MAT, General — grouped by modality; new templates render as guided multi-prompt forms reusing the existing custom-template rendering path)
* `PROJ-55` Workbook Remediation (Real, step-specific content for 12-Step Steps 2-11 with unique literature-grounded contexts; migrated Workbook pages off direct Firestore calls onto a TanStack Query hook; fixed a fragile decryption heuristic; removed orphaned data module; dynamic gamification denominator)
* `PROJ-50` Guided CBT/REBT Interactive Workflows (Step-locked guided flows for ABCDE, CBA, and DENTS Scenario Mode; new Thought Record and Five Questions tools; AI coaching prompts; Tools Hub redesign with Start Fresh/Resume/History entry points and completion tracking)
* `PROJ-54` Journal Insights Momentum UI Redesign (GlassCard, dark theme, smooth charts, and typography upgrade)
* `PROJ-53` ROSC Matrix Visual Upgrade (Pill Capsules) (Animated segmented pill visualization, glassmorphic dark theme, replacing the Recharts radar chart)
* `PROJ-49` The Recovery Capital (ROSC) Matrix (Monthly SAMHSA domain assessment, Recharts radar chart with longitudinal overlay, ZK-encrypted AI narrative, free-tier self-report scores)
* `PROJ-47` The Ledger — Precision, Resilience & Tab Redesign (Monthly day-drift fix, grace window, missedCountHistory, Today/Later/Log tabs)
* `PROJ-48` User Guide Synchronization Sprint (Daily Readings page, Dynamic Anchor, Voice-to-Vault, Recurrence Table, Smart Reset expansion)
* `PROJ-46` The Ledger — Frictionless Task Module Upgrade (Swipe Gestures, Quick Capture, Rhythm Score, AI Context Cards)
* `PROJ-42` Daily Readings Engine (Multi-Modality Content)
* `PROJ-41` The Dynamic Anchor (Circadian Companion Widget)
* `PROJ-40` Test Suite Audit (Vitest Pipeline Overhaul)
* `PROJ-39` Deferred Vault Lock (Frictionless Onboarding)
* `PROJ-31` Crypto Chunking Pipeline (Zero-Knowledge Scaling)
* `PROJ-19` The Landing Page (Vibrant Momentum & Persona Showcase)
* `PROJ-24` The Asset Engine (Strict-Typed Image Dictionary)
* `PROJ-18` Command Center (AI Telemetry Dashboard & SRE Rate Limiting)
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
