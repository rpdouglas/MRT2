# My Dashboard — Marketing & Persona Brief

**What this document is for:** briefing material for an LLM writing marketing copy (ads, landing pages, App/Play Store copy, email, social) about MRT's Dashboard — the home screen every user lands on after unlocking the app. It explains what the Dashboard actually does, why its specific design choices matter in substance-use recovery, and exactly how each of MRT's six personas uses it — so copy comes out grounded in the real product, not generic "your recovery journey starts here" dashboard language.

Second in the per-feature series (see `docs/marketing/journal.md` for the first, and `docs/marketing/README.md` for the full list). Written against `docs/screens/dashboard.md`, itself just re-verified against the live source code.

---

## The one-sentence pitch

**My Dashboard is recovery's home base — real progress and a private daily check-in, not a gamified scoreboard, with everything else one tap away.**

---

## Why the Dashboard's design matters in recovery

The choices here aren't generic "app home screen" decisions — they map onto specific, well-established recovery practices:

- **Counting time is a real 12-Step ritual, not a gimmick.** AA/NA chip and medallion ceremonies exist because marking sobriety duration publicly and physically is a documented source of motivation and identity reinforcement. The Dashboard's milestone images are, internally, literally called "chips" and "medallions" in the codebase — this isn't a coincidence, it's the same practice, digitized.
- **Making the cost of use concrete is a real motivational-interviewing technique.** Turning "I'm saving money" from an abstract idea into an actual running dollar total is a recognized way to reinforce the tangible upside of a recovery decision, not just the abstinence itself.
- **A lightweight daily check-in ritual mirrors structured daily inventory** (the same Step 10 practice behind the Journal, see `docs/marketing/journal.md`) — delivered here as a single tap, matched to time of day, not a demand.
- **A stable, low-friction landing screen is itself protective.** Early recovery benefits from routine and predictability; a home screen that's calm, consistent, and never shame-coded (no red "overdue" states, no failure language) removes one more source of friction from a day that may already have plenty.

**Marketing framing:** this is the home base of a recovery *practice*, built around rituals that already work in recovery culture — not a generic productivity-app dashboard with a sobriety counter bolted on.

---

## What the Dashboard actually does

### The Sobriety Hero — more than a counter
The card at the top of the screen does four distinct things, not just one:

1. **Counts time** — years, months, and days since the sobriety date the user set. If no date is set yet, it shows a plain "Begin the Journey" prompt — no red state, no guilt, just an invitation.
2. **Shows money saved** — once someone enters what they used to spend and how often, the card shows a running total saved since their sobriety date, in their own currency. Until then, it's a simple "Set up Financial Freedom" link, not a blank space that implies something's missing.
3. **Lets the user personalize it** — a small color-swatch button on the card itself lets someone pick their own accent color, right where they'll see it every day.
4. **Celebrates milestones — and makes them shareable.** On a real milestone (24 hours, 1 week, every month through year one, then every year after), the card's footer becomes a "🎉 Milestone!" banner, and the Share button starts pulsing. Tapping Share exports the card as an image — complete with a medallion graphic and a quote pulled from the user's own most recent AI insight — ready to post or send anywhere the person chooses. **This is entirely opt-in**, on every single milestone: nothing is ever auto-shared or auto-posted.

**Marketing angle:** "your own digital medallion ceremony" is a genuinely accurate, evocative framing — this is the same recognition ritual recovery culture has used for decades, just built into the app and easy to actually use.

### The Daily Anchor — two lightweight actions, not a to-do list
Two pill-shaped buttons, not a task list:

- **Check-In** — icon and label change with time of day (sun/amber in daylight hours, moon/violet at night). One tap opens a private journal entry, already pre-filled with a prompt matched to that time of day. A small red dot appears only as a gentle nudge, never a demand; a lock icon shows if the vault needs a PIN first.
- **Daily Reading** — one tap opens today's reading matched to the person's own fellowship/modality preference, right in the app, or (before content exists in that language yet) the fellowship's own reading site. A dropdown lets someone jump straight to any other fellowship's reading. Reading something that resonates can become a private journal reflection in one more tap — from reading to writing, without leaving the moment.

