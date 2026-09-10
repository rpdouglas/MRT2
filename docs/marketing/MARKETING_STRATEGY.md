# MRT Marketing Strategy

**What this document is for:** the phased execution plan for producing and shipping MRT's marketing content — what to build, in what order, for six personas, with a realistic asset count for a solo developer. This is the *plan*; the *rules* every asset must follow (compliance vocabulary, colour system, voice, distribution rules) live in `BRAND_GUIDELINES.md` and are referenced here rather than repeated.

**Revision note (September 2026):** this is a fact-checked rewrite of `MRT_Marketing_Strategy_v1.docx` (May 2026 draft). That draft predated `docs/marketing/`, `docs/PERSONAS.md` v2.2/v2.3 (which added Jordan), and several shipped features it assumed were still pending — it treated the persona count as unresolved, described a Sponsee Rolodex screenshot for a module that was never built, used a colour palette that didn't match `src/lib/theme.ts`, and assumed the Google Play Store listing was still blocked. All of that is corrected below; see the Decision Log at the end for what changed and why.

Sources: `BRAND_GUIDELINES.md`, `docs/PERSONAS.md` v2.3, `docs/marketing/OVERVIEW.md`, `docs/ROADMAP.md`, `docs/design/vibrant_momentum.md`.

---

## Executive Summary

MRT's biggest risk is not having too little marketing. It's trying to market too many things at once to a solo developer's capacity. The app is extraordinarily broad — multiple recovery pathways, six personas, dozens of modules, AI, ZK encryption, CBT tools, MAT-inclusive tracking, crisis intervention, and more. Attempting to produce marketing content for every feature while simultaneously building the product is a path to burnout and incoherence.

This plan treats marketing as a product feature: build one reusable system that continuously creates value with minimal ongoing effort. The result is a sustainable, persona-first content strategy that grows naturally alongside the product rather than competing with it for attention.

| The Old Approach | This Plan |
|---|---|
| 200 marketing assets | ~34 exceptional core assets |
| Feature-first ("here's our dashboard") | Narrative-first ("meet David") |
| Separate marketing calendar | Marketing grows with shipping |
| Complex funnels + daily content | One polished post per meaningful ship |
| Market the entire app | Market the journey |

**Strategic principles, compliance constraints, visual system, and voice/distribution rules:** see `BRAND_GUIDELINES.md` — every asset produced under this plan follows that document without exception.

---

## Phase 0 — Prerequisites

Complete before producing any content asset. Estimated time: 1–2 days (down from 2–3 — persona count and the app-store item below are now resolved).

### 0.1 Persona Count — Resolved

This plan covers **six personas** — David, Ned, Lisa, Walt, Maya, and Jordan. Jordan ("The Stabiliser," MAT/harm-reduction, Day 1–365+) was formally added to `docs/PERSONAS.md` in v2.2 and refined in v2.3 (current). Jordan already has a shipped, dedicated feature — one-tap dose logging, a renameable sobriety-counter label, and discreet notifications (`PROJ-111`, shipped 2026-09-04) — so persona content for Jordan is not just possible but overdue. Content count throughout this plan is **18 persona posts** (3 per persona × 6 personas).

### 0.2 Apply for LegitScript Certification

Still open — see `BRAND_GUIDELINES.md`'s Paid Advertising Gate. Apply at legitscript.com now so certification is ready before paid campaigns are needed; the process takes several weeks.

- Visit legitscript.com and begin the Health and Wellness Merchant application
- Document MRT's positioning as a wellness app, not a treatment provider
- Reference the ZK architecture and PIPEDA/42 CFR Part 2 compliance posture in the application

### 0.3 Choose Two Primary Distribution Channels

Still open. Every asset in this plan should be created for two specific channels — choose now and don't change for at least three months.

