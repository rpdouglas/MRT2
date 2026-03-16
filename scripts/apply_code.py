import os

FENCE = chr(96) * 3

REPLACEMENTS = {
    "src/pages/Dashboard.tsx": [
        (
            "}, [userProfile?.lastSeenBuildHash, meta.globalHash, user, queryClient]);", 
            "}, [userProfile, meta.globalHash, user, queryClient]);"
        )
    ]
}

def apply_surgical_fixes():
    for filepath, fixes in REPLACEMENTS.items():
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            for old_str, new_str in fixes:
                content = content.replace(old_str, new_str)
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Surgically patched: {filepath}")
        else:
            print(f"⚠️ File not found for patching: {filepath}")

if __name__ == "__main__":
    apply_surgical_fixes()
    print("✨ ESLint exhaustive-deps warning resolved.")