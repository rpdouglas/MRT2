#!/usr/bin/env python3
"""
sync_governance.py — MRT Safe Delivery Protocol script.

Applies the mechanical fixes from the 2026-07-16 governance alignment audit.
Targeted .replace(old, new) patches only. No full-file rewrites.

Excluded from this script (require human/LLM judgment, not a mechanical sync):
  - Writing new docs/projects/XX_FEATURE.md specs for PROJ-07, PROJ-33, PROJ-34,
    PROJ-35, PROJ-37, "Changelog Beacon", "Privacy-Preserving Community",
    "Multi-Addiction Clocks" — real planning work, run the `planning` skill per item.
  - Backfilling specs for legacy shipped items with no spec (PROJ-18, PROJ-19,
    PROJ-32, [BILLING]) — same reason.
  - Confirming whether PROJ-07's DUNS number has been issued (Check H) — needs a
    real-world check by the user, not a doc edit.
  - Promoting a project into ACTIVE_CYCLE.md's Priority-2 slot — a prioritization
    call for the user, not a drift fix.

Run with DRY_RUN = True (default) to preview. Set DRY_RUN = False to apply.
"""

import pathlib

DRY_RUN = False
FENCE = chr(96) * 3
ROOT = pathlib.Path(__file__).resolve().parent.parent

PATCHES = [
    {
        "file": "docs/ROADMAP.md",
        "desc": "PROJ-41 Wave 1 table: correct stale '3-column' description to the as-built '2-column' (Card 3/Intent was descoped — see docs/projects/41_DYNAMIC_ANCHOR.md §6 and docs/projects/48_USER_GUIDE_SYNC.md Shipped Notes).",
        "old": "| ✅ **Shipped** | `PROJ-41` | **The Dynamic Anchor** | David / Ned | A slim, frictionless, 3-column Quick Action Bar replacing the static daily pledge. |",
        "new": "| ✅ **Shipped** | `PROJ-41` | **The Dynamic Anchor** | David / Ned | A slim, frictionless, 2-column Quick Action Bar replacing the static daily pledge. |",
    },
    {
        "file": "docs/ROADMAP.md",
        "desc": "PROJ-41 RECENTLY SHIPPED line: add a pointer to the Card 3 descope so the summary doesn't silently disagree with the spec's own §6 addendum.",
        "old": "* `PROJ-41` The Dynamic Anchor (Circadian Companion Widget)",
        "new": "* `PROJ-41` The Dynamic Anchor (Circadian Companion Widget) — ships as a 2-card Check-In/Reading bar; the spec'd 3rd \"Intent\" card was descoped and its dead code removed, see docs/projects/41_DYNAMIC_ANCHOR.md §6.",
    },
    {
        "file": "docs/BACKLOG.md",
        "desc": "Add PROJ-23 (QA Sentinel / Playwright E2E) to Parked/Unscheduled — currently an orphan spec (archived, referenced nowhere) despite being a real open gap: PROJ-40 only backfilled unit tests, not the E2E golden-path suite this spec scopes.",
        "old": "* **PROJ-45 — Adaptive Persona UI Engine.** Full spec exists at `docs/projects/45_ADAPTIVE_PERSONA_UI.md`. Status: ⚪ Planned — PARKED, explicitly not in active sprint pending the Open Questions in the spec's §6.",
        "new": (
            "* **PROJ-45 — Adaptive Persona UI Engine.** Full spec exists at `docs/projects/45_ADAPTIVE_PERSONA_UI.md`. Status: ⚪ Planned — PARKED, explicitly not in active sprint pending the Open Questions in the spec's §6.\n"
            "* **PROJ-23 — The QA Sentinel (Playwright E2E pipeline).** Full spec exists at `docs/projects/archive/23_QA_SENTINEL.md`. Status: ⚪ Planned — not yet built; PROJ-40 backfilled unit-test coverage only, so the E2E golden-path suite this spec scopes remains an open gap. Surfaced during the 2026-07-16 governance audit (previously an orphan spec referenced nowhere)."
        ),
    },
    {
        "file": "docs/projects/38_URGE_INTERVENTION.md",
        "desc": "Add a forward-looking implementation note: the spec's new `urge_events` collection has no firestore.rules entry yet (flagged as a Check I security-gap finding, unbuilt so not yet live).",
        "old": "}\n\nType Location\nsrc/lib/types/urge.ts",
        "new": (
            "}\n\n"
            "**Implementation note (added 2026-07-16 governance audit):** When this collection is built, add an "
            "owner-scoped `firestore.rules` entry in the same PR that ships the first write path (matching the "
            "`journals`/`tasks` pattern: `allow create: if isCreatingOwnedResource(); allow read, update, delete: "
            "if isResourceOwner();`) — do not defer it to a follow-up.\n\n"
            "Type Location\nsrc/lib/types/urge.ts"
        ),
    },
    {
        "file": "docs/projects/archive/27_SMART_TOOLS.md",
        "desc": "Add a one-line pointer so this archived spec isn't an orphan — it's the as-built baseline PROJ-50 extended, not superseded, but currently referenced nowhere in current governance docs.",
        "old": "# 📁 Project 27: The CBT Engine (SMART Tools)",
        "new": (
            "> Extended by PROJ-50 (Guided CBT/REBT Interactive Workflows) — see "
            "[`../50_GUIDED_CBT.md`](../50_GUIDED_CBT.md). This spec remains the as-built baseline PROJ-50 built on top of.\n\n"
            "# 📁 Project 27: The CBT Engine (SMART Tools)"
        ),
    },
    {
        "file": "docs/projects/archive/23_QA_SENTINEL.md",
        "desc": "Add a one-line pointer now that PROJ-23 is tracked in BACKLOG.md (Parked/Unscheduled) as of this sync.",
        "old": "# 📁 Project 23: The QA Sentinel",
        "new": (
            "> Parked — tracked in [`docs/BACKLOG.md`](../../BACKLOG.md) (Parked / Unscheduled) as of 2026-07-16. "
            "The Playwright E2E golden-path suite scoped here has not been built; PROJ-40 covered unit-test coverage only.\n\n"
            "# 📁 Project 23: The QA Sentinel"
        ),
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

        print("  --- OLD ---")
        print(f"  {patch['old'][:300]}")
        print("  --- NEW ---")
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