| Channel | Best for | MRT Communities |
|---|---|---|
| Reddit | High-intent recovery communities. Organic trust-building. No promotional posting — community participation first. | r/stopdrinking · r/redditorsinrecovery · r/RecoveryDharma · r/SMART |
| TikTok / Instagram Reels | Reaching Ned (24, digital native). #SoberTok community is large and active. Organic only until LegitScript is approved. | #SoberTok · #RecoveryTok · #SoberLife |
| X / Twitter (Build in Public) | Developer and privacy-tech audience. ZK architecture story resonates here. Low effort — repurpose spec work. | #BuildInPublic · #IndieHacker · #SoloFounder |
| LinkedIn | B2B: EAPs, treatment centres, clinical partners. | HR professionals · clinical programme directors |

**Decision:** select two channels and record them in the Decision Log below.

### 0.4 Audit the Live App Store Listing — Resolved

`PROJ-07` (Google Play Store TWA) went live in Production on 2026-09-09 — MRT is already downloadable on Google Play. `PROJ-105` (Google Play Billing) is deployed and in review. This is a listing-audit task now, not pre-launch prep:

- App Store short description (80 chars max): wellness + habit-tracking framing, no clinical claims
- App Store long description (4,000 chars max): persona-first narrative, features second
- Keywords list (100 chars): sobriety, recovery, habit tracker, CBT, journaling — no "addiction treatment" (triggers scrutiny)
- Screenshots: a curated 8-image Play Store listing set already exists (Dashboard, Journal, Recovery Games hub, Urge Surfer, Workbooks, Goal Ladder, Daily Crossword, SOS Crisis modal — regenerated 2026-08-31, see `docs/ROADMAP.md`'s Store Listing Visual QA entry). Audit it against current UI before reusing — don't recreate from scratch.

---

## Phase 1 — Build the Marketing Foundation — Done

Originally: "Phase 1 produces one document: the MRT Brand Marketing Playbook." **That document now exists: `BRAND_GUIDELINES.md`** — approved vocabulary, 12-Step Tradition compliance, colour palette (corrected against `src/lib/theme.ts`), typography, icon/imagery style, CTA style, caption framework, hashtag strategy, and the master AI image prompt template. Nothing left to build here; reference it, don't recreate it.

---

## Phase 2 — Introduce the Six Personas

Estimated time: 2–3 weeks. 18 posts total (3 per persona × 6 personas). These are the highest-impact posts in the plan — they communicate immediately: "this app understands me."

For each persona, produce exactly three pieces of content in sequence. Do not skip to the solution post without the introduction and challenge posts — the narrative arc is the mechanism.

| Post | Title | Content | Design |
|---|---|---|---|
| Post 1 | Meet [Persona] | Who they are. Their recovery stage. Their emotional state. Their daily reality — not their pathology. | Persona emoji large. Module gradient. First name + archetype label. One-sentence bio. |
| Post 2 | [Persona]'s Biggest Challenge | The specific problem they face. Told as a moment, not a statistic. Visceral and honest. | Darker gradient. Problem stated in large typography. No MRT branding on this post — pure empathy. |
| Post 3 | How MRT Helps [Persona] | Real app screenshot. One feature. One moment. How that feature maps to the challenge from Post 2. | Device frame with real screenshot. Module gradient. Feature name. One-sentence benefit. |

### Persona Content Briefs

**David — The Survivor 🌊 · Day 1–30 · CA**
- Post 1 — Meet David: *"32 years old. Two years clean. Then one night changed everything. He's back at Day 1 and he knows exactly how hard this night is going to be."* Module: Dashboard. Gradient: whichever Sobriety Hero colour the graphic uses — Dashboard is personalised, not fixed (Amber is a safe default).
- Post 2 — His Challenge: *"It's 2 AM. The urge is loud. He doesn't want to wake anyone up. He doesn't want to explain. He just needs the noise to stop."* No product mention. Pure moment.
- Post 3 — How MRT Helps: real screenshot of the SOS modal / Urge Surfer. Caption: *"One tap. The Urge Surfer meets him exactly where he is. No login, no navigation, no explaining."*
- Compliance check: no clinical claims, no "cure"/"treatment" language, don't depict the urge itself graphically.

**Ned — The Pink Cloud ⚡ · Day 30–90 · NA**
- Post 1 — Meet Ned: *"24 years old. 47 days clean. He's treating recovery like a fitness challenge — and right now, that's exactly what he needs."* Module: Tasks. Gradient: Cyan → Teal → Emerald.
- Post 2 — His Challenge: *"The streak is everything. One missed day and it feels like losing two months of progress. The app should celebrate the wins, not punish the slip."*
- Post 3 — How MRT Helps: real screenshot of the Rhythm Score ring and Task streak. Caption: *"14-Day Rhythm. One missed day doesn't erase 46. MRT measures consistency, not perfection."*

**Lisa — The Service Superstar 🌿 · 7+ Years · AA**
- Post 1 — Meet Lisa: *"45 years old. Seven years sober. Sponsors five women. Chairs two meetings a week. Still finds time to neglect herself."* Module: Vitality (Service/Sponsee Rolodex is paused, `PROJ-05` — no live UI to screenshot). Gradient: Rose → Orange → Amber.
- Post 2 — Her Challenge: *"She can tell you exactly where each of her sponsees is in their step work. She cannot tell you the last time she checked in with herself."*
- Post 3 — How MRT Helps: real screenshot of the Vitality check-in (body / food / breath). Caption: *"She manages everyone else's recovery. Thirty seconds, once a day, for her own."*
- Compliance check: don't depict the (unbuilt) Sponsee Rolodex or imply sponsees can be managed in-app today. If a future Service Module screenshot is used once `PROJ-05` ships: no sponsee faces or real names, first-name-only, no fellowship logos.

**Walt — The Zen Master 🌙 · 35+ Years · AA + Recovery Dharma**
- Post 1 — Meet Walt: *"68 years old. Thirty-five years of recovery. Started in AA. Found Recovery Dharma. Still writing in his journal every morning."* Module: Insights. Gradient: Fuchsia → Pink → Rose.
- Post 2 — His Challenge: *"He doesn't want streaks. He doesn't want badges. He wants to see how the shape of his life has changed over years — not days."*
- Post 3 — How MRT Helps: real screenshot of Recovery Capital's Trends view (an area/line chart, not a radar chart, across the Health / Home / Purpose / Community domains — "ROSC" is Insights' internal/backend name only, never user-facing copy). Caption: *"Your data. Your patterns. Nobody else can read it — not even us. Walt's journal stays Walt's."*

