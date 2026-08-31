# MRT2 — Executive Report

*This is the top-level synthesis of a full architectural, technical, product, UX, security, performance, and competitive audit of the MRT2 ("My Recovery Toolkit") codebase, conducted 2026-08-29 via direct repository inspection, real command execution (`npm audit`, `tsc --noEmit`, `npm run build`, `npm run test:once`), and live market research. Every finding below is traceable to a specific file, command output, or cited external source in the companion documents (`01`–`13`). Where evidence was unavailable, this report says so explicitly rather than estimating.*

---

## Executive Summary

MRT2 is a materially more mature, more disciplined engineering effort than its apparent team size would suggest. The evidence throughout this audit — zero `any` types across the codebase, 2,198 passing automated tests with zero failures, a verified (not just claimed) zero-knowledge encryption architecture, dual-layer accessibility enforcement, and a 7-gate CI/CD pipeline — points to a small, highly disciplined team (likely solo or near-solo, working extensively with AI-agent tooling under a formal "Recursive Build Protocol") that has built a genuinely defensible, differentiated product in a crowded market.

The product itself — a zero-knowledge recovery companion spanning journaling, CBT/REBT tools, AI-guided insight, and a genuinely distinctive gamified "Recovery Games" layer — has no direct competitor found in this audit's research that matches its combination of verified privacy architecture, dual 12-Step/Buddhist framework support, and clinical-tool depth.

The single largest gap is not technical: it is product-strategic. The **Service Module** — sponsor/sponsee tooling for the "Lisa" persona, documented internally as the product's "Primary Viral Driver" — is entirely unbuilt, its spec explicitly paused, and its planned entry point on the Dashboard has since been reassigned to another feature. This is the highest-leverage single decision surfaced anywhere in this audit.

The remaining gaps cluster into two categories that are normal and expected at this stage, not signs of neglect: **operational maturity that scales with user count** (App Check, APM, cost alerting — all cheap to close now, expensive to be caught without later) and **go-to-market execution questions this audit could not answer from source code alone** (actual retention/revenue data, Android monetization gap, enterprise readiness).

## Overall Score: 74/100

| Category | Score /100 | Basis |
|---|---|---|
| Architecture | 80 | Sound, verified ZK core; some structural-enforcement gaps (see `01`) |
| Engineering | 85 | Exceptional type-safety/testing discipline; some ops-maturity gaps (see `02`) |
| Product | 70 | Deep, well-built feature set; one major unbuilt persona-critical module (see `03`, `05`) |
| UX | 75 | Strong code-evidenced discipline; live/visual verification incomplete (see `04`) |
| Performance | 70 | Good build-time engineering; runtime data unmeasured in this pass (see `09`) |
| Security | 80 | Strong core controls; App Check + legacy-PIN gaps open (see `08`) |
| Scalability | 80 | Architecture holds to 1M+ users; needs ops investment ahead of scale (see `10`) |
| Developer Experience | 75 | Strong onboarding/docs; minor tooling drift (see `02`, `11`) |
| Business Readiness | 50 | Strong technical foundation; monetization/enterprise gaps, data unverifiable from code (see `05`) |
| Technical Debt | 70 | Actively tracked, modest in volume, nothing alarming found (see `02`, `07`) |

*(Overall Score is the unweighted average of the ten category scores above. A weighted score favoring Security/Architecture, given the health-adjacent, privacy-critical nature of the product, would land in the same high-70s range.)*

---

## Top 25 Strengths

