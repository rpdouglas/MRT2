import os

FENCE = chr(96) * 3

patches = [
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[BUG]** Push Notifications failing to fire (Triage Report 4/16).""",
        "new_block": r"""## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`."""
    },
    {
        "filepath": "docs/ACTIVE_CYCLE.md",
        "old_block": r"""## ✅ Resolved This Cycle
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*""",
        "new_block": r"""## ✅ Resolved This Cycle
- [x] **[HOTFIX]** Push Notification Engine -> *Resolved PWA routing and timezone boundary bugs in `dailyBeacon` function (v1.1.7).*
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*"""
    }
]

def append_changelog():
    changelog_path = "docs-site/support/changelog.md"
    new_entry = r"""# 🚀 Changelog

## [v1.1.7] - 2026-04-17
### 🚑 Hotfixes & Infrastructure
- **Bug Fix [PROJ-26]:** Resolved a critical issue in the `dailyBeacon` system where users were not receiving push notifications for tasks due "today" due to a timezone boundary parsing error.
- **System Update:** Upgraded FCM push notification payloads to utilize the modern HTTP v1 `webpush` spec, ensuring notifications reliably launch the PWA dashboard on Android and iOS devices.

"""
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "## [v1.1.7]" not in content:
            content = content.replace("# 🚀 Changelog\n", new_entry)
            with open(changelog_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Successfully appended v1.1.7 to: {changelog_path}")
        else:
            print(f"ℹ️ v1.1.7 already exists in {changelog_path}")
    else:
        # Fallback if the file doesn't exist yet
        os.makedirs(os.path.dirname(changelog_path), exist_ok=True)
        with open(changelog_path, 'w', encoding='utf-8') as f:
            f.write(new_entry)
        print(f"✅ Created and appended v1.1.7 to: {changelog_path}")

def apply_patches():
    print(f"[{FENCE}] Initiating Cycle State Synchronization for Hotfix v1.1.7 [{FENCE}]")
    
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
    print("\n🚀 Cycle Boards Updated. Ready for PR.")

if __name__ == "__main__":
    apply_patches()