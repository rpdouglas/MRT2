# MRT Brand & Marketing Guidelines

**What this document is for:** the reusable rulebook behind every public-facing MRT asset — compliance constraints, visual system, caption/hashtag conventions, and distribution rules. Anyone (an LLM, a copywriter, a future contributor) producing a social post, ad, store listing line, or pitch-deck slide about MRT should check it against this document before it ships.

This is the file that didn't exist. `MRT_Marketing_Strategy_v1.docx` (the original marketing strategy draft, May 2026) repeatedly cited an "MRT Brand Guidelines v3.0" as an existing authority — no such file was ever in this repository. This document is that gap closed: the compliance/visual/voice rules extracted out of the strategy draft, fact-checked against the current app and `docs/`, and separated from the phased execution plan (personas, content calendar, asset counts) that should keep changing independently of these rules. Sources: `docs/PERSONAS.md`, `docs/marketing/OVERVIEW.md`, `docs/design/vibrant_momentum.md`, `docs/ROADMAP.md`, `src/lib/theme.ts`.

---

## Strategic Principles

- **Narrative before feature.** Open with a person, not a dashboard screenshot. Meet David — he relapsed after two years, here's how MRT helps him get through tonight — *then* show the SOS screen, Voice-to-Vault, or Urge Surfer. `docs/PERSONAS.md` is the narrative infrastructure; use it.
- **Marketing as a product feature, not a separate phase.** Every meaningful ship gets a screenshot wrapped in the branded template and posted. The content library should grow as a side effect of shipping, not require a dedicated content calendar.
- **Depth over breadth in distribution.** Don't spread across every platform — pick channels where the exact user already discusses the exact problem (recovery subreddits, #SoberTok) and be genuinely present, not just posting.
- **A small library of exceptional assets beats a large library of mediocre ones.** Persona introductions, philosophy posts, screenshot spotlights, and quote graphics are built to be remixed and reposted across months, not produced on a volume quota.
- **Compliance is not optional.** MRT operates in a regulated space (addiction/recovery + AI + health claims). Every public-facing asset is a regulatory document in miniature — the rules below apply without exception, to every asset, every time.

---

## Non-Negotiable Compliance Constraints

These are hard constraints, not style preferences.

### Regulatory language

| | |
|---|---|
| ✅ **Approved** | "AI-powered recovery companion" · "intelligent recovery support tool" · "recovery support" · "wellness app" |
| ❌ **Prohibited** | "AI therapist" · "private AI therapist" · "treats addiction" · "cures" · "diagnoses" · "prescription" · "patient" (in consumer context) |

**Reason:** "AI therapist" language triggers FDA SaMD (Software as a Medical Device) classification in the US and Health Canada review in Canada — regulatory exposure regardless of how qualified the claim is.

### 12-Step Tradition compliance

MRT serves users across AA, NA, and CA fellowships. Traditions 6 (no endorsement), 11 (public anonymity), and 12 (no personalities) constrain how the app can relate to those fellowships in any public communication.

| ✅ Approved | ❌ Prohibited |
|---|---|
| "Supports 12-Step recovery journeys" | "Endorsed by AA" or "Official AA app" |
| "Compatible with 12-Step programmes" | AA/NA/CA logos or the trademarked triangle-in-circle symbol |
| "12-Step-inspired tools" | "For AA members" in ad targeting or creative |
| Testimonials with first name only ("Sarah, 2 years sober") | Full name + fellowship identification in any public material |

### Safe messaging

Follow SAMHSA's "Talk. They Matter." guidelines and AFSP safe-messaging standards:

- No graphic descriptions of drug use, or detailed relapse narratives that glorify the event
- No specific numbers tied to weight, calories, or quantities (eating-disorder intersection risk)
- No before/after transformation framing that implies a clinical outcome
- Crisis disclosures in comments or DMs get a 988 / local crisis line, never counselling from the account

### Paid advertising gate

**LegitScript certification is required before any paid advertising on Meta or Google that uses addiction/recovery language targeting US users.** Apply at legitscript.com — the process takes several weeks, so start it well before a paid campaign is actually needed. Until certified: organic only.

---

## Visual System

### Colour palette — corrected against `src/lib/theme.ts`

The module gradients below are 3-stop (a middle "via" colour sits between the two shown) and are the actual literal source of truth the app renders — not an aspirational brand palette.

