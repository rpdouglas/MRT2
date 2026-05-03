import os

FENCE = chr(96) * 3

def sync_docs():
    # 1. Update Roadmap (Promotion to Shipped)
    with open('docs/ROADMAP.md', 'r') as f:
        roadmap = f.read()
    
    new_shipped = "* `PROJ-42` Daily Readings Engine (Multi-Modality Content)\n* `PROJ-41` The Dynamic Anchor (Circadian Companion Widget)"
    roadmap = roadmap.replace('## ✅ RECENTLY SHIPPED', f'## ✅ RECENTLY SHIPPED\n{new_shipped}')
    
    with open('docs/ROADMAP.md', 'w') as f:
        f.write(roadmap)

    # 2. Update Dashboard Spec (Anchor & Reading Integration)
    with open('docs/specs/11_DASHBOARD.md', 'r') as f:
        spec = f.read()
    
    spec_update = """## 2. Integrated Components
* **Dynamic Anchor:** A time-aware Quick Action bar (Morning/Afternoon/Evening/Night).
* **Daily Reading Card:** Rotates content based on modality preferences (AA, NA, Dharma, etc.)."""
    
    with open('docs/specs/11_DASHBOARD.md', 'w') as f:
        f.write(spec + "\n" + spec_update)

    # 3. Update Changelog (Safe Prepend)
    changelog_path = 'docs-site/support/changelog.md'
    with open(changelog_path, 'r') as f:
        lines = f.readlines()
    
    new_entry = [
        "\n",
        "## [v1.5.0] - 2026-05-03\n",
        "### ✨ Daily Reading Engine Launch\n",
        "- **Feature [PROJ-42]:** Full integration of multi-modality Daily Readings (AA, NA, Dharma, SMART).\n",
        "- **UX [PROJ-41]:** Finalized the Dynamic Anchor widget with circadian-aware prompts.\n",
        "- **Privacy:** Confirmed Readings bypass the ZK boundary as shared content to ensure instant access.\n"
    ]
    
    # Insert after the # 🚀 Changelog header
    lines.insert(1, "".join(new_entry))
    
    with open(changelog_path, 'w') as f:
        f.writelines(lines)

    print("✅ Documentation and Roadmap synchronized.")

if __name__ == "__main__":
    sync_docs()