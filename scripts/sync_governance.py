#!/usr/bin/env python3
"""Governance sync — 2026-09-16 audit (6 violations, APPLY ALL).

Applies the fixes from the governance audit run after the Play Billing
(PROJ-105) leading-space SKU investigation prompted a full docs-vs-code check:

1. CLAUDE.md's stale "no rate limit at all" claim (PROJ-106 already fixed that half)
2. PROJ-104 (Accessibility Phase 2) orphan — add to ROADMAP.md + ACTIVE_CYCLE.md
3. Dead file:// link (AntiGravity CLI local cache path) in ACTIVE_CYCLE.md
4. Archive docs/reports/2026-08_governance_alignment_remediation_plan.md (superseded)
5. Archive docs/reports/2026-09_premium_gating_audit.md (both open items resolved since)
6. Bold-ify Status/Primary Persona/Objective in 3 specs with the known non-bold gap;
   widen BACKLOG.md's tracked item to cover them (leaving 42_DAILY_READINGS.md's
   genuinely different header shape untouched, per its own note in the item)

Standard MRT Safe Delivery Protocol: DRY_RUN default, targeted .replace() patches
only, no full-file rewrites, run dry first and read the output before flipping
DRY_RUN to False.
"""

import shutil
from pathlib import Path

DRY_RUN = False
FENCE = chr(96) * 3
ROOT = Path(__file__).resolve().parent.parent

# Each text patch: (relative path, old string, new string)
PATCHES = []

# --- Fix 1: CLAUDE.md stale cost-gap claim -----------------------------------
PATCHES.append((
    "CLAUDE.md",
    '**Known live gap, not yet fixed (flag if you touch these files):** '
    '`WorkbookDetail.tsx` (`analyzeWorkbookContent`), `WorkbookSession.tsx` '
    '(`getGeminiCoaching`), and `AudioRecorder.tsx` (`generateAudioAnalysis`) '
    '— three of the nine approved Gemini flows above — have **no tier check '
    'and no rate limit at all**. This is a live, uncapped Gemini API cost '
    'exposure (any free user can call these without limit), independent of '
    'whether they should also be premium-gated as a product decision. '
    "Don't extend these call sites without also considering this gap; don't "
    'assume "it\'s been like this a while" means it\'s intentional.',

    '**Known gap, partially fixed (flag if you touch these files):** '
    '`WorkbookDetail.tsx` (`analyzeWorkbookContent`), `WorkbookSession.tsx` '
    '(`getGeminiCoaching`), and `AudioRecorder.tsx` (`generateAudioAnalysis`) '
    '— three of the nine approved Gemini flows above — have **no tier check** '
    "(any free or premium user can call them identically; there's no "
    'premium-only enforcement point). `PROJ-106` (2026-09) closed the '
    '*uncapped-cost* half of this gap with real server-side rate limits in '
    '`generateAIInsights` (`functions/src/index.ts`): a 7-day free-tier '
    'cooldown on `workbook_analysis`, a 24h free-tier cooldown on '
    '`audio_analysis`, and a 15-second all-tier anti-abuse floor on '
    '`workbook_coach`. What remains open is purely a product decision — '
    'should these three also be premium-gated like the app\'s other AI flows '
    "— not an active cost emergency. Don't extend these call sites without "
    "considering whether that decision has been made yet; don't assume the "
    'missing tier check is an oversight rather than a deliberate '
    'not-yet-decided state.',
))

