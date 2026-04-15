import os

# FENCE pattern to protect markdown codeblocks during generation
FENCE = chr(96) * 3

files_to_update = {
    "docs/ACTIVE_CYCLE.md": r"""# 🏃 Active Development Cycle

**Current Phase:** Cycle 2026-W14
**Methodology:** ISO Year-Week Continuous Delivery

## 🚨 Triage & Hotfixes (Priority 1)
*Issues bypassing the backlog to protect user retention.*
- [ ] **[BUG]** Move VitePress docs to `docs.myrecoverytoolkit.ca`.
- [ ] **[UX]** Rename global variables/UI text from "Users" to "Friends" (Peer-to-peer alignment).

## 🛠️ Active Projects (Priority 2)
*Core feature work for the current cycle.*
- [ ] **PROJ-19:** Design smoother mobile landing page & "About Us" section for top-of-funnel traffic.
- [ ] **PROJ-18:** Polish & Deploy `/admin/telemetry` UI to track Gemini API usage and user flow (Recharts already integrated).
- [ ] **[BILLING]** Implement and test Stripe Webhook handlers to automatically provision premium roles upon checkout.
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) and Recovery Community Centers (RCCs) for employment/training resources in Workbooks hub.

## 🧹 Chores & Tech Debt
- [ ] Increase Nav Icon sizes by 25% (Accessibility).
- [ ] Fix Nav Logo white background issue.
- [ ] Wire up Changelog Beacon alert in Dashboard.
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState`.

## ✅ Resolved This Cycle
- [x] **[FEAT]** Admin Inbox Workflow Upgrade -> *Added 'Backlog' status, purple UI tier, and updated TS interfaces.*
- [x] **[BUG]** PWA Workbox cache collision -> *Resolved via PWAUpdateBeacon and Prompt strategy.*
- [x] **[BUG]** Dashboard load speed optimization -> *Resolved via 30-day bounded queries and composite indexing.*
- [x] **[SRE]** Zero-Knowledge Vault Stability -> *Patched void promise chains and TextDecoder exceptions.*
""",

    "docs-site/support/changelog.md": r"""# 🚀 Changelog

## [v1.1.0] - 2026-04-15
### Added
- **Admin Workflow Upgrade:** Introduced a dedicated "Backlog" tier to the Admin Inbox. Feedback and feature requests can now be triaged into a resting state (Backlog) before active development begins (Investigating), keeping the "New" queue clean and actionable.

### Fixed & Optimized (v1.0.2 Hotfixes)
- **TypeScript Strictness:** Resolved optional prop drilling errors in the Admin Dashboard and fortified Firebase `Firestore` instance casting for the ticketing system.
- **PWA Cache Collision (PROJ-19):** Shifted the Service Worker update strategy from aggressive auto-updating to a deterministic user prompt (`PWAUpdateBeacon`). 
- **SRE Stability Patches:** Resolved a strict TypeScript compilation error in the `crypto.ts` fallback logic and purged unused ESLint directives.

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`).
"""
}

def sync_post_sprint():
    print(f"[{FENCE}] Initiating MRT Post-Cycle Sync for v1.1.0 [{FENCE}]")
    for filepath, content in files_to_update.items():
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
        safe_content = content.replace('___FENCE___', FENCE)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(safe_content)
        print(f"✅ Successfully synchronized: {filepath}")
    
    print("\nSync Complete. Architecture, UI, and Project Boards are aligned.")

if __name__ == "__main__":
    sync_post_sprint()