# My Recovery Toolkit — Whole-App Marketing Guide

**What this document is for:** the single entry point for anyone — an LLM, a copywriter, a stakeholder — writing marketing material about MRT as a whole: the landing page, app store listing, a pitch deck, an investor one-pager, a press description. It ties together every per-feature brief, every persona, the design system, and the current roadmap into one cohesive picture of what MRT is, who it's for, and why it's different — so top-level copy doesn't contradict or flatten what the feature-level briefs already establish.

This is not a replacement for the per-feature briefs in this folder (`journal.md`, `dashboard.md`, `tasks.md`, `vitality.md`, `tools.md`, `workbooks.md`, `games.md`, `insights.md`, `profile.md`, `sos-crisis-support.md`, `premium-upgrade.md`) — those remain the source of detail for anything feature-specific. This document is the synthesis layer above them, plus the whole-app framing none of them individually owns. Sources: `docs/PERSONAS.md`, `docs/design/vibrant_momentum.md`, `docs/screens/`, `docs/ROADMAP.md`, and every brief in this folder.

---

## The one-sentence pitch

**My Recovery Toolkit is a zero-knowledge, offline-first companion app for substance-use recovery — real 12-Step, CBT, SMART Recovery, Recovery Dharma, and MAT-informed tools, built so that not even MRT itself can read what you write.**

---

## The elevator pitch (three sentences)

MRT is a single app that holds the daily practices recovery already runs on — journaling, step work, habit tracking, body-based self-care, crisis grounding — and makes them easier to actually sustain, without inventing a new methodology or picking one recovery path over another. Every sensitive thing a person writes is encrypted on their own device before it ever reaches a server, so the privacy promise that makes honest recovery writing possible is backed by math, not a policy page. And the free tier isn't a trial — crisis tools, core journaling, and habit tracking are permanently free for everyone; the $3.99/mo Supporter tier only ever removes a pacing cooldown on AI depth, never gates access to help.

---

## Core philosophy — three pillars, and why they're not generic

- **Zero-Knowledge, for real.** "We cannot leak what we cannot read." Journal entries, workbook answers, and sponsor notes are encrypted client-side with a key derived from the user's own PIN — MRT itself cannot decrypt them, even under a server breach. This isn't a privacy *policy* claim; it's the actual cryptographic architecture (`CLAUDE.md`'s Zero-Knowledge Encryption Boundary, `docs/SECURITY_ZERO_KNOWLEDGE.md`). See "The privacy promise" in `journal.md` for the plain-language version copy should use.
- **Recovery as a return to life, not a punishment.** MRT actively rejects the gloomy, clinical aesthetic and the shame-coded mechanics (red "overdue" states, streaks that reset to zero and imply failure) that dominate habit and health apps. This is enforced app-wide as the **No-Guilt Engine** — verified, working code (`reconcileOverdueTask()`), not just a design intention. See the design system section below.
- **Offline-first, because crises don't wait for signal.** The app functions fully offline and syncs safely when connectivity returns — a real requirement, not a nice-to-have, given how many of MRT's crisis-relevant moments happen with unreliable connectivity (2 AM, a bad location, a bad day).

---

## Who it's for — six real personas, not demographic segments

MRT is built around six recovery personas (full detail: `docs/PERSONAS.md`), each representing a *state* a person moves through, not a fixed customer type — the same person may be David at Day 3 and Ned at Day 60. Every design and copy decision should be traceable to one of these:

| Persona | Stage & Path | Core need | Their MRT story |
|---|---|---|---|
| **David** — "The Survivor" | Day 1–30, Cocaine Anonymous | De-escalate right now | *"I just need the noise to stop right now."* Zero-friction crisis access — SOS, Urge Surfer, Craving Buster, voice-to-text journaling — nothing gated, nothing that asks more of him than he has. |
| **Ned** — "The Pink Cloud" | Day 30–90, Narcotics Anonymous | Momentum, without a trapdoor at Day 90 | *"I'm going to crush it today!"* Streaks, milestones, XP — but built with forgiving math (Rhythm Score, Smart Reset) specifically because a punishing tracker at his Day 90 crash would do real harm. |
| **Lisa** — "The Service Superstar" | 7+ years, Alcoholics Anonymous, sponsors 3–6 women | Stay organized without burning out | *"I have five sponsees and a full-time job."* Fast, uncluttered screens; Vitality and Journal as her own self-care counterbalance to a life spent managing others' recovery. |
| **Walt** — "The Zen Master" | 35+ years, AA-origin, now Recovery Dharma | Depth, and total data ownership | *"Recovery is a lifelong practice of mindfulness and reflection."* Long-form journaling, zero gamification in his flow, traceable AI, full unrestricted export — decades of his own writing, still entirely his. |
| **Maya** — "The Systematiser" | 6–18 months, SMART Recovery / secular / CBT | A traceable curriculum, not vibes | *"I want to understand the mechanics of my brain so I can upgrade my operating system."* Structured Workbooks, rigorous CBT tools (CBA, D.E.N.T.S.), and every AI insight showing exactly which entries it came from. |
| **Jordan** — "The Stabiliser" | Day 1–365+, MAT (Buprenorphine/Naltrexone) + MARA/SMART | Non-judgmental support for a medically-assisted path | *"My recovery combines medicine and behavior."* Every path respected explicitly — no language implying medication-assisted recovery is "not really sober." (See "Where the product is headed" below — this is the persona with the most active, honest gap between documented need and shipped feature today.) |

