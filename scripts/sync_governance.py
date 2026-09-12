#!/usr/bin/env python3
"""One-off governance sync — applies the fixes from the 2026-09-12 governance
audit (APPLY ALL). Targeted .replace() patches only, no full-file rewrites.
Run with DRY_RUN = True first; only flip to False after reviewing the diff.
"""

DRY_RUN = False
FENCE = chr(96) * 3

PATCHES = []


def patch(path, old, new, label):
    PATCHES.append((path, old, new, label))


# ---------------------------------------------------------------------------
# 1. docs/projects/120_TEMPLATE_EDITOR_TIER_GATE.md — fix header after rename
#    (108 -> 120, resolving the duplicate-PROJ-ID collision with
#    108_PERSONA_ASSET_REFRESH.md)
# ---------------------------------------------------------------------------
patch(
    "docs/projects/120_TEMPLATE_EDITOR_TIER_GATE.md",
    "# 📁 Project 108: Gate the `/templates` Route Itself, Not Just Its Entry Point",
    "# 📁 Project 120: Gate the `/templates` Route Itself, Not Just Its Entry Point",
    "Renumber header 108 -> 120",
)

# ---------------------------------------------------------------------------
# 2. docs/ROADMAP.md — PROJ-111 (MAT Dose Tracking) is shipped, not Planned
# ---------------------------------------------------------------------------
patch(
    "docs/ROADMAP.md",
    "| ⚪ Planned | `NEW` | **MAT Dose-Tracking & Discreet Notifications (Jordan)** | Jordan | Build what `docs/PERSONAS.md` documents for Jordan but doesn't exist in code: dose-adherence tracking, a customizable sobriety-counter label (e.g. \"Days of Stability\" instead of a fixed counter), and discreet, drug-name-free lock-screen notifications. Promoted 2026-09-03 from `docs/BACKLOG.md`'s \"Jordan discreet-UI feature depth audit\" — its trigger (\"before marketing that targets the MAT/Jordan segment\") fired while drafting the `docs/marketing/` persona briefs, which confirmed the gap directly (no counter-label prop on `SobrietyHero.tsx`; no MAT/dose-specific code anywhere in `src/`). **Spec drafted 2026-09-03:** `docs/projects/111_MAT_DOSE_TRACKING.md` — ready for `/planning` (3-strategy proposal) before code starts. |",
    "| ✅ **Shipped** | `PROJ-111` | **MAT Dose-Tracking & Discreet Notifications (Jordan)** | Jordan | Built what `docs/PERSONAS.md` documents for Jordan: one-tap `mat_doses` dose log, a customizable sobriety-counter label (`customCounterLabel`), and discreet, drug-name-free push reminders (`computeMatReminderAlert`, fixed generic copy only). Promoted 2026-09-03 from `docs/BACKLOG.md`'s \"Jordan discreet-UI feature depth audit.\" **Phases 1-3 shipped 2026-09-04** — see `docs/projects/111_MAT_DOSE_TRACKING.md`. AI correlation (\"Side-Effect Correlation Matrix\") remains explicit future scope. |",
    "PROJ-111 status: Planned -> Shipped",
)

