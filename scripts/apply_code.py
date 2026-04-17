import os

FENCE = chr(96) * 3

patches = [
    # Remove from Priority 2
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.).""",
        "new_block": r"""- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.)."""
    },
    # Remove from Chores
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07).""",
        "new_block": r"""- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07)."""
    },
    # Add to Resolved
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## ✅ Resolved This Cycle
- [x] **[HOTFIX]** Push Notification Engine -> *Resolved PWA routing and timezone boundary bugs in `dailyBeacon` function (v1.1.7).*""",
        "new_block": r"""## ✅ Resolved This Cycle
- [x] **[SRE]** PROJ-18: Admin Telemetry -> *Deployed `/admin/telemetry` with bounded 30-day Firestore queries and Recharts token burn visualization (v1.1.8).*
- [x] **[SRE]** API Rate Limiting -> *Injected optimistic UI lock into `useRateLimits.ts` to prevent race-condition API spam.*
- [x] **[HOTFIX]** Push Notification Engine -> *Resolved PWA routing and timezone boundary bugs in `dailyBeacon` function (v1.1.7).*"""
    },
    # Remove PROJ-18 from ROADMAP NOW section
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-18` | **Command Center** | Admin | Desktop-Optimized Admin Analytics for AI cost metrics and user flow telemetry. |
| 🟡 **Active** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. |""",
        "new_block": r"""| 🟡 **Active** | `PROJ-19` | **Road to 5,000** | CEO | 6-month User Acquisition strategy. Includes Landing Page overhaul & PWA caching fixes. |
| 🟡 **Active** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. |"""
    },
    # Add PROJ-18 to ROADMAP RECENTLY SHIPPED
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""## ✅ RECENTLY SHIPPED
* `[UX]` Global Actionable Toasts (Sonner Provider Architecture)""",
        "new_block": r"""## ✅ RECENTLY SHIPPED
* `PROJ-18` Command Center (AI Telemetry Dashboard & SRE Rate Limiting)
* `[UX]` Global Actionable Toasts (Sonner Provider Architecture)"""
    }
]

def safe_update_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""## [v1.1.8] - 2026-04-17
### 📊 Admin & SRE (Runway Protection)
- **Feature [PROJ-18]:** Deployed the Command Center Telemetry Dashboard (`/admin/telemetry`). Provides real-time visual analytics of Gemini API token burn and model distribution (Flash vs Pro) utilizing Recharts.
- **SRE Update:** Upgraded the `useRateLimits` hook with an optimistic UI lock to strictly prevent API race conditions from free-tier users spam-clicking analysis actions.

"""
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Find the line index of the main header
        header_index = -1
        for i, line in enumerate(lines):
            if line.strip().startswith("# 🚀 Changelog"):
                header_index = i
                break
                
        if header_index != -1:
            # Check if we already inserted it to avoid duplicates
            if not any("## [v1.1.8]" in line for line in lines):
                lines.insert(header_index + 1, "\n" + new_entry)
                with open(changelog_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                print(f"✅ Safely prepended v1.1.8 to: {changelog_path}")
            else:
                print(f"ℹ️ v1.1.8 already exists in {changelog_path}")
        else:
            print(f"⚠️ Could not find '# 🚀 Changelog' header in {changelog_path}. Skipping append.")
    else:
        print(f"⚠️ {changelog_path} does not exist. Skipping append.")

def apply_patches():
    print(f"[{FENCE}] Initiating Master Close & Audit Sync [{FENCE}]")
    
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
            
    safe_update_changelog()
    print("\n🚀 Project Boards and Logs Synchronized. Ready for PR.")

if __name__ == "__main__":
    apply_patches()