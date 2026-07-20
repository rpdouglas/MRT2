# 📁 Project 70: Changelog Historical Scrub

**Status:** ✅ Shipped
**Primary Persona:** All (internal/process — no primary end-user persona; David is the indirect beneficiary as the eventual reader via the PROJ-17 in-app toast)
**Objective:** Finish what `PROJ-69` Phase 1 flagged but left out of scope — rewrite every remaining entry in `docs-site/support/changelog.md` (v1.0.0 through v1.8.18) into plain, user-facing language, removing `[PROJ-XX]` ticket tags, internal file/hook/component names, and engineering jargon that PROJ-69's narrower scrub didn't touch.

**Source:** Closing note on `PROJ-69`: "The remaining `[PROJ-XX]` tags scattered through other historical changelog entries... a broader retroactive cleanup, not part of this ticket." A full scan (`grep -n "PROJ-\|\`" changelog.md`) found the problem was bigger than bracket tags — entries from roughly v1.0.0–v1.3.x read like a raw engineering log (file names in backticks, "SRE," "TypeScript compilation error," "ESLint directives," admin-only feature descriptions with zero end-user relevance).

---

## 1. The Executive Summary

**User Story:** As the Lead Architect, I want the full changelog history — not just the ticket that first raised the concern — to read as if it was written for an end user, so a user reading historical entries (via search, curiosity, or the PROJ-17 toast on an old device that hasn't polled in a while) never encounters ticket IDs, file paths, or internal architecture reasoning.

**Competitive Gap:** N/A — trust/polish hygiene, same rationale as `PROJ-69`.

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** None. Unlike `PROJ-69` Phase 1, no live security-incident disclosures were found in this remaining scope — the two that existed were already removed in PROJ-69. This pass is pure internal-vocabulary cleanup, not a live-disclosure fix.
* [x] **Encryption Strategy:** N/A.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

No Firestore/schema/script changes. Single-file docs-content edit: `docs-site/support/changelog.md`.

---

## 4. Implementation Phases 🏗️

### Phase 1: Entry-by-entry classification and rewrite
Applied the same per-entry judgment established in `PROJ-69` Phase 1 (content over label) across all ~35 remaining entries:

* **Tags-only strip** (content already user-appropriate, just needed `[PROJ-XX]`/`(PROJ-XX)` removed): v1.8.18, v1.8.7, v1.8.6, v1.8.5, v1.8.3 (partial — see below), v1.8.0, v1.7.0, v1.6.1, v1.6.0, v1.5.0, v1.4.0, v1.3.0 (partial), v1.2.0 (partial), v1.1.10, v1.1.7 (partial), v1.1.4, v1.1.3 (partial).
* **Rewrite** (real user-facing content buried under internal terms — component names, library names, or architecture reasoning stripped, meaning preserved): v1.8.2 (`GlassCard`/"Walt persona rules" → plain design description), v1.8.1 (`Recharts` dropped), v1.5.0 privacy bullet ("ZK boundary" → plain explanation), v1.1.6 (`sonner` dropped), v1.1.5 (Eventarc/Cloud Functions/JWT detail dropped, kept "you can become a Supporter, auto-upgraded"), v1.1.4 (`SobrietyHero` → "sobriety hero card"), v1.1.0 (kept only the one user-visible bullet — the update-prompt behavior change — rewritten without `PWAUpdateBeacon`), v1.0.1 (kept two genuinely user-visible fixes, dropped the `skipLibCheck` infra bullet), v1.0.0 ("strictly-typed React components" dropped).
* **Partial-bullet deletion** (entry kept, but one or more sibling bullets with zero user-facing content removed): v1.8.3 (dropped the "Architecture Cleanup" bullet — TanStack Query hook migration, no user impact), v1.3.0 (dropped the "Test Suite" bullet — Vitest mocking fix, no user impact), v1.2.0 (dropped the Asset Engine bullet — WebP pipeline/`ASSETS` dictionary/FCP metric, no user impact; renamed header from "Major UX & Architecture Overhaul" to "Landing Page Refresh" since the only surviving content is the landing page), v1.1.3 (dropped "SRE & Prompt Infrastructure" and "Governance Update" bullets — both 100% internal; renamed header to "Terminology Update" since only the Users→Friends rename survived).
* **Full entry deletion** (zero user-facing content once internal framing was stripped): v1.3.1 (Test Suite Audit — 100% internal), v1.1.1 (Admin Inbox schema/listener fix — an admin-only internal tool, not something any of the four personas interact with).
* **Full entry rewrite down to a fraction of its original bullets** (admin-only tool description removed, one genuinely user-facing bullet kept and rewritten): v1.1.8 (dropped the Command Center Telemetry Dashboard bullet — admin-only — kept and rewrote the rate-limit race-condition fix as a plain bug fix; header changed from "📊 Admin & SRE (Runway Protection)" to "🐛 Bug Fixes").

**Judgment call flagged, not resolved unilaterally:** the Admin Inbox (v1.1.0, v1.1.1) and Admin Telemetry Dashboard (v1.1.8) were treated as internal ops tooling with no end-user persona (David/Ned/Walt/Lisa) interacting with them, per the persona table in `CLAUDE.md` — Lisa's Service Module is a distinct feature area. If that reading is wrong (e.g., if Lisa or another persona does see the Admin Inbox), those two deletions should be revisited.

### Phase 2: Formatting normalization
Removed a stray double-blank-line before `## [v1.2.0]` left over from a since-deleted entry's spacing, matching the single-blank-line-between-entries convention used everywhere else in the file.

---

## 5. QA & Verification 🧪

* [x] **Leak scan:** `grep -n "PROJ-\|\`" docs-site/support/changelog.md` after the edit returns exactly one match — the legitimate `myrecoverytoolkit.ca` domain reference in v1.8.11 — down from ~40 matches before.
* [x] **Full read-through:** read the entire resulting file top to bottom as if arriving via the PROJ-17 toast on any historical version; no ticket IDs, file paths, or engineering jargon remain.
* [x] **No accidental content loss:** every surviving bullet traces to a real, verifiable user-facing behavior change from the original entry; nothing was invented to fill a gap left by a deleted bullet.
* [x] **`npm run docs:check-specs`:** all spec files (including this one) pass required-section validation.
* [ ] **Governance re-check:** not yet run — recommend before the next `governance` skill invocation, though this ticket doesn't touch `ROADMAP.md`/`BACKLOG.md` beyond the standard `sync_ticket_docs.py` close.
* [x] **The Subway Test:** N/A — no runtime app behavior, docs-only change.
* [x] **The "Lost PIN" Test:** N/A — no encrypted/ZK data touched.
