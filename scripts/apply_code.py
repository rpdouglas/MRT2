#!/usr/bin/env python3
import os
import re

FENCE = chr(96) * 3

def update_proj_31():
    filepath = "docs/projects/20_CRYPTO_SCALING.md"
    
    completion_note = f"""
## PROJ-31 Post-Sprint Audit
**Status:** [x] COMPLETED

**Implementation Notes:**
* Migrated monolithic array loading to a cursor-based Firestore pipeline ({FENCE}limit{FENCE} + {FENCE}startAfter{FENCE}).
* Batch writes strictly capped beneath Firestore's 500-operation transaction limit.
* UI decoupled from database engine modifications.
"""
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    content = ""
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
            
    # Mark as completed if not already
    if "[ ] PROJ-31" in content:
        content = content.replace("[ ] PROJ-31", "[x] PROJ-31")
        
    if "PROJ-31 Post-Sprint Audit" not in content:
        content += "\n" + completion_note
        
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✅ Updated {filepath}")

def update_security_docs():
    filepath = "docs/SECURITY_ZERO_KNOWLEDGE.md"
    
    rotation_update = f"""
## Key Rotation (Zero-Knowledge)
PIN rotation is an asynchronous, chunked process running in 50-document batches using Firestore cursors. 

**Fail-Safe Rollback:**
If a network drop occurs mid-rotation, the {FENCE}try/catch{FENCE} block successfully ensures the {FENCE}globalKey{FENCE} strictly reverts to the {FENCE}oldPin{FENCE} state in memory, preventing permanent data lockouts. The old and new AES-GCM keys are rotated sequentially within the chunking loop, never leaving the localized {FENCE}lib/rotation.ts{FENCE} scope.
"""

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    content = ""
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()

    # Replace the existing Key Rotation section or append it
    if "## Key Rotation" in content:
        content = re.sub(r'## Key Rotation.*?(?=\n## |\Z)', rotation_update, content, flags=re.DOTALL)
    else:
        content += "\n" + rotation_update

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✅ Updated {filepath}")

if __name__ == "__main__":
    print("Initiating Docs-as-Code Crystallization for PROJ-31...")
    update_proj_31()
    update_security_docs()
    print("🚀 Documentation update complete.")