# ---------------------------------------------------------------------------
# 3. docs/ROADMAP.md — RECENTLY SHIPPED backfill for the orphaned 105-119
#    burst (106, 107, 108x2, 109, 110, 111, 116, 117 — none previously listed)
# ---------------------------------------------------------------------------
_recently_shipped_new_entries = """* `PROJ-117` Testing & CI Gap Remediation (Closed all 8 recommendations from the 2026-09 testing-strategy gap analysis: a real `Build` step and an `E2E Security` step added to the CI `verify` gate, `service`/`workbook_answers` Firestore rules tests, `syncStripeSubscription`/`handlePlayRTDN`'s tier-decision logic extracted and unit tested, and the accessibility scan expanded from 7 to 12 routes — surfacing and fixing real, previously-uncaught WCAG violations on every newly-added route except one.)
* `PROJ-116` Welcome Page Persona Quiz & Redesign (Restructured the public Welcome page around a 4-question "Find Your Recovery Season" persona-matching quiz, added a standalone crisis-bypass link in a sticky trust bar, and — in a 2026-09-09 amendment — gave Android-TWA visitors a minimal auth-only landing instead of the full marketing funnel they no longer need post-install.)
* `PROJ-111` MAT Dose-Tracking & Discreet Notifications (Jordan) (One-tap daily `mat_doses` log, a customizable sobriety-counter label, and discreet drug-name-free push reminders for MAT/harm-reduction users — closing three concrete gaps a 2026-09-03 audit confirmed were entirely absent from the app.)
* `PROJ-110` Data Import Integrity & Zero-Knowledge Restore Fix (Fixed the "restore a backup" flow to actually restore tasks/workbook answers/game history, not just journals, and to re-encrypt recovered content through the live vault key instead of writing plaintext into an encrypted collection — plus a follow-up fix to a related `exporter.ts` decrypt bug found during the same investigation.)
* `PROJ-109` CI/CD Branch Strategy & Environment Promotion (Fixed `claude/*` session branches — the pattern nearly all work happens on — never triggering the DEV deploy pipeline; made `main` PR-only with a required, verified-working CI check; documented UAT's dormant-by-design status.)
* `PROJ-108` Persona Asset Refresh (Unified all six personas on one pop-art illustration style, implemented the long-documented but never-built `full_body`/`looking_left` asset keys, and replaced the dead pre-baked bio-image concept with a code-rendered `PersonaBioCard`, closing the Maya/Jordan bio-content gap.)
* `PROJ-120` Template Editor Tier Gate (Gated the `/templates` route and `TemplateEditor.tsx` itself behind `PremiumGate`, closing the CLAUDE.md-flagged gap where only the button linking to the feature was tier-gated, not the feature surface itself. Renumbered from its original PROJ-108 during the 2026-09-12 governance sync to resolve a duplicate-ID collision with the Persona Asset Refresh ticket.)
* `PROJ-107` Profile Page Tier Visibility & Upgrade Entry Point (Added a source-aware tier card to Profile's General tab — badge + upgrade/manage CTA — closing the gap where no voluntary path to `/premium` existed anywhere in the app outside a reactive paywall trigger.)
* `PROJ-106` Close the Uncapped AI Cost Gap (3 Ungated Gemini Flows) (Closed a live, uncapped Gemini API cost exposure on `workbook_analysis`/`audio_analysis` (free-tier cooldowns) and `workbook_coach` (an all-tier anti-abuse floor), found while scoping PROJ-105.)
"""
patch(
    "docs/ROADMAP.md",
    '* `PROJ-113` Daily Inspirational Image (Admin-uploaded daily inspirational image library (Firebase Storage), nightly round-robin rotation into daily_images/{date}, a once-per-day Dashboard popup with native share and a structured linkedImageId reference on journal entries created from it.)\n* `PROJ-97` Dependency Hygiene Round 2',
    '* `PROJ-113` Daily Inspirational Image (Admin-uploaded daily inspirational image library (Firebase Storage), nightly round-robin rotation into daily_images/{date}, a once-per-day Dashboard popup with native share and a structured linkedImageId reference on journal entries created from it.)\n'
    + _recently_shipped_new_entries
    + '* `PROJ-97` Dependency Hygiene Round 2',
    "Backfill RECENTLY SHIPPED with 106/107/108/109/110/111/116/117/120",
)

