import os

# FENCE pattern to protect markdown code blocks during generation
FENCE = chr(96) * 3

patches = [
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage.
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.).""",
        "new_block": r"""## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.)."""
    },
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*""",
        "new_block": r"""## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*
- [x] **[BILLING]** Stripe Integration -> *Deployed Firestore trigger to provision premium JWT claims upon successful checkout.*"""
    },
    {
        "filepath": "docs/ROADMAP.md",
        "old_block": r"""## ✅ RECENTLY SHIPPED
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)""",
        "new_block": r"""## ✅ RECENTLY SHIPPED
* `[BILLING]` Stripe Webhook & Premium Provisioning Pipeline
* `PROJ-32` The Viral Export Engine (AI Insight Milestone Cards)
* `PROJ-28` The Resentment Burner (SVG Combustion Engine)"""
    }
]

def append_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""# 🚀 Changelog

## [v1.1.5] - 2026-04-16
### Added & Upgraded (Monetization Engine)
- **Feature [BILLING]:** MRT is now fully monetized! Implemented the backend Stripe synchronization pipeline.
- **Infrastructure:** Configured Eventarc and 2nd-gen Cloud Functions to listen for Firebase Stripe Extension events, automatically upgrading users to the `premium` tier and generating secure Firebase Auth JWT custom claims without requiring manual developer intervention.

"""
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Prevent double-appending
        if "## [v1.1.5]" not in content:
            content = content.replace("# 🚀 Changelog\n", new_entry)
            with open(changelog_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Successfully appended v1.1.5 to: {changelog_path}")
        else:
            print(f"ℹ️ v1.1.5 already exists in {changelog_path}")
    else:
        os.makedirs(os.path.dirname(changelog_path), exist_ok=True)
        with open(changelog_path, 'w', encoding='utf-8') as f:
            f.write(new_entry)
        print(f"✅ Created and appended v1.1.5 to: {changelog_path}")

def apply_patches():
    print(f"[{FENCE}] Initiating Cycle State Synchronization for Billing Launch [{FENCE}]")
    
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
    print("\n🚀 Cycle Boards Updated. v1.1.5 is ready for PR.")

if __name__ == "__main__":
    apply_patches()