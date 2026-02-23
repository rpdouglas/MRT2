import os

vp_index = r"""---
layout: home

hero:
  name: "My Recovery Toolkit"
  text: "Documentation & Resources"
  tagline: The safest place to do the hardest work.
  actions:
    - theme: brand
      text: Read the Guide
      link: /guide
    - theme: alt
      text: Open App
      link: https://www.myrecoverytoolkit.ca
---
"""

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"✅ Updated: {path}")

if __name__ == "__main__":
    print("🚑 Correcting production URL in Knowledge Base...")
    write_file("docs-site/index.md", vp_index)
    print("✨ URL updated to www.myrecoverytoolkit.ca")