# My Vitality — Marketing & Persona Brief

**What this document is for:** briefing material for an LLM writing marketing copy about MRT's Vitality module — quick logging for movement, nutrition, and breathwork. It explains what Vitality actually does, why body-based self-care matters in substance-use recovery, and how it's used — grounded in the real, verified product, not generic wellness-app language.

Fifth in the per-feature series (`docs/marketing/journal.md`, `dashboard.md`, `tools.md`, `tasks.md` before this; `docs/marketing/README.md` tracks the rest). Built on `docs/screens/vitality/`, which was spot-verified against live source this pass (including a genuine engineering-only bug in the breathwork timer — irrelevant to marketing copy, noted for completeness) and held up accurate.

---

## The one-sentence pitch

**My Vitality is a 30-second way to notice your body, your food, and your breath — because recovery isn't only what happens in your head.**

---

## Why body-based self-care matters in recovery

Recovery work often focuses entirely on thoughts, urges, and triggers — Vitality exists because the body is part of the same system:

- **Movement and mood are directly linked.** Physical activity is a well-established, low-cost tool for regulating the mood swings and restlessness common in early recovery — this isn't a wellness-app add-on, it's a real part of relapse-prevention practice.
- **Noticing *why* you're eating, not just *what*, is a real mindful-eating practice.** The Fuel logger's hunger-type check (physical hunger vs. an emotional, bored, or habitual urge to eat) echoes the same kind of self-inquiry recovery programs already use for substance cravings — pausing to ask "what's actually driving this" before acting on it.
- **4-7-8 breathing and box breathing are real, named techniques**, not invented exercises — the same physiological regulation methods used clinically for anxiety and, by first responders and military personnel, for acute stress control. MRT didn't invent a breathing gimmick; it built a timer around two techniques that already work.
- **None of this replaces urge-specific crisis tools.** Vitality is steady, everyday self-regulation — not the app's crisis response. Urge Surfer stays the dedicated tool for an active craving; see `docs/marketing/tools.md`.

**Marketing framing:** "recovery lives in your body too" — real techniques, quick enough to actually use, not another wellness checklist.

---

## What Vitality actually does

### Three quick logs, one shared record
- **Move** — what the activity was, how long, how intense, plus an optional note. Takes under a minute.
- **Fuel** — what kind of eating moment it was, and what was actually driving it (physical hunger vs. something else) — plus a simple hydration tap-counter for the moment.
- **Breath** — a guided timer with a calming visual, offering 4-7-8 breathing, box breathing, or a fully custom pattern someone can build and save for themselves. A gentle haptic pulse marks each phase change, and the screen stays awake for the whole session.

Every log — whether it's a five-minute walk or a two-minute breathing session — becomes part of the same private, encrypted record as a Journal entry. There's no separate Vitality database; it's the same trusted vault.

### A ring, not a streak
The small progress ring on the Dashboard header reflects the day so far across three pillars — movement, nutrition, mindfulness — filling roughly a third for each one touched that day. It's not a punishing metric: there's no red state for an incomplete ring, no penalty for a day that's only one-third full. It's simply a gentle, honest snapshot of a day's self-care, not a scoreboard.

### Mood, without being asked
Every Vitality log quietly carries a mood signal inferred from someone's own recent entries — nobody has to stop and rate how they feel just to log a walk or a glass of water. One less thing standing between "I should log this" and actually doing it.

---

## How each persona uses Vitality

MRT designs around six real recovery personas (full detail in `docs/PERSONAS.md`). Vitality isn't built with per-tab persona targeting in code — it's a general self-regulation surface — but two personas are explicitly named for it in the persona documentation, and worth leading with.

### Lisa — "The Service Superstar" (7 years, Alcoholics Anonymous, sponsors 3–6 women)
> *"I have five sponsees and a full-time job. I need to stay organized so I don't burn out."*

Lisa is Vitality's clearest documented fit. Her persona work names this module specifically as her personal self-care counterbalance to a life spent managing everyone else's recovery — the one place in the app that's tracking *her* wellbeing, not her sponsees'.

**Marketing angle:** even the person holding everyone else up needs somewhere to notice her own body and needs — this is that place.

### Jordan — "The Stabiliser" (Day 1–12mo+, MAT/Buprenorphine or Naltrexone + MARA/SMART)
> *"My recovery combines medicine and behavior. I need tools that support my physical stability without judgment."*

**Handle carefully, verified gap:** Jordan's persona documentation calls for craving-correlation tracking tied to medication timing, surfaced through Vitality. That specific capability isn't built — checked directly, none of the three logging tabs has any MAT-mode branching, dose field, or medication log. This is now a tracked roadmap item (`docs/ROADMAP.md` Wave 1, promoted from the backlog while drafting the Dashboard and Tasks briefs), not a shipped feature. Don't write copy promising it yet.

**Marketing angle:** for now, keep Jordan's Vitality mention general — private, judgment-free logging of movement, food, and breath, same as anyone else. The medication-correlation story becomes true once the roadmap item ships.

### The other four personas
Vitality isn't built around a specific story for David, Ned, Walt, or Maya — don't force one. If a mention is needed: Breath's grounding, calming quality is thematically relevant to anyone managing anxiety in the moment (David included), but it is **not** MRT's crisis tool — that's Urge Surfer (see `docs/marketing/tools.md`), which is built and positioned specifically for that job. Don't blur the two in copy.

---

## How Vitality connects to the rest of MRT

- **Every Vitality log is a Journal entry under the hood** — same encryption, same private History timeline, same eligibility for AI Pattern Analysis (see `docs/marketing/journal.md`).
- **The Bio-Balance ring lives on the Dashboard** — Vitality's only visible footprint outside its own screen (see `docs/marketing/dashboard.md`).
- **Nothing here requires Premium** — Vitality is fully free, on every tier, with no exceptions.

---

## Brand voice & marketing guardrails

Everything from `docs/marketing/journal.md`'s guardrails applies here too. Vitality-specific additions:

- **Don't promise cumulative hydration tracking.** The water counter is a snapshot at the moment someone logs a meal, not a running daily total — there's no "track your water intake all day" feature. Frame it as a small mindful-hydration check-in, not a hydration tracker.
- **Don't promise MAT/medication-correlation features for Jordan.** That's a real, tracked roadmap item, not something live today — see Jordan's section above.
- **Never imply the Bio-Balance ring is a performance score.** It's a gentle daily reflection, not a metric to optimize or a source of guilt on a low day.
- **Keep Breath separate from crisis messaging.** It's a genuinely useful regulation tool, but it isn't the app's crisis response — don't write copy that could read as "use this instead of Urge Surfer during a craving."

---

## Quick reference: personas at a glance

| Persona | Stage | Path | Vitality's job for them |
|---|---|---|---|
| David | Day 1–30 | CA | Breath's grounding tool is relevant, but not his crisis tool — that's Urge Surfer |
| Ned | Day 30–90 | NA | No dedicated story — general self-care logging |
| Lisa | 7 years | AA | Her documented self-care counterbalance to service burnout |
| Walt | 35+ years | AA → Recovery Dharma | No dedicated story |
| Maya | 6–18 months | SMART/CBT/secular | No dedicated story |
| Jordan | Day 1–12mo+ | MAT + MARA/SMART | General logging today; medication-correlation is a tracked roadmap item, not yet built |
