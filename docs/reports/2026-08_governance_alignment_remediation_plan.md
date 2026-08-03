# 🗺️ Governance Alignment Remediation Plan

**Date:** 2026-08-03
**Source:** Full governance audit — all 4 governance files (`docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/ACTIVE_CYCLE.md`, `docs/SCHEMA_ARCHITECTURE.md`) and all 69 numbered specs in `docs/projects/` read in full, cross-referenced against the actual codebase (routes, hooks, pages, `firestore.rules`).
**Result:** 7 governance violations found, plus a longer backlog of pending/incomplete work items surfaced along the way.

This document is self-contained — it assumes no prior context from the session that produced it. Work through the phases in order; Phase 1 items are all small, independent, low-risk edits and can be done in any order within that phase.

---

## How to use this doc

1. Work top to bottom by phase. Phase 1 is the highest-priority, lowest-effort set — do it first.
2. Each item names the exact file(s) to touch and what's wrong. None of these require new architecture or design decisions beyond what's already stated.
3. Phase 3 items cannot be done from an agent sandbox — they need a human with a real device, production console access, or a live API key. Don't try to automate around that; just do them when you have the access.
4. Once a Phase 1/2 item is fixed, it's reasonable to re-run the `governance` skill to confirm the fix landed cleanly before moving on.

---

## Phase 1 — Critical Fixes

These are the governance violations that actively mislead sprint planning or leave a real (if low-severity) security gap. All are small, mechanical edits.

