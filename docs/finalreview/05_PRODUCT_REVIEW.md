# MRT2 — Product Review

*Built from code evidence (feature catalogue, monetization implementation, persona documentation in `CLAUDE.md`/`docs/PERSONAS.md`) and the competitive research in `06_COMPETITIVE_ANALYSIS.md`. Business metrics (actual MAU/DAU, retention curves, revenue) were not available to this audit — see the explicit "could not be verified" notes throughout.*

---

## 1. Market Positioning

MRT positions itself at the intersection of three categories that are usually served by separate, weaker products:

1. **Sobriety trackers** (I Am Sober, Nomo, SobrMate) — day-counting, streaks, community.
2. **Encrypted/AI journaling apps** (The Architect, Reflect, DeepJournal) — zero-knowledge AI reflection.
3. **Peer-support/sponsor platforms** (Loosid, WEconnect) — community and sponsor-adjacent tooling.

No competitor found in this audit's research combines all three with a genuine zero-knowledge encryption core **and** an explicit dual 12-Step/Buddhist-recovery framework **and** MAT-specific discreet tooling **and** a real gamified "Recovery Games" layer with dedicated game design (not just streak badges). This is a legitimately differentiated position, not a marketing claim — see the feature-by-feature competitive table in `06_COMPETITIVE_ANALYSIS.md`.

## 2. Target Audience

Six named, deeply-specified personas (`CLAUDE.md`/`docs/PERSONAS.md`) span the addiction-recovery lifecycle from acute Day-1 crisis (David) through 35-year veteran reflection-mode (Walt), plus one sponsor-role persona (Lisa) and one modality-specific persona (Jordan, MAT/Buprenorphine). This is unusually granular persona work for a product at this apparent stage — most early-stage products have 1-2 loosely-sketched personas, not six with explicit anti-personas, journey arcs, and a documented overlap-resolution register.

**Assessment:** the target audience is well-understood on paper and, per the UX review, has demonstrably shaped real product decisions (not just documentation). The risk is the inverse of the usual one: with six distinct personas and only one of them (Lisa) tied to the single largest unbuilt feature (Service Module), there's a real question of whether the product is currently trying to serve too many distinct needs simultaneously for a small team to execute all of them to the same depth — evidenced by Service Module's "paused... to focus on Wave 1 Onboarding" status.

## 3. Unique Value Proposition

**"The only recovery companion that can't read your recovery."** The zero-knowledge architecture (verified as real, not marketing, in the Security Assessment) combined with genuine dual-framework support (12-Step *and* Buddhist/Recovery Dharma, verified via the Fellowship Resources links and Recovery Dharma daily-readings modality) is a defensible, hard-to-copy UVP — copying it requires a competitor to rearchitect their entire backend around client-side encryption, not just add a feature.

## 4. Competitive Advantages (confirmed in code, cross-referenced against competitive research)

