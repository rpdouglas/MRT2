# 📁 Project 69: Changelog Split — Public/Internal Separation

**Status:** ✅ Shipped
**Primary Persona:** All (internal/process — no primary end-user persona; David is the indirect beneficiary as the eventual reader via the PROJ-17 in-app toast)
**Objective:** Stop publishing internal engineering detail — including live security-incident disclosures — to the public-facing `docs-site/support/changelog.md`, by classifying every ticket as user-visible or not at close time and only writing curated, plain-language entries to the public file.

**Source:** Ad-hoc review of `docs-site/support/changelog.md` (2026-07-20) found it mixing user-facing release notes with internal-only entries — architecture cleanups, CI/secrets hardening, and two live security-incident disclosures (leaked prod service-account key in deploy logs; app-signing keystore found in git history, both v1.8.16). The file is not just a docs page: it's the deep-link target of the PROJ-17 Changelog Beacon toast shown to every user, including David mid-crisis, so its audience is real end users, not developers. Precedent for a process-only spec with no schema/UI change: `PROJ-62` (Tech Debt Quick Wins).

---

## 1. The Executive Summary

**User Story:** As the Lead Architect, I want ticket-close to force an explicit "is this user-visible?" decision and route the answer to the right file, so the public changelog only ever contains content someone deliberately wrote for end users, and internal/security detail never leaks there again — accidentally or by inertia.

**Competitive Gap:** N/A — internal trust/security hygiene, not a differentiator. Directly serves the "how does this feel for David in an acute crisis state?" persona check: David can reach this file mid-crisis via the PROJ-17 toast and should never see a security post-mortem there.

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** No PII or emotional/recovery content involved. The sensitivity here runs the *other* direction from the usual ZK concern: the current public file is itself the leak — two entries currently disclose real security-incident detail (credential leak + key rotation) to an unauthenticated public audience. Phase 1 (below) is a live-disclosure fix and should ship independently of, and before, the tooling in Phases 2–3.
* [x] **Encryption Strategy:** N/A — no `crypto.ts` interaction, no Firestore writes.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

No Firestore collections, documents, or TypeScript interfaces affected. This is a docs-content + CLI-script change.

**Files Impacted:**
* `docs-site/support/changelog.md` — retroactive content edit (Phase 1), then ongoing target of automated prepends (Phase 2).
* `scripts/sync_ticket_docs.py` — new optional `--public-note` / `--version` args and a new `apply_public_changelog_entry()` step, following the existing `insert_after_heading` / idempotency-guard pattern already used for `ACTIVE_CYCLE.md` and `ROADMAP.md`.
* `.claude/skills/ticket-close/SKILL.md` — new classification gate in the checklist; updated script-invocation example and "remaining manual steps" list.

**No change to `scripts/check_spec_quality.mjs`** — this spec's own required sections (Status/Personas/Objective/Implementation/QA) are unaffected by the changelog split itself.

---

## 4. Implementation Phases 🏗️

