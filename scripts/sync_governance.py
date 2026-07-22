#!/usr/bin/env python3
"""
sync_governance.py — MRT Safe Delivery Protocol script.

Applies the mechanical fixes from the 2026-07-22 governance alignment audit.
Targeted .replace(old, new) patches only. No full-file rewrites.

Fixes applied:
  1. docs/ACTIVE_CYCLE.md                          — add PROJ-73 to Active Projects (Priority 2)
  2. docs/ROADMAP.md                               — add PROJ-73 to Wave 1 table
  3. docs/projects/42_DAILY_READINGS.md            — as-built note (folded into PROJ-41's widget)
  4. docs/projects/41_DYNAMIC_ANCHOR.md            — cross-reference PROJ-42
  5. docs/projects/64_AI_PROXY_SECURITY_HARDENING.md — mark CLAUDE.md follow-up done

Run with DRY_RUN = True (default) to preview. Set DRY_RUN = False to apply.
"""

import pathlib

DRY_RUN = False
FENCE = chr(96) * 3
ROOT = pathlib.Path(__file__).resolve().parent.parent

PATCHES = [
    {
        "file": "docs/ACTIVE_CYCLE.md",
        "desc": "Add PROJ-73 to Active Projects (Priority 2) — it's genuinely in-flight (Phases 1-3 shipped, Phase 4 stretch remains) but was absent from every governance file (Check B orphan finding).",
        "old": (
            "Sprint 9.2 (Bubblewrap compile, Play Console submission) still blocked on remaining Google Play Console verification steps, not DUNS — both prior blockers (PROJ-67 keystore, PROJ-68 Stripe/TWA gating) are resolved.\n\n\n"
            "## ⏸️ Paused (Not in this cycle)"
        ),
        "new": (
            "Sprint 9.2 (Bubblewrap compile, Play Console submission) still blocked on remaining Google Play Console verification steps, not DUNS — both prior blockers (PROJ-67 keystore, PROJ-68 Stripe/TWA gating) are resolved.\n"
            "- [🟡 Phases 1-3 Done] **PROJ-73:** Test Suite Hardening — Vault-PIN Pepper Coverage. Closes the coverage gap left by PROJ-65: e2e Vault Test now exercises the real peppered derivation path (Functions emulator added to `test:e2e`), direct unit coverage of `EncryptionContext.tsx` added (12 tests), and `verifyVaultPin`'s decision logic (`evaluateVaultPinAttempt`/`deriveVaultPepper`) extracted and unit tested. Phase 4 (stretch — Recovery Games component test coverage) remains open. See `docs/projects/73_TEST_SUITE_HARDENING.md`.\n\n\n"
            "## ⏸️ Paused (Not in this cycle)"
        ),
    },
    {
        "file": "docs/ROADMAP.md",
        "desc": "Add PROJ-73 as a Wave 1 row (internal/security, same bucket as PROJ-65/67/68) so it's visible outside ACTIVE_CYCLE.md too.",
        "old": (
            "| ✅ **Shipped** | `PROJ-65` | **Vault PIN Brute-Force Hardening** | All | Rate-limited server-pepper key derivation (multi-device-safe alternative to the originally-proposed IndexedDB Master Key, which was rejected) so a Firestore breach doesn't reduce to a 10,000-combination PIN search. Implemented 2026-07-17, external security review passed 2026-07-19 — see `docs/projects/65_VAULT_KEY_HARDENING.md`. |\n\n"
            "## 🌊 Wave 2: Retention & Community (Weeks 7–16)"
        ),
        "new": (
            "| ✅ **Shipped** | `PROJ-65` | **Vault PIN Brute-Force Hardening** | All | Rate-limited server-pepper key derivation (multi-device-safe alternative to the originally-proposed IndexedDB Master Key, which was rejected) so a Firestore breach doesn't reduce to a 10,000-combination PIN search. Implemented 2026-07-17, external security review passed 2026-07-19 — see `docs/projects/65_VAULT_KEY_HARDENING.md`. |\n"
            "| 🟡 **In Progress** | `PROJ-73` | **Test Suite Hardening — Vault-PIN Pepper Coverage** | All | Closes the coverage gap left by PROJ-65 so the peppered PIN-derivation scheme is actually exercised by automated tests at every layer (Cloud Function handler, client orchestration, browser e2e). Phases 1-3 shipped; Phase 4 (stretch — Recovery Games component coverage) remains. See `docs/projects/73_TEST_SUITE_HARDENING.md`. |\n\n"
            "## 🌊 Wave 2: Retention & Community (Weeks 7–16)"
        ),
    },
    {
        "file": "docs/projects/42_DAILY_READINGS.md",
        "desc": "Add an as-built note: the spec's standalone DailyReadingCard.tsx was never built — the feature shipped folded into PROJ-41's DynamicAnchorWidget instead (Check I spec-drift finding).",
        "old": "- [ ] No trademarked fellowship names in any UI label or generated content",
        "new": (
            "- [ ] No trademarked fellowship names in any UI label or generated content\n\n"
            "---\n\n"
            "## 14. As-Built Note (added 2026-07-22 governance audit)\n\n"
            "The Dashboard integration described in §7 shipped differently than specced: there is no standalone `DailyReadingCard.tsx`. The reading feature (data layer, modality selection, share button, buffer-health Cloud Functions) shipped exactly as designed, but its UI entry point was folded into `DynamicAnchorWidget.tsx`'s existing \"Reading\" card (`docs/projects/41_DYNAMIC_ANCHOR.md`) rather than added as a second, separate Dashboard card. See `docs/projects/41_DYNAMIC_ANCHOR.md` for the as-built widget."
        ),
    },
    {
        "file": "docs/projects/41_DYNAMIC_ANCHOR.md",
        "desc": "Cross-reference PROJ-42 from the widget spec that actually hosts its UI, so a reader of this file alone understands the Reading card's full scope.",
        "old": (
            "Decision (2026-07-09): descope and remove Card 3 entirely rather than build it. `notifyIntent`, `needsIntent`, and `Task.source: 'anchor_intent'` were deleted as part of the notification-system remediation (see `docs/projects/26_THE_BEACON.md`). The Quick Action Bar remains a 2-card layout (Check-In, Reading) going forward. Any future revival of an \"Intent\" concept should be scoped as a new ticket, not a resurrection of this dead code."
        ),
        "new": (
            "Decision (2026-07-09): descope and remove Card 3 entirely rather than build it. `notifyIntent`, `needsIntent`, and `Task.source: 'anchor_intent'` were deleted as part of the notification-system remediation (see `docs/projects/26_THE_BEACON.md`). The Quick Action Bar remains a 2-card layout (Check-In, Reading) going forward. Any future revival of an \"Intent\" concept should be scoped as a new ticket, not a resurrection of this dead code.\n\n"
            "**Cross-reference (added 2026-07-22 governance audit):** Card 2 (Reading) is also the shipped UI entry point for `docs/projects/42_DAILY_READINGS.md` (PROJ-42) — the dropdown chevron opens `ModalitySelector`-configured readings via `ReadingModal`, not just the static external fellowship link originally specced in Phase 3 above. PROJ-42's own standalone `DailyReadingCard.tsx` was never built; its functionality lives entirely inside this widget."
        ),
    },
    {
        "file": "docs/projects/64_AI_PROXY_SECURITY_HARDENING.md",
        "desc": "Mark the CLAUDE.md wording follow-up as done — it's already reflected in current CLAUDE.md but PROJ-64's own tracking section still listed it as open.",
        "old": "* CLAUDE.md's \"Approved Gemini exception\" wording needs updating to describe the Cloud Function proxy hop.",
        "new": "* ~~CLAUDE.md's \"Approved Gemini exception\" wording needs updating to describe the Cloud Function proxy hop.~~ **✅ Done** — confirmed 2026-07-22 governance audit: CLAUDE.md's Zero-Knowledge Encryption Boundary section now documents the proxy hop explicitly.",
    },
]


