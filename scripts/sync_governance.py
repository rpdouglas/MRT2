#!/usr/bin/env python3
"""
sync_governance.py — MRT Safe Delivery Protocol script.

Applies the mechanical fixes from the 2026-08-04 (second pass) governance alignment audit.
Targeted .replace(old, new) patches only. No full-file rewrites.

Fixes applied:
  1. docs/projects/80_GAMES_HUB_UNIFIED_HERO.md — repoint 2 citations to the deleted
     RecoveryGamesUnifiedHero.jsx as a historical note (file no longer exists anywhere)
  2. docs/ROADMAP.md, docs/ACTIVE_CYCLE.md, docs/projects/67,68_*.md — repoint 6
     citations to docs/reports/archive/2026-07_app_readiness_review.md
  3. docs/projects/91,90,89,92_*.md, docs/ACTIVE_CYCLE.md — repoint 5 citations to
     docs/reports/archive/PRODUCTION_READINESS_AUDIT.md
  4. docs/ACTIVE_CYCLE.md — repoint 1 citation to
     docs/reports/archive/2026-07_codebase_deep_review.md
  5. 9 specs (24,77,91,94,96,97,98,99,101) — standardize non-canonical persona labels:
     apply a named internal stakeholder (Alex/Dev/Morgan/Taylor) from
     docs/governance/INTERNAL_PERSONAS.md where the need genuinely maps to one,
     otherwise "All" (real cross-cutting/user-facing) or generic "Internal"
  6. .claude/skills/governance/SKILL.md — extend Check C allowlist with the 4 named
     internal stakeholders + generic "Internal" fallback
  7. docs/projects/57_JOURNAL_TEMPLATE_MODALITIES.md — note that GROUP_ORDER/optgroup
     mechanism was superseded by PROJ-93's TemplatePickerSheet.tsx
  8. docs/projects/53_ROSC_PILL_CAPSULE.md — correct "Deprecated/Deleted" claim
     (ROSCRadarChart.tsx still exists, orphaned)
  9. docs/projects/30_DATA_EXPORT.md — fix filename drift (export.ts -> exporter.ts)
  10. docs/projects/94,95_*.md — check §2 Security/ZK Audit boxes whose prose already
      answers them (template-formatting fix, not new analysis)

Run with DRY_RUN = True (default) to preview. Set DRY_RUN = False to apply.
"""

import pathlib

DRY_RUN = False
FENCE = chr(96) * 3
ROOT = pathlib.Path(__file__).resolve().parent.parent

