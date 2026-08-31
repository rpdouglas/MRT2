# 📁 Project 103: Firebase App Check

**Status:** 🟡 In Progress — client-side init shipped 2026-08-31 (inert, no site key configured yet); blocked on 2 Firebase Console steps before enforcement can safely proceed (see §5)
**Primary Persona:** All (network-edge security gate — no single persona owns this, protects the whole product)
**Objective:** Attest that requests hitting Firestore, Cloud Functions, and Auth actually originate from MRT's real app (web PWA and Android TWA), not scripted/scraped/replayed clients — closing the largest network-edge security gap named in the 2026-08-29 finalreview audit (P0 #2).

---

## 1. The Executive Summary
**User Story:** As any user, I want the backend I depend on to stay available and not get quietly drained by scripted abuse traffic, so that the app stays fast, cheap to run, and trustworthy as it goes public on the Play Store.
**Source:** `docs/finalreview/08_SECURITY_ASSESSMENT.md`, `docs/finalreview/15_RISK_MATRIX_AND_TECH_DEBT_REGISTER.md` (`TD-06`), `docs/reports/2026-08_finalreview_synthesis_and_playstore_plan.md`. Promoted from `docs/BACKLOG.md`'s "Infrastructure & Scale Triggers" 2026-08-31 — its own trigger ("proactively before a significant marketing/user-acquisition push") is met by the upcoming Play Store submission.
**Competitive Gap:** Not a user-facing differentiator — this is operational-maturity table stakes. Confirmed absent today across Firestore, Auth, and all 8 Cloud Functions (`functions/src/index.ts`).

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
* [x] **Data Sensitivity:** App Check is an attestation layer at the network edge — it verifies the *caller*, not the *payload*. It never touches encrypted or decrypted content and sits entirely outside the ZK boundary described in `CLAUDE.md`.
* [x] **Encryption Strategy:** N/A — no interaction with `src/lib/crypto.ts`.
* [x] **Key Rotation:** N/A — unrelated to vault-key/PIN rotation.
* [ ] **Open question for the strategy phase:** does the zero-knowledge boundary already limit what an unattested client could obtain even without App Check? (The finalreview audit notes ciphertext, not plaintext, is most of what's exposed today.) This affects how urgently Enforce-mode (vs. Monitor-mode) is needed per collection/function — analyze, don't assume.

---

## 3. Schema & Architecture 🗄️
No new Firestore collections. Two things change:
* **`firestore.rules`:** rules would gain `request.app != null` conditions (App Check token presence) alongside existing `request.auth` checks, once/where enforced.
* **`functions/src/index.ts`:** each of the 8 Cloud Functions needs a per-function decision — callable/HTTPS functions invoked directly by the client (e.g. `verifyVaultPin`, `generateAIInsights`) are real App Check candidates; Firestore-triggered or scheduled functions (e.g. `syncStripeSubscription`, `dailyBeacon`) are not directly client-callable and likely don't need it. **Enumerate and classify all 8 before proposing enforcement, not after.**

**Types (`src/lib/db.ts`):** No changes expected.

---

## 4. Known Constraints to Resolve During Strategy (Phase 2)

These are the specific open questions the `/planning` Rule-of-3 pass needs to resolve — not yet decided here:

1. **Provider choice for web:** reCAPTCHA v3 is Firebase's standard free web provider. Given MRT ships as a PWA *and* an Android TWA (Chrome rendering the same web app, not a native Android SDK integration), does the TWA need a separate Play Integrity provider, or does the same web/reCAPTCHA provider already cover both surfaces? Get this right before scoping effort — it changes the integration surface significantly.
2. **Offline-first compatibility:** `CLAUDE.md` states MRT is explicitly offline-first (Firestore's multi-tab IndexedDB persistence, per `PROJ-64`). App Check tokens are short-lived and refresh periodically — confirm this doesn't break offline reads/writes for a user who opens the app with an expired/missing token and no network to refresh it. David's crisis-first, max-3-taps requirement makes a false-positive lockout here a real severity, not a cosmetic bug.
3. **Enforcement rollout order:** Firebase App Check supports **Monitor mode** (log unattested requests, don't block) before **Enforce mode** (reject them) per service. Given there's no APM/crash-reporting tool yet (`docs/BACKLOG.md` — separately tracked), how do we get visibility into Monitor-mode data without one? Decide the minimum viable observability before flipping to Enforce.
4. **CI/emulator compatibility:** `PROJ-99` added the first real Firestore rules emulator test suite; `PROJ-23`/`PROJ-73` depend on Firebase emulators for Playwright e2e. Confirm the emulator suite supports App Check (debug tokens) without breaking existing CI gates.
5. **Which of the 8 Cloud Functions actually need it** — classify callable-by-client vs. trigger-only per the Schema section above.

---

## 5. Implementation Phases 🏗️

*Filled in 2026-08-31 by the `/planning` Rule-of-3 pass. **Analysis only — no code written.** Awaiting explicit approval before Phase 3 Execution begins.*

### Correction to the audit's own count
The finalreview audit (`08_SECURITY_ASSESSMENT.md`) says "all eight Cloud Functions." Direct inspection of `functions/src/index.ts` finds **7**: `dailyBeacon`, `checkBufferHealth`, `generateDailyCrossword` (all `onSchedule`), `syncStripeSubscription` (`onDocumentWritten`), and `generateReadingsAdmin`, `generateAIInsights`, `verifyVaultPin` (all `onCall`). The likely 8th is a function the Stripe Firebase Extension provisions on its own (not in this file, not under MRT's direct source control) — worth confirming in the Firebase Console during build, not assumed. This matters because **only the 3 `onCall` functions are actually client-callable** — App Check's `enforceAppCheck` option only applies to functions a client invokes directly over HTTPS. The 3 scheduled functions and the Firestore-triggered `syncStripeSubscription` aren't reachable that way, so App Check doesn't apply to them at all — the real scope is narrower than "8 functions" implies.

### Dependency Impact Table

| File/Module | Type | Impact | Confidence |
|---|---|---|---|
| `src/lib/firebase.ts` | Client Firebase init | MODIFY | HIGH |
| `functions/src/index.ts` (`generateReadingsAdmin`, `generateAIInsights`, `verifyVaultPin`) | Cloud Functions (`onCall`) | MODIFY | HIGH |
| `functions/src/index.ts` (`dailyBeacon`, `checkBufferHealth`, `generateDailyCrossword`, `syncStripeSubscription`) | Cloud Functions (scheduled/trigger) | NO-CHANGE | HIGH — not client-callable, App Check doesn't apply |
| `firestore.rules` | Security rules | NO-CHANGE (this ticket) | MEDIUM — Firestore/Auth App Check enrollment is a Console/API-level toggle, not a rules-syntax change, in Monitor mode; confirm during build, don't assume |
| `firebase.json` | Emulator config | MODIFY | HIGH — needs an `appcheck` emulator block for local/CI debug-token testing |
| `.github/workflows/*.yml` | CI | MODIFY | MEDIUM — emulator startup needs the new `--only appcheck` (or equivalent) flag alongside existing `auth,firestore,functions` |
| `src/__tests__/firestore.rules.test.ts` | Rules unit tests (`PROJ-99`) | MODIFY | MEDIUM — add an App Check debug-token fixture so a future Enforce-mode change has a real regression harness |
| `package.json` (root) | dependencies | NO-CHANGE | HIGH — `firebase@^12.11.0` already ships `firebase/app-check`; no new package |
| `functions/package.json` | dependencies | NO-CHANGE | HIGH — `firebase-functions@^7.3.0` already supports `enforceAppCheck` natively |
| Env/secrets (`.env`, Secret Manager) | Config | MODIFY | HIGH — needs a reCAPTCHA v3 site key (client, public) + secret key (server-side verification, if ever needed beyond the SDK default) |
| `scripts/generate_screenshots.js` (`PROJ-63`) | Dev tooling | MODIFY | MEDIUM — drives a real Chromium instance against the dev server; needs a debug token wired in or it starts failing attestation once the client SDK initializes App Check |
| `docs/RUNBOOK.md` | Docs | MODIFY | HIGH — new rollback entry, matching the existing Hosting/Functions/rules pattern from `PROJ-96` |
| Firebase Console / API (App Check registration, Monitor-mode enrollment) | Infra, not code | N/A | HIGH — a per-environment (dev/uat/prod) console action, same "not checkable/doable from an agent sandbox" shape as the already-tracked GCP budget alert |

### Three Strategies

**Strategy A — Conservative (Cloud Functions only):** Initialize the client App Check SDK with reCAPTCHA v3, add `enforceAppCheck: true` to the 3 `onCall` functions only. Skip Firestore/Auth entirely.
- Effort: ~1–2 days.
- Trade-off: closes the costliest, most security-sensitive surface (`verifyVaultPin`, `generateAIInsights`'s Gemini-cost exposure) fast, but leaves direct Firestore access — a scripted client with a valid Auth token could still read/write Firestore directly, bypassing Cloud Functions entirely — completely untouched.
- David (crisis): safest — smallest blast radius if anything about token issuance misbehaves.
- Walt (reflective): unaffected.
- Scores — speed 5 / persona-fit 5 / ZK complexity 5 / maintenance 4 / test surface 4.

**Strategy B — Recommended (Functions enforced + Firestore/Auth Monitor mode):** Everything in A, plus enroll Firestore and Auth in **Monitor mode** (observe, never block) in this same ticket, with a concrete time-boxed observation window (e.g. 2 weeks post-Play-Store-launch) and an explicit follow-up decision point to consider Enforce mode. Build the App Check emulator + debug-token plumbing (dev, CI, and `PROJ-63`'s screenshot pipeline) now, so a future Enforce-mode flip is a config change, not a new dev cycle.
- Effort: ~3–4 days.
- Trade-off: more upfront integration work (emulator config, debug-token plumbing across 3 surfaces) in exchange for real Monitor-mode visibility into the *actual* audit finding (Firestore/Auth had zero App Check coverage — not just functions) before Play Store traffic begins.
- David: same safety profile as A — Monitor mode never blocks a real request, so no new lockout risk.
- Walt: unaffected — no change to his AI/export/analysis flows.
- Scores — speed 3 / persona-fit 5 / ZK complexity 5 / maintenance 4 / test surface 3.

**Strategy C — Robust/Scalable (Enforce mode on high-value paths now):** Everything in B, plus flip `verifyVaultPin` and `generateAIInsights` straight to Enforce mode in this same ticket.
- Effort: ~6–8 days (realistically longer — no APM/crash-reporting tool exists yet, a separately-tracked `BACKLOG.md` item, so real-time visibility into Enforce-mode rejections would mean manually querying Firebase Console logs, not a dashboard).
- Trade-off: closes the gap fastest and most completely, but the missing observability tooling makes flipping to Enforce within the same ticket materially riskier, exactly where a false positive costs the most.
- David: **highest risk** — if App Check token issuance has any edge case (offline app open, an expired token, a TWA webview quirk), Enforce mode on `verifyVaultPin` could lock him out of his own vault mid-crisis. Directly conflicts with `CLAUDE.md`'s "his worst case sets the UX floor for the whole product."
- Walt: unaffected either way.
- Scores — speed 1 / persona-fit 2 / ZK complexity 4 / maintenance 3 / test surface 2.

**Recommendation: Strategy B.** It closes the audit's actual finding (Firestore/Auth, not just a 3-function subset), and doesn't trade David's crisis-path reliability for a security-posture improvement that Monitor mode already delivers — visibility — without Enforce mode's lockout risk. This also matches how this repo has already handled comparably blast-radius-sensitive rollouts: `PROJ-65`'s peppered vault-key scheme shipped as a per-account `usesPepperV2` flag with a gradual migration, not a hard cutover.

### Technical Impact

1. **Schema / `src/lib/db.ts`:** None. App Check tokens are transport-layer (HTTP headers) — never persisted to a Firestore document, never touched by any TypeScript interface.
2. **Firestore rules / indexes / Cloud Functions:** Add `enforceAppCheck: true` to the 3 `onCall` functions' options objects. No `firestore.indexes.json` change. `firestore.rules` unchanged in this ticket — Firestore/Auth Monitor-mode enrollment is a Console/API action, not a rules-syntax change (confirm this during build; Firebase's App Check/rules integration story has shifted across product versions, don't assume from memory).
3. **Metadata fields to preserve:** N/A — no document writes involved.
4. **Date normalization:** N/A.
5. **ZK boundary — every encrypted field explicitly:** None touched. App Check operates entirely outside the ZK boundary described in `CLAUDE.md` — confirmed in §2 above.
6. **Test contract:**
   - *Unit:* new tests for the 3 `enforceAppCheck: true` functions, confirming they still succeed when called with a valid emulator-issued debug token (`firebase-functions-test` + App Check emulator).
   - *Integration:* extend `src/__tests__/firestore.rules.test.ts`'s existing `PROJ-99` emulator pattern with an App Check debug-token fixture.
   - *Security:* verify a request *without* a valid token to one of the 3 functions is rejected — in the emulator, not production Enforce mode (Strategy B defers that).
   - *Regression:* full `npm run test:e2e` (Playwright against emulators, `PROJ-23`) must stay green with App Check initialized client-side in Monitor mode.
   - **Explicitly required — the Subway Test:** offline app open with an expired/absent App Check token must not break Firestore reads/writes. MRT is offline-first by design; this is the single highest-severity failure mode for this entire project.
   - **Also required:** confirm `scripts/generate_screenshots.js` (`PROJ-63`) still works once the client SDK initializes App Check — it drives a real Chromium instance against the dev server and will need a debug token wired in.
7. **Bundle check:** `firebase/app-check`'s `ReCaptchaV3Provider` adds to the existing `firebase` manual chunk (`vite.config.ts`, `PROJ-89`) — measure the actual gzip delta at build time, don't assume it's negligible. No new npm dependency. No new lazy routes. No new Gemini calls.
8. **Rollback:** `git revert` is fully sufficient for every code change here (client SDK init, `enforceAppCheck` flags, emulator config) — nothing is a one-way migration. The one non-code rollback lever is the Firebase Console/API Monitor-mode enrollment itself, reversible via the same Console — document this in `docs/RUNBOOK.md` alongside the existing Hosting/Functions/rules entries (`PROJ-96`) once shipped.

---

## Stop Gate

**Analysis complete.** Strategy B approved 2026-08-31.

## 7. Phase 3 Execution Log

### Correction found mid-execution
Before writing code, verified two assumptions from §5's Dependency Impact Table were wrong:
- **No local App Check emulator exists** in `firebase-tools@15.24.0` (checked `node_modules/firebase-tools` directly — no `appCheck`/`appcheck` emulator config anywhere in its schema).
- `enforceAppCheck` verification runs through `firebase-admin`'s `verifyToken()`, which does real cryptographic JWT verification (`functions/node_modules/firebase-admin/lib/app-check/token-verifier.js`) — no emulator-side bypass, no debug-token special-casing server-side. Debug tokens are a *client-side* mechanism only (skip solving reCAPTCHA), and the resulting token still has to pass real server-side verification — which itself requires the debug token to be pre-registered in Firebase Console.
- **Concrete consequence:** `e2e/golden-paths/vault.spec.ts` (`PROJ-73`, a CI-blocking gate) drives the real app through Playwright and makes an actual network call to `verifyVaultPin`. Flipping `enforceAppCheck: true` on that function today — with no site key and no registered debug token — would break that e2e test immediately, and every real vault unlock in production along with it.

### What shipped 2026-08-31 (safe, zero behavior change for real users)
- `src/lib/firebase.ts`: client-side `initializeAppCheck` + `ReCaptchaV3Provider`, gated entirely behind `VITE_RECAPTCHA_SITE_KEY` being set (it isn't, in any environment yet) — so this is fully inert today, wrapped in try/catch per `CLAUDE.md`'s fail-safe convention. Also sets `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in `DEV` only, ahead of the debug-token console step, so no further code change is needed once that's registered.
- `.env.example`: documents the new optional `VITE_RECAPTCHA_SITE_KEY` var.
- No Cloud Function changes yet — `enforceAppCheck` deliberately **not** added to `generateReadingsAdmin`/`generateAIInsights`/`verifyVaultPin` in this pass (that's what would have broken `vault.spec.ts`).
- Verified: `npm run check` clean (701/701 tests, lint, specs, build). Firebase chunk bundle delta: **+13.5KB raw / +4.3KB gzip** (`firebase` manual chunk, `vite.config.ts`) — small, as expected.

### Blocked on 2 Firebase Console steps (only a human with Console access can do these)
1. Register the app under Firebase Console → App Check, generate a reCAPTCHA v3 site key — needed per environment (`mrt2-app-dev`, `mrt2-app-uat`, `mrt2-app-prod`).
2. Register a debug token in Firebase Console → App Check → Manage debug tokens, for local dev/CI to use instead of solving reCAPTCHA.

### Deferred to a follow-up pass, once the above are done
- Set `VITE_RECAPTCHA_SITE_KEY` per environment (env var + GitHub Actions secret for CI/deploy).
- Add `enforceAppCheck: true` to the 3 callable functions.
- Wire the registered debug token into `e2e/golden-paths/vault.spec.ts` and `scripts/generate_screenshots.js` (`PROJ-63`) so they keep passing once enforcement is live.
- Firestore/Auth Monitor-mode enrollment (Strategy B's second half) — a separate Console action, not a code change.
- `docs/RUNBOOK.md` rollback entry — deferred until there's actual live behavior to roll back; today's change has none.

---

## 6. QA & Verification 🧪
* [ ] **Unit Tests:** TBD per chosen strategy.
* [ ] **The Subway Test:** Explicitly required given the offline-first constraint above — verify offline read/write still works with an expired/absent App Check token.
* [ ] **The "Lost PIN" Test:** N/A (App Check doesn't touch the vault-key/PIN system).
* [ ] **Monitor-mode data review:** before flipping any service to Enforce mode, confirm a real review of Monitor-mode rejection data happened, not just a time-based rollout.
