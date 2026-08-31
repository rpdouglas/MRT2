# MRT2 — Gap Analysis

*Every gap below is anchored to a specific, evidence-backed finding from the earlier reports. Priority: P0 (before wider scale/launch) · P1 (next 1-2 quarters) · P2 (opportunistic). Effort is rough person-time, not a committed estimate. ROI is qualitative (Low/Med/High/Very High), not a computed financial figure — no revenue data was available to this audit.*

---

## A. Technical Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk if unaddressed | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| Encrypt-before-write not structurally enforced | Convention/comment-only in `useFirestoreCrud.ts` | A typed wrapper (e.g. a branded `EncryptedString` type, or a lint rule) that makes writing plaintext to an encrypted field a compile-time error | P1 | 3-5 days | A future feature silently regresses the ZK boundary | High (trust-destroying if it ever happened) | High |
| Firestore shape/size validation covers only 2/6 sensitive collections | `journals`, `game_saves` validated; `workbook_answers`, `service`, `rosc_assessments`, `game_progress` are not | All encrypted/semi-sensitive collections get the same shape+size ceiling | P1 | 2-3 days | Storage-cost abuse, malformed-data crashes in consumers | Medium | Medium-High |
| 13 files bypass the hooks-only Firestore-access convention | Raw `getDocs`/`onSnapshot` calls in `JournalHistory.tsx`, `AchievementsTab.tsx`, admin/, etc. | All Firestore access routed through `src/hooks/` | P2 | 1-2 weeks (refactor, needs care) | Harder to audit the ZK boundary as the codebase grows | Low-Medium | Medium |
| Node version drift (devcontainer=20, CI/prod=24) | `.devcontainer/devcontainer.json` two majors behind | Devcontainer pinned to Node 24 | P2 | <1 day | Contributor builds locally-pass, CI-fail (or vice versa) | Low | High (trivial fix) |
| Stale artifacts (`.eslintrc.json`, `vite.config.bak`) | Dead files still tracked | Removed | P2 | <1 hour | Minor new-contributor confusion | Low | High (trivial fix) |
| `noUncheckedIndexedAccess` deferred | 164 compiler errors found when evaluated, deferred | Dedicated cycle to fix and enable | P2 | 1-2 weeks | Latent array/object-index bugs possible | Low-Medium | Medium |

## B. Product Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| Service Module (sponsor tooling) unbuilt | Zero code; spec paused; dashboard entry point reassigned | At minimum a Phase-1 sponsee list + notes | **P0** | 3-5 weeks (per spec's own phased plan) | Lisa persona ("Primary Viral Driver") has no reason to be a power user or referrer | **Very High** — this is the single highest-leverage gap in the whole audit | **Very High** |
| "SMART Goal" tool is a disabled stub | Greyed "coming soon" card, no component | Either build it or remove the card (a visible permanent stub erodes trust) | P2 | 3-5 days to build; <1 hour to remove | Minor — visible incompleteness | Low | Low-Medium |
| Two games soft-hidden (`active: false`) with no stated reason found in code | Craving Buster, Thought Challenge built but not listed in GamesHub | Product decision on whether this is permanent; if temporary, a re-activation date/owner | P2 | Decision only, ~0 dev effort | None functional; ambiguity is a planning risk, not a user risk | Low | Low |
| Android in-app purchase not implemented | TWA build hides the upgrade CTA entirely rather than redirecting | Google Play Billing integration, or at minimum an explicit "upgrade on web" CTA inside the TWA | P1 | 1-2 weeks (Play Billing) / 1 day (redirect CTA) | Direct, ongoing revenue leak on Android | High | High |
| No multi-addiction tracking per user | Single sobriety-date model (implied; not exhaustively re-verified) | Support multiple concurrent tracks, matching I Am Sober Plus | P2 | 1-2 weeks | Loses users with co-occurring recovery needs to a competitor | Medium | Medium |

## C. UX Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No global reduced-motion/focus-visible CSS baseline | Handled per-component (2 known instances) | A global `@media (prefers-reduced-motion)` rule and `:focus-visible` base style in `index.css` | P1 | 1-2 days | New components silently miss this unless the author remembers | Low-Medium (accessibility/trust) | High (cheap, systemic fix) |
| Jordan (MAT persona) discreet-UI depth unverified | Persona brief mentions custom counter labels, no-drug-names-on-lock-screen; not fully traced in code this pass | Explicit audit + likely feature work to fully match the documented persona need | P1 | 3-5 days audit, TBD build | A stated persona promise may not be fully delivered | Medium | Medium |
| No moderated usability testing evidence | All UX evidence is code-structural, not observed user behavior | A structured usability pass per persona's documented worst-case scenario | P1 | 2-3 weeks (recruiting + sessions + synthesis) | Product decisions currently rest on inferred intent, not observed behavior | Medium-High | High |

