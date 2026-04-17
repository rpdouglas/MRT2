# 🗺️ MRT Product Roadmap: "Continuous Momentum"

**Methodology:** Lean (Now / Next / Later)

## 🟢 NOW (Active Cycle Focus)
*Projects currently in active development and unblocking growth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. |

## 🟡 NEXT (Up Next)
*Fully scoped projects awaiting engineering bandwidth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-34` | **Aggregated Stats Engine** | Admin | Cloud Functions to calculate stats on-write to reduce Firestore read costs at 10k+ scale. |
| ⚪ Planned | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. (Elevated to unblock Sponsor viral loop). |
| ⚪ Planned | `PROJ-31` | **Crypto Chunking Pipeline** | Admin | Refactor PIN rotation to handle 10,000+ encrypted documents via background chunking to prevent UI thread lock. (Prerequisite for Data Sovereignty). |
| ⚪ Planned | `PROJ-25` | **The Daily Oracle** | Walt / Ned | Daily prompted journaling templates & aggregated daily reflections (Vague 12-step, Dharma, Stoic). |
| ⚪ Planned | `PROJ-29` | **Enterprise DevOps** | Admin | Migrate GitHub Actions to OpenID Connect (OIDC) keyless authentication and enforce SHA-pinning for supply chain security. |
| ⚪ Planned | `PROJ-30` | **Data Sovereignty Engine** | Walt | Formalize the local decryption and structured export (JSON/PDF) protocol for legacy users. |

## ⚪ LATER (Strategic Epics)
*Approved concepts requiring further technical scoping.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-33` | **Predictive Relapse Engine** | Walt/Lisa | System that analyzes the Insights collection to generate proactive warning tasks based on historical emotional velocity. |
| ⚪ Planned | `PROJ-22` | **Insights Stats** | Walt | Data visualization tab within the Insights module. |
| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright) for scaling safety. |

## ✅ RECENTLY SHIPPED
* `PROJ-18` Command Center (AI Telemetry Dashboard & SRE Rate Limiting)
* `[UX]` Global Actionable Toasts (Sonner Provider Architecture)
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)
* `PROJ-27` The CBT Engine (SMART Tools integration)
* `PROJ-26` The Beacon (Push Notifications)