**Maya — The Systematiser 🧠 · 6–18 Months · SMART / CBT**
- Post 1 — Meet Maya: *"28 years old. Eight months sober. Tried AA. It wasn't the right fit. Found SMART Recovery and treated her addiction like a problem she could actually solve."* Module: Workbooks. Gradient: Emerald → Green → Lime.
- Post 2 — Her Challenge: *"She doesn't want slogans. She wants to understand the psychological mechanics of her cravings. She wants data, not encouragement."*
- Post 3 — How MRT Helps: real screenshot of the guided ABCDE worksheet or Workbook progress view. Caption: *"ABCDE. CBA. Thought Records. The full CBT toolkit — guided, step by step, encrypted, and entirely hers."*

**Jordan — The Stabiliser ⚓ · Day 1–365+ · MAT / MARA & SMART**
- Post 1 — Meet Jordan: *"35 years old. Stable on a Buprenorphine program after multiple painful abstinence-only relapse cycles. Employed. Rebuilding family relationships. Their recovery includes medicine, and they are tired of apps that treat that like a footnote."* Module: Dashboard (the dose-log widget and custom counter live here, not in a dedicated module). Gradient: whichever Sobriety Hero colour the graphic uses.
- Post 2 — Their Challenge: *"The room goes quiet when they mention Suboxone. Some sponsors still say it is not 'real' sobriety. They need an app that never makes them defend a doctor's prescription."* No product mention. Pure moment.
- Post 3 — How MRT Helps: real screenshot of the one-tap dose-log widget and the renameable counter (shipped, `PROJ-111`, 2026-09-04). Caption: *"Days of Stability, not days since a mistake. One tap logs today's dose — no drug names on the lock screen, ever."*
- Compliance check: no language implying medication-assisted recovery is "not really sober" or "cheating." No drug names in any lock-screen mockup — notification copy must stay generic, per `PROJ-111`. Composite persona, first-name-only, not a real patient.

---

## Phase 3 — Product Philosophy Posts

