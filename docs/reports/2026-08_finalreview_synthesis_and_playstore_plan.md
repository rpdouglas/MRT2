# Finalreview Synthesis & Play Store Launch-Readiness Plan

**Date:** 2026-08-31
**Source:** `docs/finalreview/00`–`15` — a 16-document external audit of MRT2 (architecture, codebase, product, UX, competitive positioning, security, performance, scalability, and a 50-item ranked recommendation list), dated 2026-08-29.
**Purpose:** Reconcile every finalreview recommendation against what's already tracked in `ROADMAP.md`/`ACTIVE_CYCLE.md`/`BACKLOG.md`/`docs/projects/`, answer "what actually gates our first Google Play submission," and phase the rest into the existing governance system. This report is the audit trail; the actual phasing lives in `ROADMAP.md`, `ACTIVE_CYCLE.md`, and `BACKLOG.md`, which this report's findings were applied to directly.

---

## 1. What the audit found that's already good

Worth stating up front so this doesn't read as all-gaps: the audit's overall score was **74/100**, and its top strengths (verified independently, not just claimed) include a real zero-knowledge encryption architecture, **zero `any` types** anywhere in `src/`, **2,198 passing tests, 0 failing**, dual-layer CI-enforced accessibility (`jsx-a11y` + `axe-core`), a 7-gate CI/CD pipeline, and no direct competitor matching MRT2's combination of verified ZK privacy + dual 12-Step/Buddhist framework support + MAT-aware design + a real gamified layer. See `docs/finalreview/00_EXECUTIVE_SUMMARY.md` and `14_EXECUTIVE_REPORT.md` for the full scorecard.

## 2. What actually gates the first Play Store submission

None of the 16 finalreview documents discuss Play Console mechanics (Data Safety questionnaire, content rating, target API level, AAB size limits) at all — confirmed by two separate research passes over every doc. The audit's own "P0" framing (Service Module, App Check, legacy vault-key migration) is about **pre-scale** readiness, not **pre-submission** readiness. The actual submission mechanics live only in `docs/projects/07_PLAY_STORE_TWA.md`, `89_PLAY_STORE_RELEASE_BLOCKERS.md`, and the archived readiness reports — and two of those mechanics (Data Safety questionnaire, content rating questionnaire) aren't tracked as done or pending *anywhere* in current docs. That's the concrete gap this report closes.

So recommendations are sorted into four tiers, not two:

| Tier | Meaning |
|---|---|
| **0** | Literally blocks the Play Console listing |
| **1** | Cheap, do before/alongside going public — closes exposure that starts the moment the app is a public download |
| **2** | Immediate post-launch (next cycle) — real but not submission-blocking |
| **3** | Next 1–2 quarters / opportunistic — now filed in `BACKLOG.md` with trigger conditions |

### Tier 0 — Submission mechanics (before the Play Console listing can go live)

| Item | Status | Where it's now tracked |
|---|---|---|
| Finish PROJ-07 Sprint 9.2 (Bubblewrap AAB build/sign, upload, `assetlinks.json` fingerprint) | Blocked on a human Play Console verification recheck last done 2026-08-03 | `ROADMAP.md` Wave 0, `ACTIVE_CYCLE.md` |
| **Google Play Console Data Safety questionnaire** | Not started, not tracked anywhere until this report | `ROADMAP.md` Wave 0 (new) |
| **Content rating questionnaire** | Not started, not tracked anywhere until this report | `ROADMAP.md` Wave 0 (new) |
| Store listing visual QA (`_raw_screenshots/`, `SCREENSHOTS_INDEX.md`, description copy) | Assets exist (PROJ-63 screenshot generator) but the UX audit pass (`04_UX_UI_REVIEW.md` §5) flags them as not reviewed in this pass | `ROADMAP.md` Wave 0 (new) |

### Tier 1 — Do before/alongside going public

| Item | Rationale | Where it's now tracked |
|---|---|---|
| Firebase App Check (all Cloud Functions + Firestore) | Audit P0 #2 (`08_SECURITY_ASSESSMENT.md`). Its own existing `BACKLOG.md` trigger — *"proactively before a significant marketing/user-acquisition push"* — is met by a Play Store submission. Promoted, not a new judgment call. | `ROADMAP.md` Wave 0 (promoted out of `BACKLOG.md`) |
| GCP budget/cost alerting | Console-only action, already flagged as not done in `docs/projects/99_FIRESTORE_BACKEND_HARDENING.md` §4 | `ROADMAP.md` Wave 0 |
| Patch `react-router-dom`/`react-router` | `TD-13`. Note: a 2026-07-19 `npm audit fix` already cleared 0 production vulnerabilities (`ACTIVE_CYCLE.md`), but the fresh 2026-08-29 audit re-found a HIGH finding — needs re-verification (possible new advisory or regression since July), not assumed already fixed | `ROADMAP.md` Wave 0 |
| Gate `/debug` behind `isAdmin` or strip from prod builds | `TD-14` | `ROADMAP.md` Wave 0 → `ACTIVE_CYCLE.md` chore |
| Pull and review existing `web-vitals` → PostHog data | Near-zero cost, instrumentation already live | `ROADMAP.md` Wave 0 |
| Draft a DPA / sub-processor disclosure list (Gemini, PostHog, Stripe, Google Drive) | `07_GAP_ANALYSIS.md` §I. Directly feeds the Data Safety questionnaire's accuracy — do this first | `ROADMAP.md` Wave 0 |
| Align devcontainer to Node 24; remove `.eslintrc.json`/`vite.config.bak` | `TD-09`/`TD-10`/`TD-11`, trivial | `ROADMAP.md` Wave 0 → `ACTIVE_CYCLE.md` chore |