**Persona hierarchy** (`docs/PERSONAS.md` §1), useful for prioritization framing in any pitch material: David is the **Primary Safety Anchor** (his worst-case state sets the UX floor for the whole product); Ned is the **Primary Engagement Driver**; Walt + Maya are the **Primary Depth Drivers** (their usage justifies the Premium tier); Lisa is the **Primary Viral Driver** (sponsor-led organic growth); Jordan is the **Primary Stabilization Driver** (keeping MRT non-stigmatizing toward medically-assisted recovery).

---

## What makes MRT different — the claims that cut across every feature

These are the differentiators worth leading with in top-level copy, because they're true app-wide, not feature-specific:

1. **"Not even we can read it."** A rare case where a real technical constraint becomes an honest, headline-worthy marketing claim rather than a disclaimer. True of Journal, Workbooks, sponsor notes, and Vitality logs alike.
2. **A habit tracker that's actually on your side.** No red failure states, anywhere, ever. A missed day is never framed as a loss — verified in the Forgiveness Tap, Rhythm Score, and Smart Reset mechanics (Tasks), and in the deliberately un-punishing design of games like Goal Ladder and Daily Crossword.
3. **Real technique, not wellness-app invention.** Every tool traces to an established practice — 12-Step Step 4/10 (Journal), CBT/SMART worksheets (Tools), H.A.L.T. (Trigger Match), 4-7-8/box breathing (Vitality's Breath tab), urge-surfing (Urge Surfer). Nothing here is a generic "coping card."
4. **Every recovery path respected, in the same sentence if needed.** 12-Step (AA/NA/CA), SMART Recovery, Recovery Dharma, secular/CBT, and medication-assisted recovery are all first-class, never with MAT treated as an asterisk on an abstinence counter.
5. **Freemium done honestly.** Nothing safety-critical is ever behind Premium — SOS, Urge Surfer, Craving Buster, sponsor contact, the sobriety counter, and core journaling/task tracking are permanently free. Premium ($3.99/mo, "Supporter" framing) only ever removes an AI-depth pacing cooldown and adds export/template convenience — it doesn't cripple the free tier to sell the paid one. See `premium-upgrade.md`.
6. **AI that shows its work.** Every AI-generated suggestion is visually marked (purple Sparkle icon) and never presented as authoritative — and for the personas who need it most (Maya, Walt), every insight is traceable back to the specific entries that produced it.

---

## The product, module by module

Each module below is one tap from the Dashboard (except SOS, which is everywhere, and Premium, which is one screen). Full detail and per-persona breakdowns live in each module's own brief.

| Module | One-sentence pitch | Built primarily for | Brief |
|---|---|---|---|
| **Dashboard** | Recovery's home base — real progress and a private daily check-in, not a gamified scoreboard, with everything else one tap away. | Everyone (calm for David, milestone-forward for Ned) | `dashboard.md` |
| **Journal** | A private, AI-assisted place to process what's actually happening — text, voice, or guided prompts — that no one else, including MRT, can read. | Everyone; deepest fit for Walt (long-form) and Maya (traceable AI) | `journal.md` |
| **Tasks** | Turns recovery's daily actions into a simple list that never shames a missed day — free, forever, for every tier. | David (frictionless capture), Ned (forgiving momentum) | `tasks.md` |
| **Vitality** | A 30-second way to notice your body, your food, and your breath — because recovery isn't only what happens in your head. | Lisa (self-care counterbalance) | `vitality.md` |
| **Workbooks** | Turns real 12-Step, Recovery Dharma, or secular recovery literature into guided step work, one question at a time, with an AI coach reading alongside you. | Maya (structured curriculum), Walt (his actual current practice) | `workbooks.md` |
| **Tools** | A library of real CBT and SMART Recovery exercises, organized by the moment you're actually in. | Maya (strongest persona/feature match in the app), David (Urge Surfer) | `tools.md` |
| **Recovery Games** | Real coping tools — breathing rhythm, CBT patterns, H.A.L.T., momentum-building — turned into short games built for a specific moment, not gamification with a recovery theme painted on. | Near 1:1 persona-mapped: David/Ned/Lisa/Walt each get a named game | `games.md` |
| **Insights & Recovery Capital** | Every pattern MRT's AI ever noticed, in one place — and a real, SAMHSA-grounded way to see the whole shape of a recovery, not just a sobriety count. | Walt (longitudinal trends), Maya (traceable evidence) | `insights.md` |
| **Profile** | Identity, real vault security, full data ownership, and every milestone earned — the trust layer behind everything else. | Walt (data export), Ned (his gamification home) | `profile.md` |
| **SOS / Crisis Support** | One button, on every screen, that gets you a real person or a real tool in seconds — no PIN, no menu, no waiting. | David — this feature *is* his worst-case design floor, made real | `sos-crisis-support.md` |
| **Premium ("Supporter")** | Unlimited AI depth and full-featured exports — everything else stays free, forever, because crisis and core recovery tools should never have a price tag. | Walt and Maya (natural fit, already the heaviest depth users) | `premium-upgrade.md` |

**Jordan, across the product today:** no single module is built specifically for Jordan yet — her needs are honored *negatively* (no shaming language anywhere, every persona-neutral design choice already helps her) but not yet with a *dedicated* feature the way David has SOS or Ned has Goal Ladder. See "Where the product is headed" below — this is a known, tracked, and currently-being-planned gap, not an oversight to paper over in copy.

---

## The design system, briefly

MRT's visual language is **Vibrant Momentum** — full detail: `docs/design/vibrant_momentum.md`. The short version for anyone writing visual or UI-adjacent copy: high-saturation, alive gradients (never flat or grey-dominant), glassmorphism, a distinct color identity per module (Journal's indigo-to-violet reflection, Tasks' cyan-to-emerald energy, Workbooks' emerald-to-lime growth, and so on), and a hard rule against red failure states anywhere in the product. If a screenshot, mockup, or visual reference is needed for marketing material, it should reflect this system, not a generic health-app aesthetic — see that document's Marketing & Public-Facing Rules section specifically (no shadowy/depressed-looking stock imagery, avatars and personas only, never real names or faces).