Estimated time: 1 week. 6 posts. These communicate what MRT stands for before explaining what it does — brand voice posts that state positions, not features. Each one should be a claim only MRT can make honestly.

| Post | Theme | Core message |
|---|---|---|
| 3.1 | Why MRT is different | "Every other recovery app is built around a single path. AA. SMART. Meditation. MRT is built around the person — whatever path they're on." |
| 3.2 | Recovery isn't one-size-fits-all | "David needs immediate crisis tools. Walt needs a blank journal and silence. Ned needs a streak. The same app serves all three. That's intentional." |
| 3.3 | Your data belongs to you | "We use zero-knowledge encryption. Your journal entries are encrypted on your device before they leave it. Not even we can read them. That's not a feature — it's a design principle." Built in Canada with Canadian privacy standards. |
| 3.4 | Built for 2 AM | "We designed every crisis feature for the moment when cognitive load is maxed and support feels impossible. One tap. No navigation. No login. Just help." |
| 3.5 | The No-Guilt Engine | "Missed a day? MRT moves the task to today — silently, without penalty. 'Let today go.' Recovery doesn't reset to zero because you had a hard night." |
| 3.6 | One app, many recovery paths | "AA. NA. CA. Recovery Dharma. SMART Recovery. Secular/Stoic. Mindfulness. MAT. We don't pick a winner. We support the path that works for you." |

Production note: these work best as single-image text graphics — large typography on a gradient background, no screenshots. The claim is the visual. Keep copy tight: the headline IS the post, with a two-sentence expansion in the caption.

---

## Phase 4 — Screenshot Spotlights (Ongoing)

