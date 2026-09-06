# 📁 Project 117: Testing & CI Gap Remediation

**Status:** ✅ Shipped (2026-09-06) — Strategy B implemented as planned, all 3 tiers
**Primary Persona:** Dev / AI Partner (CI correctness, test coverage of ZK/tier boundaries) — see `docs/governance/INTERNAL_PERSONAS.md`. No direct end-user-facing UI change in any item below; several items indirectly protect David's crisis-safety paths and the tier/ZK boundary from regressing silently.
**Objective:** Implement all 8 recommendations from `docs/reports/2026-09_testing_strategy_gap_analysis.md` §4 — close the gap between what CI *looks* like it enforces and what it actually enforces (real type-checking, the SEC-01 security regression), and add coverage at the specific ZK/tier seams that report found untested (`workbook_answers`/`service` rules, `syncStripeSubscription`/`handlePlayRTDN`, the `/` a11y gap).

**Source report:** `docs/reports/2026-09_testing_strategy_gap_analysis.md`. Unlike the source spec for PROJ-116, that report *is* itself a rigorously evidence-based document (every claim independently re-verified by this session before planning began) — this project spec exists to satisfy the planning gate's required template shape, not because the report's findings were suspect.

---

## 1. The Executive Summary
**User Story:** As the developer, I want CI to actually catch what it appears to catch (type errors, the previously-shipped auth bypass) and I want the app's most access-controlled data (tier-granting functions, fully-encrypted collections) to have automated proof its access controls hold, so that "green CI" is a real signal, not a partial one.
**Competitive Gap:** N/A — internal engineering quality, not a user-facing differentiator.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No item here handles new PII or emotional data. Items 3/4 add *tests that assert* PII/tier access controls already in place — they must not weaken or change the rules/functions under test, only prove their existing behavior.
* [x] **Encryption Strategy:** No change to `src/lib/crypto.ts` or any encryption payload. Item 3's new rules tests exercise `workbook_answers`/`service` (both already-encrypted collections per CLAUDE.md) but only assert Firestore *access* rules (ownership), not decrypt anything — rules tests never see plaintext, only ciphertext blobs and metadata shape.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

**No Firestore schema changes, no `firestore.rules` changes, no new Cloud Functions, no `src/lib/db.ts` interface changes anywhere in this project.** Every item either (a) adds test files/blocks that assert existing behavior, (b) extracts already-existing decision logic into a separately-testable pure function without changing its runtime behavior, or (c) edits CI workflow YAML.

**Files touched, by recommendation (see §7 Phase 1 table for the full dependency grid):**
```
1. .github/workflows/deploy.yml           — add Build step to `verify` job
2. .github/workflows/deploy.yml           — add E2E Security step to `verify` job
3. src/__tests__/firestore.rules.test.ts  — two new describe blocks
4. functions/src/index.ts                 — extract 2 pure functions (no behavior change)
   functions/src/index.test.ts            — new tests for both
5. e2e/golden-paths/a11y.spec.ts          — split into authenticated + public route scans (see §6 Decision 1)
6. e2e/golden-paths/a11y.spec.ts          — same file as #5, PROJ-104 Phase 3's route list, same split fix required
   docs/projects/104_ACCESSIBILITY_PHASE2.md — status update once shipped
7. e2e/golden-paths/ (new file)           — PIN rotation + account deletion/crypto-shredding e2e
8. (no files — explicit decision not to add coverage tooling now)
```

---

## 4. Implementation Phases 🏗️

### Phase 1 (Tier 1 — CI-gate correctness, ~15 min total)
* **Rec #1:** Add a `Build` step to `verify`, placed *after* the existing "Install Playwright browsers" step (`deploy.yml` line ~118-119) rather than adding a second install — `verify` already installs Chromium for the E2E Golden Paths step immediately after, and `scripts/prerender-public-routes.mjs` needs exactly that same browser. **Correction to the report's own recommendation #1:** it suggested `verify` "would need its own `npx playwright install --with-deps chromium` step added" — it doesn't; reusing the existing one by ordering the new step after it is simpler and avoids a redundant ~30s install. Confirmed via `npm run build` locally that the prerender step needs no Firebase emulator (it renders 4 public routes against a local `vite preview`, no Auth/Firestore dependency), so this step has no emulator-ordering constraint — it can run anywhere after the Playwright install line.
* **Rec #2:** Add an `E2E Security` step running `npm run test:e2e:security`, anywhere in `verify` (it builds and serves its own production bundle via `playwright.security.config.ts`'s `webServer`, independent of Rec #1's new Build step and independent of the emulator-backed steps).