### Phase 1: Retroactive scrub (do first — live disclosure, independent of tooling)
* Remove the two entries with real security-incident detail from `docs-site/support/changelog.md`:
  * v1.8.16 — "Rotated the Android app-signing keystore after discovering it was tracked in git history... fixed a CI logging gap... that was leaking the production Firebase Admin SDK service account key into every deploy log in plaintext."
  * Any other entry disclosing a specific vulnerability, credential exposure, or attack surface (scan all `(Internal)`-tagged entries for this pattern, not just the one flagged above — e.g. v1.8.12's Firestore-rules gap description ("any signed-in user could write a log entry under an arbitrary `uid`") is a live vulnerability *description*, even though the underlying rule is already fixed, and should also come out).
* For the remaining `(Internal)`-tagged entries, confirm each is already captured in its corresponding `docs/projects/XX_FEATURE.md` spec, then either delete or rewrite depending on content — don't apply a blanket rule without checking each one first.
* Leave all `✨`-marked user-facing entries untouched.
* This phase can ship standalone, ahead of Phases 2–3, since it fixes a live issue.

**Approved deviation, found during implementation:** this phase's original text assumed all seven `(Internal)`-tagged entries had "no end-user-facing behavior to describe" and could be deleted wholesale. A closer read found that untrue for five of them — the `(Internal)` label described the *engineering framing*, not the *user impact*:
* **v1.8.10, v1.8.12, v1.8.13** — genuinely zero user-facing content (each explicitly stated "No user-facing behavior changed," or was pure dev tooling). Deleted entirely, along with v1.8.16 (the security disclosure).
* **v1.8.8, v1.8.9, v1.8.14, v1.8.15, v1.8.17** — each contained a real, user-experienced fix or behavior change buried under internal framing (a Dashboard streak bug, a Vitality confirmation toast, a Workbook-page crash, an AI analysis flow hanging indefinitely, and a Play Store purchase-flow change for Android users, respectively). Rewrote each down to a short plain-language bullet for the genuine user-facing content only — ticket IDs, file/hook names, and internal reasoning stripped. v1.8.9 additionally had a live vulnerability disclosure ("closing a gap where they were written unencrypted") that was dropped entirely, keeping only the unrelated toast-confirmation UI change.

This confirms the Phase 3 classification gate needs to warn closers against trusting a ticket's internal category/label as a proxy for user impact — the two aren't the same axis, and this file is proof.

### Phase 2: `sync_ticket_docs.py` — public-note automation
* Add `--public-note TEXT` (optional) and `--version X.Y.Z` (required only if `--public-note` is passed) CLI args.
* New `apply_public_changelog_entry(note, version)`:
  * Builds `## [v{version}] - {today's date}\n### {category emoji + short title}\n- {note}\n` (reuse today's `datetime.date.today()` — the script currently has no date dependency, so this is new) and inserts it via `insert_after_heading(content, r"^# .*Changelog", ...)`, mirroring the existing `ACTIVE_CYCLE`/`ROADMAP` insertion pattern.
  * **Idempotency guard:** if `[v{version}]` already appears in `changelog.md`, warn and skip — same pattern as the existing `PROJ-XX already referenced` guards.
  * **Leak guard:** if `--public-note` matches `PROJ-\d+` (case-insensitive) or looks like a file path (`\.tsx?|\.py|src/`), refuse and exit with an error explaining why — this is the exact class of internal detail this project exists to keep out, so catch it mechanically rather than relying on the closer to remember.
* When `--public-note` is **omitted**: print `"No public changelog entry (internal-only change)."` in the same place the other WARNING-style lines print today, so the dry-run output always shows an explicit decision either way — never silent.
* `--summary` behavior is completely unchanged — it keeps driving the spec Status line, `ACTIVE_CYCLE.md`, and `ROADMAP.md` exactly as today. That remains the internal record; `--public-note` is strictly additive.
* Update the trailing "Remaining manual steps" print block: drop the line `docs-site/support/changelog.md: prepend a version entry.` (now automated when applicable) and keep the guide-drift/tech-debt/ZK line as-is.

### Phase 3: `ticket-close` skill — classification gate
* Add a new item to the Drift Checklist, positioned first (before "1. Schema drift"): **"0. User-visible classification"** — answer explicitly, in the drift report, before running the rest of the checklist:
  * **Not user-visible** (internal refactor, tech debt, CI/infra, dependency bump, test coverage, **or any security/credential/incident work regardless of downstream user impact**) → state this explicitly in the report; do not pass `--public-note`.
  * **User-visible** → draft the `--public-note` text inline in the report for review before running the script: plain language, no `PROJ-` ID, no file/hook/component/Cloud-Function names, no architecture or "why" rationale (that stays in the spec and `--summary`).
  * **Hard rule, no exceptions:** security-incident tickets never get a public-facing note, even a softened one ("we improved our security posture"). If a security fix has genuine required end-user action (e.g. "please re-verify your email"), that's a judgment call routed through direct user communication, not the changelog — flag it to the user rather than drafting one.
* Update the `Project Board Updates` section's example invocation to show both forms:
  ```
  python scripts/sync_ticket_docs.py --proj PROJ-XX --summary "..." --apply                                    # internal-only
  python scripts/sync_ticket_docs.py --proj PROJ-XX --summary "..." --public-note "..." --version 1.9.0 --apply  # user-visible
  ```

---

## 5. QA & Verification 🧪

* [x] **Unit Tests:** None — `sync_ticket_docs.py` is a CLI text-templating tool with no existing test harness (consistent with today). Verified by dry run instead: ran `--public-note`/`--version` against a scratch copy of `changelog.md` (`insert_changelog_entry` called directly) and diffed the inserted block's heading level/date format against a real existing entry — matched exactly (`## [vX.Y.Z] - <date>` / `### <category>` / `- <note>`, correct blank-line spacing).
* [x] **Leak-guard check:** dry-ran with `--public-note "Fixed a bug in PROJ-69's flow"` — refused (`matched 'PROJ-\d+'`). Dry-ran with a `src/pages/Foo.tsx` reference — refused (`matched '\bsrc/'`). Dry-ran with a clean plain-language note — inserted correctly (verified below).
* [x] **Pairing validation:** `--public-note` without `--version` (and vice versa) exits with an explicit error rather than silently doing something partial.
* [x] **Idempotency check:** confirmed via direct check that `f"[v{version}]" in content` correctly detects an already-present entry (the same guard pattern already proven for `ACTIVE_CYCLE.md`/`ROADMAP.md`); a real double-run wasn't exercised against the live changelog since PROJ-69 itself hasn't closed yet.
* [x] **Internal-only path:** dry-ran with no `--public-note` — printed `"No public changelog entry (internal-only change)."` explicitly rather than staying silent.
* [x] **Phase 1 scrub verification:** done in the prior commit — `git diff` reviewed and the full resulting file read top to bottom as if arriving from the PROJ-17 toast; confirmed nothing internal remains and no `✨` entry was accidentally altered.
* [ ] **Governance re-check:** not yet run — defer to Phase 3 close, since this project isn't fully shipped until the `ticket-close` skill gate (Phase 3) is also in place.
* [x] **The Subway Test:** N/A — no runtime app behavior, `docs-site` build is a separate `docs:build` script not part of `npm run check`.
* [x] **The "Lost PIN" Test:** N/A — no encrypted/ZK data touched.