# ---------------------------------------------------------------------------
# 4. docs/ACTIVE_CYCLE.md — same backfill into Resolved This Cycle
# ---------------------------------------------------------------------------
_resolved_new_entries = """- [x] **PROJ-117:** Testing & CI Gap Remediation — Closed all 8 recommendations from the 2026-09 testing-strategy gap analysis: a real `Build` step and an `E2E Security` step added to CI's `verify` gate, `service`/`workbook_answers` Firestore rules tests, two Cloud Functions' tier-decision logic extracted and unit tested, and the accessibility scan expanded from 7 to 12 routes.
- [x] **PROJ-116:** Welcome Page Persona Quiz & Redesign — Restructured the public Welcome page around a persona-matching quiz and a crisis-bypass trust bar; a 2026-09-09 amendment gave Android-TWA visitors a minimal auth-only landing.
- [x] **PROJ-111:** MAT Dose-Tracking & Discreet Notifications (Jordan) — One-tap daily dose log, a customizable sobriety-counter label, and discreet drug-name-free push reminders for MAT/harm-reduction users.
- [x] **PROJ-110:** Data Import Integrity & Zero-Knowledge Restore Fix — Fixed the backup-restore flow to cover tasks/workbook answers/game history (not just journals) and to re-encrypt recovered content instead of writing plaintext.
- [x] **PROJ-109:** CI/CD Branch Strategy & Environment Promotion — Fixed `claude/*` branches never triggering the DEV deploy pipeline; made `main` PR-only with a required, verified CI check.
- [x] **PROJ-108:** Persona Asset Refresh — Unified all six personas on one pop-art illustration style; implemented `full_body`/`looking_left`; replaced the dead pre-baked bio-image concept with a code-rendered `PersonaBioCard`.
- [x] **PROJ-120:** Template Editor Tier Gate — Gated the `/templates` route itself behind `PremiumGate`, not just the button linking to it. Renumbered from PROJ-108 during the 2026-09-12 governance sync to resolve a duplicate-ID collision.
- [x] **PROJ-107:** Profile Page Tier Visibility & Upgrade Entry Point — Added a source-aware tier card + upgrade/manage CTA to Profile, closing the gap where no voluntary entry point to `/premium` existed anywhere in the app.
- [x] **PROJ-106:** Close the Uncapped AI Cost Gap (3 Ungated Gemini Flows) — Closed a live, uncapped Gemini cost exposure on `workbook_analysis`/`audio_analysis`/`workbook_coach`, found while scoping PROJ-105.
"""
patch(
    "docs/ACTIVE_CYCLE.md",
    "- [x] **PROJ-113:** Daily Inspirational Image — Admin-uploaded daily inspirational image library (Firebase Storage), nightly round-robin rotation into daily_images/{date}, a once-per-day Dashboard popup with native share and a structured linkedImageId reference on journal entries created from it.\n- [x] **PROJ-97:**",
    "- [x] **PROJ-113:** Daily Inspirational Image — Admin-uploaded daily inspirational image library (Firebase Storage), nightly round-robin rotation into daily_images/{date}, a once-per-day Dashboard popup with native share and a structured linkedImageId reference on journal entries created from it.\n"
    + _resolved_new_entries
    + "- [x] **PROJ-97:**",
    "Backfill Resolved This Cycle with 106/107/108/109/110/111/116/117/120",
)