### Phase 2 (Tier 2 — untested ZK/tier seams, ~2-4 days total)
* **Rec #3:** Add `describe('service — ownership (PROJ-117)', ...)` mirroring the existing `journals`/`game_saves` blocks (top-level root collection, `isCreatingOwnedResource()`/`isResourceOwner()` pattern — confirmed identical rule shape in `firestore.rules` lines 233-236). Add `describe('workbook_answers — ownership (PROJ-117)', ...)` mirroring the existing `users/{userId}/playPurchases` block instead (line 448) — **correction to the report's suggested precedent**: `workbook_answers` is a nested subcollection (`users/{userId}/workbook_answers/{answerId}`, `isOwner(userId)`, confirmed in `firestore.rules` line 128-130), a structurally different shape from `journals`/`game_saves`'s top-level-collection pattern the report pointed to. `playPurchases` is the correct existing precedent for a nested-subcollection ownership test.
* **Rec #4:** Extract `computeStripeTierUpdate(beforeStatus, afterStatus): { tier: 'premium'|'free' } | null` from `syncStripeSubscription` (the `beforeStatus === afterStatus` short-circuit + the `isPremium` ternary, `functions/src/index.ts` lines 958-965) and unit-test it directly — same "extract pure logic, test in isolation" boundary `PROJ-73` already established for `verifyVaultPin`'s `evaluateVaultPinAttempt`. For `handlePlayRTDN`, extract and directly test the **stale-notification guard** specifically (`functions/src/index.ts` lines 1184-1187: `if (profile.tierSource && profile.tierSource !== "play-billing") return;`) — this is the one line standing between a stale Play renewal notification and silently downgrading a user who has since upgraded via Stripe (or vice versa), and it currently has zero coverage of any kind. Leave both `onDocumentWritten`/`onMessagePublished` wrappers thin, calling the extracted functions.

### Phase 3 (Tier 3 — a11y route expansion, ~1-1.5 days total)
* **Rec #5 + #6, combined — must ship together, not separately (see §6 Decision 1):** `a11y.spec.ts` currently scans every route through the `onboardedUser` auto-fixture (`e2e/fixtures/emulator.ts`, `auto: true` — every test using this fixture module signs up and lands on `/dashboard` *before* the test body runs). **Both `/` (Rec #5) and `/login` (part of Rec #6's PROJ-104 Phase 3 list) redirect an already-authenticated visitor away** (`Welcome.tsx`'s `useEffect` → `/dashboard`; `Login.tsx`'s `useEffect` → `/dashboard` or `/profile`, confirmed by reading both). Scanning either route with the current fixture would silently scan whatever it redirects to instead — a false-pass, not real coverage, and PROJ-104 Phase 3 as currently written in its own spec file would ship this exact bug for `/login` if implemented literally as scoped.
  * Fix: split `a11y.spec.ts` into two route groups — `AUTHENTICATED_ROUTES` (existing 7, plus PROJ-104 Phase 3's `/tools/urge-surfer`, `/profile`, `/admin`, `/delete-account` — confirmed `/delete-account` has no auth-redirect despite being a public route, so it's safe under the existing fixture) using the current `onboardedUser` fixture pattern; `PUBLIC_ROUTES` (`/`, `/login`) using a **plain, unauthenticated** Playwright `test` (imported directly from `@playwright/test`, not `../fixtures/emulator`) so no session exists when the route loads.
  * Update `docs/projects/104_ACCESSIBILITY_PHASE2.md` Phase 3's status once shipped, noting this fixture-split correction so a future reader doesn't wonder why `/login` needed different handling than `/profile`.

### Phase 4 (Tier 4 — deferred / explicit no-op)
* **Rec #7 (backlog, not this PR):** New `e2e/golden-paths/rotation-and-deletion.spec.ts` covering PIN rotation (`changePin`) and account deletion/crypto-shredding end-to-end against real emulators, mirroring `subway.spec.ts`'s precedent for a genuinely multi-step flow. Scoped here for completeness but recommended as a follow-up ticket, not bundled into this PR (see §7 Phase 2 strategy recommendation).
* **Rec #8 (no action):** Explicitly not adding coverage-percentage tooling now — confirmed reasoning holds (gaps found are structural/whole-file, not density-related; a coverage number would look reassuring while missing exactly what this project fixes). Revisit only if a future gap analysis finds density-type gaps instead.

---

