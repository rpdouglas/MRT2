import os

filepath = "src/components/admin/FeedbackViewer.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Swap the Heroicon name for the correct Lucide name in the import
content = content.replace(
    "ClipboardDocumentListIcon", 
    "ClipboardList"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print(f"✅ Fixed icon import in {filepath}")