**Marketing angle:** two small rituals a day, not another checklist — matched to the actual rhythm of a real day, not a generic streak counter.

### Six doors, one grid
Below the Anchor, six tiles — Journal, Tasks, Vitality, Workbooks, Games, Tools — each just an icon, a title, and a one-line description. **Deliberately not a scoreboard**: there are no live numbers, streaks, or stats on these tiles. That's a real product decision (not an oversight) — the team moved all of that detail into Profile → Achievements specifically to keep the home screen calm and easy to scan instead of another wall of metrics.

**Marketing angle:** "everything you need, nothing you don't" — a genuinely quiet home screen in a category full of noisy ones.

### Quiet reliability signals
A few small, easy-to-miss-but-worth-mentioning touches: a gentle reminder to back up data if it's been a week without a live cloud connection, a one-time toast when the app updates (linking to a real, plain-language changelog), and a soft opt-in prompt for daily reminder notifications — never sensitive content, just a nudge. None of these are alarms; they're closer to a trusted assistant quietly keeping things in order.

---

## How each persona uses the Dashboard

MRT designs around six real recovery personas (full detail in `docs/PERSONAS.md`). Do not invent details beyond what's here or in the personas doc; if a claim needs a specific stat or quote, flag it rather than fabricating one.

### David — "The Survivor" (Day 1–30, Cocaine Anonymous)
> *"I just need the noise to stop right now."*

David's relationship with the Dashboard is simple: it's the calm landing pad after the hardest part (unlocking the vault) is already done. The sobriety counter is just there, counting up, asking nothing of him. He isn't the audience for the milestone-share moment yet, and he doesn't need to be — the six-tile grid gets him to whatever he actually needs (often Tools) in one tap, without a wall of stats or a to-do list demanding attention he doesn't have.

**Marketing angle:** never pair David's story with streaks, milestones, or "keep it up" language — for him, the Dashboard's value is entirely in what it *doesn't* ask of him.

### Ned — "The Pink Cloud" (Day 30–90, Narcotics Anonymous)
> *"I'm going to crush it today!"*

Ned is the Dashboard's ideal audience. The sobriety counter, the milestone medallions, the share loop — this is exactly his currency, and his highest-energy period (Day 30–90) lines up with his most frequent monthly milestones. The Daily Anchor gives him a habit to build; the tile grid is his jumping-off point into the tools that keep his momentum visible.

**Marketing angle:** "hit 30, 60, 90 days — and actually show it off." This is the single strongest persona/feature match on the whole Dashboard.

### Lisa — "The Service Superstar" (7 years, Alcoholics Anonymous, sponsors 3–6 women)
> *"I have five sponsees and a full-time job. I need to stay organized so I don't burn out."*

Lisa's Dashboard visits are fast — a glance, maybe a Daily Reading tap for a quick spiritual touchpoint, then straight into whatever module she actually needs (often Vitality, her own self-care counterbalance). The calm, uncluttered tile grid matters to her specifically because her day is already full of other people's needs; this screen isn't one more thing demanding her attention.

**Marketing angle:** a home screen that respects five spare minutes instead of asking for more of them.

### Walt — "The Zen Master" (35+ years, AA-origin, now Recovery Dharma)
> *"Recovery is a lifelong practice of mindfulness and reflection."*

At 35+ years, Walt's milestones only land once a year — which means the medallion/share moment shows up rarely and means something, rather than nagging him constantly the way a weekly-streak mechanic would (and per his persona rules, gamification shouldn't be in his primary flow at all — the yearly cadence keeps it out of his way). What he actually watches on this screen is the **backup reminder** — data sovereignty is core to who he is, and this banner is his cue to keep his monthly export habit going.

