#!/usr/bin/env python3
"""
sync_governance.py — MRT Safe Delivery Protocol script.

Applies the mechanical fixes from the 2026-08-04 governance alignment audit.
Targeted .replace(old, new) patches only. No full-file rewrites.

Fixes applied:
  1. docs/ROADMAP.md                       — drop PROJ-24/39/48 from stale no-spec exemption list
  2-5. docs/projects/59,60,61,62_*.md       — repoint Source: citations to the archived deep-review report
  6. docs/reports/archive/google_play_readiness_report.md — repoint profile-gap-analysis.md citation
  7. .claude/skills/governance/SKILL.md    — add missing Jordan persona to Check C allowlist
  8-16. docs/projects/{9 specs}.md          — note explaining unchecked QA boxes vs Shipped status
  17. docs/projects/23_QA_SENTINEL.md       — clarify Out-of-Scope note against suite's real size
  18. docs/projects/50_GUIDED_CBT.md        — fix stale tools/tools/ paths + DENTSTool casing
  19. docs/SCHEMA_ARCHITECTURE.md           — buffer_status text + missing collection definitions
  20. docs/BACKLOG.md                       — bump stale review date + untracked open items

Run with DRY_RUN = True (default) to preview. Set DRY_RUN = False to apply.
"""

import pathlib

DRY_RUN = False
FENCE = chr(96) * 3
ROOT = pathlib.Path(__file__).resolve().parent.parent

PATCHES = [
    {
        "file": "docs/ROADMAP.md",
        "desc": "Drop PROJ-24/39/48 from the no-spec exemption footnote — all three have real spec files now.",
        "old": "> **Spec-file note:** IDs referenced here without a `docs/projects/XX_FEATURE.md` file (PROJ-18, 19, 24, 32, 33, 34, 35, 37, 39, 48, and `[BILLING]`) predate CLAUDE.md's spec-file requirement and are exempt from backfill — flagged and resolved during the 2026-07-18 governance audit. Any of these picked up for new work should get a proper spec at that time.",
        "new": "> **Spec-file note:** IDs referenced here without a `docs/projects/XX_FEATURE.md` file (PROJ-18, 19, 32, 33, 34, 35, 37, and `[BILLING]`) predate CLAUDE.md's spec-file requirement and are exempt from backfill — flagged and resolved during the 2026-07-18 governance audit. PROJ-24, 39, and 48 were removed from this list on 2026-08-04: all three now have real spec files in `docs/projects/`, restored from `docs/projects/archive/` per `ACTIVE_CYCLE.md`'s Docs Archive Cleanup entry. Any of these picked up for new work should get a proper spec at that time.",
    },
    {
        "file": "docs/projects/59_DATA_LAYER_CONSOLIDATION.md",
        "desc": "Repoint Source: citation to the archived report path.",
        "old": "docs/reports/2026-07_codebase_deep_review.md",
        "new": "docs/reports/archive/2026-07_codebase_deep_review.md",
    },
    {
        "file": "docs/projects/60_GOD_FILE_DECOMPOSITION.md",
        "desc": "Repoint Source: citation to the archived report path.",
        "old": "docs/reports/2026-07_codebase_deep_review.md",
        "new": "docs/reports/archive/2026-07_codebase_deep_review.md",
    },
    {
        "file": "docs/projects/61_TEST_COVERAGE_BACKFILL.md",
        "desc": "Repoint Source: citation to the archived report path.",
        "old": "docs/reports/2026-07_codebase_deep_review.md",
        "new": "docs/reports/archive/2026-07_codebase_deep_review.md",
    },
    {
        "file": "docs/projects/62_TECH_DEBT_QUICK_WINS.md",
        "desc": "Repoint Source: citation to the archived report path.",
        "old": "docs/reports/2026-07_codebase_deep_review.md",
        "new": "docs/reports/archive/2026-07_codebase_deep_review.md",
    },
    {
        "file": "docs/reports/archive/google_play_readiness_report.md",
        "desc": "Repoint profile-gap-analysis.md citation to its archived path.",
        "old": "docs/reports/profile-gap-analysis.md",
        "new": "docs/reports/archive/profile-gap-analysis.md",
    },
    {
        "file": ".claude/skills/governance/SKILL.md",
        "desc": "Add missing Jordan persona to Check C's validation allowlist.",
        "old": "- Validate persona names against `docs/PERSONAS.md` — only `David`, `Ned`, `Lisa`, `Walt`, `Maya`, and `All` are valid. Flag any persona name that is not in this set.",
        "new": "- Validate persona names against `docs/PERSONAS.md` — only `David`, `Ned`, `Lisa`, `Walt`, `Maya`, `Jordan`, and `All` are valid. Flag any persona name that is not in this set.",
    },
]

