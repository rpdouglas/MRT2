# 📁 Project 116: Welcome Page Persona Quiz & Redesign

**Status:** ✅ Shipped (2026-09-06) — Strategy B implemented as planned
**Primary Persona:** N/A (marketing/pre-auth surface, `src/pages/Welcome.tsx`) — but every persona is a discovery *outcome*; David's crisis-first floor governs the crisis-bypass requirement specifically (§0 of `docs/PERSONAS.md`).
**Objective:** Restructure the live `/` (Welcome) page to unify its CTAs, surface features before persona storytelling, add a "Find Your Recovery Season" persona-matching quiz as the primary discovery mechanic, keep a trimmed-but-expandable persona showcase as a secondary path, and add a standalone crisis-bypass link for an unauthenticated visitor in acute distress — per `docs/reports/SPEC-WELCOMEPAGE-002.md` (supersedes SPEC-WELCOMEPAGE-001, incorporates SPEC-RECOVERYQUIZ-001).

**Source spec:** `docs/reports/SPEC-WELCOMEPAGE-002.md`. That file lives in `docs/reports/` (the audit/analysis directory) and is not itself a `docs/projects/00_TEMPLATE.md`-shaped spec — this document is the template-conformant project spec derived from it, with the three genuinely-blocking open items from that spec's §9 resolved below (see §6 "Pre-Planning Decisions").

---

## 1. The Executive Summary
**User Story:** As a visitor landing on `myrecoverytoolkit.ca` for the first time, I want to quickly understand what the app does, either answer a short quiz or browse to find "my" persona, and get to a single clear next step (web signup or Google Play) — and if I'm in crisis right now, I want a way to get help immediately without wading through any of that.
**Competitive Gap:** Generic sobriety trackers ("I Am Sober", "Reframe", "Sober Grid") lead with a single generic onboarding flow. MRT's persona system is a real differentiator, but only if the page gets a visitor to "this was built for me" fast — the current live page buries that behind six full bio reads and two competing CTAs. The quiz turns persona-matching into an active, shareable moment (and a funnel-continuity story for ads) instead of passive scrolling.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** Does this feature handle PII or emotional data? **No.** Quiz answers are non-identifying (pacing/approach/obstacle/rhythm preferences), computed and discarded client-side. No Firestore read/write of any kind — same N/A status as the rest of `Welcome.tsx` today (per `docs/screens/welcome.md`).
* [x] **Encryption Strategy:** Will this use `src/lib/crypto.ts`? **No.**
* [x] **Key Rotation:** Does this data need to be included in `executePinRotation`? **No.**
* [x] **Gemini:** No AI call of any kind in this feature. Not a tenth entry to the approved-flow list.

**Explicit scope decision (see §6, Decision 1):** the quiz result is **not persisted** to any `users/{uid}` field, pre- or post-signup. It lives in component state + `sessionStorage` for the duration of the CTA click, and is sent to PostHog as a property on funnel events only (persona label, e.g. `"maya"` — not free text, not an answer transcript). This keeps the ZK boundary at N/A rather than opening a new plaintext-profile-field question.

---

## 3. Schema & Architecture 🗄️

**No Firestore schema changes.** No new collection, no new field on `users/{uid}`, no `firestore.rules` change, no index, no Cloud Function. This is a static/client-only page restructure plus one outbound-URL helper.

**New files:**
```
src/components/welcome/RecoveryQuiz.tsx        — quiz UI: 4 questions, result card
src/lib/welcomeQuizScoring.ts                   — pure scoring function + tie-break (unit-testable in isolation)
src/components/welcome/CrisisResourcesPanel.tsx — unauthenticated static crisis view (§6 Decision 2)
src/lib/playStoreLink.ts                        — builds the tagged Google Play URL (§6 Decision 1)
```

**Modified files:**
```
src/pages/Welcome.tsx      — page reorder per spec §5, CTA unification (§6 spec section), crisis-bypass link,
                              dual CTA (web signup / Google Play) on quiz result + direct showcase clicks
src/lib/telemetry.ts       — new tracking functions (§7 below)
docs/screens/welcome.md    — living doc update post-implementation (already stale: says Maya/Jordan
                              aren't shown, but PROJ-108 added them to the carousel on 2026-09-03)
```