# ---------------------------------------------------------------------------
# 5. docs/BACKLOG.md — strike the Jordan/MAT entry (PROJ-111 already shipped,
#    not just promoted/needs-a-spec), matching this file's own precedent for
#    other superseded-by-a-shipped-ticket entries.
# ---------------------------------------------------------------------------
patch(
    "docs/BACKLOG.md",
    '* ~~**Jordan (MAT persona) discreet-UI feature depth audit.**~~ **Promoted 2026-09-03 — trigger met.** This item\'s own trigger ("proactively before marketing that specifically targets the MAT/Jordan segment") fired while drafting the `docs/marketing/` persona briefs, which reference Jordan directly. What the original finalreview audit left as "stated but not fully traced" is now confirmed, not just suspected: no custom counter-label prop exists anywhere on `SobrietyHero.tsx` (Dashboard\'s sobriety counter is hardcoded to Years/Months/Days), and a direct grep of `src/` for medication/dose/MAT/Suboxone/Naltrexone turned up zero real matches — no dose-logging UI, no MAT-specific handling, anywhere in the app. See `docs/marketing/dashboard.md` and `docs/marketing/tasks.md`\'s Jordan sections for the guardrails this drove (don\'t promise these features in copy). Moved to `docs/ROADMAP.md` Wave 1 — needs a spec via `/planning`.',
    '* ~~**Jordan (MAT persona) discreet-UI feature depth audit.**~~ **Shipped 2026-09-04 as `PROJ-111`.** Promoted 2026-09-03 (trigger: "proactively before marketing that specifically targets the MAT/Jordan segment"), spec\'d the same day, and built the next day: one-tap `mat_doses` log, `customCounterLabel`, and discreet drug-name-free push reminders. See `docs/projects/111_MAT_DOSE_TRACKING.md`. This entry was found still describing the pre-spec "needs `/planning`" state during the 2026-09-12 governance audit, five days after it actually shipped — `docs/ROADMAP.md`/`docs/ACTIVE_CYCLE.md` had the same drift, fixed in the same pass.',
    "Strike the stale Jordan/MAT backlog entry",
)

# ---------------------------------------------------------------------------
# 6. docs/BACKLOG.md — give PROJ-119 its own tracked line (previously only
#    mentioned in passing inside the PROJ-118 bullet, not as its own entry)
# ---------------------------------------------------------------------------
patch(
    "docs/BACKLOG.md",
    "## 🔧 Infrastructure & Scale Triggers (No persona — internal readiness, no spec written yet)",
    "* **`PROJ-119` — Notification Category Preferences.** Full spec exists at `docs/projects/119_NOTIFICATION_CATEGORY_PREFERENCES.md`. Status: ⚪ Planned, strategy drafted but not yet through `/planning`'s implementation approval — blocked on `PROJ-118`'s Phase 1 device verification (the notification-channel/delegation groundwork this depends on is already built; what's missing is confirming it works on a real device). Previously only mentioned in passing inside the `PROJ-118` bullet above, not tracked as its own line — given one here during the 2026-09-12 governance audit.\n\n## 🔧 Infrastructure & Scale Triggers (No persona — internal readiness, no spec written yet)",
    "Give PROJ-119 its own tracked BACKLOG line",
)

# ---------------------------------------------------------------------------
# 7. docs/projects/102_SEO_AEO_OPTIMIZATION.md — Status header contradicted
#    its own body (Phases 0-3 all marked DONE with dates, header said Planned)
# ---------------------------------------------------------------------------
patch(
    "docs/projects/102_SEO_AEO_OPTIMIZATION.md",
    "**Status:** ⚪ Planned",
    "**Status:** 🟡 In Progress — Phases 0-3 shipped 2026-08-30/31 (crawl infra, per-route metadata/renderability, docs-site + AEO content); only Phase 4 (external verification: Search Console/Bing enrollment, Rich Results Test, social-preview check) remains open. Corrected 2026-09-12 — the header had said Planned since this file was created despite the body recording three shipped phases.",
    "Fix self-contradictory Status header",
)


def main():
    print(f"{'DRY RUN' if DRY_RUN else 'APPLYING'} — {len(PATCHES)} patches\n")
    for path, old, new, label in PATCHES:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"[MISSING] {path} — {label}")
            continue

        count = content.count(old)
        if count == 0:
            print(f"[NOT FOUND] {path} — {label} (old string not present — already applied, or drifted)")
            continue
        if count > 1:
            print(f"[AMBIGUOUS] {path} — {label} (old string appears {count} times, expected exactly 1 — skipping)")
            continue

        print(f"[OK] {path} — {label}")
        if not DRY_RUN:
            content = content.replace(old, new, 1)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

    print("\nDone." + (" (dry run — no files written)" if DRY_RUN else " Files written."))


if __name__ == "__main__":
    main()
