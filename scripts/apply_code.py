import os

FENCE = chr(96) * 3

patches = [
    # Clear Priority 1 Triage
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.""",
        "new_block": r"""## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
*(Queue Empty)*"""
    },
    # Add to Resolved
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## ✅ Resolved This Cycle
- [x] **[SRE]** PROJ-18: Admin Telemetry -> *Deployed `/admin/telemetry` with bounded 30-day Firestore queries and Recharts token burn visualization (v1.1.8).*""",
        "new_block": r"""## ✅ Resolved This Cycle
- [x] **[DEVOPS]** Docs Architecture -> *Migrated VitePress documentation to `docs.myrecoverytoolkit.ca` via GitHub Pages custom domain routing (v1.1.9).*
- [x] **[SRE]** PROJ-18: Admin Telemetry -> *Deployed `/admin/telemetry` with bounded 30-day Firestore queries and Recharts token burn visualization (v1.1.8).*"""
    }
]

def safe_update_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""## [v1.1.9] - 2026-04-19
### 🛠️ Infrastructure & Routing
- **DevOps:** Successfully migrated the MRT documentation hub to a dedicated custom domain (`docs.myrecoverytoolkit.ca`) using GitHub Pages CNAME routing. This fully isolates the documentation Service Worker from the main PWA caching engine.

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
            if not any("## [v1.1.9]" in line for line in lines):
                lines.insert(header_index + 1, "\n" + new_entry)
                with open(changelog_path, 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                print(f"✅ Safely prepended v1.1.9 to: {changelog_path}")
            else:
                print(f"ℹ️ v1.1.9 already exists in {changelog_path}")
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