**Types (no `db.ts` change — this is local/component-scope, not a Firestore interface):**
```typescript
// src/lib/welcomeQuizScoring.ts
export type RecoveryPersona = 'david' | 'ned' | 'lisa' | 'walt' | 'maya' | 'jordan';

export interface QuizAnswers {
  q1: 'david' | 'ned' | 'maya' | 'walt' | 'jordan' | 'lisa'; // direct target, +3 own axis
  q2: '12step' | 'smart' | 'dharma' | 'mat' | 'secular_cbt';
  q3: 'streak_shame' | 'privacy' | 'preachy' | 'overwhelmed';
  q4: 'late_night' | 'errand' | 'morning_reflection';
}

export function scoreQuiz(answers: QuizAnswers): RecoveryPersona; // implements §7.3 matrix + tie-break
```
Note: this is intentionally its own small union type, not a reuse of `GamePersonaTarget` (`src/lib/db.ts:213`) — that type is Recovery-Games-scoped (`'David' | 'Ned' | 'Lisa' | 'Walt' | 'All'`, no Maya/Jordan) and belongs to a different, Firestore-backed domain (`game_progress`). Extending it to 6 values for this unrelated marketing quiz would leak an unrelated concept into the games SDK.

---

## 4. Implementation Phases 🏗️

### Phase 1: Scoring Engine (pure logic, no UI)
* `welcomeQuizScoring.ts` implementing the exact §7.3 matrix and tie-break rule (highest Q1 score wins; if Q1 ties, highest combined Q3+Q4).
* Unit tests covering: a clean win, a Q1 tie resolved by Q3+Q4, and an all-tie edge case (define and document the fallback — spec doesn't state what happens if Q3+Q4 also ties; propose stable-first-match-in-persona-order to keep it deterministic).

### Phase 2: Quiz UI + Result Card
* `RecoveryQuiz.tsx`: 4-question flow (single-select per question, no back/skip logic beyond spec scope), progress indicator, result card per §7.4 (persona name/tagline/portrait via `ASSETS.personas.<name>.bio` — **already exists**, shipped 2026-09-05 in commit `d57c098`, contradicting the spec's assumed flat `bio_{persona}.webp` path; actual convention is `ASSETS.personas.<name>.bio` → `/personas/<name>/bio.webp`, matching PROJ-108's nested-directory convention).
* Add the one-line code comment the spec asks for (§7.4) at the point these assets are consumed, distinguishing this marketing-only asset from `PersonaBioCard`'s in-app usage.
* Dual CTA on the result card (§6 Decision 1): "Begin your toolkit — built for [Persona]" (scrolls to `#auth-section`, unchanged behavior) + a secondary "Get it on Google Play" link via `playStoreLink.ts`.

### Phase 3: Page Restructure
* Reorder `Welcome.tsx` sections per spec §5: encryption strip → hero (+ crisis-bypass link, compact disclaimer) → feature strip → quiz → trimmed showcase → trust statement → closing CTA → footer.
* CTA unification: single "Begin your toolkit" string in hero + closing block; remove "Initialize Toolkit" wording if it exists in current copy (confirm during implementation — not found in the `PERSONA_CONTENT`/header excerpt read during planning, may be closing-block-only copy).
* Showcase stays **larger** than the spec's draft assumption per §6 Decision 3: keep existing `PersonaBioCard` expand-to-full-story per card (already implemented, already has all 6 personas' bios authored per PROJ-108) — just add the trimmed name/archetype/quote header row above it, which already exists in the current carousel markup (`persona.name`/`persona.title`/`persona.quote`). Net effect: much less removal than the spec assumed, mostly reordering + one new expand toggle if not already collapsed by default.
* Direct showcase-card clicks carry the same persona-tagged referrer as a quiz completion (spec §6 "New", accepted as in-scope — same `playStoreLink.ts` helper, same sessionStorage tag for the web path).
* **Somatic Check:** the crisis-bypass link must render above the fold near the hero on a 320px viewport, not require scrolling past the quiz to find — this is the one place in this project that touches David's crisis-first floor directly.

