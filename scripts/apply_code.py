import os

# FENCE pattern to protect markdown code blocks during generation
FENCE = chr(96) * 3

patches = [
    {
        "filepath": "docs/specs/08_ADMIN.md",
        "old_block": r"""### B. User Directory
* **Source:** `users` collection.
* **Feature:** Searchable list of all users. Allows toggling the `role` field.""",
        "new_block": r"""### B. Friends Directory (formerly User Directory)
* **Source:** `users` collection.
* **Feature:** Searchable list of all friends on the platform. Allows toggling the `role` field. (Note: The UI displays 'Friends' to align with fellowship traditions, while the database retains the 'users' collection structure)."""
    },
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W14
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[UX]** Rename global variables/UI text from "Users" to "Friends" (Peer-to-peer alignment).

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage and user flow (Recharts already integrated).
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) and Recovery Community Centers (RCCs) for employment/training resources in Workbooks hub.

## 🧹 Chores & Tech Debt
- [x] Increase Nav Icon sizes by 25% (Accessibility) -> *Scoped to the main MRT Logo to preserve flexbox layouts.*
- [x] Fix Nav Logo white background issue.
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07).""",
        "new_block": r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W15
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-32:** Viral Export Engine (Secure Milestone Share Cards).
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage.
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.).

## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07)."""
    },
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |
| 🟡 **Active** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. |

## 🟡 NEXT (Up Next)
*Fully scoped projects awaiting engineering bandwidth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |
| ⚪ Planned | `PROJ-32` | **Viral Export Engine** | Ned | Secure Milestone Share Cards combining clean time and non-sensitive AI insights. |""",
        "new_block": r"""| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-32` | **Viral Export Engine** | Ned | Secure Milestone Share Cards combining clean time and non-sensitive AI insights. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |
| 🟡 **Active** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. |

## 🟡 NEXT (Up Next)
*Fully scoped projects awaiting engineering bandwidth.*
| Status | ID | Project Name | Persona | Description |
| :--- | :--- | :--- | :--- | :--- |"""
    }
]

def append_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""# 🚀 Changelog

## [v1.1.3] - 2026-04-15
### Added & Upgraded (The Fellowship Alignment)
- **UX Alignment:** Codebase-wide sweep renaming "Users" to "Friends" in the presentation layer (e.g., `FriendsDirectory.tsx`) to better align with peer-to-peer 12-step fellowship traditions, while safely preserving underlying database architecture.
- **SRE & Prompt Infrastructure:** Upgraded the internal Prompt Engineering ecosystem to v4.2, introducing strict AST/Targeted Patching to prevent context hallucinations and full-file overwrite regressions.
- **Governance Update:** Realigned the Master Plan and Roadmap to target the "Road to 5,000" KPI, specifically prioritizing the Viral Export Engine (PROJ-32) and Play Store TWA deployment (PROJ-07).

"""
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Prevent double-appending
        if "## [v1.1.3]" not in content:
            content = content.replace("# 🚀 Changelog\n", new_entry)
            with open(changelog_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Successfully appended v1.1.3 to: {changelog_path}")
        else:
            print(f"ℹ️ v1.1.3 already exists in {changelog_path}")

def apply_patches():
    print(f"[{FENCE}] Initiating Cycle 2026-W15 State Synchronization [{FENCE}]")
    
    for patch in patches:
        filepath = patch["filepath"]
        if not os.path.exists(filepath):
            print(f"⚠️ Warning: File not found: {filepath}")
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if patch["old_block"] in content:
            new_content = content.replace(patch["old_block"], patch["new_block"])
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Successfully patched: {filepath}")
        else:
            print(f"⚠️ Warning: Target block not found in {filepath}. It may have already been updated.")
            
    append_changelog()
    print("\n🚀 Cycle 2026-W14 Closed. Active Cycle promoted to W15.")

if __name__ == "__main__":
    apply_patches()