# --- Fix 2: PROJ-104 orphan — add to ROADMAP.md Wave 1 -----------------------
PATCHES.append((
    "docs/ROADMAP.md",
    '| ✅ **Shipped** | `PROJ-111` | **MAT Dose-Tracking & Discreet '
    'Notifications (Jordan)** | Jordan | Built what `docs/PERSONAS.md` '
    'documents for Jordan: one-tap `mat_doses` dose log, a customizable '
    'sobriety-counter label (`customCounterLabel`), and discreet, '
    'drug-name-free push reminders (`computeMatReminderAlert`, fixed '
    'generic copy only). Promoted 2026-09-03 from `docs/BACKLOG.md`\'s '
    '"Jordan discreet-UI feature depth audit." **Phases 1-3 shipped '
    '2026-09-04** — see `docs/projects/111_MAT_DOSE_TRACKING.md`. AI '
    'correlation ("Side-Effect Correlation Matrix") remains explicit '
    'future scope. |\n',

    '| ✅ **Shipped** | `PROJ-111` | **MAT Dose-Tracking & Discreet '
    'Notifications (Jordan)** | Jordan | Built what `docs/PERSONAS.md` '
    'documents for Jordan: one-tap `mat_doses` dose log, a customizable '
    'sobriety-counter label (`customCounterLabel`), and discreet, '
    'drug-name-free push reminders (`computeMatReminderAlert`, fixed '
    'generic copy only). Promoted 2026-09-03 from `docs/BACKLOG.md`\'s '
    '"Jordan discreet-UI feature depth audit." **Phases 1-3 shipped '
    '2026-09-04** — see `docs/projects/111_MAT_DOSE_TRACKING.md`. AI '
    'correlation ("Side-Effect Correlation Matrix") remains explicit '
    'future scope. |\n'
    '| 🟡 **In Progress** | `PROJ-104` | **Accessibility Phase 2** | All | '
    'Continuing from `PROJ-91`\'s WCAG 2.2 AA remediation: Phase 1 '
    '(crisis-access — SOS reachable when the vault is locked) shipped '
    '2026-08-31, Phase 3 (CI a11y scan expansion) shipped 2026-09-06 as '
    '`PROJ-117` Tier 3. Phases 2 (PIN accessibility), 4 (structural gaps '
    '— skip link, reduced-motion baseline, `aria-live`), 5 (form labels/'
    'modals), and 6 (cognitive/UX polish) remain planned. Found as an '
    'orphan (real, shipping code with zero governance-file tracking) '
    'during the 2026-09-16 governance sweep. See '
    '`docs/projects/104_ACCESSIBILITY_PHASE2.md`. |\n',
))

# --- Fix 2 (cont.): PROJ-104 orphan — add to ACTIVE_CYCLE.md Active Projects -
PATCHES.append((
    "docs/ACTIVE_CYCLE.md",
    '## 🛠️ Active Projects (Priority 2)\n'
    '*Core feature work for the current cycle.*\n'
    '*(Queue Empty)*',

    '## 🛠️ Active Projects (Priority 2)\n'
    '*Core feature work for the current cycle.*\n'
    '- **PROJ-104:** Accessibility Phase 2 — Phases 1 and 3 shipped '
    '(crisis-access SOS reachability, CI a11y scan expansion via `PROJ-117` '
    'Tier 3); Phases 2 (PIN accessibility), 4 (structural gaps), 5 (form '
    'labels/modals), 6 (cognitive/UX polish) remain planned. Surfaced as an '
    'orphan (real, active code with zero governance-file tracking) during '
    'the 2026-09-16 governance sweep. See '
    '`docs/projects/104_ACCESSIBILITY_PHASE2.md`.',
))

# --- Fix 3: dead file:// link in ACTIVE_CYCLE.md -----------------------------
PATCHES.append((
    "docs/ACTIVE_CYCLE.md",
    '- [⛔ Abandoned] **React 19 Refactor:** Incremental migration to '
    '`useActionState` evaluated and abandoned due to poor ROI on purely '
    'client-side SPA forms. See [react19_action_state_assessment.md]'
    '(file:///home/node/.gemini/antigravity-cli/brain/'
    '7fdfa35e-619b-4a30-852b-93e6ba4e406b/'
    'react19_action_state_assessment.md).',

    '- [⛔ Abandoned] **React 19 Refactor:** Incremental migration to '
    '`useActionState` evaluated and abandoned due to poor ROI on purely '
    'client-side SPA forms. (The original assessment doc lived only in a '
    "local AntiGravity CLI session cache — not portable across machines, "
    'so the link is removed; the reasoning above is the complete record.)',
))

# --- Fix 6: bold-ify header labels in 3 specs --------------------------------
PATCHES.append((
    "docs/projects/26_THE_BEACON.md",
    'Status: ✅ Completed (shipped pre-2026-04; backfilled spec 2026-07-09 '
    'as part of the notification-system remediation)\n'
    'Primary Persona: Ned (Pink Cloud streaks), Walt (milestone tracking)\n'
    'Objective: Server-scheduled Web Push (FCM) that re-engages users '
    'outside the app via two alert types — sobriety milestone celebrations '
    'and overdue-habit reminders — without ever transmitting encrypted/'
    'sensitive content through the push payload.',

    '**Status:** ✅ Completed (shipped pre-2026-04; backfilled spec '
    '2026-07-09 as part of the notification-system remediation)\n'
    '**Primary Persona:** Ned (Pink Cloud streaks), Walt (milestone '
    'tracking)\n'
    '**Objective:** Server-scheduled Web Push (FCM) that re-engages users '
    'outside the app via two alert types — sobriety milestone celebrations '
    'and overdue-habit reminders — without ever transmitting encrypted/'
    'sensitive content through the push payload.',
))