**Marketing angle:** even the "gamified" milestone feature respects Walt, because it only ever shows up once a year, on something genuinely worth marking.

### Maya — "The Systematiser" (6–18 months, SMART Recovery / secular / CBT)
> *"I want to understand the mechanics of my brain so I can upgrade my operating system."*

For Maya, the Dashboard is mostly a fast pass-through to her real work in Workbooks and Insights — she isn't here for the sobriety counter's emotional weight so much as the uncluttered, unambiguous navigation to get to her actual curriculum.

**Marketing angle:** don't oversell this screen for Maya; her story belongs more to Workbooks and Insights. Here, the honest angle is simply "gets out of her way."

### Jordan — "The Stabiliser" (Day 1–12mo+, MAT/Buprenorphine or Naltrexone + MARA/SMART)
> *"My recovery combines medicine and behavior. I need tools that support my physical stability without judgment."*

Jordan benefits from the same things every persona does here — no red states, no failure language, a private and judgment-free counter. **One caveat for accuracy:** Jordan's persona documentation calls for a *customizable* counter label (e.g., "Days of Stability" instead of a generic sobriety count), but that customization isn't in the current Dashboard implementation — the counter always reads Years/Months/Days. Don't write copy promising a renameable counter until that's confirmed built; it's a real, documented product gap, not a shipped feature.

**Marketing angle:** lead with what's true today — private, non-judgmental progress tracking — not the custom-label feature that isn't live yet.

---

## How Dashboard connects to the rest of MRT

- **It's the front door to all six modules** — Journal, Tasks, Vitality, Workbooks, Games, and Tools are all one tap away from here, and nowhere else in the app.
- **The Daily Anchor feeds Journal directly** — both the Check-In and the "reflect on this reading" flow create real journal entries, encrypted the same way as any other entry (see `docs/marketing/journal.md`).
- **Milestone quotes are pulled from the same AI insights the Journal generates** — the share-image feature draws its quote from whatever the AI Pattern Analysis most recently produced, tying the two features together.
- **Sobriety date, financial details, and hero color are all set in Profile** — the Dashboard displays them; Profile is where they're configured.

---

## Brand voice & marketing guardrails

Everything from `docs/marketing/journal.md`'s guardrails applies here too (no clinical claims, no shame/fear language, every recovery path respected, no fabricated testimonials, crisis-safe by default). Dashboard-specific additions:

- **The "no sobriety date yet" state is never a failure state.** Copy should treat "Begin the Journey" as an invitation, not a gap or a missing achievement.
- **Milestone sharing is always the user's choice.** Never write copy that implies milestones are auto-posted, auto-shared, or visible to anyone without an explicit tap on Share.
- **Financial savings looks forward, not backward.** Frame it as "money staying in your life going forward," never as a reminder of past spending or a guilt trip about money "wasted" before recovery.
- **Don't promise the custom counter-label feature** (e.g., "Days of Stability") — it's documented as a persona need but isn't built into the Dashboard yet. See Jordan's section above.
- **Don't overstate what the tile grid is.** It's navigation with no live stats by design — copy shouldn't describe it as a "stats dashboard" or "progress tracker," since that's specifically what it stopped being.

---

## Quick reference: personas at a glance

| Persona | Stage | Path | Dashboard's job for them |
|---|---|---|---|
| David | Day 1–30 | CA | A calm landing pad that asks nothing of him |
| Ned | Day 30–90 | NA | Milestones and a share loop that matches his energy |
| Lisa | 7 years | AA | Fast, uncluttered — respects five spare minutes |
| Walt | 35+ years | AA → Recovery Dharma | A yearly medallion moment; the backup reminder matters most |
| Maya | 6–18 months | SMART/CBT/secular | A quick, unambiguous pass-through to her real work |
| Jordan | Day 1–12mo+ | MAT + MARA/SMART | Private, judgment-free progress (custom counter label not yet built) |