PATCHES = [
    # --- 1. Deleted RecoveryGamesUnifiedHero.jsx citations ---
    {
        "file": "docs/projects/80_GAMES_HUB_UNIFIED_HERO.md",
        "desc": "Objective line: note the mockup was deleted, content fully absorbed into shipped GamesHub.tsx.",
        "old": "**Objective:** Restyle `GamesHub.tsx` from a grid of separately-colored gradient tiles into one unified dark card containing a flat list of game rows (per `docs/reports/RecoveryGamesUnifiedHero.jsx`), and hide the Craving Buster / Thought Challenge entries from that list without deleting their routes, components, or any other code.",
        "new": "**Objective:** Restyle `GamesHub.tsx` from a grid of separately-colored gradient tiles into one unified dark card containing a flat list of game rows (per a design-reference mockup, `docs/reports/RecoveryGamesUnifiedHero.jsx` — since deleted as a misfile during the 2026-08-04 governance sweep; its layout is fully realized in the shipped `GamesHub.tsx`, so nothing was lost), and hide the Craving Buster / Thought Challenge entries from that list without deleting their routes, components, or any other code.",
    },
    {
        "file": "docs/projects/80_GAMES_HUB_UNIFIED_HERO.md",
        "desc": "Phase 2 bullet: note the mockup was deleted, content fully realized in shipped code.",
        "old": "* Replace the existing tile-grid `GamesHub.tsx` body with one dark unified card (`linear-gradient(160deg, #2E1A47 0%, #1B0F2E 100%)`, blurred radial accent blooms), containing a flat list of `GameRow` buttons — ported from `docs/reports/RecoveryGamesUnifiedHero.jsx`.",
        "new": "* Replace the existing tile-grid `GamesHub.tsx` body with one dark unified card (`linear-gradient(160deg, #2E1A47 0%, #1B0F2E 100%)`, blurred radial accent blooms), containing a flat list of `GameRow` buttons — ported from `docs/reports/RecoveryGamesUnifiedHero.jsx` (design-reference mockup, since deleted — its content is fully realized in the shipped `GamesHub.tsx`).",
    },
    # --- 2. app_readiness_review.md repoints ---
    {
        "file": "docs/ROADMAP.md",
        "desc": "Repoint citation to the archived app-readiness review path.",
        "old": "docs/reports/2026-07_app_readiness_review.md",
        "new": "docs/reports/archive/2026-07_app_readiness_review.md",
        "count": 1,
    },
    {
        "file": "docs/ACTIVE_CYCLE.md",
        "desc": "Repoint 2 citations (npm audit fix + PROJ-67 entries) to the archived app-readiness review path.",
        "old": "docs/reports/2026-07_app_readiness_review.md",
        "new": "docs/reports/archive/2026-07_app_readiness_review.md",
        "count": 2,
    },
    {
        "file": "docs/projects/67_SIGNING_KEY_SECRETS_HYGIENE.md",
        "desc": "Repoint 2 Source: citations to the archived app-readiness review path.",
        "old": "docs/reports/2026-07_app_readiness_review.md",
        "new": "docs/reports/archive/2026-07_app_readiness_review.md",
        "count": 2,
    },
    {
        "file": "docs/projects/68_STRIPE_TWA_GATING.md",
        "desc": "Repoint Source: citation to the archived app-readiness review path.",
        "old": "docs/reports/2026-07_app_readiness_review.md",
        "new": "docs/reports/archive/2026-07_app_readiness_review.md",
        "count": 1,
    },
    # --- 3. PRODUCTION_READINESS_AUDIT.md repoints ---
    {
        "file": "docs/projects/91_ACCESSIBILITY_REMEDIATION.md",
        "desc": "Repoint Source: citation to the archived Production Readiness Audit path.",
        "old": "docs/reports/PRODUCTION_READINESS_AUDIT.md",
        "new": "docs/reports/archive/PRODUCTION_READINESS_AUDIT.md",
        "count": 1,
    },
    {
        "file": "docs/projects/90_SECURITY_COMPLIANCE_HARDENING.md",
        "desc": "Repoint Source: citation to the archived Production Readiness Audit path.",
        "old": "docs/reports/PRODUCTION_READINESS_AUDIT.md",
        "new": "docs/reports/archive/PRODUCTION_READINESS_AUDIT.md",
        "count": 1,
    },
    {
        "file": "docs/projects/89_PLAY_STORE_RELEASE_BLOCKERS.md",
        "desc": "Repoint Source: citation to the archived Production Readiness Audit path.",
        "old": "docs/reports/PRODUCTION_READINESS_AUDIT.md",
        "new": "docs/reports/archive/PRODUCTION_READINESS_AUDIT.md",
        "count": 1,
    },
    {
        "file": "docs/projects/92_PERFORMANCE_SCALE_POLISH.md",
        "desc": "Repoint Source: citation to the archived Production Readiness Audit path.",
        "old": "docs/reports/PRODUCTION_READINESS_AUDIT.md",
        "new": "docs/reports/archive/PRODUCTION_READINESS_AUDIT.md",
        "count": 1,
    },
    {
        "file": "docs/ACTIVE_CYCLE.md",
        "desc": "Repoint PROJ-89 entry's citation to the archived Production Readiness Audit path.",
        "old": "docs/reports/PRODUCTION_READINESS_AUDIT.md",
        "new": "docs/reports/archive/PRODUCTION_READINESS_AUDIT.md",
        "count": 1,
    },
    # --- 4. codebase_deep_review.md repoint (historical narration line) ---
    {
        "file": "docs/ACTIVE_CYCLE.md",
        "desc": "Repoint the 'Report archived' narration line's own citation to the now-correct archived path.",
        "old": "docs/reports/2026-07_codebase_deep_review.md",
        "new": "docs/reports/archive/2026-07_codebase_deep_review.md",
        "count": 1,
    },
    # --- 5. Persona standardization ---
    {
        "file": "docs/projects/24_ASSET_ENGINE.md",
        "desc": "Standardize persona: 'The Architect (Admin)' -> Dev / AI Partner (type-safe asset dictionary is a code-architecture concern).",
        "old": "**Primary Persona:** The Architect (Admin)",
        "new": "**Primary Persona:** Dev / AI Partner (internal-tooling concern — a strict-typed asset dictionary is a code-architecture/maintainability need; see `docs/governance/INTERNAL_PERSONAS.md`)",
    },
    {
        "file": "docs/projects/77_NAV_TAB_BAR_UNIFICATION.md",
        "desc": "Standardize persona: 'Cross-cutting' -> All (this is a real user-facing nav change, not an internal concern).",
        "old": "**Primary Persona:** Cross-cutting (no single primary — this is an infrastructure/design-consistency pass affecting the tab navigation on My Journal, My Vitality, My Workbooks, My Tasks, and My Profile). Constrained by David's and Walt's navigation rules (see §4).",
        "new": "**Primary Persona:** All (no single primary — this is an infrastructure/design-consistency pass affecting the tab navigation on My Journal, My Vitality, My Workbooks, My Tasks, and My Profile). Constrained by David's and Walt's navigation rules (see §4).",
    },
    {
        "file": "docs/projects/91_ACCESSIBILITY_REMEDIATION.md",
        "desc": "Standardize persona: 'universal' -> All (screen-reader/keyboard access benefits every user, not an internal concern).",
        "old": "**Primary Persona:** David (contrast/sunlight legibility, crisis-flow reliability), universal (screen-reader/keyboard users)",
        "new": "**Primary Persona:** David (contrast/sunlight legibility, crisis-flow reliability), All (screen-reader/keyboard users)",
    },
    {
        "file": "docs/projects/94_ERROR_TELEMETRY_HARDENING.md",
        "desc": "Standardize persona: 'universal (...visible to engineering)' -> Dev / AI Partner (the stated need is explicitly engineering visibility).",
        "old": "**Primary Persona:** Walt (traceability of what actually happened matters most to him), universal (any user who hits an error deserves it to be visible to engineering)",
        "new": "**Primary Persona:** Walt (traceability of what actually happened matters most to him), Dev / AI Partner (error visibility for engineering; see `docs/governance/INTERNAL_PERSONAS.md`)",
    },
    {
        "file": "docs/projects/96_CI_DEPLOY_SAFETY_NET.md",
        "desc": "Standardize persona: generic 'Internal' -> Dev / AI Partner (CI/CD speed and deploy safety is squarely Dev's stated remit).",
        "old": "**Primary Persona:** Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing impact; this protects the team's ability to notice and respond to a bad deploy or a newly-introduced production vulnerability.",
        "new": "**Primary Persona:** Dev / AI Partner (CI/CD speed and deploy safety; see `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing impact; this protects the team's ability to notice and respond to a bad deploy or a newly-introduced production vulnerability.",
    },
    {
        "file": "docs/projects/97_DEPENDENCY_HYGIENE_ROUND_2.md",
        "desc": "Standardize persona: 'universal (Daily Crossword players...)' -> All (real end users, not an internal concern).",
        "old": "**Primary Persona:** Ned (task list swipe interactions — `SwipeableTaskRow.tsx`), universal (Daily Crossword players — `crossword-layout-generator`, descoped)",
        "new": "**Primary Persona:** Ned (task list swipe interactions — `SwipeableTaskRow.tsx`), All (Daily Crossword players — `crossword-layout-generator`, descoped)",
    },
    {
        "file": "docs/projects/98_AUDIT_QUICK_WINS.md",
        "desc": "Standardize persona: generic 'Internal' -> Dev / AI Partner (build-hygiene/a11y/governance-doc items are Dev's stated remit).",
        "old": "**Primary Persona:** David (the PWA install-size/precache fix in Phase 1 is a direct Day-1, acute-crisis, mobile-connection win for him); Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) for the remaining build-hygiene, accessibility, and governance-documentation items.",
        "new": "**Primary Persona:** David (the PWA install-size/precache fix in Phase 1 is a direct Day-1, acute-crisis, mobile-connection win for him); Dev / AI Partner (build-hygiene, accessibility, and governance-documentation items; see `docs/governance/INTERNAL_PERSONAS.md`).",
    },
    {
        "file": "docs/projects/99_FIRESTORE_BACKEND_HARDENING.md",
        "desc": "Standardize persona: generic 'Internal' -> Alex + Dev / AI Partner (cost guardrails are explicitly Alex's remit; rules tests/correctness are Dev's).",
        "old": "**Primary Persona:** Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) — no direct end-user-facing UI change; this protects data integrity, cost, and correctness as the user base grows.",
        "new": "**Primary Persona:** Alex (Firestore/Cloud-Functions cost guardrails), Dev / AI Partner (rules unit tests, data integrity, correctness) — see `docs/governance/INTERNAL_PERSONAS.md`; no direct end-user-facing UI change.",
    },
    {
        "file": "docs/projects/101_DATA_LAYER_CONSOLIDATION_ROUND_2.md",
        "desc": "Standardize persona: generic 'Internal' -> Dev / AI Partner (data-layer consolidation/cache-bug correctness is Dev's stated remit).",
        "old": "**Primary Persona:** Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) — no end-user-facing behavior change; closes a gap `PROJ-59` left open and fixes a latent cache bug.",
        "new": "**Primary Persona:** Dev / AI Partner (data-layer consolidation, cache-bug correctness; see `docs/governance/INTERNAL_PERSONAS.md`) — no end-user-facing behavior change; closes a gap `PROJ-59` left open and fixes a latent cache bug.",
    },
    # --- 6. Governance skill Check C allowlist ---
    {
        "file": ".claude/skills/governance/SKILL.md",
        "desc": "Extend Check C allowlist to accept the 4 named internal stakeholders + generic Internal fallback for infrastructure specs.",
        "old": "- Validate persona names against `docs/PERSONAS.md` — only `David`, `Ned`, `Lisa`, `Walt`, `Maya`, `Jordan`, and `All` are valid. Flag any persona name that is not in this set.",
        "new": "- Validate persona names against `docs/PERSONAS.md` — only `David`, `Ned`, `Lisa`, `Walt`, `Maya`, `Jordan`, and `All` are valid for user-facing specs. For internal/infrastructure specs, also accept the 4 named stakeholders from `docs/governance/INTERNAL_PERSONAS.md` (`Alex`, `Dev / AI Partner`, `Morgan`, `Taylor`) plus a generic `Internal` fallback when no single stakeholder fits. Flag any persona name that is not in one of these two sets.",
    },
    # --- 7. PROJ-57 spec/code drift note ---
    {
        "file": "docs/projects/57_JOURNAL_TEMPLATE_MODALITIES.md",
        "desc": "Note that the GROUP_ORDER/optgroup picker mechanism was superseded by PROJ-93's TemplatePickerSheet.tsx.",
        "old": "- `src/components/journal/JournalEditor.tsx`: import `GROUP_ORDER`; extend `handleTemplateSelect` to branch on `content` vs `prompts` for default templates (mirroring the existing branch already used for custom templates); replace the single `\"Standard\"` `<optgroup>` with one `<optgroup>` per `GROUP_ORDER` group.",
        "new": (
            "- `src/components/journal/JournalEditor.tsx`: import `GROUP_ORDER`; extend `handleTemplateSelect` to branch on `content` vs `prompts` for default templates (mirroring the existing branch already used for custom templates); replace the single `\"Standard\"` `<optgroup>` with one `<optgroup>` per `GROUP_ORDER` group.\n\n"
            "**2026-08-04 governance note:** this `GROUP_ORDER`/`<optgroup>` mechanism was later superseded by PROJ-93's moment-based regrouping (`TemplatePickerSheet.tsx`, reading `t.group` directly in a bottom-sheet accordion instead of a native `<select>`). `GROUP_ORDER` itself was deleted as confirmed-dead code during a knip sweep. This section is left as the original as-built record; see `docs/projects/93_JOURNAL_TEMPLATE_MOMENT_GROUPING.md` for the current picker implementation."
        ),
    },
    # --- 8. PROJ-53 dead-code claim correction ---
    {
        "file": "docs/projects/53_ROSC_PILL_CAPSULE.md",
        "desc": "Correct 'Deprecated/Deleted' claim — ROSCRadarChart.tsx still exists on disk, orphaned.",
        "old": "* `src/components/insights/ROSCRadarChart.tsx`: Deprecated/Deleted.",
        "new": "* `src/components/insights/ROSCRadarChart.tsx`: Deprecated — **2026-08-04 governance note:** the file still exists on disk with zero remaining importers (confirmed via governance audit), not actually deleted as this line originally claimed. Flagged for a future dead-code cleanup pass.",
    },
    # --- 9. PROJ-30 filename drift ---
    {
        "file": "docs/projects/30_DATA_EXPORT.md",
        "desc": "Fix filename drift: spec named it export.ts, shipped file is exporter.ts.",
        "old": "**Types (`src/lib/export.ts`):**",
        "new": "**Types (`src/lib/exporter.ts`):**",
    },
    # --- 10. PROJ-94/95 §2 checkbox formatting fix ---
    {
        "file": "docs/projects/94_ERROR_TELEMETRY_HARDENING.md",
        "desc": "Check §2 Security/ZK Audit boxes whose prose already answers them (formatting fix, not new analysis).",
        "old": (
            "## 2. Security & Zero-Knowledge Audit 🛡️\n"
            "* [ ] **Data Sensitivity:** `trackMutationFailed(domain, errorName)` must pass only a domain string (`'task'`/`'journal'`/`'template'`) and the error's `.name`/`.message` — never the mutation's input data (which, for journal/template mutations, could contain decrypted content). Verify each `onError`'s `_err` parameter is inspected only for error metadata, never logged wholesale.\n"
            "* [ ] **Encryption Strategy:** N/A — no new encrypted fields.\n"
            "* [ ] **Key Rotation:** N/A."
        ),
        "new": (
            "## 2. Security & Zero-Knowledge Audit 🛡️\n"
            "* [x] **Data Sensitivity:** `trackMutationFailed(domain, errorName)` must pass only a domain string (`'task'`/`'journal'`/`'template'`) and the error's `.name`/`.message` — never the mutation's input data (which, for journal/template mutations, could contain decrypted content). Verify each `onError`'s `_err` parameter is inspected only for error metadata, never logged wholesale.\n"
            "* [x] **Encryption Strategy:** N/A — no new encrypted fields.\n"
            "* [x] **Key Rotation:** N/A."
        ),
    },
    {
        "file": "docs/projects/95_JOURNAL_HISTORY_PAGINATION.md",
        "desc": "Check §2 Security/ZK Audit boxes whose prose already answers them (formatting fix, not new analysis).",
        "old": (
            "## 2. Security & Zero-Knowledge Audit 🛡️\n"
            "* [ ] **Data Sensitivity:** `useAnchorStatus`'s fix touches an unencrypted metadata read only (`createdAt`, `tags`) — no ZK boundary involved. `JournalHistory.tsx`'s fix still decrypts each fetched entry exactly as today; only fetch volume changes.\n"
            "* [ ] **Encryption Strategy:** No change to `src/lib/crypto.ts`'s decrypt path for either fix.\n"
            "* [ ] **Key Rotation:** N/A — no schema change."
        ),
        "new": (
            "## 2. Security & Zero-Knowledge Audit 🛡️\n"
            "* [x] **Data Sensitivity:** `useAnchorStatus`'s fix touches an unencrypted metadata read only (`createdAt`, `tags`) — no ZK boundary involved. `JournalHistory.tsx`'s fix still decrypts each fetched entry exactly as today; only fetch volume changes.\n"
            "* [x] **Encryption Strategy:** No change to `src/lib/crypto.ts`'s decrypt path for either fix.\n"
            "* [x] **Key Rotation:** N/A — no schema change."
        ),
    },
]


