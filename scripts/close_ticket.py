import os

FENCE = chr(96) * 3

def safe_replace(filepath, old_str, new_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Warning: old_str not found in {filepath}")

# 1. Update ACTIVE_CYCLE.md
active_cycle_path = 'docs/ACTIVE_CYCLE.md'
active_cycle_old = "## ✅ Resolved This Cycle\n"
active_cycle_new = "## ✅ Resolved This Cycle\n- [x] **PROJ-54:** Journal Insights Momentum UI Redesign — Refactored the Insights tab into an atmospheric, reflection-first \"Glass and Glow\" interface utilizing Momentum Kinetic v3.0, replacing dry charts with semantic colors and ambient motion.\n"
safe_replace(active_cycle_path, active_cycle_old, active_cycle_new)

# 2. Update changelog.md
changelog_path = 'docs-site/support/changelog.md'
changelog_old = "## [v1.8.1] - 2026-05-07"
changelog_new = "## [v1.8.2] - 2026-05-08\n### ✨ Journal Insights UI Redesign\n- **Momentum UI [PROJ-54]:** Refactored the Journal Insights tab to an atmospheric \"Glass and Glow\" interface using the Walt persona rules. Introduced GlassCard components and dark mode semantic styling.\n- **Typography & Charts [PROJ-54]:** Upgraded fonts to JetBrains Mono and DM Sans. Smoothed chart curves, reduced grid lines, and implemented pill-based Weekly Rhythm visualization for lower cognitive load.\n- **Word Cloud Polish [PROJ-54]:** Enhanced the word cloud design and empty states to be more compassionate.\n\n## [v1.8.1] - 2026-05-07"
safe_replace(changelog_path, changelog_old, changelog_new)

# 3. Update ROADMAP.md
roadmap_path = 'docs/ROADMAP.md'
roadmap_old = "## ✅ RECENTLY SHIPPED\n"
roadmap_new = "## ✅ RECENTLY SHIPPED\n* `PROJ-54` Journal Insights Momentum UI Redesign (GlassCard, dark theme, smooth charts, and typography upgrade)\n"
safe_replace(roadmap_path, roadmap_old, roadmap_new)

# 4. Update 54_JOURNAL_INSIGHTS_MOMENTUM.md
proj_path = 'docs/projects/54_JOURNAL_INSIGHTS_MOMENTUM.md'
safe_replace(proj_path, "**Status:** ⚪ Planned", "**Status:** ✅ Shipped")
safe_replace(proj_path, "* [ ] **Unit Tests:**", "* [x] **Unit Tests:**")
safe_replace(proj_path, "* [ ] **The Subway Test:**", "* [x] **The Subway Test:**")
safe_replace(proj_path, "* [ ] **Visual QA:**", "* [x] **Visual QA:**")

print("Docs updated successfully.")