| Module | Gradient | Persona / Vibe |
|---|---|---|
| Dashboard | *No fixed gradient* — follows whichever of the 5 Sobriety Hero colours the user picked (Amber default, Sky, Emerald, Violet, Rose) | All — reflects the identity the user chose for themselves, not a module category |
| Journal | Indigo → Purple → Violet | Walt & Maya · reflective, safe disclosure |
| Tasks | Cyan-600 (`#0891B2`) → Teal-600 → Emerald-600 (`#059669`) | Ned · energy & action |
| Workbooks | Emerald-600 (`#059669`) → Green-600 → Lime-600 (`#65A30D`) | Maya · structured growth |
| Insights (Recovery Capital) | Fuchsia-600 (`#C026D3`) → Pink-600 → Rose-500 (`#F43F5E`) | Walt · pattern-finding, AI |
| Vitality | Rose-500 (`#F43F5E`) → Orange-500 (`#F97316`) → Amber-500 | Lisa · somatic self-care, calm |
| Games | Indigo-500 → Violet-500 → Purple-600 | Ned · playful mastery, zero shame |
| Profile | Slate-700 → Gray-800 → Zinc-900 | Grounded, trustworthy, in control |
| Tools | Blue-600 → Blue-500 → Sky-500 | Quick utility, sharp focus |
| Service | Rose → Amber | **Reserved but unbuilt — `PROJ-05` is paused, no live UI.** There is no screen to screenshot; don't use this gradient in an asset that implies the Service Module (sponsee management) exists today. Use Vitality for Lisa's self-care angle instead. |

Jordan has no dedicated module gradient — his feature (dose log, custom counter) lives on the Dashboard widget, so his assets use the same personalised Dashboard treatment as everyone else's.

### Materiality

- **Glassmorphism** — translucent cards with `backdrop-blur`, layered depth. This is the app's actual default card treatment (38+ live components use it), not a special effect reserved for marketing.
- **Signature data-visualisation elements:** the Rhythm Score **ring** (a circular progress ring — not a segmented pill bar) and Recovery Capital's **area/line trend chart** (not a radar chart). Match these shapes if a mockup needs to evoke either screen.

### Typography

- **Display:** Arial Black or equivalent system sans-serif, 64–72pt, white or gradient text
- **Headings:** Arial Bold, 28–36pt
- **Body:** Arial Regular, 14–16pt, high-contrast on dark backgrounds
- **Labels:** Arial Bold, 10–11pt, uppercase, 0.12em letter-spacing
- No decorative fonts — the gradient system and glassmorphism already provide visual distinction. (Quote graphics are the one deliberate exception — see below.)

### Icon & imagery style

- Emoji icons for personas and module identifiers: 🌊 David · ⚡ Ned · 🌿 Lisa · 🌙 Walt · 🧠 Maya · ⚓ Jordan
- App screenshots: always wrapped in a device frame or glassmorphism card — never a raw screenshot floating on white
- No stock photography of people. No before/after imagery. No pill bottles, dark alleys, or clinical settings.
- Lifestyle imagery (optional): forward motion, energy, or calm — never distress or despair

### CTA style

- **Primary:** gradient pill button matching the module palette ("Start your journey" · "Try MRT free" · "Download on iOS")
- **Secondary:** ghost pill button, white border
- **No urgency language** ("Limited time", "Don't miss out") — inconsistent with the No-Guilt Engine
- **No clinical outcome promises** ("Get sober", "Stop drinking") — regulatory violation, see Compliance above

### Master AI image prompt template

For generating on-brand background imagery only — not for depicting people in recovery:

> "Abstract digital art. Deep [MODULE COLOUR] gradient background. Glassmorphism card with frosted translucent surface, soft inner glow in [MODULE ACCENT COLOUR]. Subtle geometric light refraction. No text. No people. No medical imagery. High saturation. Vibrant Momentum aesthetic. Square format 1:1."

---

## Voice & Copy

### Caption framework

Every social caption follows a three-part structure:

1. **Hook** — a single sentence that names a feeling, not a feature. *"2 AM and the urge hits."* Not *"MRT has an SOS button."*
2. **Bridge** — one or two sentences connecting the feeling to a person or moment. *"David knows this moment. He's been here before."*
3. **Resolution** — how MRT helps, in one sentence maximum, then the CTA. *"One tap. The noise stops."*