1. Zero-knowledge encryption architecture is real and independently verified, not marketing — fresh IV per call, non-extractable keys, server-rate-limited pepper exchange matching its own documentation exactly.
2. Zero `any` types anywhere in `src/` — verified by direct grep, not claimed.
3. `tsc --noEmit` clean; zero `TODO`/`FIXME`/`HACK`; zero `@ts-ignore`/`@ts-expect-error`.
4. 2,198 passing automated tests, 0 failing, across 103 test files, including dedicated ZK-boundary regression guards.
5. A genuinely server-enforced admin authorization model (custom claims checked in both Firestore rules and Cloud Functions).
6. Vault PIN rate-limiting is a real, transactionally-correct, server-side control — closes a failure mode ("client-side rate limiting") extremely common in PIN-gated apps.
7. Zero XSS surface found (`dangerouslySetInnerHTML`, `.innerHTML=`, `eval`, `document.write` — all absent from `src/`).
8. No secrets found live in tracked source, env files, or client bundles; two historical incidents both closed same-day with verified, thorough remediation.
9. Dual-layer, CI-enforced accessibility (static `jsx-a11y` + runtime `axe-core` WCAG 2.2 AA gate across 7 real routes, including the PIN screen itself).
10. A dedicated 320px-viewport automated responsive test — a rare, valuable practice.
11. A genuinely differentiated product: zero-knowledge + dual 12-Step/Buddhist framework + MAT-aware design + a real games layer, with no direct competitor matching all four.
12. An unusually mature documentation culture — 133 markdown files, a CI-enforced spec template, specs that document rejected alternatives and real bugs found during implementation.
13. Persona-driven design decisions demonstrably shaped real product architecture (e.g., Achievements relocated off the Dashboard specifically to resolve Walt vs. Ned's conflicting gamification needs).
14. A 7-gate CI/CD pipeline (audit → lint → spec-check → unit → functions-unit → functions-audit → rules-emulator → E2E) before any deploy.
15. Deliberate, well-reasoned Vite manual-chunking strategy with inline rationale for every chunk.
16. Firestore composite indexes were reconciled against real production drift (PROJ-99), not assumed correct.
17. PostHog telemetry is architecturally privacy-guarded (`safeCapture()`), not just policy-guarded.
18. A crisis-first UX pattern (SOS Modal, plaintext-fallback-on-locked-vault for Urge Surfer) that correctly prioritizes user safety over strict architectural purity when the two conflict.
19. Consistent, justified `eslint-disable` usage — every one of 19 instances found carries inline rationale, not a blanket suppression.
20. A real, working offline-first PWA using Firestore's modern multi-tab persistence API.
21. Modern secrets management (`defineSecret`/Secret Manager), with the legacy config path explicitly disabled (`disallowLegacyRuntimeConfig: true`).
22. High spec-to-code traceability — the large majority of the ~30 features map to a numbered, CI-validated spec.
23. Thoughtful monetization compliance engineering (Android TWA correctly hides Stripe checkout per Play Store policy, even though this creates the Android revenue gap noted separately).
24. AI governance is disciplined: a documented, enumerated 9-flow allowlist, server-side-only prompt construction, payload-shape validation, and prompt-injection mitigation with an honest, accurate self-assessment of its own limits.
25. Genuinely honest internal engineering culture — `ACTIVE_CYCLE.md` and multiple specs document real mistakes, near-misses, and process failures rather than presenting only successes.

## Top 25 Weaknesses / Risks

1. **Service Module (sponsor tooling) is entirely unbuilt** — the single largest gap relative to a named, high-priority persona's core need.
2. No Firebase App Check on any Cloud Function — confirmed absent, already internally acknowledged.
3. Legacy (pre-PROJ-65) accounts have no server-pepper protection on their vault key — a live, not historical, cryptographic weakness.
4. `/debug` route reachable by any authenticated user with only a UI warning, no role check.
5. Android TWA has no in-app purchase path — a direct, ongoing revenue leak.
6. Encrypt-before-write is convention-enforced, not structurally enforced, in the shared CRUD hook.
7. Firestore shape/size validation covers only 2 of 6 sensitive collections.
8. No APM/distributed tracing/uptime monitoring — production performance and outages are effectively invisible until reported.
9. No crash-reporting SDK (Sentry or equivalent) — slower incident diagnosis, no automatic alerting.
10. No documented, tested DR/BC runbook (RTO/RPO) confirmed.
11. Zero i18n readiness — 100% hardcoded English, including accessibility labels.
12. No feature-flag system beyond hardcoded booleans — can't gradually roll out or kill-switch a risky change.
13. `react-router-dom` carries a HIGH-severity npm-audit finding with genuine (if likely low-exploitability) production exposure.
14. No formal third-party penetration test evidence found.
15. No formal compliance documentation (DPA/sub-processor list, HIPAA-readiness, SOC 2) found — likely not yet needed, but unverified.
16. No enterprise readiness (SSO, multi-tenant admin, BAA capability) — expected at this stage, but worth naming for any B2B ambitions.
17. 13 files bypass the hooks-only Firestore-access convention, widening the surface a future ZK audit must cover.
18. Node version drift between the devcontainer (20) and CI/production (24).
19. Two vestigial config artifacts (`.eslintrc.json`, `vite.config.bak`) create minor new-contributor confusion.
20. `noUncheckedIndexedAccess` evaluated and deferred (164 errors found) — a known, unresolved latent-bug source.
21. No live Core Web Vitals/Lighthouse data reviewed in this audit, despite instrumentation already existing.
22. A largest-in-app 705KB/209KB-gzip `pdf-export` chunk whose true lazy-load behavior wasn't independently confirmed.
23. No community/social feature — a deliberate strategic bet, but a real competitive gap against Loosid/WEconnect's network-effect growth lever.
24. No visible business-metrics evidence (MAU/DAU/retention/revenue) accessible to this code-only audit — every prioritization judgment in this report is made without that data.
25. Jordan (MAT persona)'s discreet-UI feature depth was not fully traced/confirmed in code — a stated persona promise with unverified delivery depth.

## Top 50 Recommendations (ranked)

*P0 = before wider scale/launch · P1 = next 1-2 quarters · P2 = opportunistic. Full detail and effort/ROI estimates for each live in `07_GAP_ANALYSIS.md` and `11_MODERNIZATION_OPPORTUNITIES.md`.*

**Immediate / P0 (do these first — highest leverage, lowest risk of delay):**
1. Ship the Service Module, Phase 1 (sponsee list + notes).
2. Ship Firebase App Check across all Cloud Functions and Firestore.
3. Force or strongly nudge legacy-account vault-key migration to the peppered scheme.

**P1 — next 1-2 quarters:**
4. Close the Android in-app-purchase gap (Play Billing, or a clear redirect CTA).
5. Extend Firestore shape/size validation to `workbook_answers`, `service`, `rosc_assessments`, `game_progress`.
6. Structurally enforce encrypt-before-write (typed wrapper or custom lint rule).
7. Gate `/debug` behind `isAdmin` or strip from production builds.
8. Patch `react-router-dom`/`react-router`.
9. Add a global `prefers-reduced-motion`/`focus-visible` CSS baseline.
10. Pull and review existing `web-vitals` PostHog data.
11. Stand up real APM/tracing.
12. Add a crash-reporting SDK (Sentry or equivalent).
13. Configure GCP cost/budget alerting.
14. Write and tabletop-test a DR/BC runbook.
15. Commission a third-party penetration test.
16. Audit and, if needed, deepen Jordan (MAT persona)'s discreet-UI feature set.
17. Run a structured, moderated usability-testing pass per persona.
18. Publish a consumer-facing "why zero-knowledge" trust page.
19. Confirm/document a formal sub-processor list (Gemini, PostHog, Stripe, Google Drive) for privacy compliance readiness.
20. Re-tune `generateAIInsights`'s `maxInstances` and other hardcoded concurrency limits against real traffic data.
21. Build an AI golden-answer eval suite for the 9 approved Gemini flows.
22. Decide the fate of the two soft-hidden games (permanent curation choice vs. temporary) and document it.
23. Decide whether to build or remove the "SMART Goal" stub card.

**P2 — opportunistic / lower urgency:**
24. Align devcontainer Node version to 24.
25. Remove `.eslintrc.json` and `vite.config.bak`.
26. Resolve the `pdf-export`/`vendor` circular-chunk build warning.
27. Adopt Prettier alongside the existing ESLint config.
28. Run `knip`/`npm run deadcode` as a periodic CI check, not just an available script.
29. Add a Contributing/PR-process section to the README.
30. Evaluate (don't yet commit to) a Capacitor-based iOS wrapper for push-notification reliability.
31. Consider a dedicated Lighthouse-CI budget gate in the CI pipeline.
32. Consider a preview-channel deploy step ahead of UAT promotion.
33. Refactor the 13 files with raw Firestore calls into the hooks layer over time.
34. Complete the `noUncheckedIndexedAccess` remediation cycle.
35. Add dynamic/latest-model routing with a fallback chain for Gemini model selection.
36. Formalize the prompt-injection delimiting pattern as a reusable, tested utility for any future AI flow.
37. Evaluate multi-region Firestore configuration only if international expansion is planned.
38. Evaluate i18n investment only if a specific non-English market signal appears — not a default priority.
39. Consider a narrower, ZK-compatible "share your streak with an accountability partner" feature as a faster alternative/complement to full Service Module.
40. Lean into Buddhist/Recovery Dharma and MAT-aware positioning explicitly in marketing — an underserved niche with no matched competitor.
41. Market the Recovery Games layer more assertively — a confirmed, hard-to-copy differentiator that appears under-promoted relative to its build investment.
42. Investigate whether a lightweight, opt-in crisis-hotline deep link (matching Loosid's pattern) is worth adding to the SOS Modal.
43. Investigate whether multi-addiction tracking per user (matching I Am Sober Plus) is a worthwhile model change.
44. Reassess Recovery Games' engagement data against build investment once sufficient usage data exists.
45. If pursuing any B2B/treatment-center motion: begin SOC 2 Type I readiness work early, leveraging the already-strong CI/documentation discipline.
46. If pursuing any B2B motion: scope SSO/multi-tenant admin console requirements before committing to a sales timeline.
47. Formalize the internal 4-phase Recursive Build Protocol and Maintenance Protocols (already followed informally) as onboarding material if the team grows beyond its current apparent size.
48. Periodically re-run the full `npm audit` (untruncated) to track the 17 currently-unenumerated moderate findings as dependencies update.
49. Consider surfacing the existing `web-vitals`/PostHog performance data as an internal dashboard, not just raw events, for ongoing visibility.
50. Revisit the `/debug` Time Travel Debugger's role once `/debug` is properly gated — it's a genuinely useful QA tool and shouldn't simply be deleted, just secured.

## Highest ROI Improvements

1. **Service Module Phase 1** — very high leverage (unlocks the product's primary viral growth mechanism) at moderate, well-scoped cost (an existing phased spec already exists).
2. **Pull existing `web-vitals` data** — near-zero cost (instrumentation already paid for), immediate visibility into real user performance.
3. **App Check** — closes a real, scaling cost/abuse exposure at low integration cost given the existing Firebase-native stack.
4. **Devcontainer/stale-file cleanup, `/debug` gate, dependency patch** — trivial cost, meaningful posture improvement, no reason to delay any of these.

## Highest Risk Items

1. **Legacy vault-key derivation gap** — the one finding in this audit that directly threatens the product's core trust promise (zero-knowledge, unbreakable-without-the-PIN) for a real, if shrinking, population of accounts.
2. **No App Check + no cost alerting, compounding together** — the combination (not either alone) is what creates a real runway-threatening cost-abuse scenario at scale.
3. **No APM/crash reporting** — the risk isn't that something breaks; it's that when it does, the team finds out from users instead of monitoring, at exactly the moment (higher user count) when that matters most.
4. **Service Module's continued absence** — a strategic, not technical, risk: every month it stays unbuilt is a month the product's most persona-aligned growth lever goes unused, while competitors' community features continue compounding their own network effects.

## Immediate Actions (this week)

- Ship App Check, patch `react-router-dom`, gate `/debug`, fix devcontainer/stale files — all P0/cheap, no reason to sequence them behind anything else.
- Pull the existing `web-vitals` data and review it.
- Make the explicit go/no-go decision on Service Module Phase 1 scoping and kickoff.

## Strategic Actions (this quarter+)

- Legacy vault-key migration.
- Service Module Phase 1 build and ship.
- APM/crash-reporting/cost-alerting stand-up.
- Android Play Billing integration.
- Third-party pentest scoping.

---

## Readiness Assessments

### Investment Readiness: **Conditional-Yes**
The technical foundation (verified ZK architecture, strong testing/type discipline, sound CI/CD) is genuinely investable-grade and above what most seed/Series-A-stage products present technically. The gap is entirely on the business-data side: this audit had zero access to retention, revenue, CAC, or growth metrics, and those — not the code — are what any real investment decision hinges on. A technical diligence process starting from this report would clear quickly; a full investment decision needs the business-metrics package this audit could not produce.

### Acquisition Readiness: **Conditional-Yes, with a defined integration risk**
An acquirer's engineering diligence would find a clean, well-tested, well-documented codebase with no major "here be dragons" surprises — a genuinely favorable signal. The main integration risk for an acquirer is the apparent team-size concentration (this audit's evidence throughout points to a very small/solo engineering team): acquiring the product means largely acquiring the codebase and IP, with real key-person risk on institutional knowledge, not a large team to retain.

### Enterprise Readiness: **Not Yet**
No SSO, no multi-tenant admin, no formal HIPAA/BAA/SOC 2 posture. This is appropriate for the product's current consumer stage and not a criticism — but any B2B/treatment-center sales motion needs to treat this as a real, multi-month infrastructure investment, not a feature-flag toggle.

### Launch Readiness: **Yes, with the P0 list closed first**
The product is functionally complete, well-tested, and differentiated enough to support a genuine go-to-market push today. The three P0 items (App Check, legacy vault-key migration, Service Module Phase 1) are the specific, named conditions this audit recommends closing before any significant marketing/scale investment — not because the product is unready, but because each becomes measurably more expensive or risky the longer it's deferred once real user growth begins.

---

## Final Conclusion

MRT2 is a genuinely well-engineered, meaningfully differentiated product being held back from its full potential by one specific, well-scoped product gap (the Service Module) and a handful of specific, cheap-to-close operational-maturity gaps (App Check, APM, cost alerting) — not by any fundamental architectural, security, or quality problem. This is an unusually favorable finding for an audit of this scope and rigor: the recommendation is not "fix what's broken," it is "ship what's already designed and close a short, specific list of gaps before scale makes them expensive." The zero-knowledge architecture that is this product's central promise to its users was independently verified, line by line, to be real — which is, in a market full of privacy claims that don't survive scrutiny, the finding worth leading with.
