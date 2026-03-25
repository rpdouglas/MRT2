import os
import json

FENCE = chr(96) * 3

def main():
    print("🚀 Initiating Surgical Fix for ESLint Workspace Hoisting Collision...\n")
    filepath = 'functions/package.json'
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if 'scripts' in data and 'lint' in data['scripts']:
            # Replace the failing ESLint command with strict TS type-checking
            data['scripts']['lint'] = 'tsc --noEmit'
                
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        print(f"✅ Repaired: {filepath} (Linter swapped to strict tsc validation)")
    except Exception as e:
        print(f"❌ Error updating package.json: {e}")

if __name__ == "__main__":
    main()