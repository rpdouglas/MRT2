import os

# FENCE protection for writing markdown backticks within a Python script
FENCE = chr(96) * 3

def patch_file(filepath, old_text, new_text):
    if not os.path.exists(filepath):
        print(f"❌ Error: {filepath} not found.")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Process FENCE protection for backticks if they exist in the payload
    old_text_clean = old_text.replace('FENCE', FENCE)
    new_text_clean = new_text.replace('FENCE', FENCE)
    
    if old_text_clean not in content:
        print(f"⚠️ Warning: Target block not found in {filepath}. It may have already been updated.")
        return
        
    content = content.replace(old_text_clean, new_text_clean)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Successfully patched {filepath}")

def sync_project_boards():
    print("Initiating Documentation Drift Sync...")

    # 1. Update ACTIVE_CYCLE.md
    active_cycle_path = "docs/ACTIVE_CYCLE.md"
    
    active_cycle_old_queue = """- [ ] **PROJ-05:** The Service Network -> Build encrypted Sponsee Rolodex to unblock organic viral growth.
- [ ] **PROJ-31:** Crypto Chunking Pipeline -> Refactor PIN rotation to handle 10k+ docs without UI thread locking.
- [⛔ BLOCKED] **PROJ-07:** Play Store TWA"""

    active_cycle_new_queue = """- [ ] **PROJ-05:** The Service Network -> Build encrypted Sponsee Rolodex to unblock organic viral growth.
- [⛔ BLOCKED] **PROJ-07:** Play Store TWA"""

    active_cycle_old_resolved = """## ✅ Resolved This Cycle
- [x] **PROJ-39:** Deferred Vault Lock -> Added 'Skip for Now' onboarding bypass."""

    active_cycle_new_resolved = """## ✅ Resolved This Cycle
- [x] **PROJ-31:** Crypto Chunking Pipeline -> Refactor PIN rotation to handle 10k+ docs without UI thread locking.
- [x] **PROJ-39:** Deferred Vault Lock -> Added 'Skip for Now' onboarding bypass."""

    patch_file(active_cycle_path, active_cycle_old_queue, active_cycle_new_queue)
    patch_file(active_cycle_path, active_cycle_old_resolved, active_cycle_new_resolved)

    # 2. Update ROADMAP.md
    roadmap_path = "docs/ROADMAP.md"
    
    roadmap_old_wave3 = """| ⏸️ **Paused** | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. (Paused to focus on Wave 1 Onboarding). |
| ⏸️ **Paused** | `PROJ-31` | **Crypto Chunking Pipeline** | Admin | Refactor PIN rotation to handle 10,000+ encrypted documents via background chunking. |
| ⚪ Planned | `PROJ-33` | **Predictive Relapse Engine** | Walt / Lisa | AI analysis of Insights collection to generate proactive warning tasks. |"""

    roadmap_new_wave3 = """| ⏸️ **Paused** | `PROJ-05` | **The Service Network** | Lisa | Encrypted Sponsee Rolodex. (Paused to focus on Wave 1 Onboarding). |
| ⚪ Planned | `PROJ-33` | **Predictive Relapse Engine** | Walt / Lisa | AI analysis of Insights collection to generate proactive warning tasks. |"""

    # Also fixing the duplicate PROJ-39 entry identified during the audit
    roadmap_old_shipped = """## ✅ RECENTLY SHIPPED
* `PROJ-39` Deferred Vault Lock (Frictionless Onboarding)
* `PROJ-39` Deferred Vault Lock (Frictionless Onboarding)
* `PROJ-19` The Landing Page (Vibrant Momentum & Persona Showcase)"""

    roadmap_new_shipped = """## ✅ RECENTLY SHIPPED
* `PROJ-31` Crypto Chunking Pipeline (Zero-Knowledge Scaling)
* `PROJ-39` Deferred Vault Lock (Frictionless Onboarding)
* `PROJ-19` The Landing Page (Vibrant Momentum & Persona Showcase)"""

    patch_file(roadmap_path, roadmap_old_wave3, roadmap_new_wave3)
    patch_file(roadmap_path, roadmap_old_shipped, roadmap_new_shipped)
    
    print("Documentation Sync Complete.")

if __name__ == "__main__":
    sync_project_boards()