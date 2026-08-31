# MRT2 — Scalability & Architecture Review by User-Count Tier

*Projections below are architectural reasoning from Firebase/Firestore/Cloud Functions' documented scaling characteristics applied to MRT2's confirmed design (from the Architecture Review), not load-tested measurements — MRT2 has not been load-tested as part of this audit. Where a claim depends on real traffic data this audit didn't have, it is flagged.*

---

## 1,000 Users

**Verdict: Trivially fine, no changes needed.**

- Firestore, Cloud Functions, and Firebase Hosting all scale far beyond this tier with zero architectural changes. `generateAIInsights`'s `maxInstances: 20` ceiling is not remotely close to being a bottleneck at this volume.
- **Cost:** Firebase's free/Blaze-tier pricing at 1,000 users doing typical recovery-app usage (a few writes/reads per day) would very likely stay in the low tens of dollars/month for Firestore + Functions, plus Gemini API spend (the more variable cost, gated by the per-user cadence limits already in place — free-tier ROSC/pattern-analysis calls capped at monthly/24h cadences).
- **Operational complexity:** minimal; a single engineer can operate this comfortably.

## 10,000 Users

**Verdict: Fine, with the App Check gap becoming worth closing now rather than later.**

- Firestore/Functions still scale without architectural changes.
- At this tier, the **absence of Firebase App Check** starts to matter more concretely: even a small percentage of scripted/abusive accounts calling `generateAIInsights` up to their individual rate limits, multiplied across thousands of self-created free accounts, becomes a real (if still bounded by `maxInstances: 20`) cost exposure. This is the point where the Security Assessment's P0 App Check recommendation should already be shipped, not still pending.
- **Cost:** Gemini spend becomes the dominant variable cost line; the `maxInstances: 20` ceiling starts to function as an actual throughput cap during any usage spike (e.g., a marketing push driving simultaneous AI-analysis requests) rather than a theoretical one — worth monitoring function invocation metrics at this tier.
- **Operational complexity:** still manageable by a small team, but this is the tier where the Infrastructure Gap Analysis's monitoring/APM gaps start to have real consequences (a production incident with no APM and no crash reporter is much harder to diagnose with 10,000 real users depending on the app than with 1,000).

## 100,000 Users

**Verdict: Architecturally sound at the data-layer, but several gaps become load-bearing.**

- **Firestore itself remains a non-issue** — it's designed for this scale and well beyond; the `uid`-scoped query patterns and composite indexes observed in this audit will continue to perform well.
- **`generateAIInsights`'s `maxInstances: 20`** almost certainly needs to be raised (or made dynamic/tiered) at this scale — the code's own comment already flags this cap as "not yet backed by real traffic data," meaning it was a placeholder judgment call from the start, not a value tuned for this tier.
- **App Check becomes non-optional** — without it, the cost-abuse surface area scales linearly with user count.
- **The lack of APM/distributed tracing becomes a genuine operational liability** — diagnosing a performance regression or partial outage across Auth + Firestore + 8 Cloud Functions + Gemini's own latency, with only PostHog custom events and a Firestore error-log collection, is materially harder than with real tracing.
- **The Service Module gap (if still unbuilt) becomes a larger relative opportunity cost** — at 100,000 users, even a modest fraction being active AA/NA sponsors with 3-6 sponsees each represents a substantial unrealized viral-growth surface.
- **Single-region Firebase project** (no multi-region Firestore configuration evidence found) — likely fine for a primarily North American user base (matching the AA/NA/SMART fellowship focus), but worth an explicit decision if international expansion is planned, since Firestore's multi-region configuration is a migration decision made early, not a live toggle later.
- **Cost:** Gemini API spend at this tier, even rate-limited, is a real budget line item that should have active monitoring and alerting (not confirmed to exist) rather than being discovered via a monthly bill.

## 1,000,000 Users

**Verdict: Requires deliberate operational investment, not a rearchitecture.**

The core architectural bet (Firestore + Cloud Functions + a client-heavy PWA) does not need to be abandoned at 1M users — this is a well-trodden scale for Firebase-based products. What changes:

- **App Check, dynamic/tiered Function concurrency limits, and real APM/tracing move from "should have" to "must have."**
- **A CDN/edge strategy for Firebase Hosting** (Firebase Hosting already sits behind a global CDN by default, so this is likely already adequate — but worth explicit confirmation rather than assumption at this scale).
- **Cost governance becomes a first-class engineering concern**: Gemini spend, Firestore read/write costs, and Cloud Functions invocation costs at 1M users are a material line item requiring active budget alerts (the Architecture Review notes a GCP budget alert was flagged in the project's own `ACTIVE_CYCLE.md` as "console-only, outside this environment's reach" — i.e., acknowledged as needed but not confirmed configured).
- **The single-`maxInstances`-style hardcoded ceilings throughout the Cloud Functions layer** would need to become genuinely tiered/dynamic (e.g., per-user-tier concurrency budgets) rather than one global constant.
- **Multi-region / disaster-recovery planning stops being optional** — see the Infrastructure Gap Analysis's DR/BC gap; at 1M users, an unplanned regional outage has real business consequences that a documented, tested runbook meaningfully mitigates.
- **A small, dedicated platform/SRE function likely becomes necessary** — the evidence throughout this audit points to a very small (possibly solo) engineering team; that team structure does not scale to 1M-user on-call/incident-response needs without either growing headcount or investing heavily in automation (much of which — CI gates, telemetry discipline — is already unusually mature for the team's apparent size, which is a genuine asset here).

## Summary Table

| Tier | Data layer | Function layer | Security posture | Ops/observability | Overall readiness |
|---|---|---|---|---|---|
| 1,000 | ✅ No action | ✅ No action | Acceptable as-is | Acceptable as-is | **Ready today** |
| 10,000 | ✅ No action | ⚠️ Monitor `maxInstances` | ⚠️ Ship App Check now | ⚠️ Start APM evaluation | **Ready, close App Check gap** |
| 100,000 | ✅ No action | 🔴 Re-tune concurrency caps | 🔴 App Check required | 🔴 APM/tracing required | **Needs the P0/P1 gap-analysis items shipped first** |
| 1,000,000 | ✅ Architecture holds | 🔴 Dynamic/tiered limits | 🔴 Full hardening required | 🔴 Real SRE investment | **Needs sustained operational investment, not a rewrite** |

**Bottom line:** MRT2's architecture is a sound foundation from 1,000 through 1,000,000 users — the core technology choices (Firestore, Cloud Functions, a client-encrypted PWA) do not need to be replaced at any of these tiers. What's required is that the already-identified gaps (App Check, APM, dynamic concurrency limits, DR planning) get closed *ahead of* the scale that makes them urgent rather than *in response to* an incident caused by them. This is a materially better position to be in than a codebase that would need genuine rearchitecture to reach 1M users.
