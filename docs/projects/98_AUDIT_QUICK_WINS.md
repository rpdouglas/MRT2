# 📁 Project 98: Audit Quick-Win Remediation Sweep

**Status:** 🟡 Active — Phase 1 shipped 2026-08-02 (commit `7277e42`)
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

### Phase 2: Accessibility — icon-only button labels + motion preference
1. **`aria-label` additions** (15 confirmed instances, audit report §9): `NotificationBanner.tsx:64`, `FeedbackModal.tsx:62`, `PWAInstallBanner.tsx:77`, `JournalEditor.tsx:266`, `ManageWordCloudModal.tsx:38,56`, `AudioRecorder.tsx:99,131,138`, `JournalAnalysisWizard.tsx:287`, `TaskFormModal.tsx:126`, `PersonifyTool.tsx:71`, `DynamicAnchorWidget.tsx:187`, `ROSCAssessmentCard.tsx:151`, `DebugTools.tsx:92`. Each needs a concise, context-accurate label describing the action the icon performs — verify against the surrounding component's actual behavior, don't guess from the icon glyph alone.
2. **`react-confetti` reduced-motion gate** (`src/pages/Dashboard.tsx`, milestone celebration, ~400 particles fired via `setTimeout`) — wrap the trigger in a `window.matchMedia('(prefers-reduced-motion: reduce)')` check. There's already a precedent for the underlying intent in `DailyCrossword.tsx`'s `@media (prefers-reduced-motion: reduce)` CSS rule — this needs the JS-side equivalent since it's a canvas animation, not CSS. When reduced motion is preferred, skip the confetti entirely rather than showing a stripped-down version; the milestone banner/copy is the actual reward signal, confetti is decoration on top of it.

### Phase 3: Zero-Knowledge Governance Reconciliation — requires a decision, not just a diff
`docs/reports/2026-08_full_production_readiness_audit.md` §6 (finding SEC-NEW-01) found three Gemini call sites sending decrypted content that are **not** on CLAUDE.md's approved six-flow list:
* `getGeminiCoaching` ← `src/pages/WorkbookSession.tsx:107` (live, unsaved workbook-answer text)
* `generateAudioAnalysis` ← `src/components/journal/AudioRecorder.tsx:82` (raw voice-journal audio)
* `analyzeSystemHealth` ← `src/components/admin/ErrorLogViewer.tsx:108` (aggregated error logs — lower sensitivity than the other two)

This phase is **blocked on a product decision, not an engineering task**: for each of the three, either (a) add it to CLAUDE.md's approved-flow list with the same rigor as the existing six (name the flow, the function, the call site, confirm it already routes through `generateAIInsights` — it does, per the audit — and that it decrypts client-side only), or (b) restrict/remove the call site if it's judged out of scope for the AI carve-out. **Do not edit CLAUDE.md on any of the three without an explicit go/no-go per call site from the product owner** — this is exactly the kind of governance-document change CLAUDE.md itself says must happen "explicitly before shipping, not assumed."

Secondary item in this phase, no decision required:
* `npm audit fix` inside `functions/` (currently unaudited relative to the root `package.json` — 27 vulnerabilities, 2 critical, 8 high, per the audit, several in `firebase-admin`'s own production dependency chain). Run non-force first; if anything requires `--force` (a breaking-change bump), scope that as a fast follow rather than blocking this ticket on it — consistent with how `PROJ-90` handled the equivalent pass on the root package.

### Phase 4: React Context Hygiene
* Wrap the `value` object at `AuthContext.tsx:199`, `EncryptionContext.tsx:295`, and `LayoutContext.tsx:48` in `useMemo` with correct dependency arrays. Low risk, no behavior change — closes the "every context consumer re-renders on every provider render" gap the audit flagged as currently latent (not yet causing a measured issue, worth closing proactively rather than after it does).

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
