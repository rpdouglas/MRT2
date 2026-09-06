# Testing Strategy Gap Analysis

**Date:** 2026-09-06
**Trigger:** User request for a deep, evidence-based review of the entire testing stack (unit, component, Firestore/Storage rules, E2E, accessibility, build, lint, CI gating) — are we testing too much, too little, the wrong things, and is CI's real bar as strict as it looks.
**Method:** Every claim below was verified against the actual repo this session — commands run, files read, test counts produced live — not inferred from prior docs. Where a past project (`PROJ-73`/`91`/`96`/`104`) already fixed something, this report confirms it's still true rather than re-flagging it; where drift was found, it's called out explicitly.

---

## 0. Bottom Line

The suite is **not over-tested and not thin overall** — 796 unit/component tests, 104 Cloud Functions tests, a real emulator-backed Firestore/Storage rules gate, and a genuinely CI-enforced (not aspirational) Playwright golden-path + accessibility suite is a mature setup most apps this size don't have. The problem is **misallocation, not volume**: coverage clusters around what's easy to test (pure functions, extracted logic, components in isolation) and thins out sharply at exactly the highest-stakes seams CLAUDE.md itself calls out — the two Cloud Functions that write the `tier` field, 8 of 14 documented Firestore collections (including both fully-encrypted ones), and the actual production build (`tsc -b && vite build`) is **never run as a pull-request gate at all**, only after merge. The single highest-leverage fix is adding `npm run build` as its own step in the `verify` job — it is a five-minute CI change that closes the single biggest "green PR, broken main" hole found.

---

## 1. Current-State Inventory