**Length targets:** 50–150 words (Instagram/LinkedIn) · under 280 characters (X) · under 150 words (Reddit — community participation context does the rest of the work there).

### Hashtag strategy

| Channel | Tier | Tags |
|---|---|---|
| Instagram / TikTok | Community (always) | #SoberTok #RecoveryTok #SoberLife #SoberCommunity |
| Instagram / TikTok | Persona-specific (per post) | #SoberMilestone (Ned) · #ServiceWork (Lisa) · #RecoveryDharma (Walt) · #SMARTRecovery (Maya) · #MATRecovery (Jordan) |
| Instagram / TikTok | Brand (always) | #MyRecoveryToolkit #MRT #RecoveryApp |
| X / Twitter | Build in public | #BuildInPublic #IndieHacker #PWA #ZeroKnowledge |
| Reddit | — | Reddit communities penalise hashtag use — do not use |

### Quote graphic rules (the one typography exception)

- Full-bleed gradient background using the module palette closest to the theme
- Quote in large serif or display type — the only exception to the Arial-only rule
- MRT wordmark in small type, bottom right, with the tagline "Built for recovery. Yours."
- No persona icons — quote graphics are universal, not persona-targeted
- Format: square (1:1) for Instagram, tall (9:16) crop for Stories/Reels
- No attribution to a specific fellowship's copyrighted text unless it's explicitly public domain (use the principle, not verbatim Big Book/NA Basic Text passages)

---

## Distribution Rules

### Reddit — community participation first

**Do not post promotional content to recovery subreddits.** Participate genuinely for two to four weeks before ever mentioning MRT.

- **Approved:** answer questions, share CBT frameworks, explain urge surfing, help with Recovery Dharma/SMART questions — build trust, then mention the tool only when directly relevant.
- **Never:** "check out my app" threads, links without context, or responding to a crisis thread with an app mention. These get an account banned and damage the brand in its most important community.
- Once trust is established, a founder AMA in r/stopdrinking or r/redditorsinrecovery is one of the highest-legitimate-reach formats available — aligned with the 12-Step "attraction not promotion" principle.

### TikTok / Instagram — organic only until LegitScript

- Persona and philosophy content in short-form video: persona card as first frame, spoken caption over it, screenshot at the end
- No paid ads or boosted posts on recovery-related content until LegitScript is confirmed (see Paid Advertising Gate above)
- Respond to every comment — these communities reward engagement with more reach

### X / Twitter — build in public

- Share the development journey: specs, features being planned, architecture decisions
- The ZK-encryption story ("we built an app where even we can't read your data") resonates specifically with this audience
- Additive channel — reaches future contributors, press contacts, and B2B leads, not just recovery-community members directly

### Posting frequency guidance

| Channel | Target frequency | Notes |
|---|---|---|
| Reddit | Participation daily · promotional mention max once/month | Quality of participation matters more than frequency |
| Instagram / TikTok | 3 posts/week during persona series · 1–2 after | Consistency over volume |
| X / Twitter | 3–5 posts/week | Shorter format, lower production cost per post |
| LinkedIn (if B2B is a priority) | 1–2 posts/week | Investor/clinical-partner tone and vocabulary — different register from the consumer channels above |

---

## Guardrails & Deliberate Non-Goals

Removing these from scope was a deliberate decision, not an oversight — don't reintroduce them without revisiting why they were cut:

- **No daily content calendar.** A calendar implies obligation; obligation on top of solo development leads to burnout. Post when there's something worth posting.
- **No 90-day campaigns.** Campaign thinking needs campaign infrastructure (briefs, reviews, approvals, reporting) that doesn't fit a solo-developer operation.
- **No paid advertising before LegitScript.** See the gate above — this is a compliance risk, not a preference.
- **No complex funnels or email drip sequences** below ~5,000 MAU. CASL requires express opt-in for Canadian marketing emails; the compliant-funnel infrastructure isn't justified at pre-5,000-MAU scale.
- **No influencer campaigns** until persona content (see the marketing strategy plan) has proven the narrative framework — and even then, only with careful 12-Step Traditions compliance briefing and contract language.
- **No platform-specific creative optimisation** (A/B testing ad creative, algorithm optimisation, CRO) — these are paid-advertising activities and belong after LegitScript, not before.

---

*MRT · Brand & Marketing Guidelines · extracted and fact-checked from `MRT_Marketing_Strategy_v1.docx`, September 2026*
