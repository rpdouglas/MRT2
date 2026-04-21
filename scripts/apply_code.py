import os

FENCE = chr(96) * 3

def apply_patch():
    print(f"[{FENCE}] Initiating Surgical Patch: Aligning AuthContext Method Name [{FENCE}]")

    target_file = "src/pages/Welcome.tsx"
    
    if not os.path.exists(target_file):
        print(f"⚠️ Error: Could not find {target_file}")
        return

    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the destructured properties and types
    content = content.replace(
        "signInWithGoogle?: () => Promise<void> };",
        "loginWithGoogle?: () => Promise<void> };"
    )
    content = content.replace(
        "const { user, loading, signInWithGoogle } = auth;",
        "const { user, loading, loginWithGoogle } = auth;"
    )

    # 2. Update the invocation logic
    content = content.replace(
        "if (signInWithGoogle) {",
        "if (loginWithGoogle) {"
    )
    content = content.replace(
        "await signInWithGoogle();",
        "await loginWithGoogle();"
    )

    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"✅ Successfully patched AuthContext method name in: {target_file}")

if __name__ == "__main__":
    apply_patch()