### 1.1 — `buffer_status` collection missing from `firestore.rules`
- **Files:** `firestore.rules`, cross-reference `docs/SCHEMA_ARCHITECTURE.md` §"buffer_status/{modality}"
- **Problem:** `docs/projects/42_DAILY_READINGS.md` defines `buffer_status/{modality}` as a Firestore collection, and `functions/src/index.ts` actively writes to it (via `checkBufferHealth`/`generateReadingBatch`). It has no entry in `firestore.rules` at all.
- **Why it matters:** In practice this is Admin-SDK-only (which bypasses rules), so there's no live exploit today — but an implicit default-deny is not the same as a documented one, and this repo's own convention (established by PROJ-49's ROSC rules) is to add an explicit rule in the same PR that ships the first write path.
- **Fix:** Add an explicit deny-all-client rule block for `buffer_status/{modality}` in `firestore.rules` (no `allow read/write` clauses — it should never be reachable from a client), with a comment noting it's Cloud-Function/Admin-SDK-only. `docs/SCHEMA_ARCHITECTURE.md` already documents this correctly ("No client-facing firestore.rules entry — default-deny is correct here") — the fix is making that default-deny explicit in the rules file itself, not changing the doc.

### 1.2 — `PROJ-76` and `PROJ-81` shipped but not archived
- **Files:** `docs/ROADMAP.md` (✅ RECENTLY SHIPPED section), `docs/ACTIVE_CYCLE.md` (✅ Resolved This Cycle section)
- **Problem:** Both `docs/projects/76_GAMIFICATION_DASHBOARD_RELOCATION.md` (Gamification Dashboard Relocation) and `docs/projects/81_GAMES_HUB_DESIGN_SYSTEM_ALIGNMENT.md` (Games Hub Design System Alignment) carry Status `🟢 Done`, and the code is verified in place (`/profile/achievements` route + `AchievementsTab.tsx` for PROJ-76; `GamesHub.tsx`'s `VibrantHeader`/`GlassCard variant="games"` usage for PROJ-81). Neither appears in either governance file's shipped-work list.
- **Fix:** Add one line for each to both `docs/ROADMAP.md`'s RECENTLY SHIPPED list and `docs/ACTIVE_CYCLE.md`'s Resolved This Cycle list, matching the existing one-line format used for every other entry there (`` `PROJ-XX` Name (one-sentence summary of what shipped) ``).

### 1.3 — `PROJ-97` is an orphan spec
- **Files:** `docs/ROADMAP.md` or `docs/BACKLOG.md`
- **Problem:** `docs/projects/97_DEPENDENCY_HYGIENE_ROUND_2.md` (Dependency Hygiene Round 2, Status `⚪ Planned`) exists as a fully-written spec but appears in none of `ROADMAP.md`, `ACTIVE_CYCLE.md`, or `BACKLOG.md`. It's invisible to any sprint-planning pass that works from the governance files rather than browsing `docs/projects/` directly.
- **Fix:** Add it either as a Wave row in `ROADMAP.md` (if it's near-term) or as an entry in `BACKLOG.md`'s "Infrastructure & Scale Triggers" section (if it's not yet prioritized) — whichever matches actual intent. Scope for reference: replacing `@use-gesture/react` and `crossword-layout-generator`, migrating `SwipeableTaskRow.tsx`, adding `eslint-plugin-jsx-a11y`, and clearing `knip`-flagged dead code.

### 1.4 — `PROJ-69` disputes its own "Shipped" status
- **File:** `docs/projects/69_CHANGELOG_SPLIT.md`
- **Problem:** The spec's own §5 QA section reads: *"Governance re-check: not yet run — defer to Phase 3 close, since this project isn't fully shipped until the ticket-close skill gate (Phase 3) is also in place."* The status header says `✅ Shipped`, and both `ROADMAP.md`/`ACTIVE_CYCLE.md` list it as shipped/resolved — three governance sources disagree with the spec's own text.
- **Fix:** Either (a) run the governance recheck the spec is waiting on and check that box, confirming the status header is accurate, or (b) if the recheck already effectively happened via a later governance pass (this one, arguably), update the QA line to reflect that and remove the self-contradiction.

### 1.5 — `PROJ-41` disputes its own "Shipped" status
- **File:** `docs/projects/41_DYNAMIC_ANCHOR.md`
- **Problem:** The spec's own §6 reads: *"Status correction: despite the header above, this project was not fully completed as specced — the QA checkboxes in Section 5 were never checked off, which is consistent with Card 3 never shipping."* Status header says `✅ Shipped`; `ROADMAP.md`/`ACTIVE_CYCLE.md` both agree with the header, not the caveat.
- **Fix:** Since Card 3 (the "Intent" card) was deliberately descoped and its dead code removed — this is a completed, working 2-card widget, just not what the original spec described — the cleanest fix is updating §5's QA checkboxes to reflect what actually shipped (the 2-card version) rather than leaving them unchecked against a design that was abandoned. The status header itself is accurate; the QA section just needs to catch up to the descope decision already recorded in §6.

---

## Phase 2 — Medium Priority

### 2.1 — `PROJ-07` Google Play Console blocker: confirm still blocked
- **File:** `docs/ACTIVE_CYCLE.md`
- **Problem:** ACTIVE_CYCLE states Sprint 9.2 is "blocked on remaining Google Play Console verification steps" — this is an external dependency whose status may have changed since it was last written.
- **Fix:** Check current Google Play Console status. If resolved, move PROJ-07 to fully shipped and update both governance files; if still blocked, no doc change needed, but worth a fresh timestamp/note so the next reader knows this was checked recently rather than stale.

### 2.2 — `PROJ-05` Dashboard slot reassignment: no tracked replacement
- **Files:** `docs/ROADMAP.md` (Wave 3 row for PROJ-05), `docs/projects/05_SERVICE_MODULE.md`
- **Problem:** ROADMAP's PROJ-05 row already notes: *"Its Dashboard 'Coming Soon' placeholder slot is being reassigned to PROJ-72 Recovery Games — when unpaused, this needs a new entry point (e.g. a nav item) instead."* This is a known loose end but isn't tracked as an actual action item anywhere.
- **Fix:** Either add an explicit note to the PROJ-05 spec's Phase 3 section flagging the entry-point redesign as a prerequisite before unpausing, or leave as-is if the intent is simply "handle it whenever PROJ-05 is picked back up" — this is a judgment call, not a hard requirement.

### 2.3 — Retroactive-spec pattern (process note, not a fix)
- **Files:** `docs/projects/84_DASHBOARD_BENTO_TASKS_CONTRAST.md`, `docs/projects/85_GOAL_LADDER_HERO_DASHBOARD_THEME.md`
- **Problem:** Both specs self-report being written *after* implementation/merge, which is a violation of CLAUDE.md's "no feature without a spec first" rule. Not incomplete work — just worth naming since it's happened twice in close succession and could become a habit if unaddressed.
- **Fix:** No file edit required. Worth a one-line reminder in team process docs (or just verbal) that specs need to precede implementation, not follow it.

---

## Phase 3 — Manual Verification Backlog (needs a human, real device, or prod access)

None of these can be completed by an agent in a sandboxed environment. Do them when you have the relevant access.

| Item | Project | What's needed |
|---|---|---|
| Real TWA build + install | PROJ-07 Sprint 9.2 | Bubblewrap compile, actual Android device/emulator with the built TWA installed |
| Real TWA referrer check | PROJ-68 | Confirm `document.referrer` actually resolves to `android-app://` inside a real built TWA shell — can't be tested in a normal browser tab |
| 320px (iPhone SE) viewport passes | PROJ-90, 96, 98 | Visual check of the medical disclaimer, PWA precache size, and 15 new accessibility labels at a real narrow viewport |
| ~~First real CI run~~ **Done 2026-08-03** | PROJ-96 | Confirmed via `gh run view` on run 30863012739 (PR #159's merge to main): "Dependency Vulnerability Audit (root, production deps)", "Dependency Vulnerability Audit (functions, production deps)", and "Firestore Rules Tests (PROJ-99)" all ran and passed for real on GitHub Actions, not just local reproduction. |
| ~~Prod Firestore index reconciliation~~ **Done 2026-08-03** | PROJ-99 | A later sandbox had live Firebase CLI auth against prod. Found and fixed 2 real gaps (`tasks: uid+createdAt DESC`, `journals: uid+createdAt ASC` — both actively used, neither in the file) plus 1 orphaned index left alone. See `docs/projects/99_FIRESTORE_BACKEND_HARDENING.md` Phase 3. |
| GCP budget alert | PROJ-99 | Set a monthly budget alert in the GCP console — console-only action. Checked 2026-08-03: `gcloud` was authenticated for this account, but `billingbudgets.googleapis.com` isn't enabled on the billing account tied to `mrt2-app-prod`, and setting a budget threshold is a spend-policy decision the account owner should make anyway — still needs a human in the console. |
| Live Gemini safety-threshold check | PROJ-100 | Confirm `BLOCK_ONLY_HIGH` safety settings don't over-block a real, sensitive-but-legitimate recovery journal entry — needs a live Gemini API key and a real call |
| Live Subway Test re-runs | PROJ-95, PROJ-101 | Re-run the offline-resilience "Subway Test" in a real browser session against live data, not just the automated/unit-level equivalent |
| Collaborator re-clone confirmation | PROJ-67 | Confirm every other person with a local clone of this repo has re-cloned or hard-reset past the purged git history (old signing-key incident) |

---

## Phase 4 — Already-Tracked Chores (reproduced for completeness)

These are already correctly tracked in `docs/ACTIVE_CYCLE.md`'s Chores & Tech Debt section — nothing new was discovered here, they're just reproduced so this document is a complete picture in one place.

- **Add Daily Crossword to the Subway Test:** PROJ-79 shipped without offline-play e2e coverage. Also still missing: a 320px viewport check and the "Lost PIN" test.
- **Tighten `tsconfig.app.json`:** add `noUncheckedIndexedAccess` — deferred, found 164 compiler errors when last evaluated; needs a dedicated refactor cycle.
- **Converge the three "admin" definitions:** `AuthContext.tsx`'s hardcoded email check, the real custom claim, and the `role` field should become one thing. No privilege-escalation risk today (every real admin action still requires the custom claim), just informal duplication.

---

## Explicitly Out of Scope for This Plan

These are real, larger pieces of future work — each is its own feature-sized effort and deserves its own `/planning` pass with a fresh spec review, not a line item in a doc-remediation punch list.

- **`PROJ-05` The Service Network** (Lisa's encrypted sponsee rolodex) — Paused, 0% built beyond a `firestore.rules` stub. Spec: `docs/projects/05_SERVICE_MODULE.md`.
- **`PROJ-38` Urge Intervention System** ("The Lifeline Protocol") — Planned, 0% built. Spec: `docs/projects/38_URGE_INTERVENTION.md`.
- **`PROJ-45` Adaptive Persona UI Engine** — Parked pending 6 unresolved open questions in its own spec. Spec: `docs/projects/45_ADAPTIVE_PERSONA_UI.md`.
- **`PROJ-97` Dependency Hygiene Round 2** — Planned, 0% built (also the orphan-spec fix in Phase 1.3 above — that fix is just giving it a home in the governance docs, not building it).

Also out of scope — already correctly accepted/deferred elsewhere, no action needed now:
- `mrt2-app-uat`'s unset `VAULT_PEPPER` secret (uat isn't in active use).
- The four "Infrastructure & Scale Triggers" in `BACKLOG.md` (`dailyBeacon` fan-out rework, Aggregated Stats Engine, Firebase App Check, bulk-migration framework) — each has a stated trigger condition that hasn't fired yet.
- Assorted dev-dependency and transitive-dependency vulnerabilities across PROJ-90/96/97/98 — either no upstream fix exists yet or fixing requires a major-version bump that's been deliberately deferred.
- `docs/projects/49_ROSC_MATRIC.md` §10.4's metrics roadmap (Vitality bioBalance, task completion rate, etc.) — proposal only, by design, not a gap.
