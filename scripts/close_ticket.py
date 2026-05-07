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
active_cycle_new = "## ✅ Resolved This Cycle\n- [x] **PROJ-53:** ROSC Matrix Visual Upgrade (Pill Capsules) — Replaced Recharts radar chart with custom animated \"Pill Capsules\" design featuring premium glassmorphic dark theme and longitudinal ghosting.\n"
safe_replace(active_cycle_path, active_cycle_old, active_cycle_new)

# 2. Update changelog.md
changelog_path = 'docs-site/support/changelog.md'
changelog_old = "## [v1.8.0] - 2026-05-06"
changelog_new = "## [v1.8.1] - 2026-05-07\n### ✨ ROSC Matrix Visual Upgrade\n- **Pill Capsules [PROJ-53]:** Replaced the Recharts radar chart with a custom, animated \"Pill Capsules\" visualization featuring a premium glassmorphic dark theme.\n- **Longitudinal Tracking [PROJ-53]:** Previous month's scores are now subtly \"ghosted\" behind the current month's active pill segments, providing an instant visual diff of your momentum.\n\n## [v1.8.0] - 2026-05-06"
safe_replace(changelog_path, changelog_old, changelog_new)

# 3. Update docs-site/guide/10-insights.md
guide_path = 'docs-site/guide/10-insights.md'
guide_old = "### Your Radar Chart\n\nAfter the check-in, an animated radar chart fills in showing your four domain scores (each 1–10). The polygon draws in from the centre over half a second.\n\n* **Score pills** below the chart colour-code each domain: green (≥ 7), amber (4–6), or muted (1–3). No red states.\n* **Total score** is shown at the top: e.g., *\"Total Recovery Capital: 31/40.\"*\n* **Longitudinal overlay:** Once you have two or more monthly snapshots, the chart overlays both the current and previous month — a solid polygon for this month, a dashed outline for last month. This lets you track how the *shape* of your recovery changes over time."
guide_new = "### Your Pill Capsules\n\nAfter the check-in, an animated set of segmented pill capsules fills in, showing your four domain scores (each 1–10). The segments light up sequentially with premium glassmorphic gradients.\n\n* **Score numbers** alongside each domain pill display your exact score, with dynamic trend indicators (e.g., `▲ +2`) showing month-over-month growth.\n* **Total score** is shown prominently at the top: e.g., *\"31 / 40.\"*\n* **Longitudinal comparison:** Once you have two or more monthly snapshots, the pill segments from your previous month are subtly \"ghosted\" in the background behind your current score. This lets you instantly visualize your momentum and growth over time."
safe_replace(guide_path, guide_old, guide_new)

safe_replace(guide_path, "that month's full radar chart", "that month's full pill capsules")

# 4. Update 51_ROSC_PILL_CAPSULE.md
proj_path = 'docs/projects/51_ROSC_PILL_CAPSULE.md'
safe_replace(proj_path, "**Status:** ⚪ Planned", "**Status:** ✅ Shipped")
safe_replace(proj_path, "* [ ] **Animation Integrity:**", "* [x] **Animation Integrity:**")
safe_replace(proj_path, "* [ ] **Mobile Responsiveness:**", "* [x] **Mobile Responsiveness:**")
safe_replace(proj_path, "* [ ] **Fallback States:**", "* [x] **Fallback States:**")
safe_replace(proj_path, "* [ ] **Strict Typing:**", "* [x] **Strict Typing:**")

print("Docs updated successfully.")