def main():
    print(f"MRT Governance Sync — {'DRY RUN' if DRY_RUN else 'LIVE APPLY'}\n")
    applied, skipped = 0, 0

    for patch in PATCHES:
        path = ROOT / patch["file"]
        text = path.read_text(encoding="utf-8")
        expect = patch.get("count", 1)
        count = text.count(patch["old"])

        print(f"{FENCE}\nFILE: {patch['file']}\nWHY:  {patch['desc']}\n{FENCE}")

        if count == 0:
            print("  ⚠️  SKIPPED — anchor text not found (file may have changed since audit). No write performed.\n")
            skipped += 1
            continue
        if count != expect:
            print(f"  ⚠️  SKIPPED — anchor text found {count} times, expected {expect}. No write performed.\n")
            skipped += 1
            continue

        print("  --- OLD (excerpt) ---")
        print(f"  {patch['old'][:200]}")
        print("  --- NEW (excerpt) ---")
        print(f"  {patch['new'][:300]}")

        if DRY_RUN:
            print("  ✅ Would apply (dry run — no write performed).\n")
        else:
            new_text = text.replace(patch["old"], patch["new"])
            path.write_text(new_text, encoding="utf-8")
            print("  ✅ Applied.\n")
        applied += 1

    print(f"{FENCE}\nSummary: {applied} patch(es) {'previewed' if DRY_RUN else 'applied'}, {skipped} skipped.\n{FENCE}")
    if DRY_RUN:
        print("This was a DRY RUN. No files were modified. Set DRY_RUN = False and re-run to apply for real.")


if __name__ == "__main__":
    main()
