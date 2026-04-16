import os

# FENCE pattern to protect markdown code blocks during generation
FENCE = chr(96) * 3

patches = [
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""# 🏃 Active Development Cycle

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
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07).

## ✅ Resolved This Cycle""",
        "new_block": r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W16
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage.
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.).

## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07).

## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*"""
    },
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-32` | **Viral Export Engine** | Ned | Secure Milestone Share Cards combining clean time and non-sensitive AI insights. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |""",
        "new_block": r"""| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |"""
    },
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""## ✅ RECENTLY SHIPPED
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)""",
        "new_block": r"""## ✅ RECENTLY SHIPPED
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)"""
    }
]

def append_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""# 🚀 Changelog

## [v1.1.4] - 2026-04-15
### Added & Upgraded (Viral Export Engine)
- **Feature (PROJ-32):** Launched the completed Viral Export Engine! The `SobrietyHero` milestone cards now securely query your latest abstract AI insight and inject it into your shareable image alongside your clean-time gamification stats. 
- **Security:** Zero-Knowledge compliance strictly maintained. The export engine automatically buffers the UI to prevent unencrypted DOM flashes and only shares high-level thematic insights, protecting raw journal data.

"""
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Prevent double-appending
        if "## [v1.1.4]" not in content:
            content = content.replace("# 🚀 Changelog\n", new_entry)
            with open(changelog_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Successfully appended v1.1.4 to: {changelog_path}")
        else:
            print(f"ℹ️ v1.1.4 already exists in {changelog_path}")
    else:
        # Create it if it doesn't exist to ensure the script doesn't fail
        os.makedirs(os.path.dirname(changelog_path), exist_ok=True)
        with open(changelog_path, 'w', encoding='utf-8') as f:
            f.write(new_entry)
        print(f"✅ Created and appended v1.1.4 to: {changelog_path}")

def apply_patches():
    print(f"[{FENCE}] Initiating Cycle 2026-W16 State Synchronization [{FENCE}]")
    
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
    print("\n🚀 Cycle 2026-W15 Closed. Active Cycle promoted to W16.")

if __name__ == "__main__":
    apply_patches()