---

## Where the product is headed (know this before writing forward-looking copy)

Full detail: `docs/ROADMAP.md`. Two things worth knowing for any copy that gestures at what's next, without overpromising a specific ship date:

- **Jordan's dedicated features are in active planning, not yet shipped.** `docs/projects/111_MAT_DOSE_TRACKING.md` — one-tap dose logging, a renameable sobriety-counter label (e.g. "Days of Stability"), and discreet, drug-name-free notifications — has been through strategy planning and is queued for implementation. **Do not write copy today promising dose-tracking, a custom counter label, or MAT-specific notifications** — every per-feature brief above is explicit that these don't exist in the shipped product yet. Once shipped, this becomes Jordan's first dedicated module, closing the one real gap in an otherwise persona-complete product.
- **The Service Network (Lisa's sponsee rolodex) is paused, not built.** `docs/PERSONAS.md`'s Primary Viral Driver framing for Lisa refers to a sponsor-invite growth loop that doesn't exist in the shipped product yet (`PROJ-05`, paused). Don't write copy implying sponsees can be managed or shared from inside the app today.

Everything else described in this guide and its linked briefs is live, shipped, and verified against actual source code as of the dates noted in each brief — safe to build marketing copy on directly.

---

## Universal brand voice & guardrails

Every per-feature brief carries its own additions to this list; these are the rules that apply to *any* copy about MRT, at any level:

- **Never make clinical or medical claims.** MRT is a peer-support companion tool, not a treatment, therapy, or medical device.
- **Never use shame, fear, or scarcity language.** No "don't let addiction win," no relapse-shaming, no countdown-to-failure framing — mirrors the product's own hard "no red failure states" rule.
- **Respect every recovery path as legitimate**, explicitly: 12-Step, SMART Recovery, Recovery Dharma, secular/CBT, and medication-assisted recovery. Never imply MAT is "not really sober."
- **Lead with privacy, honestly.** "Zero-knowledge encryption" and "not even we can read it" are true, verifiable, and a real differentiator — not a generic "we take privacy seriously" line.
- **Never fabricate testimonials, statistics, or user quotes.** The persona vignettes throughout MRT's documentation are composite design personas, not real users.
- **Don't overclaim the AI.** It surfaces patterns in someone's own writing; it doesn't predict relapse, diagnose anything, or replace a sponsor or therapist.
- **Crisis-safe by default.** Any copy that could reach someone in acute crisis (app store description, first-run ad, onboarding email) should never assume the reader is stable, motivated, or having a good day. When in doubt, write for 2 AM, not for the best-case user.
- **The SOS/Crisis brief carries the strictest guardrails in the whole series** — read `sos-crisis-support.md` in full, and route any crisis-adjacent copy through a human review pass before it ships, not just an LLM pass.

---

## Where to go deeper

| Need | Go to |
|---|---|
| Full detail on one feature, with persona-by-persona breakdowns | This folder's per-feature briefs (see table above) |
| Persona journey arcs, UX constraints, safety tests | `docs/PERSONAS.md` |
| Exact screen-by-screen technical behavior, data model, gating | `docs/screens/` (63 files, one per screen/tab/tool/game) |
| Visual design language, color system, motion, accessibility | `docs/design/vibrant_momentum.md` |
| What's shipped, in progress, or planned | `docs/ROADMAP.md` |
| Zero-knowledge architecture in technical depth | `docs/SECURITY_ZERO_KNOWLEDGE.md`, `docs/SYSTEM_OVERVIEW.md` |

---

*MRT · Whole-App Marketing Guide · Synthesis layer over the per-feature briefs in `docs/marketing/`*
