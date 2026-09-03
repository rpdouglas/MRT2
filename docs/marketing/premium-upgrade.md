# Premium Upgrade ("Supporter Tier") — Marketing & Persona Brief

**What this document is for:** briefing material for an LLM writing marketing copy about MRT's Premium ("Supporter") tier and its upgrade page. It explains what upgrading actually unlocks, why the specific gates were chosen the way they were, and how to talk about pricing/platform mechanics honestly. Grounded in the real, verified product.

Bonus brief, added after a full-app review of the `docs/marketing/` series (originally 8 planned briefs, then extended with Profile) found this page — the app's only conversion/pricing surface — had no marketing brief despite already having a technical one. Built on `docs/screens/premium-upgrade.md`.

---

## The one-sentence pitch

**Supporter unlocks unlimited AI depth and full-featured exports — everything else in MRT stays free, forever, because crisis and core recovery tools should never have a price tag.**

---

## Why this matters — the free/paid line was drawn deliberately

- **Nothing safety-critical is ever behind Premium.** SOS, Urge Surfer, Craving Buster, sponsor contact, the sobriety counter, and core journaling/task tracking are explicitly, permanently free — a hard product rule, not a launch-promo. Premium only ever gates *depth* and *convenience*, never access to help.
- **What Premium actually removes is a cost-shield, not a feature wall.** Free tier already gets full AI analysis — weekly, monthly, and deep-dive pattern recognition, workbook AI coaching, all of it — just on a cooldown that protects against runaway API costs. Premium's real value is removing the wait, not unlocking something free users can't do at all.
- **$3.99/month is a "Supporter" framing, not a paywall framing.** The name itself signals what it actually is: choosing to support a product that keeps its safety net free for everyone else.

**Marketing framing:** "support the free version for everyone else" is a legitimate, honest angle here — genuinely different from a typical freemium paywall, because the free tier isn't crippled, it's just paced.

---

## What upgrading actually unlocks

- **AI analysis, on demand instead of on a cooldown** — Journal's weekly/monthly/deep-dive pattern analysis, workbook AI coaching, and Recovery Capital's AI-augmented scoring all move from a cost-shielded cadence to immediate, whenever the user is ready for them.
- **A weekly Recovery Capital check-in** instead of monthly, plus the full AI narrative behind each score (see `docs/marketing/insights.md`).
- **PDF export** — a formatted, shareable/printable report, alongside the JSON export that stays free and unrestricted for everyone.
- **Custom journal templates** — building a personal, reusable prompt set instead of only the built-in library (see `docs/marketing/journal.md`).

That's the real, complete list. Don't imply Premium unlocks a whole separate "advanced mode" — it's specifically these depth/convenience upgrades, layered on top of a fully-functional free product.

---

## How each persona relates to Premium

MRT designs around six real recovery personas (full detail in `docs/PERSONAS.md`). Premium isn't targeted at one persona — but some personas are more likely to feel its value than others, based on how they already use the app.

### Walt and Maya — the two most natural upgrade candidates
Both are already the app's heaviest AI-analysis and content-depth users (`docs/marketing/journal.md`, `workbooks.md`, `insights.md`) — Walt for long-horizon reflection and full data export, Maya for frequent, traceable AI pattern analysis. Removing their cooldown wait and adding the weekly Recovery Capital cadence is a natural fit for how they already use MRT, not a feature bolted on to justify a price.

### David
Never a Premium target for anything crisis-adjacent — and shouldn't be. If David is mentioned near upgrade copy at all, it should only be to reinforce that nothing he relies on is ever gated, not as a sales angle.

### Ned, Lisa, Jordan
No dedicated Premium story documented for these three — don't invent one. A general "get deeper insight sooner" framing applies to anyone, but none of them have a persona-specific reason to upgrade the way Walt and Maya do.

---

## How this connects to the rest of MRT

- **Every AI-gated feature mentioned above is fully documented in its own brief** — `journal.md` (Analysis Wizard, templates), `workbooks.md` (AI Compass), `insights.md` (Recovery Capital cadence) — this brief doesn't duplicate their detail, just the upgrade framing.
- **The free tier's cost-shield (not a feature block) is the honest story across all of them** — consistent messaging matters here, since overselling Premium risks making the free tier sound worse than it actually is.

---

## Brand voice & marketing guardrails

Everything from `docs/marketing/journal.md`'s guardrails applies here too. Premium-specific additions:

- **Never imply free tier is crippled or a "trial."** It's a fully-functional product on a pacing cooldown for AI depth — not a limited demo. Copy should never use "unlock the real app" framing.
- **Never suggest any crisis or safety feature could ever require payment.** SOS, Urge Surfer, Craving Buster, sponsor contact, and the sobriety counter are permanently free — this is a hard product rule, not a current promotion, and copy should never hedge it ("currently free," "free for now").
- **Don't cite exact cooldown windows as a selling point ("wait only 7 days!").** Keep it qualitative — "on-demand instead of on a schedule" — since exact cadences are implementation detail that can change.
- **Don't overstate platform availability.** Purchasing works differently depending on platform (web, iOS-PWA via Stripe; Android via Google Play Billing), and the Android path has real, current external constraints outside MRT's control. If platform-specific copy is needed, verify current status first rather than assuming Android purchasing is fully live — don't guess.
- **"$3.99/month" should always be paired with what specifically it unlocks** — never marketed as a vague "premium experience" upsell.

---

## Quick reference: personas at a glance

| Persona | Stage | Path | Premium's relevance to them |
|---|---|---|---|
| David | Day 1–30 | CA | None — never a target; reinforce that nothing he needs is gated |
| Ned | Day 30–90 | NA | No dedicated story |
| Lisa | 7 years | AA | No dedicated story |
| Walt | 35+ years | AA → Recovery Dharma | Natural fit — already the heaviest depth/export user |
| Maya | 6–18 months | SMART/CBT/secular | Natural fit — already the heaviest AI-analysis user |
| Jordan | Day 1–12mo+ | MAT + MARA/SMART | No dedicated story |