1. **Zero-knowledge encryption with a server-rate-limited PIN pepper** — more sophisticated than any competitor's documented approach found in research (most "encrypted journal" competitors either don't combine a short PIN with a server pepper at all, or don't publish enough detail to compare).
2. **A real "Recovery Games" layer** (8 distinct games, not gamified streak badges) — psycho-educational and reflective content delivered as actual games (trivia, economic simulation, breathing-rhythm challenges), explicitly designed around a 2026 industry trend (streak-forgiveness / anti-shame gamification) the competitive research confirmed is now a baseline expectation, not a differentiator — MRT2 meets that bar and exceeds it with genuine game *design*, not just streak mechanics.
3. **Persona-driven UX conflict resolution** (Walt vs. Ned's opposing gamification needs, resolved via information architecture, not a settings toggle nobody finds).
4. **Dual 12-Step + Buddhist framework support**, serving a niche (Recovery Dharma has ~16,000 US members per this audit's research) that mainstream sobriety apps do not specifically design for.
5. **MAT-aware discretion** (Jordan persona) — a population underserved by abstinence-framed competitor apps, though the depth of this support could not be fully verified in this pass (see UX Review §13).

## 5. Product Maturity

Per the Feature Catalogue: ~30 substantive features, high spec-to-code traceability, 2198 passing automated tests, one unbuilt module (Service), one genuine stub (SMART Goal tool). This reads as a **mature MVP-plus product**, well past prototype stage, with real engineering discipline behind it — closer to a Series-A-ready technical foundation than a hackathon project, though (see below) go-to-market/business maturity has not been independently verified to match the technical maturity.

## 6. Business Model

- **Freemium subscription** via Stripe (`ext-firestore-stripe-payments` extension), branded "Supporter Tier" — confirmed implemented (`PremiumUpgrade.tsx`, `PremiumGate.tsx`).
- **Play Store billing compliance** — the premium upgrade flow is explicitly hidden inside the Android TWA build (`isAndroidTWA()` gate) to comply with Google Play's billing policy, meaning premium is currently web-only on Android — **this is a real monetization constraint worth flagging**: Android users installed via Play Store cannot currently subscribe in-app at all (must go to the web version), which is a meaningful conversion-funnel leak if a large fraction of the user base is Android-TWA-sourced. *(In-app purchase / Play Billing integration for Android was not found in the codebase — this is a gap, not an unverified claim, since `PremiumUpgrade.tsx`'s TWA gate was directly confirmed.)*
- **No pricing tiers/amounts were found in the reviewed code** (Stripe price ID is an env var, `VITE_STRIPE_PREMIUM_PRICE_ID`) — actual price point could not be verified from the repository.
- **What premium unlocks:** confirmed at least PDF export (`PremiumGate` wraps `DataExportPanel`'s PDF option) — the full feature-gating boundary was not exhaustively mapped in this pass.

## 7. Retention Strategy & Engagement

- **The Beacon** (daily push cron) is the primary re-engagement mechanism — contextual (milestone/habit-aware), not generic.
- **Streak-forgiveness-aware design**: Goal Ladder has no reset mechanic; Tasks module has explicit "streak breaks must never feel punishing" as a design constraint (`CLAUDE.md`). This directly matches what the competitive research found to be the 2026 industry-standard retention lever (streak freezes/grace days as baseline expectation) — MRT2 is not behind the market here.
- **Changelog Beacon** (in-app "what's new" toast) — a retention/trust signal (users see the product is actively maintained) more commonly found in mature SaaS than early-stage consumer apps.
- **No evidence of a re-engagement email/SMS campaign system, or a churn-prediction/win-back flow** was found — retention currently appears to rely entirely on push notifications plus intrinsic product value, not a multi-channel lifecycle marketing system. **[Could not verify whether this exists outside the codebase, e.g. via a third-party marketing tool not reflected in source.]**

## 8. Monetization Assessment

**Rating: 5/10**, primarily because of the confirmed Android/TWA billing gap and the inability to verify actual conversion mechanics (paywall placement, trial design, pricing psychology) from source code alone. The plumbing (Stripe, tier field, gating component) is solid; the go-to-market execution around it could not be assessed from this codebase-only audit.

## 9. Growth Opportunities

1. **Close the Android in-app-purchase gap** — either via Google Play Billing integration or a clearer redirect-to-web upgrade flow, since the current TWA gate silently removes the upgrade CTA rather than redirecting.
2. **Resume/re-scope the Service Module** — Lisa is documented as the "Primary Viral Driver" persona; a sponsor actively using MRT2 with 3-6 sponsees is a natural word-of-mouth engine that is currently completely unbuilt.
3. **Lean into the Buddhist/Recovery Dharma + MAT niches explicitly in marketing** — these are underserved by the mainstream competitors researched (I Am Sober, Loosid, Reframe are all framed around abstinence-only, secular-generic messaging).
4. **The Recovery Games layer is under-marketed relative to its build investment** (8 distinct games, some with dedicated multi-week save systems) — this is a genuine, hard-to-copy differentiator that the competitive research found no direct competitor matches.

## 10. Onboarding & Activation

`Login.tsx` routes a new user through `/profile` (onboarding) before `/dashboard`, and `Welcome.tsx` uses persona storytelling as the pre-signup pitch. The vault PIN setup is a mandatory gate before any encrypted feature is usable — this is a meaningful activation-funnel step (a 4-digit PIN with no recovery mechanism besides a destructive "wipe and start over" per the Vault Gate feature entry) that could be a real drop-off point. **[Actual activation-funnel conversion rates were not available to this audit.]**

## 11. Enterprise Readiness

**Rating: 3/10.** No SSO/SAML, no org-level admin console (the existing Admin panel is a single global-admin surface, not a multi-tenant org-management system), no BAA/HIPAA-readiness documentation found, no SCIM/user-provisioning integration. This is expected and appropriate for the product's current consumer-facing stage — flagged here only because the audit's own scope (VC technical due diligence framing) requires naming it explicitly rather than assuming it. A B2B2C motion (selling MRT2 to treatment centers/EAPs) would require substantial new infrastructure beyond what exists today.

## 12. Viral / Word-of-Mouth Potential

The **Service Module gap directly suppresses the product's most obvious viral loop** — sponsor-to-sponsee referral is a naturally high-trust, high-conversion channel in recovery communities specifically (people trust their sponsor's tool recommendations far more than an ad), and it is currently the one flagship persona need left unbuilt. This is the single highest-leverage product decision surfaced by this entire audit: shipping even a Phase 1 Service Module could plausibly do more for organic growth than any other roadmap item reviewed. See `12_ROADMAP.md`.