### Phase 4: Crisis Bypass (unauthenticated)
* `CrisisResourcesPanel.tsx` — reuses copy/pattern from `SOSModal.tsx`'s non-personalized options only: 988/911 call links, the "Find a Meeting" accordion (AA/NA/SMART/Recovery Dharma/WFS links). **Excludes** sponsor-contact, Urge Surfer/Craving Buster/Journal/Vitality deep-links, and the vault-unlock-gated messaging — those all assume an authenticated, vault-unlocked session `SOSModal` has and this page's visitor doesn't.
* Render as an in-page anchor/section (not a route) unless implementation finds a route cleaner — either way, no auth guard, reachable with zero taps beyond the hero link.
* Track `crisis_resources_opened` (mirrors `trackSosOpened`'s existing pattern) with a `source: 'welcome_page'` property.

### Phase 5: Funnel Instrumentation
* `telemetry.ts` additions: `trackQuizStarted()`, `trackQuizQuestionAnswered(questionNumber)`, `trackQuizCompleted(persona)`, `trackShowcaseCardClicked(persona)`, `trackCrisisResourcesOpened()`. All follow the existing `safeCapture` no-PII pattern.
* UTM tagging on quiz entry points: read existing `?utm_*` query params (if present) and forward as event properties on `trackQuizStarted` — no new UTM-parsing infra needed, PostHog's `posthog-js` already auto-captures standard UTM params on pageview; confirm this during implementation rather than hand-rolling parsing.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** `welcomeQuizScoring.test.ts` — full §7.3 matrix, the Q1-tie fallback, and the proposed all-tie fallback.
* [ ] **Component tests:** `RecoveryQuiz.test.tsx` (renders 4 questions, resolves to expected persona for at least one path per persona), `CrisisResourcesPanel.test.tsx` (renders without any auth context/provider — proves it truly doesn't depend on `useUserProfile`/`useEncryption`).
* [ ] **The Subway Test:** N/A — no offline-dependent state; page is static/client-only.
* [ ] **The "Lost PIN" Test:** N/A — no vault, no encrypted data involved.
* [ ] **The 320px test:** crisis-bypass link visible without scroll; quiz question cards don't overflow; result-card dual-CTA buttons stack cleanly.
* [ ] **Manual browser check:** full page flow (quiz → result → both CTAs), showcase direct-click flow, crisis-bypass flow — all three exercised in a real browser per `npm run dev`, not just type-check/build.
* [ ] **Screenshot/asset audit:** confirm no asset reused across hero / showcase / quiz-result contexts (spec §8) — flag Jordan's showcase screenshot as a **known content gap** (no MAT/dose-tracking-specific marketing screenshot exists in `src/data/assets.ts`'s `marketing.screenshots` today); this is a content-production task, not something this ticket's code can resolve — needs a real app capture per `CLAUDE.md`'s "Play Store listing screenshots must be real captures" precedent, not an AI-generated placeholder.
* [ ] **Regression:** `npm run check` (lint + spec-quality + test + build) clean.

---

## 6. Pre-Planning Decisions (resolved 2026-09-05, supersede SPEC-WELCOMEPAGE-002 §9 items 1/3/4 for the *technical* plan; copy-wording items 1/5 and content-gap item 6 remain open as non-blocking follow-ups)

**Decision 1 — CTA destination (§9 item 3 + the newly-discovered Google-Play-vs-embedded-signup conflict):** Both paths are kept. The existing embedded web-signup scroll-to-`#auth-section` behavior is unchanged and stays primary. A secondary "Get it on Google Play" link is added, tagged with the resolved persona via a `referrer` query param (`https://play.google.com/store/apps/details?id=ca.myrecoverytoolkit.app&referrer=persona%3D{persona}`, package name confirmed from `src/pages/PremiumUpgrade.tsx`). **Reading that referrer on first app launch (to greet the user by persona) is explicitly out of scope for this project** — no Android/TWA-side install-referrer code exists in this repo today, and building it belongs with the in-progress `docs/projects/105_PLAY_BILLING_TWA.md` TWA work, not a web-page redesign. This ticket only tags the outbound URL.

**Decision 2 — Crisis bypass destination (§9 item 4):** New static, unauthenticated `CrisisResourcesPanel` (Phase 4 above). Confirmed necessary because `SOSModal.tsx` requires `useUserProfile()`/`useEncryption()` (an authenticated, vault-unlocked session) and cannot render correctly for a pre-signup visitor.

**Decision 3 — Persona showcase depth (§9 item 2):** Keep the expand-to-full-story interaction. `PersonaBioCard` (all 6 personas, real authored backstory copy) already exists and already works on the live page — trimming it away and losing that content isn't worth it just to match the spec's draft assumption. The "trim" the spec wants is satisfied by the header row (name/archetype/quote) already being the first thing shown; the expand stays as an option underneath, not a redesign.

**Still open, not blocking this plan:**
- §9 item 1 (Q1 David-option wording) — copy-only, resolve during implementation with a persona-safe phrasing pass, no architectural impact.
- §9 item 5 (compact disclaimer wording) — needs legal/compliance sign-off, independent of build sequencing; ship with a placeholder-but-accurate short disclaimer, swap wording when sign-off lands.
- §9 item 6 (Jordan showcase screenshot) — content-production gap, flagged in §5 QA above, not a code blocker.

---

## 7. Planning Protocol Output (2026-09-05)

### Phase 1: Dependency Impact Table
| File/Module | Type | Impact | Confidence |
|---|---|---|---|
| `src/pages/Welcome.tsx` | Component | MODIFY — reorder, CTA unification, crisis-bypass link, dual-CTA wiring | HIGH |
| `src/components/welcome/RecoveryQuiz.tsx` | Component | NEW | HIGH |
| `src/lib/welcomeQuizScoring.ts` | Logic | NEW | HIGH |
| `src/components/welcome/CrisisResourcesPanel.tsx` | Component | NEW | HIGH |
| `src/lib/playStoreLink.ts` | Logic | NEW | HIGH |
| `src/lib/telemetry.ts` | Module | MODIFY — 5 new tracking functions, same `safeCapture` pattern | HIGH |
| `src/components/PersonaBioCard.tsx` | Component | NO-CHANGE (reused as-is, Decision 3) | HIGH |
| `src/components/SOSModal.tsx` | Component | READ only (copy/pattern reference for `CrisisResourcesPanel`, not imported/shared) | HIGH |
| `src/data/assets.ts` | Generated | READ only — `ASSETS.personas.<name>.bio` already populated (PROJ-108 + 2026-09-05 commit `d57c098`) | HIGH |
| `src/pages/PremiumUpgrade.tsx` | Component | READ only — source of `PLAY_PACKAGE_NAME` constant to reuse | HIGH |
| `public/Marketing/Screenshots/*` | Assets | UNCERTAIN — Jordan-specific feature screenshot likely missing; content task, not code | LOW |
| `src/components/games/ScenarioMatchQuiz.tsx` (Recovery Games shared quiz loop) | Component | NO-CHANGE — considered and rejected; that component is tied to `game_progress` writes and an authenticated session, wrong domain for a pre-auth marketing quiz | HIGH |
| `src/lib/db.ts` | Types | NO-CHANGE — no schema change (Decision 1: quiz result not persisted) | HIGH |
| `firestore.rules` / indexes / Cloud Functions | Backend | NO-CHANGE | HIGH |
| `docs/screens/welcome.md` | Docs | MODIFY — living-doc update post-ship (already stale re: Maya/Jordan since PROJ-108) | HIGH |
| `docs/PERSONAS.md` | Docs | READ only — source copy for quiz result taglines/strengths | HIGH |

### Phase 2: Three Strategies

**A — Quiz + showcase as separate static sections, no shared CTA plumbing.** Build the quiz and the trimmed showcase as independent features; quiz gets the Google-Play-tagged CTA, showcase direct-clicks keep today's behavior (no referrer parity). Effort: ~2 days. Trade-off: fastest, but explicitly fails spec §6's funnel-continuity extension and reintroduces exactly the "quiz vs. showcase compete for the same job" problem the spec's §4 was written to resolve. David (crisis): no impact either way. Walt (reflective): showcase unaffected, fine for him either way. Scores: speed 5 / persona 2 / ZK 5 / maintenance 4 / test surface 4.

**B — Full spec implementation with shared persona-tagging helper (recommended).** One `playStoreLink.ts` + one sessionStorage-tag helper used by both the quiz result and direct showcase clicks, per Decision 1/§6 spec extension. Quiz, showcase-expand-kept (Decision 3), and crisis panel (Decision 2) all ship together as one coherent page restructure. Effort: ~4-5 days. Trade-off: more surface area in one PR, but avoids a half-migrated page state (unified CTA in some places, old CTA in others) which is itself a UX risk for a page David might land on directly. David: crisis-bypass link is a net new safety improvement over today's page, which has none. Walt: showcase depth preserved, no loss of the reflective read he'd want if he ever browsed this page. Scores: speed 3 / persona 5 / ZK 5 / maintenance 5 / test surface 4.

**C — Quiz only this ticket, showcase-parity + crisis panel deferred to a fast-follow.** Ship the quiz + CTA unification + reorder now; treat showcase-click referrer parity and the crisis-bypass panel as a PROJ-117 fast-follow. Effort: ~2.5 days for this ticket. Trade-off: smaller PR, faster ship — but ships a page with the exact "quiz-first flow adds a step between landing and help" gap the spec's §3 item 8 explicitly calls out as a David-safety problem, live in production for however long the fast-follow takes. Not acceptable per CLAUDE.md's "never gate/delay crisis-adjacent safety" framing — the crisis link isn't a gate, but shipping without it fails the David Safety Test on a page redesign that specifically added new friction (the quiz). Scores: speed 4 / persona 2 / ZK 5 / maintenance 4 / test surface 3.

**Recommendation: Strategy B.** Highest persona score, and Strategy C's deferral of the crisis-bypass panel is a direct governance-rule violation (`docs/PERSONAS.md` §0's David Safety Test) for a page change that itself introduces the friction that rule exists to catch — not an acceptable trade for the smaller PR. Strategy A fails the spec's own stated design resolution (§4) by re-creating the redundant-discovery-paths problem it was written to close.