## 5. QA & Verification 🧪
* [ ] **Phase 1:** A deliberately-introduced type error in a scratch branch confirms the new `Build` step fails `verify` (proves the gate closes the hole it's meant to close) — remove before merging. `test:e2e:security` step confirmed green against the current, already-fixed SEC-01 state.
* [ ] **Phase 2:** New rules-test describe blocks pass against current `firestore.rules` (proving current rules are correct) — also temporarily comment out `service`'s/`workbook_answers`' rule blocks locally to confirm the new tests actually fail without them (proves the tests test something, not just pass trivially). Same "prove it can fail" check for the two new Cloud Functions unit tests: temporarily invert the `tierSource` guard locally, confirm the new test catches it, then revert.
* [ ] **Phase 3:** Manually confirm (as this session already did for PROJ-116's Welcome page work) that the new unauthenticated `/`/`/login` a11y tests actually render the public page's real content, not a redirect target — e.g., assert `page.url()` still matches the target route before running the axe scan, so a future regression that reintroduces a redirect-while-scanning bug fails loudly instead of silently passing against the wrong page.
* [ ] **Regression:** `npm run check` (lint + spec-quality + test + build) clean throughout; full `verify` job green on the actual PR (not just locally) before merging, since the whole point of Phase 1 is proving the CI gate itself works.

---

## 6. Pre-Planning Decisions (found during this planning pass, not present in the source report)

**Decision 1 — Recs #5 and #6 must ship as one change, not two.** The report lists them as separate, independently-effort-scored recommendations (#5: ~30 min, #6: ~1 day), but they touch the same file and the same underlying bug (auth-fixture-vs-redirecting-public-route mismatch). Shipping #5 alone without the fixture-split fix would silently create a false-passing test for `/`; shipping #6 alone (PROJ-104 Phase 3 as currently scoped) would do the same for `/login`. Both need the `AUTHENTICATED_ROUTES`/`PUBLIC_ROUTES` split from Phase 3 above in the same change.

**Decision 2 — Rec #1's "new Playwright install step" isn't needed.** `verify` already installs Chromium (line ~118-119) for the existing E2E Golden Paths step. Placing the new `Build` step after that line reuses it. This shrinks Rec #1 slightly (still ~5-10 min, just skips writing a redundant install step) rather than changing its priority.

**Decision 3 — Rec #4's `workbook_answers` test should mirror `playPurchases`, not `journals`/`game_saves`.** `workbook_answers` is a nested `users/{userId}/{subcollection}` rule (`isOwner(userId)`); `journals`/`game_saves`/`service` are top-level root collections (`isCreatingOwnedResource()`/`isResourceOwner()`). Using the wrong precedent would produce a test shaped for the wrong rule pattern. `service` correctly mirrors `journals`/`game_saves` as the report suggested; only `workbook_answers`' precedent needed correcting.

---

## 7. Planning Protocol Output (2026-09-06)

### Phase 1: Dependency Impact Table

| File/Module | Type | Impact | Confidence |
|---|---|---|---|
| `.github/workflows/deploy.yml` | CI config | MODIFY — 2 new `verify` steps (Rec #1, #2) | HIGH |
| `src/__tests__/firestore.rules.test.ts` | Test | MODIFY — 2 new `describe` blocks (Rec #3) | HIGH |
| `firestore.rules` | Rules | READ only — no rule changes, tests assert existing behavior | HIGH |
| `functions/src/index.ts` | Cloud Functions | MODIFY — extract 2 pure functions from `syncStripeSubscription`/`handlePlayRTDN`, wrappers call them, no behavior change (Rec #4) | HIGH |
| `functions/src/index.test.ts` | Test | MODIFY — new tests for both extracted functions | HIGH |
| `e2e/golden-paths/a11y.spec.ts` | E2E test | MODIFY — split into `AUTHENTICATED_ROUTES`/`PUBLIC_ROUTES`, add 6 routes total (`/tools/urge-surfer`, `/profile`, `/admin`, `/delete-account`, `/`, `/login`) (Rec #5+#6) | HIGH |
| `e2e/fixtures/emulator.ts` | Test fixture | READ only — confirms `auto: true` onboarded-user behavior; no change needed, `PUBLIC_ROUTES` tests just import `test`/`expect` from `@playwright/test` directly instead | HIGH |
| `docs/projects/104_ACCESSIBILITY_PHASE2.md` | Docs | MODIFY — Phase 3 status update once shipped, note fixture-split correction | HIGH |
| `e2e/golden-paths/rotation-and-deletion.spec.ts` | E2E test | NEW (Rec #7 — recommended as separate follow-up ticket, see Phase 2 strategy below) | MEDIUM — scoped but not detailed in this pass |
| `src/lib/rotation.ts`, `src/lib/__tests__/rotation.test.ts` | Existing | READ only — confirms unit coverage already exists for PIN rotation logic (Rec #7 is about e2e, not filling a unit gap) | HIGH |
| `src/pages/DeleteAccount.tsx`, `src/pages/__tests__/DeleteAccount.test.tsx` | Existing | READ only — confirms no auth-redirect (safe under existing a11y fixture), existing unit coverage | HIGH |
| Coverage tooling (`@vitest/coverage-v8` or similar) | N/A | NO-CHANGE (Rec #8 — explicit decision not to add) | HIGH |
| `playwright.security.config.ts` | Config | READ only — confirms it self-serves a production build, no dependency on Rec #1 | HIGH |

### Phase 2: Three Strategies

**A — One big PR, all 8 recommendations at once.** Single review pass, single CI run proves everything together. Effort: ~4-6 days. Trade-off: mixes CI-YAML, Firestore-rules-authoring, Cloud-Functions-refactoring, and Playwright-fixture-design into one diff — different review lenses bundled together makes it harder to bisect if the new `Build` step (Rec #1) reveals a pre-existing type error unrelated to this project's own changes, since that failure would block the whole PR rather than just the CI-gate portion. Persona fit: N/A (no user-facing surface). Scores: speed 3 / persona N/A / ZK complexity 3 (rules+functions changes reviewed together, harder to isolate) / maintenance 3 / test surface 5.

**B — Staged by risk tier, matching the report's own ranking (recommended).** Tier 1 (Recs #1+#2, CI-gate fixes) ships first as its own tiny PR — highest leverage, lowest risk, fastest to review, and immediately closes the "green PR, broken main" hole for every subsequent PR including this project's own later tiers. Tier 2 (Recs #3+#4, rules + functions tests) ships next as its own PR — different reviewer headspace (Firestore rules semantics, Cloud Functions extraction) than CI config. Tier 3 (Recs #5+#6, a11y split) ships third — depends on nothing from Tiers 1-2, could even ship in parallel, but sequenced after since it's lowest severity per the report. Tier 4 (Rec #7) filed as a separate backlog ticket, not part of this project's PRs at all; Rec #8 requires no PR. Effort: ~1 day (Tier 1) + ~3-5 days (Tier 2) + ~1-1.5 days (Tier 3), same total work as Strategy A but reviewable and revertable independently. Persona fit: N/A. Scores: speed 4 / persona N/A / ZK complexity 5 (each tier isolated, easiest to reason about) / maintenance 5 / test surface 5.

**C — Only ship Tier 1 now (Recs #1+#2), file everything else as independent backlog tickets.** Fastest path to closing the single highest-leverage gap (the build-not-gated hole). Effort: ~15 min. Trade-off: leaves the ZK/tier-seam gaps (Recs #3, #4) and the a11y fixture bug (Recs #5, #6) undone with no committed timeline — given this report was explicitly requested to find and close these gaps, deferring everything past the CI fix risks the same fate as `PROJ-104` Phase 3 (already fully scoped since 2026-08-31, still `⚪ Planned` and unshipped as of this report). Scores: speed 5 / persona N/A / ZK complexity 2 (leaves real gaps open) / maintenance 3 / test surface 2.

**Recommendation: Strategy B.** Same total effort as Strategy A with none of its bisection risk, and unlike Strategy C it actually closes the ZK/tier-seam gaps the report was commissioned to find rather than only the cheapest item. Ship Tier 1 first specifically because every later PR in this project (and every other PR going forward) benefits from the real build gate existing as early as possible.

### Phase 3: Technical Impact
1. **Schema changes:** None anywhere in this project — see §3.
2. **Firestore rules / indexes / Cloud Functions changes:** None. Rec #3 adds tests against existing rules; Rec #4 extracts existing logic into separately-callable pure functions without changing `syncStripeSubscription`/`handlePlayRTDN`'s external behavior, request shape, or trigger config.
3. **Metadata fields to preserve:** N/A — no data-shape changes.
4. **Date normalization:** N/A.
5. **ZK boundary:** No encrypted fields touched or newly exposed. Rec #3's tests assert *access control* on already-encrypted collections (`workbook_answers`, `service`) without ever decrypting — Firestore rules tests operate on ciphertext blobs and metadata shape only, same as the 9 existing describe blocks.
6. **Test contract:**
   - Tier 1: no new tests *of* application code — these ARE the test-infrastructure changes (new CI steps running existing test suites that already pass).
   - Tier 2: unit (2 new Cloud Functions tests, `functions/src/index.test.ts`), security (2 new Firestore rules describe blocks, run against the real emulator like the existing 9).
   - Tier 3: E2E/accessibility (6 new route scans across the authenticated/public split).
   - Tier 4 (deferred): E2E (PIN rotation + deletion flow) — not implemented in this project's scope.
7. **Bundle check:** Zero new production dependencies anywhere in this project. `@axe-core/playwright` and `@firebase/rules-unit-testing` are already dev dependencies, used more (not newly added). No new lazy routes, no new Gemini calls — this project touches zero application/UI code.
8. **Rollback:** Fully `git revert`-able at every tier independently (Strategy B's whole point) — no migration, no server-side state, no deploy-order dependency. A bad CI-YAML change in Tier 1 is the only tier with any live-pipeline risk, and it's revertable in one commit with no user-facing consequence (worst case: `verify` briefly fails on unrelated PRs until reverted, never a bad deploy — `deploy`'s own build step still gates production regardless).

---

## Stop Gate
**APPROVED** (2026-09-06) — user approved Strategy B.

---

## 8. Implementation Summary (2026-09-06)

Shipped as three independent, staged PRs exactly per Strategy B — each merges cleanly on its own, none depends on the others.

**Tier 1 — CI-gate correctness** (this PR, #208): added a `Build` step (`tsc -b && vite build && prerender`) and an `E2E Security Regression (SEC-01)` step to the `verify` job. Both decisions from §6 held exactly as planned: the new `Build` step reuses the Playwright/Chromium install already present for the E2E Golden Paths step rather than installing a second time, and `test:e2e:security` needed no new dependency on it (self-contained `webServer`). Verified locally: a deliberately-introduced type error is caught by `tsc -b`, then reverted; `npm run test:e2e:security` passes against the current SEC-01 fix.

**Tier 2 — rules + Cloud Functions tests** (#209): added `service`/`workbook_answers` Firestore rules tests (66/66 pass) and extracted+tested `computeStripeTierUpdate`/`shouldApplyPlayRTDNUpdate` from `syncStripeSubscription`/`handlePlayRTDN` (114/114 functions tests pass). Both §6 precedent corrections held: `service` mirrored `journals`/`game_saves`, `workbook_answers` mirrored `playPurchases`. Every new test proven to actually assert something by temporarily breaking the underlying rule/logic and confirming the test catches it, then reverting — including one deliberate rules-disable that also caught the pre-existing `deletion.rules.test.ts` cascade test, confirming the `service` collection's real delete-permission dependency.

**Tier 3 — a11y route expansion** (#210): extended `a11y.spec.ts` from 7 to 12 routes. The §6 Decision 1 fixture-split correction (planned for `/`+`/login`) turned out to apply identically to `/admin` — found only once `/admin` was actually attempted: `AdminDashboard.tsx` has the same redirect-on-non-admin-visitor behavior as `Welcome.tsx`/`Login.tsx`'s redirect-on-authenticated-visitor, so `/admin` was deliberately **not** added rather than shipped with the same false-pass bug, pending a real admin-claim test fixture (tracked in `docs/projects/104_ACCESSIBILITY_PHASE2.md`).

**The single biggest discovery of the whole project, found only by actually running the new tests, not by planning them:** every route added in Tier 3 except `/tools/urge-surfer` immediately failed on real, previously-uncaught WCAG 2.2 AA violations — the exact risk this project set out to close, and concrete proof the a11y gate was worth adding rather than a paperwork exercise. All fixed with minimal, targeted changes (color-contrast shade bumps, one missing `htmlFor`/`id` label association) rather than deferred, since an added CI gate that ships already-failing isn't shippable. This means the original report's ~1-day effort estimate for the a11y-expansion recommendations held only for the "add routes" half of the work — the WCAG remediation half it didn't anticipate added real, necessary scope, confirming §0's framing that recommendation effort estimates were closer to a floor than a ceiling once a route had never actually been scanned before.

**Rec #7 (PIN rotation / account-deletion e2e) and Rec #8 (coverage tooling)** remain explicitly out of scope for this project, per the approved plan — #7 is a real backlog candidate; #8's reasoning (structural gaps found, not density gaps) held throughout implementation and wasn't revisited.

**Full verification, all 3 tiers combined:** `npm run lint`, `npm run docs:check-specs`, `npm run test:once` (796/796), `npm run build`, `npm run test:rules` (66/66), `npm test --prefix functions` (114/114), and the full `a11y.spec.ts` suite (12/12) all pass. No regressions found in any existing test across any tier.
