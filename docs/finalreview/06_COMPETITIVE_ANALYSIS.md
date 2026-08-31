# MRT2 — Competitive Analysis

*Based on live web research conducted during this audit (2026-08-29) into the sobriety/recovery app market. Competitor feature/pricing claims are sourced from third-party review sites and the apps' own marketing as surfaced by search — not independently verified by installing and testing each competitor. Sources are listed at the end of each section.*

---

## 1. Market Map

| Category | Representative apps | MRT2's position |
|---|---|---|
| Sobriety day-counters / habit trackers | I Am Sober, Nomo, SobrMate, HabitBox | MRT2 has day-counting as a baseline feature, not its core differentiator |
| Peer-support / community platforms | Loosid, WEconnect, Sober Grid | MRT2 has no community/social feature at all (by design — see ZK/privacy stance) |
| Coaching / behavior-change subscriptions | Reframe, Tempest | MRT2's AI coaching is more clinically-framed (CBT/REBT tools) and privacy-first vs. these apps' coach-marketplace models |
| Encrypted/AI journaling (adjacent, not recovery-specific) | The Architect, Reflect, DeepJournal, Day One | MRT2 matches or exceeds the encryption sophistication of this category, while also being recovery-domain-specific |
| Gamified habit/recovery apps | SuperBetter | MRT2's Recovery Games layer is more clinically-grounded (CBT/psycho-ed content) than SuperBetter's general "epic win" framing |

## 2. Direct Feature Comparison

| Feature | MRT2 | I Am Sober | Loosid | Reframe | Nomo | The Architect (journaling) |
|---|---|---|---|---|---|---|
| Sobriety day tracking | ✅ | ✅ | ✅ | ✅ | ✅ (unlimited clocks) | ❌ |
| Zero-knowledge encryption | ✅ (verified, code-level) | ❌ (not documented as ZK) | ❌ | ❌ | ❌ | ✅ (documented AES-256 ZK) |
| AI-powered journaling/insights | ✅ (9 approved, ZK-preserving flows) | ❌ | ❌ | Partial (coaching, not ZK) | ❌ | ✅ (weekly AI reflection) |
| CBT/REBT structured tools | ✅ (10 guided tools) | Partial (workbook activities, premium) | ❌ | Partial (coaching-led) | ❌ | ❌ |
| Gamified games layer (not just streaks) | ✅ (8 distinct games) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Peer community / social | ❌ (by design) | ✅ | ✅ (300k+ member network, dating) | ❌ | ✅ (share clocks) | ❌ |
| Sponsor/sponsee tooling | 🔴 Unbuilt (spec exists) | ❌ | Partial (community, not 1:1 sponsor tools) | ❌ | ✅ (share clocks with sponsor) | ❌ |
| Buddhist/Recovery Dharma framework support | ✅ (explicit fellowship links + readings) | ❌ | ❌ | ❌ | ❌ | ❌ |
| MAT-specific discreet tooling | Partial (persona-designed, depth unverified) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Offline-first PWA | ✅ (Firestore persistence + Workbox) | Native app | Native app | Native app | Native app | Unknown |
| Crisis/SOS quick-access | ✅ (SOS Modal, 3-tap floor) | Partial | ✅ (24/7 crisis hotline links) | ❌ | ❌ | ❌ |
| Free tier | ✅ | ✅ | ✅ | 7-day trial only | ✅ | ✅ (first 11 reflections) |
| Premium price point | Unknown (not in repo) | $9.99/mo or $39.99/yr | ~$19.99/mo | $99.99/yr + $249.99/mo coaching | Free | Free forever + paid tier |