### Phase 3: Technical Impact
1. **Schema changes:** None. No `db.ts` interface changes — quiz result is ephemeral (component state + `sessionStorage`), never written to Firestore (Decision 1/§2 above).
2. **Firestore rules / indexes / Cloud Functions:** None.
3. **Metadata fields to preserve:** N/A — no Firestore writes in this feature.
4. **Date normalization:** N/A — no `Timestamp`/`Date` handling introduced.
5. **ZK boundary:** No encrypted fields. Nothing in this feature touches `crypto.ts`, and nothing here is a tenth Gemini-approved flow — no AI call at all.
6. **Test contract:**
   - Unit: `welcomeQuizScoring.test.ts` (matrix + both tie-break levels).
   - Component: `RecoveryQuiz.test.tsx`, `CrisisResourcesPanel.test.tsx` (the latter must render with zero auth/encryption context providers to prove the Decision 2 independence claim).
   - Security: N/A — no raw Firestore doc to check, nothing server-side changes.
   - Regression: `npm run check` clean; manual browser pass on `/` covering all three flows (quiz, showcase-direct-click, crisis-bypass) per §5.
7. **Bundle check:** No new npm dependencies anticipated (`RecoveryQuiz`/`CrisisResourcesPanel` are plain React + Tailwind, same as the rest of `Welcome.tsx`). No new lazy route — `Welcome.tsx` is already eagerly loaded as the `/` route, this doesn't change that. No new Gemini calls.
8. **Rollback:** Fully `git revert`-able. No migration, no server-side state, no deploy-order dependency (pure static client page). Lowest-risk rollback profile possible for a feature this size.