## D. Infrastructure Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No Firebase App Check | Confirmed absent, repo-wide | App Check enforced on all Cloud Functions + Firestore | **P0** | 3-5 days | Unattested/scripted clients can hit callables up to per-account rate limits; multi-account abuse not blocked | Medium-High (cost + abuse risk grows with scale) | High |
| No APM / distributed tracing / uptime monitoring | PostHog (product analytics) + Firestore `client_errors` only | A dedicated APM (e.g. Sentry performance, or GCP's own tracing) + synthetic uptime checks | P1 | 1 week initial setup | Blind to production performance regressions and outages until users report them | Medium | Medium-High |
| No crash-reporting SDK | Custom PostHog events + Firestore log, no source-mapped stack traces/alerting | Sentry (or equivalent) with release tagging | P1 | 2-3 days | Slower incident diagnosis, no automatic alerting | Medium | High (cheap, well-trodden fix) |
| No documented DR/BC runbook (RTO/RPO) verified | `docs/RUNBOOK.md` exists but contents not audited in this pass | A verified, tested DR runbook | P1 | 1 week to write + a tabletop exercise | Unknown recovery time in a real incident | Medium (grows with user trust dependency) | Medium |
| No feature-flag system | Hardcoded `active: false` booleans only | A real flagging service for gradual rollout/kill-switch capability | P2 | 1 week integration | Can't gradually roll out risky changes or instantly kill a broken feature | Low-Medium | Medium |

## E. Security Gap Analysis

*(Full detail in `08_SECURITY_ASSESSMENT.md`; summarized here for the gap-matrix format.)*

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No App Check (also listed under Infrastructure) | Absent | Enforced | **P0** | 3-5 days | See Infrastructure row above | Medium-High | High |
| Legacy (pre-PROJ-65) vault-key derivation has no server pepper | PBKDF2(100k)-only for un-rotated accounts | Force a one-time migration/rotation prompt | **P0** | 1-2 weeks (migration UX + backend) | Live offline-brute-force exposure for un-rotated accounts on a Firestore breach | High (direct exposure of the product's core trust promise) | Very High |
| `/debug` route reachable by any authenticated user | UI warning banner only, no role check | Gate behind `isAdmin` or strip from production builds entirely | P1 | <1 day | Self-scoped data corruption risk (low blast radius, but inconsistent posture) | Low | High (trivial fix, real posture improvement) |
| `react-router-dom` HIGH npm-audit finding | RSC-mode CSRF advisory, fix available | Patched | P1 | <1 hour | Low real exploitability (app is SPA-mode) but flagged by every future audit until fixed | Low | High (trivial fix) |
| No formal pentest evidence found | Internal audits exist (`docs/reports/`); no third-party pentest referenced | A third-party penetration test, especially before any enterprise/B2B motion | P1 | External vendor engagement, 2-4 weeks | Unknown unknowns beyond this (source-code-only) audit's reach | Medium-High (esp. for enterprise sales) | High |

## F. Accessibility Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No global reduced-motion/focus baseline (duplicate of UX gap, listed for completeness) | Per-component only | Global CSS rule | P1 | 1-2 days | See UX section | Low-Medium | High |
| No zero-i18n readiness | 100% hardcoded English, including aria-labels | i18n library + string externalization | P2 (unless a specific market requires it sooner) | Very high (full string-externalization pass, weeks) | Excludes non-English-speaking users from an accessibility *and* market-reach perspective | Depends entirely on target-market expansion plans | Low now / High if expanding to non-English markets |
| Accessibility verified via automated tooling only | jsx-a11y + axe-core CI gates | Add periodic manual screen-reader testing (VoiceOver/NVDA) by a person with lived disability experience | P2 | Ongoing, low per-cycle cost | Automated tools miss real assistive-tech usability issues (e.g. reading order, live-region announcement timing) | Low-Medium | Medium |

## G. Performance Gap Analysis

*(Full detail in `09_PERFORMANCE_REVIEW.md`.)*

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No live Core Web Vitals / Lighthouse data captured | `web-vitals` package is integrated and reporting to PostHog, but this audit had no access to view the resulting data | Pull and review real `web_vital` PostHog data | P1 | 1 day (data pull + analysis only — instrumentation already exists) | Currently unmeasured in this audit | Medium | High (cheap — data already being collected) |
| Largest chunk (`pdf-export`) is ~705KB raw / ~209KB gzip | Bundled because jsPDF's dynamic dependencies (html2canvas, canvg, dompurify, pako) are pulled in together | Confirm this chunk is truly lazy-loaded only on export action (likely, given `React.lazy` pattern used elsewhere) and never in the critical path | P2 | 1-2 days to verify + document | If accidentally in the critical path, meaningfully slows first load | Medium | Medium |
| Circular chunk warning at build time (`pdf-export -> vendor -> pdf-export`) | Present in `npm run build` output, not resolved | Adjust manual-chunk logic to eliminate the cycle | P2 | 1-2 days | Currently cosmetic (build still succeeds) but indicates chunk-graph fragility | Low | Low-Medium |

## H. Developer Experience Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No dedicated Prettier/formatter config found | ESLint-only style enforcement | Add Prettier (or confirm one exists and wasn't found) | P2 | <1 day | Minor style-consistency drift over time | Low | Medium |
| Devcontainer Node-version drift (also listed under Technical) | Node 20 vs. 24 | Aligned | P2 | <1 day | New-contributor friction | Low | High |
| Vestigial `.eslintrc.json`/`vite.config.bak` (also listed under Technical) | Present, unused | Removed | P2 | <1 hour | Minor confusion | Low | High |

## I. Business Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| No visible business-metrics evidence to this audit | Could not verify MAU/DAU/retention/revenue from repository alone | N/A — flagging the audit's own limit, not a product defect | — | — | An executive/investor reading only this audit still needs the actual business dashboard | High (context for every other recommendation's prioritization) | — |
| Android monetization gap (duplicate of Product gap) | No in-app purchase path | Play Billing or redirect CTA | P1 | 1-2 weeks / 1 day | Direct revenue leak | High | High |
| No visible formal DPA/sub-processor documentation for Gemini/PostHog/Stripe | Not found in repository (may exist outside it) | A published sub-processor list / privacy policy update if not already covering this | P1 | Legal review, 1-2 weeks | Compliance/trust risk if a user or regulator asks | Medium | Medium |
| No enterprise/B2B sales infrastructure | Consumer-only product today | Decision point, not a gap per se, unless B2B (treatment centers, EAPs) is a target | P2 (strategic decision) | Large, if pursued | N/A unless pursued | Potentially very high (new revenue line) if pursued | Unknown pending strategic decision |

## J. AI Gap Analysis

| Gap | Current State | Desired State | Priority | Effort | Risk | Business Impact | ROI |
|---|---|---|---|---|---|---|---|
| Gemini model selection is static per analysis type | `gemini-2.5-flash`/`gemini-3.5-flash-lite` chosen by analysis type (per `docs/specs/15_AI_INTEGRATION.md`) | Consider dynamic/latest-model routing with a fallback strategy as Gemini models iterate | P2 | 2-3 days | Model deprecation could silently degrade quality if not actively monitored | Low-Medium | Medium |
| No App Check on the AI proxy (duplicate of Security gap) | Confirmed absent | Enforced | **P0** | 3-5 days | Aggregate Gemini cost abuse across many accounts is the specific AI-relevant consequence | Medium (direct COGS exposure) | High |
| Prompt-injection mitigation is honestly self-scoped as "not a hard security boundary" | Delimiting + system-instruction guard exists; team's own comment says worst case is a manipulated response to the same user | Acceptable as-is given the low blast radius (no cross-user leakage possible), but worth re-confirming if the AI output is ever surfaced to anyone other than the authoring user (e.g. a future shared/sponsor-visible AI summary) | P2 (monitor; re-escalate if scope changes) | N/A now | Would rise sharply if AI output ever becomes cross-user-visible | Low today | — |
| No documented AI safety/quality eval suite (golden-answer regression tests for prompt changes) | Not found in this pass | A small eval set per analysis type to catch prompt-change regressions | P2 | 1 week | Prompt tweaks could silently degrade insight quality with no automated signal | Low-Medium | Medium |

---

## Gap Analysis Summary — What Needs Attention First

The three **P0** items, in order of business leverage:

1. **Service Module** (Product) — the highest-ROI item in the entire audit; unlocks the product's most natural viral loop.
2. **Firebase App Check** (Infrastructure/Security/AI) — closes a real, already-internally-acknowledged cost/abuse gap before it becomes expensive at scale.
3. **Legacy vault-key migration** (Security) — closes a live cryptographic weakness for any account that hasn't rotated its PIN since the hardened scheme shipped; directly protects the product's core trust promise.
