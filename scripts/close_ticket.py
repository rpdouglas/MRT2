import os

FENCE = chr(96) * 3

def update_file(file_path, old_text, new_text):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_text in content:
        content = content.replace(old_text, new_text)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Target text not found in {file_path}")

def main():
    # 1. Update ACTIVE_CYCLE.md
    active_cycle_path = 'docs/ACTIVE_CYCLE.md'
    active_cycle_old = """## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
*(Queue Empty)*"""
    active_cycle_new = """## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [x] **Overdue Task Completion Fix:** Fixed a bug where overdue recurring tasks calculated their next due date relative to their past due date instead of today.
*(Queue Empty)*"""
    
    update_file(active_cycle_path, active_cycle_old, active_cycle_new)
    
    # 2. Update changelog.md
    changelog_path = 'docs-site/support/changelog.md'
    changelog_old = """# 🚀 Changelog

## [v1.7.0] - 2026-05-06"""
    changelog_new = """# 🚀 Changelog

## [v1.7.1] - 2026-05-06
### 🐛 Bug Fixes
- **Recurring Tasks:** Fixed an issue where completing an overdue recurring task would calculate its next due date based on the missed date rather than today, preventing it from properly rolling forward.

## [v1.7.0] - 2026-05-06"""
    
    update_file(changelog_path, changelog_old, changelog_new)

if __name__ == '__main__':
    main()
