import os

FENCE = chr(96) * 3

patches = [
    # 1. Clear from Active Projects
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.).""",
        "new_block": r"""## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic."""
    },
    # 2. Add to Resolved This Cycle
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## ✅ Resolved This Cycle
- [x] **[DEVOPS]** Docs Architecture -> *Migrated VitePress documentation to `docs.myrecoverytoolkit.ca` via GitHub Pages custom domain routing (v1.1.9).*""",
        "new_block": r"""## ✅ Resolved This Cycle
- [x] **[COMPLIANCE]** Fellowship Routing -> *Injected 'Find a Meeting' locators into SOSModal and overhauled Workbooks tab into a Fellowship Directory (v1.1.10).*
- [x] **[DEVOPS]** Docs Architecture -> *Migrated VitePress documentation to `docs.myrecoverytoolkit.ca` via GitHub Pages custom domain routing (v1.1.9).*"""
    },
    # 3. Update the Workbooks Spec
    {
        "filepath": "docs/specs/04_WORKBOOKS.md",
        "old_block": r"""* **Literature Tab:** A placeholder for upcoming classic reading materials and daily meditations.""",
        "new_block": r"""* **Fellowships Tab:** A dedicated directory featuring outbound links to official websites and core literature for major recovery modalities (AA, NA, SMART, Recovery Dharma, WFS)."""
    }
]

def safe_update_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""## [v1.1.10] - 2026-04-20
### ⚖️ Compliance & Resources
- **Lifeline:** Added a progressive-disclosure "Find a Meeting" locator to the SOS Modal for urgent crisis support.
- **Library:** Transformed the Workbooks 'Literature' tab into a comprehensive 'Fellowships' directory with direct links to official websites and core literature (AA, NA, SMART, Recovery Dharma, WFS).
- **Security:** Enforced `noopener noreferrer` boundary on all outbound links to prevent tab-nabbing.

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
            if not any("## [v1.1.10]" in line for line in lines):
                lines.insert(header_index + 1, "\n" + new_entry)
                with open(changelog_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                print(f"✅ Safely prepended v1.1.10 to: {changelog_path}")
            else:
                print(f"ℹ️ v1.1.10 already exists in {changelog_path}")
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
    print("\n🚀 Project Boards and Specs Synchronized. Ready for PR.")

if __name__ == "__main__":
    apply_patches()