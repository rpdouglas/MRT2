import os

# FENCE pattern to protect markdown code blocks during generation
FENCE = chr(96) * 3

patches = [
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## 🧹 Chores & Tech Debt
- [ ] **[UX]** Journal Insights: Add confirmation toast/modal when adding an AI insight to tasks (Triage Report 4/16).
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07).""",
        "new_block": r"""## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.
- [ ] **[SRE]** Verify Gemini Rate Limiting logic (`useRateLimits.ts`) blocks excessive API calls for Free Tier.
- [ ] **[DEVOPS]** Generate `/.well-known/assetlinks.json` for TWA Play Store Verification (PROJ-07)."""
    },
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*
- [x] **[BILLING]** Stripe Integration -> *Deployed Firestore trigger to provision premium JWT claims upon successful checkout.*""",
        "new_block": r"""## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*
- [x] **[BILLING]** Stripe Integration -> *Deployed Firestore trigger to provision premium JWT claims upon successful checkout.*
- [x] **[UX]** Global Actionable Toasts -> *Implemented non-blocking `sonner` notifications for AI task ingestion.*"""
    },
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""## ✅ RECENTLY SHIPPED
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)""",
        "new_block": r"""## ✅ RECENTLY SHIPPED
* `[UX]` Global Actionable Toasts (Sonner Provider Architecture)
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)"""
    }
]

def append_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""# 🚀 Changelog

## [v1.1.6] - 2026-04-16
### UX/UI Refinements (Quality of Life)
- **Feature [UX]:** Introduced a modern, non-blocking global toast notification system utilizing `sonner`.
- **Workflow Improvement:** Converting an AI Insight from the Journal History or Workbooks into a tracked task now triggers an actionable toast, allowing users to rapidly batch-add tasks or navigate directly to their Task Ledger with a single click.

"""
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Prevent double-appending
        if "## [v1.1.6]" not in content:
            content = content.replace("# 🚀 Changelog\n", new_entry)
            with open(changelog_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Successfully appended v1.1.6 to: {changelog_path}")
        else:
            print(f"ℹ️ v1.1.6 already exists in {changelog_path}")
    else:
        # Fallback if the file doesn't exist
        os.makedirs(os.path.dirname(changelog_path), exist_ok=True)
        with open(changelog_path, 'w', encoding='utf-8') as f:
            f.write(new_entry)
        print(f"✅ Created and appended v1.1.6 to: {changelog_path}")

def apply_patches():
    print(f"[{FENCE}] Initiating Cycle State Synchronization for UX Toast Launch [{FENCE}]")
    
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
    print("\n🚀 Cycle Boards Updated. v1.1.6 is ready for PR.")

if __name__ == "__main__":
    apply_patches()