---

## Stop Gate
**APPROVED** (2026-09-06) — user approved Strategy B.

---

## 8. Implementation Summary (2026-09-06)

Strategy B shipped as planned, all decisions from §6 honored:

- **`src/lib/welcomeQuizScoring.ts`** (new): pure scoring engine implementing the §7.3 matrix exactly, with the documented 3-level tie-break (overall total → Q1 score → combined Q3+Q4 → fixed persona-priority as the final deterministic fallback for the fully-tied case the source spec doesn't define). 5 unit tests, including a verified real tie case that exercises the Q3+Q4 fallback branch (not just the Q1-wins branch).
- **`src/lib/playStoreLink.ts`** (new): `buildPlayStoreLink(persona)` tags the outbound Google Play URL's `referrer` param. `PLAY_PACKAGE_NAME` was moved here as the canonical definition (previously a private const in `PremiumUpgrade.tsx`) — **important direction choice**: `PremiumUpgrade.tsx` now imports it from this lib file, not the reverse, because `PremiumUpgrade` is a lazy-loaded route and `Welcome.tsx` (this feature's consumer, the eager `/` route) importing from a lazy page would have dragged that route's code into the main bundle. Confirmed via `npm run build`: `PremiumUpgrade` still builds as its own separate chunk.
- **`src/data/welcomePersonas.ts`** (new): `WELCOME_PERSONAS`, extracted from `Welcome.tsx`'s former inline `PERSONA_CONTENT` so the quiz result card and the showcase cards share one source of truth. Added `resultStrengths` (2-3 lines per persona) for the quiz result card, condensed from each persona's "Key Feature Alignment" section in `docs/PERSONAS.md`.
  - **Fixed an asset-reuse bug found during extraction** (spec §8's own audit item): Jordan's showcase screenshot was `scn_dashboard_02_clean_time` — the exact same image already used as the hero's floating "Clean Time Chip" badge. Swapped to `scn_tasks_log` (same-app stand-in, thematically closer to one-tap dose logging) with a code comment flagging that a real MAT/dose-tracking screenshot should replace it — tracked as the one still-open content gap (§9 item 6 equivalent).
- **`src/components/welcome/RecoveryQuiz.tsx`**, **`PersonaCtaButtons.tsx`**, **`CrisisResourcesPanel.tsx`** (new): quiz UI + shared dual-CTA button group + the unauthenticated crisis-bypass modal. `CrisisResourcesPanel` is a trimmed sibling of `SOSModal.tsx` (988/911 + meeting finder only) proven via test to render with zero auth/encryption context providers.
- **`src/lib/telemetry.ts`**: 5 new tracking functions (`trackQuizStarted`, `trackQuizQuestionAnswered`, `trackQuizCompleted`, `trackShowcaseCardClicked`, `trackCrisisResourcesOpened`), same `safeCapture` no-PII pattern as the rest of the file. Full test coverage added to the existing `telemetry.test.ts`.
- **`src/pages/Welcome.tsx`**: reordered per spec §5 (hero → feature strip → quiz → showcase → trust statement → auth/closing CTA → footer); CTA unified to "Begin your toolkit" everywhere (hero, showcase cards, quiz result, and the signup submit button, which previously read "Initialize Toolkit"); auth-section headline personalizes to "Begin your toolkit — built for {Persona}" when a quiz/showcase persona tag is present in `sessionStorage`.
  - **Design correction made during browser verification, not part of the original plan:** the crisis-bypass link was originally placed in the hero body per the spec's literal wording ("near the hero"). A real 320×568px Playwright screenshot showed it below the fold — failing the David Safety Test the spec itself was written to satisfy, since a visitor in acute crisis would need to scroll past the full hero text stack to find it. **Fixed by moving it into the sticky trust bar** (top of every viewport, at every scroll position) instead of the hero body — a strictly stronger placement than "near the hero," verified visible at 320px width with a fresh screenshot after the fix.
- **QA:** `npm run check` clean (lint, docs:check-specs, 796/796 tests across 113 files, build). Manual browser verification via a throwaway Playwright script against the real dev server (not committed) covering: crisis panel open/close with 988 visible, full quiz flow resolving correctly to David, quiz-result CTA click correctly scrolling to and personalizing the auth section, all 6 showcase personas rendering, zero console errors, and the 320px crisis-link-visibility fix. Screenshots reviewed visually, not just asserted programmatically.
- **Explicitly not done (per §6 Decision 1 scope boundary):** no Android/TWA-side code reads the Play Store install referrer at first app launch — this repo only tags the outbound URL. Still open per §9 equivalent: Q1's "Calm, low friction" wording and the compact disclaimer's final copy need a persona-safe/legal pass respectively; Jordan's showcase screenshot is a stand-in pending a real MAT/dose-tracking capture.
