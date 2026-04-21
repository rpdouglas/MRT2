import os
import re

FENCE = chr(96) * 3

def update_file(filepath, old_text, new_text, use_regex=False):
    if not os.path.exists(filepath):
        print(f"⚠️ Warning: Could not find {filepath}")
        return False
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if use_regex:
        new_content = re.sub(old_text, new_text, content, flags=re.DOTALL)
        if new_content == content:
             print(f"⚠️ Warning: Regex match failed in {filepath}")
             return False
        content = new_content
    else:
        if old_text not in content:
            print(f"⚠️ Warning: Exact string match failed in {filepath}")
            return False
        content = content.replace(old_text, new_text)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Synced: {filepath}")
    return True

def apply_patch():
    print(f"[{FENCE}] Initiating Post-Sprint PM Sync [{FENCE}]")

    # 1. Update ACTIVE_CYCLE.md
    active_cycle = "docs/ACTIVE_CYCLE.md"
    update_file(
        active_cycle,
        "- [ ] **PROJ-19:** Design smoother mobile landing page & \"About Us\" section for top-of-funnel traffic.",
        "- [x] **PROJ-19:** Design smoother mobile landing page & \"About Us\" section for top-of-funnel traffic."
    )
    
    # Add PROJ-19 and PROJ-24 to Resolved list
    resolved_hook = "## ✅ Resolved This Cycle"
    new_resolved = "## ✅ Resolved This Cycle\n- [x] **[UX]** PROJ-19: Landing Page -> *Overhauled top-of-funnel with Vibrant Momentum scroll-snapping layout and Google Auth.*\n- [x] **[DEVOPS]** PROJ-24: Asset Engine -> *Deployed strict-typed ASSETS dictionary and batch WebP compression pipeline.*"
    update_file(active_cycle, resolved_hook, new_resolved)

    # 2. Update ROADMAP.md
    roadmap = "docs/ROADMAP.md"
    # Remove PROJ-19 from Active
    proj19_regex = r"\| 🟡 \*\*Active\*\* \| `PROJ-19` \| \*\*Road to 5,000\*\* \| CEO \| 6-month User Acquisition strategy\. Includes Landing Page overhaul & PWA caching fixes\. \|\n"
    update_file(roadmap, proj19_regex, "", use_regex=True)
    
    # Add to Shipped
    shipped_hook = "## ✅ RECENTLY SHIPPED"
    new_shipped = "## ✅ RECENTLY SHIPPED\n* `PROJ-19` The Landing Page (Vibrant Momentum & Persona Showcase)\n* `PROJ-24` The Asset Engine (Strict-Typed Image Dictionary)"
    update_file(roadmap, shipped_hook, new_shipped)

    # 3. Update PROJ-24 Status
    proj24_spec = "docs/projects/24_ASSET_ENGINE.md"
    update_file(proj24_spec, "**Status:** ⚪ Planned", "**Status:** 🟢 Done")

    print("\n🚀 PM Boards synchronized. Next step: Execute Schema and User Guide updates.")

if __name__ == "__main__":
    apply_patch()