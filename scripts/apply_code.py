import os
import re

FENCE = chr(96) * 3

def sync_active_cycle():
    print(f"[{FENCE}] Syncing ACTIVE_CYCLE.md [{FENCE}]")
    target_file = "docs/ACTIVE_CYCLE.md"
    
    new_content = r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W16
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
*(Queue Empty)*

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [⛔ BLOCKED] **PROJ-07:** Play Store TWA (Waiting on DUNS Number for Google Play Developer Account verification).

## 🧹 Chores & Tech Debt
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.

## ✅ Resolved This Cycle
- [x] **[COMPLIANCE]** Fellowship Routing -> *Injected 'Find a Meeting' locators into SOSModal and overhauled Workbooks tab into a Fellowship Directory (v1.1.10).*
- [x] **[DEVOPS]** Docs Architecture -> *Migrated VitePress documentation to `docs.myrecoverytoolkit.ca` via GitHub Pages custom domain routing (v1.1.9).*
- [x] **[SRE]** PROJ-18: Admin Telemetry -> *Deployed `/admin/telemetry` with bounded 30-day Firestore queries and Recharts token burn visualization (v1.1.8).*
- [x] **[SRE]** API Rate Limiting -> *Injected optimistic UI lock into `useRateLimits.ts` to prevent race-condition API spam.*
- [x] **[HOTFIX]** Push Notification Engine -> *Resolved PWA routing and timezone boundary bugs in `dailyBeacon` function (v1.1.7).*
- [x] **[FEAT]** PROJ-32: Viral Export Engine -> *Injected non-sensitive AI insights securely into SobrietyHero export cards.*
- [x] **[BILLING]** Stripe Integration -> *Deployed Firestore trigger to provision premium JWT claims upon successful checkout.*
"""
    if os.path.exists(target_file):
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(new_content.strip() + "\n")
        print(f"✅ {target_file} updated.")

def sync_master_plan():
    print(f"[{FENCE}] Syncing MASTER_PLAN.md [{FENCE}]")
    target_file = "docs/MASTER_PLAN.md"
    
    if not os.path.exists(target_file): return
    
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    old_block = r"""- [ ] Finalize App Store Deployment (PROJ-07)."""
    new_block = r"""- [ ] Acquire DUNS Number to unblock Google Play Developer Account creation.
- [⛔] Finalize App Store Deployment (PROJ-07) - *Blocked by DUNS.*"""
    
    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {target_file} updated.")

def sync_roadmap():
    print(f"[{FENCE}] Syncing ROADMAP.md [{FENCE}]")
    target_file = "docs/ROADMAP.md"
    
    if not os.path.exists(target_file): return
    
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update PROJ-07 Status
    content = content.replace(
        r"| 🟡 **Active** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. |",
        r"| ⛔ **Blocked** | `PROJ-07` | **Play Store TWA** | CEO | Generate assetlinks.json and finalize Google Play Store deployment. (Waiting on DUNS). |"
    )

    # Inject new ideas from gap analysis into LATER Epic
    new_epics = r"""| ⚪ Planned | `PROJ-35` | **The Autopsy Engine** | David | A shame-free CBT reset flow that captures triggers and emotional velocity immediately following a relapse. |
| ⚪ Planned | `PROJ-36` | **Restitution Dashboard** | Ned | Visual UI widget for tracking financial savings and "Time Recovered" using existing `financial.ts` logic. |
| ⚪ Planned | `PROJ-37` | **Secure Handshake Protocol** | Lisa | Local QR-code generation allowing a sponsee to share an encrypted 4th-step inventory directly to a sponsor's device in person. |"""
    
    if "The Autopsy Engine" not in content:
        content = content.replace(
            r"| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright) for scaling safety. |",
            r"| ⚪ Planned | `PROJ-23` | **The QA Sentinel** | Admin | E2E Testing Pipeline (Playwright) for scaling safety. |" + "\n" + new_epics
        )
        
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ {target_file} updated.")

if __name__ == "__main__":
    print(f"[{FENCE}] Initiating Governance Synchronization [{FENCE}]")
    sync_active_cycle()
    sync_master_plan()
    sync_roadmap()
    print(f"\n🚀 Governance files perfectly aligned with current state.")