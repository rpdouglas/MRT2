import os

FENCE = chr(96) * 3

active_cycle_content = r"""# 🏃 Active Development Cycle

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
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) and Recovery Community Centers (RCCs) for employment/training resources in Workbooks hub (Recovery Capital integration).

## 🧹 Chores & Tech Debt
- [ ] Increase Nav Icon sizes by 25% (Accessibility).
- [ ] Fix Nav Logo white background issue.
- [ ] Wire up Changelog Beacon alert in Dashboard.
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState` and `<form action={...}>`.
"""

roadmap_content = r"""# 🗺️ MRT Product Roadmap: "Continuous Momentum"

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
| ⚪ Planned | `PROJ-29` | **Enterprise DevOps** | Admin | Migrate GitHub Actions to OpenID Connect (OIDC) keyless authentication and enforce SHA-pinning for supply chain security. |

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

def write_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.replace('```', FENCE))
    print(f"Successfully updated: {filepath}")

if __name__ == "__main__":
    write_file("docs/ACTIVE_CYCLE.md", active_cycle_content)
    write_file("docs/ROADMAP.md", roadmap_content)