Effort per post: 20–30 minutes. Produced whenever a feature ships. No fixed schedule — this is the easiest content to produce and the most sustainable over time. Every time a meaningful feature ships: screenshot, wrap it in the branded template from Phase 1 (now `BRAND_GUIDELINES.md`'s icon/imagery rules), write three sentences. Done.

**Ongoing rule:** every sprint that ships a user-facing feature closes with one screenshot spotlight post — part of the Definition of Done for each feature, not optional.

### Starting Library (10 Posts from Existing Features)

| Feature | Module | Screenshot to use | One-line benefit |
|---|---|---|---|
| Dashboard & Sobriety Counter | Dashboard | Clean-time counter with milestone arc | "Your days, always visible. Never hidden behind a login." |
| Voice-to-Vault | Journal | Voice recording UI | "Don't type. Just talk. Encrypted before it leaves your device." |
| Recovery Capital | Insights | Trend chart across 4 domains (Health, Home, Purpose, Community) | "Health. Home. Purpose. Community. Your recovery capital, month by month." |
| Guided ABCDE Worksheet | Workbooks | Step 4 — Dispute prompt screen | "The hardest step in CBT. MRT walks you through it." |
| Forgiveness Tap | Tasks | Amber "Let today go" sheet | "Missed a habit. MRT doesn't punish you for it." |
| Daily Readings | Dashboard | Reading card with modality selector | "AA. Recovery Dharma. SMART. Secular. Your daily reflection, your tradition." |
| MAT Dose Log & Custom Counter | Dashboard | One-tap dose-logging widget + renameable counter label (Jordan, `PROJ-111`, shipped) | "Days of Stability, not days since a mistake. One tap logs today's dose — no drug names, ever." |
| AI Pattern Analysis | Insights | Deep pattern result card | "90 days of patterns. One honest summary. No black box — see the evidence." |
| Rhythm Score | Tasks | Rhythm ring (circular progress, not a segmented bar) | "Consistency over perfection. 14-day rhythm, not brittle streaks." |
| ZK Encryption Explainer | Any | Lock icon + architecture diagram | "We can't read your journal. Technically. Built that way on purpose." |

---

## Phase 5 — Evergreen Quote Graphics (Ongoing)

Effort per post: 10–15 minutes. One per week when time permits. No obligation. Recovery communities run on shared language — slogans, sayings, principles passed down for decades. Quote graphics tap directly into this and are the fastest, most shareable content to produce.

**Content themes:** 12-Step daily reader excerpts (principles, not verbatim Big Book/NA Basic Text — copyright), CBT reminders and cognitive reframes, Recovery Dharma inquiry prompts, SMART Recovery cost-benefit prompts, One Day at a Time philosophy, daily gratitude prompts, generic milestone celebrations ("One year. 365 decisions."). No attribution to specific fellowship texts unless explicitly public domain.

**Design rules:** see `BRAND_GUIDELINES.md`'s Quote Graphic Rules — full-bleed gradient, large serif/display type (the one exception to the Arial rule), MRT wordmark bottom right with "Built for recovery. Yours.", no persona icons (universal, not persona-targeted), square (1:1) or tall (9:16) crop.

---

## Asset Library Summary

| Asset Type | Count |
|---|---|
| Brand Marketing Playbook (Phase 1) | 1 document — done (`BRAND_GUIDELINES.md`) |
| Reusable design templates | 4 (persona intro, challenge, solution, quote) |
| Persona introduction posts | 6 (one per persona) |
| Persona challenge posts | 6 |
| Persona solution posts (with real screenshots) | 6 |
| Product philosophy posts | 6 |
| Screenshot spotlights (starting library) | 10 |
| Screenshot spotlights (ongoing — one per feature shipped) | Grows indefinitely |
| Evergreen quote graphics | Ongoing (target: one per week) |
| **TOTAL CORE ASSETS** | **~34 + ongoing** |

These 34 core assets, posted at one per day, cover about five weeks of content. Posted at three per week, they cover about eleven weeks. With ongoing screenshot spotlights and weekly quotes added, this is a sustainable six-month content library produced in roughly four weeks of occasional effort.

---

## Distribution

Full channel rules (Reddit community-participation-first, TikTok/Instagram organic-only-until-LegitScript, X build-in-public, posting-frequency guidance) live in `BRAND_GUIDELINES.md`'s Distribution Rules section — every asset in this plan ships through those rules without exception. Once trust is established on Reddit, a founder AMA in r/stopdrinking or r/redditorsinrecovery is one of the highest-legitimate-reach formats available, aligned with the 12-Step "attraction not promotion" principle.

**What this plan deliberately does not include** (no daily content calendar, no 90-day campaigns, no paid advertising before LegitScript, no complex email funnels below ~5,000 MAU, no influencer campaigns yet, no platform-specific creative optimisation before LegitScript): see `BRAND_GUIDELINES.md`'s Guardrails & Deliberate Non-Goals — removing these from scope was deliberate, not an oversight; don't reintroduce them without revisiting why they were cut.

---

## Decision Log

Track decisions made during execution here. Do not re-litigate decided questions without updating this log.

| # | Decision | Options considered | Status |
|---|---|---|---|
| 1 | Persona count | 5 personas vs. 6 (adding Jordan) | ✅ Resolved — 6 personas. Jordan added in `PERSONAS.md` v2.2, refined in v2.3, and already has a shipped feature (`PROJ-111`, 2026-09-04). |
| 2 | Primary channels | Reddit + TikTok · Reddit + X · Instagram + X · LinkedIn only | ❓ Unresolved — complete §0.3 |
| 3 | LegitScript application | Apply now vs. wait until paid ads needed | ❓ Unresolved — §0.2 action |
| 4 | B2B vs. B2C priority | Consumer-first vs. clinical partnership-first | ❓ Unresolved — affects Phase 3 philosophy posts and LinkedIn priority |
| 5 | App Store readiness | Prepare metadata ahead of launch vs. audit an already-live listing | ✅ Resolved — `PROJ-07` went live in Production 2026-09-09; `PROJ-105` Google Play Billing is deployed and in review. §0.4 is now a listing audit, not launch prep. |
| 6 | Brand Marketing Playbook | Build from scratch (original Phase 1) vs. already exists | ✅ Resolved — `BRAND_GUIDELINES.md` created September 2026, extracted and fact-checked from the original strategy draft. Phase 1 is done; reference it, don't recreate it. |

---

*MRT · Marketing Strategy · fact-checked rewrite of `MRT_Marketing_Strategy_v1.docx`, September 2026 · rules live in `BRAND_GUIDELINES.md`*