PATCHES.append((
    "docs/projects/38_URGE_INTERVENTION.md",
    'Status: ⚪ Planned\n'
    'Primary Persona: David (Crisis) → Secondary: Ned (Early Recovery)\n'
    'Objective: Provide a zero-friction, real-time intervention flow that '
    'interrupts urges and guides the user through a structured, '
    'somatic-first recovery protocol within 3–5 minutes.',

    '**Status:** ⚪ Planned\n'
    '**Primary Persona:** David (Crisis) → Secondary: Ned (Early Recovery)\n'
    '**Objective:** Provide a zero-friction, real-time intervention flow '
    'that interrupts urges and guides the user through a structured, '
    'somatic-first recovery protocol within 3–5 minutes.',
))

PATCHES.append((
    "docs/projects/41_DYNAMIC_ANCHOR.md",
    'Status: ✅ Shipped (2026-05-03) — descoped from original spec, see '
    '§6: Intent Card (Card 3) was never built; its dead code was removed '
    '2026-07-09. The Quick Action Bar ships as a 2-card (Check-In, '
    'Reading) widget, not the 3-card design below.\n'
    'Primary Persona: David (Crisis), Ned (Early Recovery)\n'
    'Objective: Replace the rigid "Daily Pledge" with a slim, frictionless, '
    '3-column Quick Action Bar that adapts its journaling prompts based on '
    'the local time of day, complete with visual nudges and customizable '
    'alerts.',

    '**Status:** ✅ Shipped (2026-05-03) — descoped from original spec, '
    'see §6: Intent Card (Card 3) was never built; its dead code was '
    'removed 2026-07-09. The Quick Action Bar ships as a 2-card '
    '(Check-In, Reading) widget, not the 3-card design below.\n'
    '**Primary Persona:** David (Crisis), Ned (Early Recovery)\n'
    '**Objective:** Replace the rigid "Daily Pledge" with a slim, '
    'frictionless, 3-column Quick Action Bar that adapts its journaling '
    'prompts based on the local time of day, complete with visual nudges '
    'and customizable alerts.',
))

PATCHES.append((
    "docs/BACKLOG.md",
    '* **Harden `check_spec_quality.mjs` to structural (not just '
    'substring) validation, and migrate `governance/SKILL.md`\'s '
    'one-off-script "APPLY ALL" pattern onto `sync_ticket_docs.py`\'s '
    'reusable-script precedent.** Surfaced 2026-08-31 '
    '(`docs/reports/2026-08_ai_workflow_gap_analysis.md`) — confirmed two '
    'specs (`docs/projects/26_THE_BEACON.md`, `42_DAILY_READINGS.md`) '
    'structurally diverge from `00_TEMPLATE.md`\'s header/section shape '
    'yet still pass the CI gate, because the checks are keyword-'
    'substring-only. **Trigger:** the next spec-quality false-negative '
    'caught in manual review, or opportunistically alongside other '
    'docs-as-code tooling work.',

    '* **Harden `check_spec_quality.mjs` to structural (not just '
    'substring) validation, and migrate `governance/SKILL.md`\'s '
    'one-off-script "APPLY ALL" pattern onto `sync_ticket_docs.py`\'s '
    'reusable-script precedent.** Surfaced 2026-08-31 '
    '(`docs/reports/2026-08_ai_workflow_gap_analysis.md`) — confirmed two '
    'specs (`docs/projects/26_THE_BEACON.md`, `42_DAILY_READINGS.md`) '
    'structurally diverge from `00_TEMPLATE.md`\'s header/section shape '
    'yet still pass the CI gate, because the checks are keyword-'
    'substring-only. **2026-09-16 governance sweep found the same gap in '
    'two more specs** (`38_URGE_INTERVENTION.md`, `41_DYNAMIC_ANCHOR.md`) '
    'and fixed the shallow half directly: all three non-bold specs '
    '(`26`, `38`, `41`) now use `**Status:**`/`**Primary Persona:**`/'
    '`**Objective:**` matching the template. `42_DAILY_READINGS.md` is a '
    'deeper case, not just missing bold — it uses an entirely different '
    'header field set (`ID`/`Epic`/`Priority`/`Target Personas`) '
    'predating this template, and reshaping it risks losing real '
    'information (it lists 4 target personas, not one primary); left '
    'as-is pending an actual decision on whether to reshape it, not '
    'silently touched. **Trigger:** the next spec-quality false-negative '
    'caught in manual review, or opportunistically alongside other '
    'docs-as-code tooling work.',
))

