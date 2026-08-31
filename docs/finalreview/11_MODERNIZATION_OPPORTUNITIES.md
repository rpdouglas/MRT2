# MRT2 — Modernization Opportunities

*Forward-looking opportunities, distinct from the Gap Analysis (which addresses deficiencies against a current-state bar). These are upside moves — things MRT2 doesn't need to do, but plausibly should consider, given the evidence gathered in this audit.*

---

## AI & Automation

1. **Dynamic/latest-model routing for Gemini calls.** Model selection is currently static per analysis type (`docs/specs/15_AI_INTEGRATION.md`). As Gemini's model lineup iterates, a lightweight routing layer (with a documented fallback chain) would reduce the risk of silent quality degradation when a pinned model is deprecated.
2. **A golden-answer eval suite for the 9 approved AI flows.** No automated quality-regression testing for prompt changes was found. Even 5-10 fixed test cases per flow with a rubric-based (or LLM-judge) quality score would catch prompt-engineering regressions before they reach users — this is standard practice for AI-feature teams and is currently absent.
3. **Extend the AI-governance model (delimiting + injection guard) as a documented pattern for any future flow**, not just the current 9 — the pattern is good; formalizing it as a reusable, testable utility (rather than re-implemented per `analysisType` branch) would reduce the chance of a future flow shipping without it.

## Workflow / Developer Tooling

4. **Adopt Prettier alongside ESLint** (not confirmed to exist) for zero-debate formatting consistency as the team/contributor base grows.
5. **Align the devcontainer's Node version with CI/production (24, not 20)** — a same-day fix that removes a class of "works on my machine" bug.
6. **Resolve the `pdf-export`/`vendor` circular-chunk warning** and remove the two vestigial files (`vite.config.bak`, `.eslintrc.json`) — trivial, but each one removed is one less thing a new contributor has to figure out is safe to ignore.
7. **Run `npm run deadcode` (knip) as a periodic CI check**, not just an available script — the config already exists; wiring it into the existing Debt Ledger maintenance protocol would close the loop.

## Infrastructure / Cloud Optimization

8. **Firebase App Check** — covered extensively elsewhere as a security gap; it is equally a cost-optimization move (bounding abuse-driven Gemini/Functions spend).
9. **A real APM/tracing tool** (see Infrastructure Gap Analysis) — beyond incident response, this would let the team make *data-driven* decisions about the `maxInstances`/concurrency tuning called out in the Scalability Review, instead of judgment calls.
10. **Cost-alerting on GCP** — `docs/ACTIVE_CYCLE.md` already flags an unconfigured budget alert as a known, deferred item; closing this is cheap and directly protects against a runaway-cost incident (e.g., an App-Check-less abuse scenario compounding with no alert to catch it).

## Testing & Analytics

11. **Pull and act on existing `web-vitals` telemetry** — the single highest-leverage, lowest-effort item in this entire report; the instrumentation cost has already been paid.
12. **Add a Contributing/PR-process section to the README** — the process exists (documented in `CLAUDE.md`/`docs/governance/DEVELOPER_GUIDE.md`) but isn't surfaced in the first place a new contributor looks.

## Offline-First / PWA Enhancements

13. **Confirm (or build) a true background-sync queue for offline mutations** beyond what Firestore's SDK provides implicitly — for a product whose crisis-tool value proposition depends on working with no connectivity, an explicit, testable offline-mutation queue (rather than relying entirely on the Firestore SDK's built-in behavior) is worth a dedicated audit even if the current behavior already works correctly.
14. **Android in-app purchase (Play Billing)** — covered in the Gap Analysis as a monetization gap; it's equally a "meet users where the modern platform expects" modernization move, since Play Store users increasingly expect in-app upgrade flows.

## Platform Expansion

15. **A native-wrapper evaluation for iOS**, distinct from the existing Android TWA — iOS's PWA support (particularly around push notifications, already flagged in the codebase as an "iOS standalone-only" constraint) is historically the weaker of the two mobile platforms for a pure-PWA strategy; a lightweight native wrapper (e.g., Capacitor) purely to unlock more reliable iOS push and a proper App Store listing may be worth scoping, without abandoning the PWA-first codebase.
16. **A public, documented API/SDK is not currently a priority** given MRT2's zero-knowledge, single-user-owned-data model (a public API for third-party integrations would need careful ZK-boundary design) — flagged here only to explicitly note it was considered and is *not* recommended near-term, rather than silently omitted.

## Ranked by Effort-to-Impact

| Opportunity | Effort | Impact | Recommended timing |
|---|---|---|---|
| Pull existing web-vitals data | Very Low | Medium-High | Immediately |
| App Check | Low-Medium | High | Immediately (P0, also in Gap Analysis) |
| Devcontainer Node alignment, stale-file cleanup | Very Low | Low-Medium | Immediately |
| GCP cost alerting | Low | Medium | Next sprint |
| AI eval suite | Medium | Medium | Next 1-2 sprints |
| APM/tracing | Medium | High (at scale) | Before the 10k-100k user tier |
| Android Play Billing | Medium | High (revenue) | Next 1-2 sprints |
| Prettier adoption | Low | Low | Opportunistic |
| iOS native-wrapper evaluation | Medium (evaluation only) | Medium | Next 1-2 quarters |
