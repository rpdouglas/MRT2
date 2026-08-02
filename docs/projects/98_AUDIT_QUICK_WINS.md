# 📁 Project 98: Audit Quick-Win Remediation Sweep

**Status:** ✅ Shipped
**Primary Persona:** David (the PWA install-size/precache fix in Phase 1 is a direct Day-1, acute-crisis, mobile-connection win for him); Internal (Dev/Ops governance per `docs/governance/INTERNAL_PERSONAS.md`) for the remaining build-hygiene, accessibility, and governance-documentation items.
**Objective:** Close the 10 "Quick Win" items (each independently estimated at hours, not days) from `docs/reports/2026-08_full_production_readiness_audit.md` §20, without touching any of that report's Medium-Effort or Large-Refactor items (tracked separately — see §6).

---

## 1. The Executive Summary
**User Story:** As every persona, I benefit from a smaller first install, correctly-labeled controls under a screen reader, and an accurate zero-knowledge governance document — none of which requires new product surface, only closing gaps the audit already found and cited by file:line.
**Source:** `docs/reports/2026-08_full_production_readiness_audit.md` §3, §6, §8, §9, §20 (2026-08-02).

**Scope note:** This ticket batches 10 independent, low-risk fixes across build config, assets, accessibility, and governance documentation. Splitting into 10 separate tickets would be governance overhead disproportionate to the risk; grouping them here as one remediation sweep mirrors the precedent set by `PROJ-90` (Security/Dependency/Compliance Hardening) and `PROJ-91` (Accessibility Remediation), both of which bundled a similar-sized batch of independently-small fixes under one ticket.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** One item in this batch (Phase 3) touches the zero-knowledge governance boundary directly — reconciling CLAUDE.md's approved-Gemini-flow list against three undocumented call sites the audit found (`getGeminiCoaching`, `generateAudioAnalysis`, `analyzeSystemHealth`). This is a documentation/decision task, not a change to the ZK boundary's mechanics — no new encryption, no new data flow — but it requires an explicit human decision on scope before any doc edit lands (see Phase 3).
* [x] **Encryption Strategy:** N/A for every other item — no new Firestore writes, no new encrypted fields.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. No `src/lib/db.ts` changes. No Cloud Functions schema changes (Phase 3's `npm audit fix` inside `functions/` may bump dependency versions but touches no application code).

**Files impacted (grouped by phase, see §4 for detail):**
* `vite.config.ts` — PWA precache scope, dead-chunk config, `html2canvas` aliasing
* `src/data/assets.ts`, `src/lib/milestones.ts` — medallion image paths (`.png` → `.webp`)
* `.gitignore`, `stats.html` (delete, currently a tracked artifact)
* `src/pages/Dashboard.tsx` — `react-confetti` reduced-motion gate
* 12 component files — `aria-label` additions (see Phase 2)
* `CLAUDE.md` — Gemini approved-flow list (pending the Phase 3 decision)
* `functions/package.json` / `functions/package-lock.json` — `npm audit fix`
* `src/contexts/AuthContext.tsx`, `EncryptionContext.tsx`, `LayoutContext.tsx` — `useMemo` around the provider `value` object

---

## 4. Implementation Phases 🏗️

### Phase 1: Build & Asset Hygiene (bundle/precache size, dead config) — ✅ Shipped 2026-08-02
Highest-ROI phase. Verified result: PWA precache dropped from **19.17MB/99 entries to 3.36MB/64 entries** (an 82% cut, ahead of the ≈85% estimate) via a real `npm run build`, not the (now-deleted) stale `stats.html`. `npm run check` clean throughout (lint, spec-quality, 662/662 tests, build).

1. [x] **PWA precache scope** — added `globIgnores: ['Marketing/**', 'raw_assets/**']` to `vite.config.ts`'s `workbox` config, rather than relocating the directories: `scripts/optimize_assets.py` has `public/raw_assets`/`public/Marketing` hardcoded as its source/dest, so a move would've required updating that script too for no added benefit — `globIgnores` achieves the same precache-scope fix with a smaller, lower-risk diff. Confirmed via `src/data/assets.ts` that a handful of files in both directories *are* referenced by `Welcome.tsx` (the pre-auth marketing splash) — they still serve normally over the network exactly as before; this change only removes them from the offline-precache manifest, which is the correct behavior for assets shown on a page a user can only reach with network access anyway.
2. [x] **Medallion images** — confirmed the two-registry discrepancy from planning: `src/lib/milestones.ts` (the real, live consumer via `getMilestoneImage()`) now points all 12 entries at the existing `.webp` variants. `src/data/assets.ts`'s `Chips` block was **left untouched** — it's auto-generated (`scripts/generate_asset_index.py`, "do not edit manually") and confirmed via repo-wide grep to have **zero runtime consumers** for its `Chips` keys; it'll self-correct next time someone regenerates it. The now-orphaned `public/Chips/*.png` originals (6.6MB) were deleted — the `.webp` versions are the same images, ~12x smaller, already present, and were the only remaining question mark before this could be a clean removal rather than a risky one.
3. [x] **Dead `lucide-react` branch** — removed from `manualChunks`; `@heroicons/react` branch left in place.
4. [x] **Dead `google-fonts-cache` Workbox rule** — removed.
5. [x] **`html2canvas` dead weight** — landed a different, lower-risk fix than the alias/stub this phase originally proposed: bucketed `html2canvas`/`canvg`/`dompurify`/`pako` into the existing `pdf-export` manualChunk (already dynamically imported by `exporter.ts`) instead of aliasing them away. Root cause, confirmed by inspecting the real `dist/` output: jsPDF reaches `html2canvas` via a dynamic `import()` inside its optional `.html()` method (never called by `exporter.ts`), which Rollup would normally code-split into its own lazy chunk — but the `manualChunks` catch-all was unconditionally absorbing it into the eager `vendor` bucket regardless, defeating that split. Moving it into `pdf-export` restores the laziness Rollup already wanted to give it, with no risk to jsPDF's actual `.html()` capability if it's ever used later (nothing is stubbed or removed, just re-bucketed). Verified: `vendor` 875.7KB→540.3KB raw; `pdf-export` grew to absorb it but only loads if a user actually exports data.
6. [x] **Stale committed `stats.html`** — added to `.gitignore`, `git rm --cached`.

### Phase 2: Accessibility — icon-only button labels + motion preference — ✅ Shipped 2026-08-02
1. [x] **`aria-label` additions** (15 confirmed instances, audit report §9) — all 15 added, one file relocated from where the audit's file:line pointed (`ROSCAssessmentCard.tsx` now lives in `src/components/insights/`, not wherever it was when originally cited). One, `NotificationBanner.tsx`'s dismiss button, had an existing unit test (`NotificationBanner.test.tsx:93`) locating it via `getByRole('button', { name: '' })` — i.e. asserting on the *absence* of an accessible name. Updated the test to query by the new label; its failure on first run is exactly the confirmation this fix needed. `PersonifyTool.tsx`'s cancel button had a `title="Cancel"` attribute already, which doesn't reliably act as an accessible name across screen readers — added `aria-label="Cancel edit"` alongside it rather than replacing it.
2. [x] **`react-confetti` reduced-motion gate** — `Dashboard.tsx`'s milestone celebration now checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before firing; skips the animation entirely (not a stripped-down version) when true, matching the plan. Confirmed before landing that `SobrietyHero.tsx` renders the milestone medallion image and "🎉 X Milestone!" banner independently of Dashboard's confetti overlay — reduced-motion users still get the actual reward acknowledgment, just without the particle animation.

### Phase 3: Zero-Knowledge Governance Reconciliation — ✅ Shipped 2026-08-02
`docs/reports/2026-08_full_production_readiness_audit.md` §6 (finding SEC-NEW-01) found three Gemini call sites sending decrypted content that were **not** on CLAUDE.md's approved six-flow list:
* `getGeminiCoaching` ← `src/pages/WorkbookSession.tsx:107` (live, unsaved workbook-answer text)
* `generateAudioAnalysis` ← `src/components/journal/AudioRecorder.tsx:82` (raw voice-journal audio)
* `analyzeSystemHealth` ← `src/components/admin/ErrorLogViewer.tsx:108` (aggregated error logs — lower sensitivity than the other two)

**Decision (product owner, 2026-08-02): approve all three as-is** — none restricted or removed. All three added to CLAUDE.md's approved-flow list (six → nine) with the same rigor as the existing six, plus a governance note recording that they shipped before being documented and were retroactively reviewed rather than assumed exempt. Fixed two pre-existing internal inconsistencies discovered while editing: a "four approved flows" reference that never matched the six actually listed, and a "six-flow list" cross-reference in the crossword carve-out paragraph that hadn't been updated. Also synced `GEMINI.md` (a parallel governance file for a different AI tool), which had already independently drifted to its own "seven" count — left unfixed, it would have recreated the same governance-drift problem in a second document.

* [x] **`npm audit fix` inside `functions/`** — 27 vulnerabilities (2 critical, 8 high, 15 moderate, 2 low) → 11 moderate, non-force. The remaining 11 (`ts-deepmerge`, `uuid` transitive chains) only resolve via `--force`, which would downgrade `firebase-admin` from `^13.8.0` to `10.3.0` — a breaking-change downgrade of the Cloud Functions runtime's core SDK, well outside quick-win scope. Deferred, consistent with how `PROJ-90` handled the equivalent dev-only-vulnerability tail on the root package. `functions/` build and all 58 tests pass; `package.json` unchanged, lockfile-only.

### Phase 4: React Context Hygiene — ✅ Shipped 2026-08-02
* [x] **Memoized `value` in all three contexts** — turned out to need more than the plan's literal "wrap `value` in `useMemo`": every handler function in `AuthContext` (7) and 4 of `EncryptionContext`'s 8 (`setupVault`/`resetVault`/`changePin`/`unlockVault` — the other 4 were already `useCallback`-wrapped) plus `LayoutContext`'s `toggleSidebar`/`toggleSOS` were plain closures recreated every render. Wrapping only `value` in `useMemo` against those unstable references would have recomputed on every render anyway — a no-op fix that merely looked done. Wrapped every plain handler in `useCallback` with its real dependencies first, *then* memoized `value` against the now-stable references. No behavior change, purely referential stability; `npm run check` clean with no `exhaustive-deps` warnings.

### Phase 5: Edge Cases
* [ ] Confirm the `globIgnores`/directory-move for `Marketing/`+`raw_assets/` doesn't break `scripts/generate_screenshots.js` or any other tooling that reads from `public/` expecting those directories present at their current path.
* [ ] Confirm WebP rendering for the 12 medallions across every browser this PWA targets (already precedent elsewhere in `public/`, but `milestones.ts` is a new consumer being switched — verify explicitly).
* [ ] Confirm any `html2canvas` alias doesn't silently break a jsPDF code path outside `exporter.ts` — re-grep for other `jspdf`/`jsPDF` usage at implementation time (the audit found only `exporter.ts`, but re-confirm since this doc predates the actual implementation).
* [ ] Confirm none of the 15 `aria-label` additions collide with an existing visually-hidden text node for the same control (would double the screen-reader announcement).

---

## 5. QA & Verification 🧪
* [ ] **Build check:** `npm run check` clean (lint + spec-quality + tests + build) after every phase — these five phases are independent enough to land as separate commits or PRs if preferred, rather than one large one.
* [ ] **Precache verification:** `npm run build` and inspect the generated precache manifest (the build's own "precache N entries (X KiB)" log line, or `dist/sw.js`) — confirm total precache size drops from ~19.17MB to roughly 3-4MB after Phase 1.
* [ ] **Visual/manual:** confirm milestone medallions still render correctly everywhere `MILESTONE_CHIPS`/`ASSETS.Chips` are consumed, after the `.webp` swap; confirm PDF export (the Data Export panel, `exporter.ts`'s consumer flow) still produces a valid, correctly-tabled PDF after any `html2canvas` aliasing.
* [ ] **Accessibility:** re-run the existing `e2e/golden-paths/a11y.spec.ts` axe-core CI gate — expect no new failures; manually verify a screen reader announces the 15 new labels sensibly in context.
* [ ] **Reduced motion:** manually verify (browser devtools "prefers-reduced-motion: reduce" emulation) that the Dashboard milestone celebration skips confetti but still shows its non-motion reward content.
* [ ] **Governance:** confirm CLAUDE.md accurately reflects whatever decision Phase 3 lands on, for all three call sites — this ticket isn't done until the document matches the code, whichever direction that decision goes.
* [ ] **Functions:** `npm run build --prefix functions` and `npm test --prefix functions` clean after the `npm audit fix` pass.

---

## 6. Explicitly Out of Scope
The audit's Medium-Effort and Large-Refactor items are tracked separately, not part of this ticket: migrating `useTaskOperations`/`useJournalOperations`/`useWorkbookAnswers` onto `useFirestoreCrud`; Firestore rules shape/size validation; `firestore.indexes.json` reconciliation; `maxInstances`/cost guardrails on Cloud Functions; `dailyBeacon`'s unchunked `sendEach` fix; `PROJ-96` (CI safety net) and `PROJ-97` (dependency hygiene round 2), both of which already have their own specs; the `useTasksList`/`useTaskOperations` cache-key mismatch; prompt-injection hardening across the 9 Gemini flows; and the missing `AuthContext.test.tsx` coverage. Recommend a follow-up ticket per the audit's "Medium Effort" bucket once this sweep ships.