def main():
    print(f"MRT Governance Sync — {'DRY RUN' if DRY_RUN else 'LIVE APPLY'}\n")
    applied, skipped = 0, 0

    for patch in PATCHES:
        path = ROOT / patch["file"]
        text = path.read_text(encoding="utf-8")
        count = text.count(patch["old"])

        print(f"{FENCE}\nFILE: {patch['file']}\nWHY:  {patch['desc']}\n{FENCE}")

        if count == 0:
            print("  ⚠️  SKIPPED — anchor text not found (file may have changed since audit). No write performed.\n")
            skipped += 1
            continue
        if count > 1:
            print(f"  ⚠️  SKIPPED — anchor text found {count} times, not unique enough to patch safely. No write performed.\n")
            skipped += 1
            continue

        print("  --- OLD (excerpt) ---")
        print(f"  {patch['old'][:300]}")
        print("  --- NEW (excerpt) ---")
        print(f"  {patch['new'][:400]}")

        if DRY_RUN:
            print("  ✅ Would apply (dry run — no write performed).\n")
        else:
            new_text = text.replace(patch["old"], patch["new"], 1)
            path.write_text(new_text, encoding="utf-8")
            print("  ✅ Applied.\n")
        applied += 1

    print(f"{FENCE}\nSummary: {applied} patch(es) {'previewed' if DRY_RUN else 'applied'}, {skipped} skipped.\n{FENCE}")
    if DRY_RUN:
        print("This was a DRY RUN. No files were modified. Set DRY_RUN = False and re-run to apply for real.")


if __name__ == "__main__":
    main()
