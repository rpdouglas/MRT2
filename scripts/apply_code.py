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
- [ ] **Compliance:** Add outbound links to specific modalities (Recovery Dharma, WFS, etc.) and Recovery Community Centers (RCCs) for employment/training resources in Workbooks hub (Recovery Capital integration).

## 🧹 Chores & Tech Debt
- [ ] Increase Nav Icon sizes by 25% (Accessibility).
- [ ] Fix Nav Logo white background issue.
- [ ] Wire up Changelog Beacon alert in Dashboard.
- [ ] **React 19 Refactor:** Incrementally migrate legacy `e.preventDefault()` form submissions to native `useActionState` and `<form action={...}>`.

## ✅ Resolved This Cycle
- [x] **[BUG]** PWA Workbox cache collision -> *Resolved via PWAUpdateBeacon and Prompt strategy.*
- [x] **[BUG]** Dashboard load speed optimization -> *Resolved via 30-day bounded queries and composite indexing.*
- [x] **[SRE]** Zero-Knowledge Vault Stability -> *Patched void promise chains and TextDecoder unhandled exceptions.*
""",

    "docs-site/support/changelog.md": r"""# 🚀 Changelog

## [v1.0.2] - 2026-04-15
### Fixed & Optimized
- **PWA Cache Collision (PROJ-19):** Shifted the Service Worker update strategy from aggressive auto-updating to a deterministic user prompt (`PWAUpdateBeacon`). This eliminates the "3-to-4 reloads required" bug and protects users from fatal `ChunkLoadError` crashes during active sessions.
- **SRE Stability Patches:** Resolved a strict TypeScript compilation error in the `crypto.ts` fallback logic and purged unused ESLint directives to ensure a perfectly clean CI/CD pipeline.

## [v1.0.1] - 2026-04-14
### Fixed & Optimized
- **Dashboard Performance (PROJ-19):** Implemented a 30-day bounded query engine (`useDashboardData.ts`) and composite indexing. This drastically reduces initial load times and prevents memory exhaustion for long-term users with thousands of entries.
- **Zero-Knowledge Vault Stability:** Patched an edge-case crash during PIN rotation and decryption fallback. The vault now gracefully handles corrupted `ArrayBuffer` payloads and invalid keys without locking the UI thread.
- **Infrastructure:** Hardened the Cloud Functions deployment environment (`skipLibCheck`) and resolved strict TypeScript type-checking (`verbatimModuleSyntax`) errors.
"""
}

def sync_post_sprint():
    print("Initiating MRT Post-Cycle Sync...")
    for filepath, content in files_to_update.items():
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
        safe_content = content.replace('___FENCE___', FENCE)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(safe_content)
        print(f"✅ Successfully synchronized: {filepath}")
    
    print("\nSync Complete. Architecture, UI, and Project Boards are aligned.")

if __name__ == "__main__":
    sync_post_sprint()