# --- Fixes 4 & 5: archive two superseded/resolved reports --------------------
REPORT_MOVES = [
    (
        "docs/reports/2026-08_governance_alignment_remediation_plan.md",
        "docs/reports/archive/2026-08_governance_alignment_remediation_plan.md",
    ),
    (
        "docs/reports/2026-09_premium_gating_audit.md",
        "docs/reports/archive/2026-09_premium_gating_audit.md",
    ),
]

# --- Fixes 4 & 5 (cont.): log both archivals in ACTIVE_CYCLE.md Chores ------
PATCHES.append((
    "docs/ACTIVE_CYCLE.md",
    '## 🧹 Chores & Tech Debt\n'
    '- [x] **Governance Alignment Sweep (2026-09-12):**',

    '## 🧹 Chores & Tech Debt\n'
    '- [x] **Governance Alignment Sweep (2026-09-16):** Ran the '
    '`governance` skill in full (4 governance files, 87 project specs, '
    'targeted code-evidence checks), prompted by wanting to confirm docs '
    'actually match code after the PROJ-105 SKU-whitespace bug investigation. '
    'Found and fixed via `scripts/sync_governance.py` (APPLY ALL): '
    '`CLAUDE.md` still described the `PROJ-106`-fixed uncapped-AI-cost gap as '
    'fully unfixed (the tier-check half is still open, the rate-limit half '
    'was closed weeks ago); `PROJ-104` (Accessibility Phase 2) was a real, '
    'actively-shipping orphan absent from every governance file; a dead '
    '`file://` link into a local AntiGravity CLI session cache in this file\'s '
    'own React 19 entry; and a non-bold header-format gap in 3 specs '
    '(`26`, `38`, `41`), tracked and partly widened in `docs/BACKLOG.md`. '
    'Also archived two reports whose open items are now resolved: '
    '`2026-08_governance_alignment_remediation_plan.md` (superseded by this '
    'sweep and the 2026-09-12 one) and `2026-09_premium_gating_audit.md` '
    '(§3\'s uncapped-cost gap closed by `PROJ-106`; §4\'s fictional "Service '
    'Network Access" marketing line is no longer present in '
    '`PremiumUpgrade.tsx`, confirmed by direct grep — resolved sometime '
    'after the report was written, never formally closed out until now).\n'
    '- [x] **Governance Alignment Sweep (2026-09-12):**',
))


def apply_patches():
    changed = []
    for rel_path, old, new in PATCHES:
        path = ROOT / rel_path
        text = path.read_text(encoding="utf-8")
        count = text.count(old)
        if count == 0:
            print(f"  {FENCE}\n  MISSING ANCHOR in {rel_path} — skipped, no change made\n  {FENCE}")
            continue
        if count > 1:
            print(f"  WARNING: anchor found {count} times in {rel_path} — expected exactly 1, skipped")
            continue
        new_text = text.replace(old, new)
        if DRY_RUN:
            print(f"--- WOULD PATCH: {rel_path} ---")
        else:
            path.write_text(new_text, encoding="utf-8")
            print(f"PATCHED: {rel_path}")
        changed.append(rel_path)
    return changed


def apply_moves():
    for src_rel, dst_rel in REPORT_MOVES:
        src = ROOT / src_rel
        dst = ROOT / dst_rel
        if not src.exists():
            print(f"  MISSING SOURCE: {src_rel} — skipped")
            continue
        if DRY_RUN:
            print(f"--- WOULD MOVE: {src_rel} -> {dst_rel} ---")
        else:
            shutil.move(str(src), str(dst))
            print(f"MOVED: {src_rel} -> {dst_rel}")


def main():
    print(f"DRY_RUN = {DRY_RUN}\n")
    apply_patches()
    apply_moves()
    if DRY_RUN:
        print("\nDry run complete. No files were modified. Set DRY_RUN = False to apply.")
    else:
        print("\nApply complete.")


if __name__ == "__main__":
    main()