**Everything else is Tier 2 or Tier 3 — real work, but does not block the first submission.**

---

## 3. Full reconciliation — all 50 ranked recommendations

*Priority = the audit's own P0/P1/P2 label (`14_EXECUTIVE_REPORT.md`). Tier = this report's phasing. "Already tracked" means the item already exists somewhere in governance and only got a cross-reference here, not a new entry.*

| # | Recommendation | Priority | Tier | Disposition |
|---|---|---|---|---|
| 1 | Ship Service Module Phase 1 | P0 | 2 (post-launch, deferred) | Already tracked — `ROADMAP.md` Wave 3 / `PROJ-05`, status stays **Paused** per explicit decision this cycle; audit's recommendation noted, not actioned |
| 2 | Ship Firebase App Check | P0 | 1 | Promoted from `BACKLOG.md` trigger to `ROADMAP.md` Wave 0 |
| 3 | Force/nudge legacy vault-key migration | P0 | 2 | Newly tracked — `ROADMAP.md` Wave 1 |
| 4 | Close Android IAP gap (Play Billing or redirect CTA) | P1 | 3 | Already mitigated (`PROJ-68`, redirect-to-web); `13_FUTURE_STATE_ARCHITECTURE.md` §8 calls it a "compliance-adjacent workaround, not long-term" — filed as a revisit trigger in `BACKLOG.md` |
| 5 | Extend Firestore validation to 4 remaining collections | P1 | 2 | Newly tracked — `ROADMAP.md` Wave 1 (`TD-03`) |
| 6 | Structurally enforce encrypt-before-write | P1 | 2 | Newly tracked — `ROADMAP.md` Wave 1 (`TD-02`) |
| 7 | Gate `/debug` | P1 | 1 | `ROADMAP.md` Wave 0 → `ACTIVE_CYCLE.md` chore (`TD-14`) |
| 8 | Patch `react-router-dom`/`react-router` | P1 | 1 | `ROADMAP.md` Wave 0 → `ACTIVE_CYCLE.md` chore (`TD-13`) |
| 9 | Global `prefers-reduced-motion`/`focus-visible` CSS baseline | P1 | 2 | Newly tracked — `ROADMAP.md` Wave 1 |
| 10 | Pull/review existing `web-vitals` data | P1 | 1 | `ROADMAP.md` Wave 0 |
| 11 | Stand up real APM/tracing | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 12 | Add crash-reporting SDK | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 13 | Configure GCP cost/budget alerting | P1 | 1 | `ROADMAP.md` Wave 0 (already known-undone per `PROJ-99` §4) |
| 14 | Write/tabletop-test DR/BC runbook | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 15 | Commission third-party pentest | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 16 | Audit/deepen Jordan (MAT persona) discreet-UI | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 17 | Structured moderated usability-testing pass | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 18 | Publish "why zero-knowledge" trust page | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 19 | Confirm/document sub-processor (DPA) list | P1 | 1 | `ROADMAP.md` Wave 0 (feeds Tier 0 Data Safety form) |
| 20 | Re-tune `generateAIInsights` concurrency limits | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 21 | AI golden-answer eval suite | P1 | 3 | Newly tracked — `BACKLOG.md` trigger |
| 22 | Decide fate of 2 soft-hidden games | P1 | 2 | Newly tracked — `ROADMAP.md` Wave 1 (`TD-16`) |
| 23 | Decide build/remove "SMART Goal" stub | P1 | 2 | Newly tracked — `ROADMAP.md` Wave 1 (`TD-17`), bundled with #22 |
| 24 | Align devcontainer to Node 24 | P2 | 1 | `ROADMAP.md` Wave 0 chore (`TD-09`) |
| 25 | Remove `.eslintrc.json`/`vite.config.bak` | P2 | 1 | `ROADMAP.md` Wave 0 chore (`TD-10`/`TD-11`) |
| 26 | Resolve `pdf-export`/`vendor` circular chunk warning | P2 | 3 | Newly tracked — `BACKLOG.md`, trigger: next `vite.config.ts` manualChunks touch (`TD-12`) |
| 27 | Adopt Prettier | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic |
| 28 | Run `knip`/deadcode as periodic CI check | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic |
| 29 | Add Contributing/PR-process section to README | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic |
| 30 | Evaluate Capacitor iOS wrapper | P2 | 3 | Already tracked — finalreview's own 12-month roadmap; added to `BACKLOG.md` trigger (push-notification reliability signal) |
| 31 | Lighthouse-CI budget gate | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic |
| 32 | Preview-channel deploy step | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic |
| 33 | Refactor 13 raw-Firestore-call files into hooks layer | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic (`TD-04`) |
| 34 | Complete `noUncheckedIndexedAccess` remediation | P2 | — | **Already tracked** — `ACTIVE_CYCLE.md` Chores & Tech Debt, no change needed |
| 35 | Dynamic/latest-model routing + fallback chain for Gemini | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic |
| 36 | Formalize prompt-injection delimiting as reusable utility | P2 | 3 | Newly tracked — `BACKLOG.md`, opportunistic (refinement of shipped `PROJ-100`) |
| 37 | Multi-region Firestore, only if international expansion | P2 | 3 | Newly tracked — `BACKLOG.md`, conditional trigger |
| 38 | i18n investment, only if market signal | P2 | 3 | Newly tracked — `BACKLOG.md`, conditional trigger (`TD-19` already notes this posture; now has an explicit backlog line) |
| 39 | Narrower ZK "share your streak" feature vs. full Service Module | P2 | — | Product idea — added as a new icebox line under Lisa in `BACKLOG.md`, alongside the existing Service Module entry |
| 40 | Lean into Buddhist/Recovery Dharma & MAT positioning in marketing | P2 | — | **Product/marketing recommendation, not an engineering backlog item** — noted here only |
| 41 | Market Recovery Games layer more assertively | P2 | — | **Product/marketing recommendation, not an engineering backlog item** — noted here only |
| 42 | Crisis-hotline deep link in SOS Modal | P2 | 3 | Newly tracked — `BACKLOG.md`, David icebox |
| 43 | Multi-addiction tracking per user | P2 | — | **Already tracked** — `ROADMAP.md` Wave 2, "Multi-Addiction Clocks" (`NEW`) |
| 44 | Reassess Recovery Games engagement data vs. build investment | P2 | — | Data-dependent, not actionable now; noted only (matches the audit's own "once sufficient usage data exists" framing) |
| 45 | If B2B: begin SOC 2 Type I readiness | P2 | — | Contingent on a strategic decision not yet made; added as one compact conditional line in `BACKLOG.md` |
| 46 | If B2B: scope SSO/multi-tenant admin | P2 | — | Bundled with #45 |
| 47 | Formalize Recursive Build Protocol as onboarding material if team grows | P2 | — | Contingent trigger (team growth) not met — noted only, no action |
| 48 | Periodically re-run full untruncated `npm audit` | P2 | — | **Already covered** — the existing `deps-audit` skill does this; no new tracking needed |
| 49 | Surface `web-vitals`/PostHog data as internal dashboard | P2 | 3 | Newly tracked — `BACKLOG.md`, follow-on trigger after #10 lands |
| 50 | Revisit `/debug` Time Travel Debugger's role once gated | P2 | 2 | Folded into the `/debug` gate item (#7) as a follow-on note |

---

## 4. Net changes applied to governance docs

- **`docs/ROADMAP.md`** — new `Wave 0: Play Store Launch Gate` section (Tier 0 + Tier 1 items) inserted before Wave 1; Tier 2 items added as new rows in Wave 1; Service Module row in Wave 3 annotated with a pointer to this report. No existing rows renumbered or removed.
- **`docs/ACTIVE_CYCLE.md`** — `PROJ-07` entry updated to reference the two new Play Console questionnaires and the screenshot QA pass; cheap Tier 1 chores (router patch, `/debug` gate, devcontainer/file cleanup) added to Chores & Tech Debt; App Check/vault-migration/Firestore-validation/DPA-list left as spec-needed pointers only, per `CLAUDE.md`'s spec-before-code rule.
- **`docs/BACKLOG.md`** — Firebase App Check entry removed from "Infrastructure & Scale Triggers" (promoted, trigger met) and replaced with a pointer to its new `ROADMAP.md` Wave 0 row; Tier 3 items added as new trigger-based entries in the same style as the existing ones; Service Module entry gets a one-line pointer to this report; a few small product-icebox lines added (share-streak feature, crisis-hotline deep link) under their respective personas.

## 5. Service Module — explicitly deferred, not decided here

The audit calls the Service Module (`PROJ-05`) the single highest-leverage recommendation in the entire report — Wave 1 (Play Store TWA), the reason it was originally paused, is now essentially done. That makes a reasonable case for unpausing it next. This report intentionally does **not** make that call: per this cycle's decision, `PROJ-05` stays **⏸️ Paused** in both `ROADMAP.md` and `BACKLOG.md`, with only a citation added pointing back to this report's rationale. Revisit explicitly in a future planning session.