QA_NOTE = (
    "## 5. QA & Verification 🧪\n\n"
    "**2026-08-04 governance note:** this spec's Status above reflects code-level verification "
    "(routes/hooks/components/tests confirmed present, and passing where automated) performed during "
    "the 2026-08-04 governance audit. The unchecked items below are manual/device/browser/visual checks "
    "that have not been performed by a human — tracked here as a known gap, not a blocker to the Shipped "
    "status. Check them off once actually performed."
)
for spec in [
    "24_ASSET_ENGINE",
    "30_DATA_EXPORT",
    "39_DEFERRED_VAULT_LOCK",
    "63_SCREENSHOT_GENERATOR",
    "82_POSTHOG_TELEMETRY_EXPANSION",
    "83_SOBRIETY_HERO_TYPOGRAPHY_SCALE",
    "94_ERROR_TELEMETRY_HARDENING",
    "95_JOURNAL_HISTORY_PAGINATION",
    "98_AUDIT_QUICK_WINS",
]:
    PATCHES.append(
        {
            "file": f"docs/projects/{spec}.md",
            "desc": "Note explaining unchecked QA boxes vs Shipped status (code-verified, not human/device-verified).",
            "old": "## 5. QA & Verification 🧪",
            "new": QA_NOTE,
        }
    )

PATCHES.append(
    {
        "file": "docs/projects/23_QA_SENTINEL.md",
        "desc": "Clarify the Out-of-Scope note against the e2e suite's actual current size (it's grown well past the original 3 golden paths via later tickets).",
        "old": "* Expanding beyond the three original golden paths (e.g. AI analysis flows, Service Module, export) — this project is scoped to exactly the three paths in the original spec. Additional E2E coverage is a future ticket.",
        "new": (
            "* Expanding beyond the three original golden paths (e.g. AI analysis flows, Service Module, export) — this project is scoped to exactly the three paths in the original spec. Additional E2E coverage is a future ticket.\n\n"
            "**2026-08-04 governance note:** the `e2e/golden-paths/` and `e2e/security/` suites have since grown beyond "
            "these three specs via later, separately-spec'd tickets (`a11y.spec.ts`, `subway.spec.ts`, `viewport-320.spec.ts`, "
            "`security/mockuser-prod.spec.ts`) — the Out of Scope statement above describes PROJ-23's own original "
            "contribution only, not the suite's current full contents."
        ),
    }
)