**Sources:** [Best Addiction Recovery Apps of 2026 — ChoosingTherapy](https://www.choosingtherapy.com/addiction-recovery-apps/) · [I Am Sober App Review 2026](https://www.choosingtherapy.com/i-am-sober-app-review/) · [Loosid vs I Am Sober vs Reframe](https://loosidapp.com/loosid-vs-i-am-sober-vs-reframe-which-sober-app-fits-your-journey/) · [Reframe App Review 2026](https://www.choosingtherapy.com/reframe-app-review/) · [Zero-Knowledge AI Journal Comparison (2026)](https://cortexos.app/library/zero-knowledge-ai-journal-comparison-2026/) · [Best Journaling Apps for 2026 — Architect](https://architectapp.ai/blog/best-journaling-apps-2026)

## 3. Architecture & Technology Comparison

MRT2's technical architecture (verified in this audit, not sourced from competitor marketing) compares favorably on:
- **Encryption sophistication**: the PBKDF2 + server-pepper HMAC combination (PROJ-65) is more advanced than what "zero-knowledge" journaling competitors typically document publicly — most describe "AES-256, keys never leave your device" without detailing PIN-brute-force mitigation, which MRT2 solves via a genuinely rate-limited server-side pepper exchange.
- **Offline-first PWA vs. native**: nearly every direct competitor found in research (I Am Sober, Loosid, Reframe, Nomo) is a native iOS/Android app, not a PWA. MRT2's PWA-first approach trades some native-platform polish for zero app-store gatekeeping on updates, a single codebase, and (per the competitive research on gamification trends) is well-positioned for a market where "streak forgiveness" and lightweight, always-current experiences are increasingly expected.
- **AI governance**: MRT2's documented, enumerated 9-flow allowlist with a Cloud-Functions proxy (never direct client-to-Gemini) is a materially more disciplined AI-privacy architecture than what's typically found in "AI coaching" competitor apps, which often route content through more general third-party chat/coaching infrastructure.

## 4. UX & Business Model Comparison

- **Pricing:** MRT2's actual price point could not be determined from the repository. For context, the market ranges from Nomo (free) through I Am Sober ($9.99/mo) to Reframe ($99.99/yr base + expensive optional coaching). MRT2's freemium model (free core + Stripe "Supporter Tier") sits structurally closest to I Am Sober's model.
- **Community:** MRT2 has deliberately **no** social/community feature — this is a genuine strategic bet (consistent with the zero-knowledge privacy thesis — a community feature is inherently harder to reconcile with "we can't read your data") that trades away Loosid's/WEconnect's core growth lever (peer network effects) for a stronger privacy story. This is defensible but means MRT2 cannot currently compete on "community" as an acquisition channel the way Loosid's 300,000+ member network does.
- **AI capabilities:** MRT2's AI is the most clinically-structured of any competitor found (CBT/REBT-framework-driven prompts, not generic chat) — closer in spirit to a digital-therapeutics product than a "chat with an AI coach" app, while still being priced/positioned as a consumer app.

## 5. Features Competitors Have That MRT2 Lacks

1. **Peer community / social discovery** (Loosid's 300k+ network, WEconnect's peer support model, Sober Grid's map-based sober-friend-finding) — a deliberate MRT2 omission, but a real competitive gap for users whose primary need is *connection*, not tooling.
2. **Human coaching marketplace** (Reframe's paid 1:1 video coaching) — MRT2's AI coaching is a lower-cost, lower-touch substitute, not a replacement for users who want a human.
3. **Native mobile app polish/platform integrations** (widgets, native share sheets, Apple Health/Google Fit integration) — not confirmed present in MRT2's codebase; PWA-first architecture makes some of these harder or impossible (e.g. true home-screen widgets).
4. **In-app crisis hotline integration** (Loosid's 24/7 crisis hotline links) — MRT2's SOS Modal routes to internal tools + sponsor contact + meeting finder; a direct crisis-hotline deep-link was not confirmed present.
5. **Multi-addiction tracking in one app** (I Am Sober Plus tracks up to 10 addictions simultaneously) — MRT2's data model is not confirmed to support multiple concurrent addiction/sobriety-date tracks per user.

## 6. Features MRT2 Has That Competitors Do Not (confirmed differentiators)

1. **Verified zero-knowledge architecture with server-rate-limited PIN pepper** — more technically rigorous than any competitor's public documentation found in research.
2. **A real games layer** (8 distinct, clinically-grounded games) vs. competitors' streak/badge gamification only.
3. **Dual 12-Step + Buddhist/Recovery Dharma framework support** in one product.
4. **MAT-aware persona design** (Jordan) — addressing a population most abstinence-framed competitors do not explicitly design for.
5. **10 structured CBT/REBT tools with in-context AI coaching** — deeper clinical-technique coverage than any competitor found.
6. **A sponsor-facing module in the roadmap** (even unbuilt, it's *designed* around a specific persona's real workflow — Nomo's "share a clock" is a much shallower version of sponsor-facing functionality).

## 7. Competitive Opportunities

1. **"Zero-knowledge" as an explicit marketing wedge.** None of the mainstream sobriety-tracking competitors researched make encryption/privacy a headline feature the way MRT2 legitimately can — this audit's security review found the ZK claim to be real, verified, code-level fact, which is a rare, defensible, hard-to-fake claim in a crowded market.
2. **Recovery Dharma / Buddhist-recovery is a real, underserved niche** (~16,000 US members per this audit's research, growing peer-support movement) with no dedicated well-funded app competitor identified.
3. **MAT-specific tooling** is a genuine white space — most competitor apps are abstinence-framed by default, which can alienate or fail to serve MAT patients; leaning further into Jordan's persona needs (verified: not yet fully confirmed depth) is a differentiation opportunity, not just a completeness one.
4. **Ship the Service Module to unlock sponsor-driven viral growth** — see Product Review §12; this is the highest-leverage strategic move identified across the whole audit.

## 8. Strategic Differentiation Recommendations

| Recommendation | Rationale | Effort |
|---|---|---|
| Make "zero-knowledge, verified" a headline claim in marketing/App Store copy | It's true, verified by this audit, and no competitor credibly claims it in the recovery-app category specifically | Low (marketing only) |
| Ship Service Module Phase 1 (even a minimal sponsee list + notes) | Unlocks Lisa's persona-native viral loop; currently 100% unbuilt | Medium-High (see Roadmap) |
| Publish a "why zero-knowledge" trust page/whitepaper | Converts a technical differentiator into a consumer-legible trust signal, similar to how Signal/ProtonMail market encryption to non-technical users | Low-Medium |
| Consider a lightweight opt-in, still-ZK-compatible sponsor/accountability-partner sharing feature (a narrower, faster version of full Service Module) | Captures some of Nomo's "share your clock" viral mechanic without abandoning the ZK thesis | Medium |
| Close the Android in-app purchase gap | Direct monetization leak on what may be a large share of the user base | Medium |
