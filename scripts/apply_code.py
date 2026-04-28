#!/usr/bin/env python3
import os

def fix_changelog_version():
    filepaths = [
        "docs-site/support/changelog.md",
        "docs/CHANGELOG.md"
    ]
    
    fixed = False
    for filepath in filepaths:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "[v1.13.0]" in content:
                # Replace the incorrect version with the correct semantic version
                content = content.replace("[v1.13.0]", "[v1.3.0]")
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Corrected version from v1.13.0 to v1.3.0 in {filepath}")
                fixed = True

    if not fixed:
        print("⚠️ Could not find [v1.13.0] in the changelog files.")

if __name__ == "__main__":
    print("Fixing Semantic Versioning...")
    fix_changelog_version()