PATCHES.extend(
    [
        {
            "file": "docs/projects/50_GUIDED_CBT.md",
            "desc": "Fix stale ascii-tree paths for the 'replace' block: tools/ -> smart_tools/, DENTSTool -> DentsTool casing.",
            "old": (
                "    tools/ABCTool.tsx             ← Guided ABCDE 5-step flow (replace)\n"
                "    tools/CBATool.tsx             ← Guided CBA with quadrant-by-quadrant reveal (replace)\n"
                "    tools/DENTSTool.tsx           ← Guided DENTS with scenario pre-planning mode (replace)\n"
                "    tools/FiveQuestionsTool.tsx   ← Guided self-enquiry flow (replace)"
            ),
            "new": (
                "    smart_tools/ABCTool.tsx             ← Guided ABCDE 5-step flow (replace)\n"
                "    smart_tools/CBATool.tsx             ← Guided CBA with quadrant-by-quadrant reveal (replace)\n"
                "    smart_tools/DentsTool.tsx           ← Guided DENTS with scenario pre-planning mode (replace)\n"
                "    smart_tools/FiveQuestionsTool.tsx   ← Guided self-enquiry flow (replace)"
            ),
        },
        {
            "file": "docs/projects/50_GUIDED_CBT.md",
            "desc": "Fix stale ascii-tree path for the 'new' block: tools/ThoughtRecordTool.tsx -> smart_tools/ThoughtRecordTool.tsx.",
            "old": "    tools/ThoughtRecordTool.tsx   ← New 7-column guided thought record (new)",
            "new": "    smart_tools/ThoughtRecordTool.tsx   ← New 7-column guided thought record (new)",
        },
        {
            "file": "docs/projects/50_GUIDED_CBT.md",
            "desc": "Phase 2 Files: line — fix ABCTool.tsx real path (src/components/smart_tools/, not tools/tools/).",
            "old": "**Files:** `src/components/tools/tools/ABCTool.tsx`",
            "new": "**Files:** `src/components/smart_tools/ABCTool.tsx`",
        },
        {
            "file": "docs/projects/50_GUIDED_CBT.md",
            "desc": "Phase 3 Files: line — fix CBATool.tsx real path.",
            "old": "**Files:** `src/components/tools/tools/CBATool.tsx`",
            "new": "**Files:** `src/components/smart_tools/CBATool.tsx`",
        },
        {
            "file": "docs/projects/50_GUIDED_CBT.md",
            "desc": "Phase 4 Files: line — fix ThoughtRecordTool.tsx real path.",
            "old": "**Files:** `src/components/tools/tools/ThoughtRecordTool.tsx`, `src/components/tools/EmotionIntensitySelector.tsx`",
            "new": "**Files:** `src/components/smart_tools/ThoughtRecordTool.tsx`, `src/components/tools/EmotionIntensitySelector.tsx`",
        },
        {
            "file": "docs/projects/50_GUIDED_CBT.md",
            "desc": "Phase 5 Files: line — fix DentsTool.tsx/FiveQuestionsTool.tsx real paths + casing.",
            "old": "**Files:** `src/components/tools/tools/DENTSTool.tsx`, `src/components/tools/tools/FiveQuestionsTool.tsx`",
            "new": "**Files:** `src/components/smart_tools/DentsTool.tsx`, `src/components/smart_tools/FiveQuestionsTool.tsx`",
        },
        {
            "file": "docs/SCHEMA_ARCHITECTURE.md",
            "desc": "buffer_status text now matches the explicit deny-all rule added in firestore.rules.",
            "old": "* **Purpose:** PROJ-42. Cloud-Function-internal tracker of how far ahead each modality's reading buffer is generated (`checkBufferHealth`/`generateReadingBatch`). No client-facing `firestore.rules` entry — default-deny is correct here, this collection is never read or written from the client, only from Admin-SDK Cloud Functions.",
            "new": "* **Purpose:** PROJ-42. Cloud-Function-internal tracker of how far ahead each modality's reading buffer is generated (`checkBufferHealth`/`generateReadingBatch`). Has an explicit `firestore.rules` deny-all entry (added 2026-08-04 governance remediation) — this collection is never read or written from the client, only from Admin-SDK Cloud Functions, so the rule denies all client access rather than relying on default-deny alone.",
        },
        {
            "file": "docs/SCHEMA_ARCHITECTURE.md",
            "desc": "Add missing checkout_sessions/subscriptions/payments collection definitions (diagrammed but never documented).",
            "old": "### `journals/{entryId}`",
            "new": (
                "### `users/{uid}/checkout_sessions/{id}`, `users/{uid}/subscriptions/{id}`, `users/{uid}/payments/{id}`\n"
                "* **Purpose:** Stripe Firebase Extension subcollections (backend-managed, PROJ-68/premium billing). Users create the checkout-session request; the extension's backend fills in the Stripe-hosted URL and later writes subscription/payment status. **UNENCRYPTED** — Stripe metadata, not recovery content.\n"
                "* **Access:** `checkout_sessions` — user can `create`/`read`, never `update`/`delete`. `subscriptions` and `payments` — user can `read` only; all writes are `false` (extension-only, via Admin SDK) so a client can never fake a subscription or payment record. See `firestore.rules` lines 111-123.\n\n"
                "### `journals/{entryId}`"
            ),
        },
        {
            "file": "docs/SCHEMA_ARCHITECTURE.md",
            "desc": "Add missing service collection definition (diagrammed, has real firestore.rules coverage, but never documented).",
            "old": "### `game_progress/{id}`",
            "new": (
                "### `service/{serviceId}`\n"
                "* **Purpose:** PROJ-05 (The Service Network / Lisa Module) — sponsor/sponsee service notes. Placeholder collection with real `firestore.rules` coverage already in place (owner-scoped CRUD) ahead of the feature itself, which is `⏸️ Paused`. **ENCRYPTED** per the ZK boundary table in `CLAUDE.md` (sponsee notes).\n\n"
                "### `game_progress/{id}`"
            ),
        },
        {
            "file": "docs/BACKLOG.md",
            "desc": "Bump stale Last Reviewed date.",
            "old": "**Last Reviewed:** 2026-07-12",
            "new": "**Last Reviewed:** 2026-08-04",
        },
        {
            "file": "docs/BACKLOG.md",
            "desc": "Add untracked open items from 2026-07_firebase_architecture_review.md (orphaned report, zero citations elsewhere).",
            "old": "* **Bulk-migration framework** (paginated, resumable, Cloud-Function-driven — beyond the current single-`uid` admin button in `SchemaMigration.tsx`, which doesn't paginate past 500 documents for even one user). **Trigger:** the next genuinely breaking schema change that needs to apply to every existing account, not before — building this speculatively risks over-engineering for a shape of migration nobody has needed yet (`usesPepperV2`'s lazy per-account flag has covered every real migration so far).",
            "new": (
                "* **Bulk-migration framework** (paginated, resumable, Cloud-Function-driven — beyond the current single-`uid` admin button in `SchemaMigration.tsx`, which doesn't paginate past 500 documents for even one user). **Trigger:** the next genuinely breaking schema change that needs to apply to every existing account, not before — building this speculatively risks over-engineering for a shape of migration nobody has needed yet (`usesPepperV2`'s lazy per-account flag has covered every real migration so far).\n"
                "* **Three still-open recommendations from `docs/reports/2026-07_firebase_architecture_review.md`** (surfaced 2026-08-04 governance audit — this report has zero citations elsewhere in `docs/`, so these were untracked until now): (1) `scripts/sync_security_rules.sh` can push directly to prod with no environment gate/confirmation prompt; (2) `measurementId` is configured in `src/lib/firebase.ts` but `firebase/analytics` is never imported/initialized — either wire it up or remove the dormant config; (3) the transaction-vs-batch-write consistency model used across Firestore mutations isn't documented anywhere. **Trigger:** next time any of these three files is touched for an unrelated reason — not urgent enough to schedule proactively at current scale."
            ),
        },
    ]
)


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
        print(f"  {patch['old'][:200]}")
        print("  --- NEW (excerpt) ---")
        print(f"  {patch['new'][:300]}")

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