| Category | Tool | What it covers | Gates CI (PR)? | Verified evidence |
|---|---|---|---|---|
| Unit/component | Vitest + RTL | Components, hooks, lib functions | ✅ Yes — `verify` job "Unit Tests" step | `npm run test:once`: **112 files, 796 tests, ~182s**, 0 failures |
| Cloud Functions unit | Vitest (separate workspace) | Extracted pure logic from `functions/src/index.ts` | ✅ Yes — `verify` job "Functions Unit Tests" | `npm test --prefix functions`: **1 file (`index.test.ts`), 104 tests**, 0 failures |
| Firestore rules | `@firebase/rules-unit-testing` + emulator | Ownership/shape checks, per-collection | ✅ Yes — `verify` job "Firestore Rules Tests" | `src/__tests__/firestore.rules.test.ts` (680 lines), **9 `describe` blocks** covering 6 of 14 CLAUDE.md-documented collections + `playPurchases`/`playPurchaseIndex`/`ai_logs`/`client_errors`/`feedback` |
| Storage rules | Same, Storage emulator | `image_library` backing bucket | ✅ Yes — `verify` job "Storage Rules Tests" | `src/__tests__/storage.rules.test.ts` exists, runs via `test:rules:storage` |
| E2E golden paths | Playwright + real Auth/Firestore/Functions emulators | Signup→onboard, task complete, vault setup/unlock (peppered), offline/resume, a11y, 320px screenshots | ✅ Yes — `verify` job "E2E Golden Paths" (`npm run test:e2e`) | 6 spec files in `e2e/golden-paths/`: `gate.spec.ts` (1 test), `ledger.spec.ts` (1), `vault.spec.ts` (1), `subway.spec.ts` (2), `a11y.spec.ts` (7, generated), `viewport-320.spec.ts` (5, screenshot-only) |
| E2E production-build security regression | Playwright, separate config (`playwright.security.config.ts`) | Proves `mockUser` URL-param auth bypass (SEC-01) stays dead in a **real production build** | ❌ **No** — `test:e2e:security` does not appear anywhere in `.github/workflows/deploy.yml` | Grepped the full workflow file — zero matches for `test:e2e:security` or `playwright.security` |
| Accessibility (automated) | `@axe-core/playwright`, inside `a11y.spec.ts` | WCAG 2.2 AA on 7 routes | ✅ Yes — it's part of the E2E Golden Paths step above, not a separate named step | `ROUTES = ['/dashboard','/vitality','/tools','/games','/games/craving-buster','/workbooks','/journal']` — **7 of 41 routes in `App.tsx`** |
| Accessibility (static) | `eslint-plugin-jsx-a11y` | JSX-source-level a11y patterns | ✅ Yes — part of "Lint Check" | Confirmed active in `eslint.config.js`, scoped to `**/*.tsx` |
| Lint | ESLint 9 flat config, `--max-warnings 0` | Code style, hooks rules, a11y (static) | ✅ Yes — `verify` job "Lint Check" | `npm run lint` clean; **20 `eslint-disable` comments in `src/`**, all individually justified (WCAG autofocus rationale, Playwright fixture false-positives, etc.) — not blanket suppressions |
| Type-checking (`tsc -b`) | TypeScript project build | Full cross-file type correctness | ❌ **No** — only runs inside `npm run build`, which is **not a step in the `verify` job at all** | Grepped `deploy.yml`: the only `npm run build` invocation is in the `deploy` job (line ~270), which is `needs: verify` **and** `if: github.event_name == 'push'` — never runs on a `pull_request` event |
| Production build (`vite build` + prerender) | Vite + `scripts/prerender-public-routes.mjs` | Bundling, prerendering 4 public routes | ❌ **No**, same reason as above | Same evidence as the `tsc -b` row — it's the same `npm run build` command |
| Docs-site build | VitePress | `docs-site/` (separate from the app) | ✅ Yes — `verify` job "Docs Site Build" | Distinct from the app build; already correctly gated (added specifically because a broken docs-site build once went unnoticed until after merge — see the workflow's own GATE 3b comment) |
| Spec-quality (docs, not code) | `scripts/check_spec_quality.mjs` | `docs/projects/*.md` required sections | ✅ Yes — `verify` job "Spec Quality Check" | Confirmed a real gate; explicitly a **documentation**-quality check, not code-quality — kept as its own category per the task's own instruction not to conflate the two |
| Dependency vulnerability audit | `npm audit` (root + `functions/`) | Production-dependency CVEs | ✅ Yes — two separate `verify` steps, `critical`/`high` thresholds respectively | Confirmed in workflow with documented, specific accepted exceptions (react-router RSC advisory) |
| Coverage measurement | — | — | N/A | **No coverage tool configured at all** — no `@vitest/coverage-v8` or equivalent in `package.json`, no `coverage` block in any vitest config. Not a percentage to guess at; it simply isn't measured. |

---

## 2. Gap Analysis, Weighted by Real Risk

### 2.1 Highest severity — the ZK/tier/crisis seams CLAUDE.md itself flags

**`syncStripeSubscription` and `handlePlayRTDN` have zero test coverage of any kind.** These are the two Cloud Functions that can write `tier`/`tierSource` on `users/{uid}` — per CLAUDE.md, "only `syncStripeSubscription`... or an admin... can set them," making this one of the most access-controlled fields in the entire schema. Grepped `functions/src/index.test.ts` (all 104 tests) for `stripe`, `RTDN`, `handlePlayRTDN`: **zero matches**. Contrast with `verifyVaultPin` (`PROJ-73`), which got its decision logic extracted into `evaluateVaultPinAttempt`/`deriveVaultPepper` specifically so it could be unit-tested without mocking `firebase-admin`'s transaction API — `syncStripeSubscription` never got that treatment, has no e2e coverage either, and isn't even flagged as an accepted gap anywhere (`docs/projects/105_PLAY_BILLING_TWA.md:94` explicitly says to "check before assuming a pattern to copy" from it — i.e., even the next feature that needed the same pattern wasn't sure this one had any).

**8 of 14 Firestore collections in CLAUDE.md's own encryption-boundary table have no rules test at all**: `workbook_answers`, `service`, `tasks`, `insights`, `rosc_assessments`, `users/{uid}/templates`, `game_progress`, `crossword_puzzles`. Two of those — **`workbook_answers` and `service`** — are the app's only two **fully-encrypted** collections besides `journals`/`game_saves`, and `service` holds a sponsor's notes about *other people* (sponsees), not even the writer's own data. There is currently no automated proof that Firestore rules actually enforce ownership or reject a cross-user read/write on either. `firestore.rules.test.ts`'s 9 `describe` blocks cover `journals`, `game_saves`, `mat_doses`, `users` (tier/role escalation), `playPurchases`/`playPurchaseIndex`, `image_library`/`daily_images`, and `ai_logs`/`client_errors`/`feedback` — a real and reasonably broad set, but the two most sensitive fully-encrypted collections outside `journals` are the ones missing.

**The `/` Welcome page has never been in the automated accessibility gate — including today's own quiz/crisis-panel work.** `a11y.spec.ts`'s route list has never included `/` (it's absent from the array, not removed). This session added a brand-new, unauthenticated, form-and-modal-heavy surface to that exact page (`RecoveryQuiz`, `CrisisResourcesPanel`, a personalized auth headline) with full unit/RTL test coverage but zero automated axe coverage in a real browser — the same gap that already existed for the pre-existing embedded signup form on that page.

### 2.2 High severity — CI looks stricter than it is

**The actual production build (`tsc -b && vite build && prerender`) is not a pull-request gate.** It only runs inside the `deploy` job, which is both `needs: verify` and `if: github.event_name == 'push'` — so it never executes for a `pull_request` event. Since `npm run lint` uses `tseslint.configs.recommended` (confirmed: no `parserOptions.project` anywhere in `eslint.config.js`, i.e. the **non**-type-checked variant) and Vitest transforms TypeScript per-file via esbuild (no cross-file type checking), **nothing in the `verify` job actually type-checks the codebase.** A PR can have a real type error — a missing required prop, a Firestore doc shape mismatch, a wrong function signature — pass lint, pass every unit test, pass e2e, and merge clean. The break is only discovered when the post-merge `deploy` job runs `npm run build` for real, at which point it's already on `main` (the deploy itself would fail closed, so nothing broken reaches users, but `main` sits in a red/blocked state until someone notices and fixes it — a worse position than catching it in review).

**`test:e2e:security` (the SEC-01 mockUser-bypass regression test) is not wired into CI at all.** It exists specifically because a real production auth-bypass vulnerability was found and fixed (`PROJ-90`) — `playwright.security.config.ts`'s own header comment explains it must run against a real production build (`vite build` + `vite preview`) because the golden-path suite's dev-server config would pass even if the fix were reverted. Confirmed via full-file grep of `deploy.yml`: it is never invoked. This is the single clearest case in the whole audit of "a real, working regression test for a real, previously-shipped vulnerability, sitting completely disconnected from the pipeline that's supposed to run it."

### 2.3 Medium severity — real coverage, thin surface area

**Automated a11y coverage is 7 of 41 routes (~17%).** `docs/projects/104_ACCESSIBILITY_PHASE2.md` Phase 3 already identifies exactly this and lists 5 specific routes to add (`/tools/urge-surfer`, `/login`, `/delete-account`, `/profile`, `/admin`) — that phase is still `⚪ Planned`, not shipped, confirmed by reading the file's current status. Even fully shipped, that only reaches 12 of 41 routes; `/` (Welcome) isn't on that list either (see 2.1).

**`viewport-320.spec.ts` makes no assertions** — it's explicitly documented in its own header as "no assertions, just guards against someone deleting this" and produces screenshots for manual review only. This is an honest, deliberate design (confirmed via its comment), but it means the automated suite would **not** have caught a real regression found and fixed in this very session: the Welcome page's new crisis-bypass link rendered below the fold at a real 320×568 viewport (only caught by an ad-hoc manual Playwright script written during that work, not this suite). Worth noting as a concrete, dated example of the gap's real cost, not a hypothetical.

**No end-to-end coverage for PIN rotation, account deletion/crypto-shredding, or Stripe subscription upgrade→downgrade→re-verify tier enforcement.** The golden-path suite covers vault *setup* and *unlock* (`vault.spec.ts`) but not `changePin`'s rotation path or `executeCryptoShredding` end-to-end in a real browser against real emulators — both exist as documented, deliberate unit-level coverage only (`rotation.test.ts`, `EncryptionContext.test.tsx`'s `changePin` delegation test), which is a reasonable choice, just worth naming explicitly as "unit-only, not e2e" rather than leaving it ambiguous.

### 2.4 Low severity / hygiene, confirmed clean

- **Zero `.skip`/`.only`/`.todo`/`describe.skip` anywhere in `src/`** — no rot, no silently-disabled tests left behind. Confirmed by full-repo grep.
- **`eslint-disable` usage (20 instances) is disciplined**, not an escape-hatch pattern — every instance carries an inline rationale (WCAG autofocus justification repeated verbatim across ~8 sites, Playwright-fixture false positives, etc.), not a blanket suppression.
- **`prerender-public-routes.mjs` fails loudly, not silently** — confirmed by reading the script: it throws on a missing `dist/`, throws if the local preview server doesn't come up within 20s, and throws (via Playwright's own `waitForSelector` timeout) if any of the 4 prerendered routes doesn't mount within 15s. Since `main()` is called with no `.catch()`, an unhandled rejection crashes the Node process with a non-zero exit code by default — this correctly fails the `deploy` job's build step rather than silently shipping an empty prerender. Not a gap.
- **Playwright's `retries: process.env.CI ? 1 : 0`** is a standard, modest CI-flakiness allowance, not a sign of a suite so unreliable it needs masking — no evidence of a larger retry count or a skip-on-failure pattern anywhere.

---

## 3. Over-Testing / Inefficiency Findings

Genuine over-testing was not found. The closest candidates, neither serious:

- `functions/src/index.test.ts` is a single 104-test file for a 2047-line module covering ~13 distinct exported functions plus shared helpers — not wasteful, but as the file grows, splitting by function (mirroring the `PROJ-73`-established "extract pure logic, test in isolation" pattern already used for `verifyVaultPin`) would make it easier to see which of the 13 functions above actually has coverage at a glance, rather than requiring the grep-based audit this report had to do.
- No flaky-test-retry masking was found (see 2.4) — this is a genuine strength, not a false negative from insufficient searching (the workflow, both Playwright configs, and CI logs' referenced runtimes were all checked directly).

---

## 4. Recommendations, Ranked by Risk × Effort

1. **(Effort: ~5 min, Risk closed: highest) Add `npm run build` as a step in the `verify` job**, before or alongside "Unit Tests." This single change turns on real type-checking and a real production-build check as a PR gate — closing the "green PR, broken main" hole in §2.2 entirely. Playwright/Chromium for the prerender step is already installed later in the `deploy` job; `verify` would need its own `npx playwright install --with-deps chromium` step added (already proven safe — it's the exact same install line the `deploy` job already runs for the same reason).
2. **(Effort: ~10 min) Add `test:e2e:security` as a `verify` job step.** It already builds and serves a real production bundle itself (`playwright.security.config.ts`'s own `webServer` command), so it doesn't depend on recommendation #1 to be meaningful — it can be added standalone today.
3. **(Effort: 1-2 days) Write rules tests for `workbook_answers` and `service`**, the two fully-encrypted collections with zero coverage — mirror `firestore.rules.test.ts`'s existing `journals`/`game_saves` `describe` blocks (ownership, cross-user read/write rejection, shape/size validation) since those are the closest existing precedent for a fully-encrypted collection.
4. **(Effort: 1-2 days) Add direct unit coverage for `syncStripeSubscription` and `handlePlayRTDN`.** Follow `PROJ-73`'s established extraction pattern: pull the tier-decision logic (Stripe status → `tier`/`tierSource` mapping, RTDN notification-type → status mapping) into plain exported functions, test those directly, leave the `onDocumentWritten`/`onMessagePublished` wrapper thin — the same boundary already drawn for `verifyVaultPin`.
5. **(Effort: ~30 min) Add `/` to `a11y.spec.ts`'s `ROUTES` array**, given it's both the app's actual public entry point and just received substantial new interactive surface (quiz, modal, personalized form) this session. Low effort, immediate, closes a gap that predates this session but is now more consequential.
6. **(Effort: 1 day, tracked but stalled) Ship `PROJ-104` Phase 3** (`/tools/urge-surfer`, `/login`, `/delete-account`, `/profile`, `/admin` added to the a11y route list) — already fully scoped, just not executed.
7. **(Effort: 2-3 days, lower urgency) Add e2e coverage for PIN rotation and account deletion/crypto-shredding.** Unit coverage already exists and is solid; this is about closing the "does this actually work end-to-end against real emulators" gap the way `subway.spec.ts` already did for offline/resume, not a correctness concern today.
8. **(Effort: ongoing, no urgent action) No coverage-percentage tooling is recommended as a priority** — given the gaps found are structural (whole collections/functions with zero coverage) rather than density-related (files with thin coverage), a raw coverage percentage would likely look reassuring while missing exactly the gaps this report found. If added later, pair it with per-directory or per-critical-path thresholds (crypto/vault/tier code specifically), not a single repo-wide number.

---

## 5. Already Fixed — Confirmed Still True, Not Re-Flagged

- **`PROJ-73`'s vault-pepper e2e fix holds**: `test:e2e`'s emulator list includes `functions` (confirmed in both `package.json` and `deploy.yml`), so `vault.spec.ts` genuinely exercises the peppered `verifyVaultPin` path rather than silently falling back to the legacy derivation — this was the project's entire point and it's still wired correctly.
- **`PROJ-91`'s CI a11y gate is real, not aspirational** — confirmed `a11y.spec.ts` runs as part of the `E2E Golden Paths` step, which is a genuine blocking `verify` job step, not a manual-only protocol.
- **`PROJ-96`'s dependency-audit gates are both still active and correctly scoped** (`critical` for root with the documented react-router exception, `high` for `functions/`, both confirmed present with retry-on-503 handling in `deploy.yml`).
- **`PROJ-104` Phase 1 (SOS reachable while vault-locked) is unrelated to this report's scope** but its Phase 3 (CI a11y route expansion) is confirmed still `⚪ Planned` in the doc's own status line — correctly listed above as an open gap (§4.6), not claimed-but-missing drift.
