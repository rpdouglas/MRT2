# My Tasks — Marketing & Persona Brief

**What this document is for:** briefing material for an LLM writing marketing copy about MRT's Tasks — the daily-actions and habit-tracking screen. It explains what Tasks actually does, why its specific anti-punishment design choices matter in recovery, and how each persona uses it — grounded in what's actually live in the product, not what an older spec describes.

Fourth in the per-feature series (`docs/marketing/journal.md`, `dashboard.md`, `tools.md` before this; `docs/marketing/README.md` tracks the rest). Built on `docs/screens/tasks/` after re-verifying its central claim against live source — see "Important: what changed in this pass" below before writing anything about how missed tasks are handled.

---

## Important: what changed in this pass (and since)

The technical docs previously described a "Smart Reset" mechanic — an overdue recurring task getting silently and gracefully rolled forward overnight, protecting a streak from a missed day. Tracing that claim to the actual code at the time found it wasn't live — the function that does this (`getUserTasks()`) existed and was well-built, but nothing in the running app called it. That gap was tracked as `TD-25` and **fixed on 2026-09-03**: the reconciliation logic is now wired into the live data path (`useTasksList()`), so Smart Reset is real and running today.

**What this means for copy now:** it's safe to write that the app quietly protects a streak overnight for a missed recurring task — that claim is verified live again, alongside the Forgiveness Tap (an explicit swipe-triggered choice) and the Rhythm Score's forgiving math. All three are real and confirmed in source as of this update.

---

## The one-sentence pitch

**My Tasks turns recovery's daily actions into a simple list that never shames a missed day — free, forever, for every tier.**

---

## Why this design matters in recovery

- **Daily structure is protective**, especially early on — routine and small, achievable actions are a well-established part of stabilizing early recovery, independent of any specific clinical framework.
- **Punitive habit-tracking works against recovery, not for it.** A streak counter that resets to zero and shows a red "you failed" state after one missed day is a real, documented relapse-adjacent risk pattern — it turns a single hard day into a reason to give up entirely ("I already broke it, why bother"). MRT's task design is a deliberate rejection of that pattern.
- **This is a real design response to a named risk window.** Ned's persona work explicitly calls out the "Pink Cloud Crash" around Day 90 — the point where early-recovery momentum fades and a punishing tracker would do real harm right when someone's most vulnerable. Tasks is built with that specific moment in mind, not as an afterthought.

**Marketing framing:** "a habit tracker that's actually on your side" — accurate, verifiable, and a real differentiator from the streak-shaming pattern most habit apps use.

---

## What Tasks actually does

### Three honest lanes: Today, Later, Log
Pending tasks split by whether they're actionable now or scheduled ahead, plus a completed-task archive grouped by year and month — not one long undifferentiated list.

### Never punished for a missed day — for real, verified reasons
- **Forgiveness Tap.** Swipe left on a task instead of just leaving it, and a bottom sheet opens: *"Let today go"* — "Move to Tomorrow" or "Keep for Today," with copy that adapts to context ("Your streak is safe — this is just one day" vs. "Recovery continues tomorrow"). This is an explicit, honest choice offered to the user, not a silent background trick.
- **Rhythm Score**, not a streak counter. A rolling 14-day consistency score where one missed day out of fourteen still scores around 93, not zero — deliberately forgiving math, shown as a simple ring above the list, never framed as a countdown to failure.

### Built to capture things fast
A pull-down gesture from the top of the list opens a lightweight "add task" sheet — one field, a few taps, done — for someone who doesn't have the focus for a full form in the moment.

### When AI notices something, it becomes a task
A suggested action from the Journal's AI Pattern Analysis can be added straight into this list with one tap, carrying a visible note explaining *why* it was suggested and a link back to the insight that generated it — closing the loop between "here's a pattern in your writing" and "here's something to actually try this week."

---

## How each persona uses Tasks

MRT designs around six real recovery personas (full detail in `docs/PERSONAS.md`). Do not invent details beyond what's here or in the personas doc.

### David — "The Survivor" (Day 1–30, Cocaine Anonymous)
> *"I just need the noise to stop right now."*

Tasks stays free and frictionless for David by design — no premium wall, no complicated setup. The Quick Capture sheet matters most here: one field, minimal taps, for someone who can't handle a longer form on a hard day.

**Marketing angle:** never pair David's story with streaks or Rhythm Score language — for him, the value is entirely in how little the screen asks of him.

### Ned — "The Pink Cloud" (Day 30–90, Narcotics Anonymous)
> *"I'm going to crush it today!"*

Tasks is Ned's daily engagement engine — the place he checks off his morning pledge and habits. The Rhythm Score's forgiving math is built specifically for his Day 90 window, when a punishing streak break would be the worst possible moment for the app to feel like it's failing him.

**Marketing angle:** momentum without the trapdoor — built for exactly the moment most habit apps let someone down.

### Lisa — "The Service Superstar" (7 years, Alcoholics Anonymous, sponsors 3–6 women)
> *"I have five sponsees and a full-time job. I need to stay organized so I don't burn out."*

Not a primary story here — her persona documentation doesn't call out Tasks specifically. If a use case is needed, it's her own personal habits (self-care reminders, her own program), not anything Tasks does uniquely for her role as a sponsor.

### Walt — "The Zen Master" (35+ years, AA-origin, now Recovery Dharma)
> *"Recovery is a lifelong practice of mindfulness and reflection."*

Walt's persona rules are explicit that gamification shouldn't sit in his primary flows — Tasks, with its Rhythm ring and momentum framing, isn't really his screen. His story belongs to Journal and Insights, not here.

### Maya — "The Systematiser" (6–18 months, SMART Recovery / secular / CBT)
> *"I want to understand the mechanics of my brain so I can upgrade my operating system."*

Maya uses Tasks as the execution layer for what her journaling and AI analysis surface — a pattern she spots becomes a concrete, dated action, not just an insight she reads and forgets. The traceable "why was this suggested" link on AI-sourced tasks matters to her specifically, since she won't act on something she can't trace back to real evidence.

**Marketing angle:** where insight turns into action — and you can always see why.

### Jordan — "The Stabiliser" (Day 1–12mo+, MAT/Buprenorphine or Naltrexone + MARA/SMART)
> *"My recovery combines medicine and behavior. I need tools that support my physical stability without judgment."*

**Handle carefully, verified gap:** Jordan's persona documentation calls for dedicated, discreet medication-adherence tracking (single-tap dose logging, lock-screen-safe reminders). That specific feature doesn't exist in Tasks today — checked directly, there's no dose-tracking UI or MAT-specific handling anywhere in the code. A free-text recurring task *can* be repurposed for a personal daily routine, worded however the user chooses, but that's general-purpose flexibility, not a built feature — and **task content isn't end-to-end encrypted the way Journal entries are** (by design, so streak logic can run), so it's not the natural place to promise discretion for anything sensitive.

**Marketing angle:** don't build Jordan-specific Tasks copy around medication tracking — that promise isn't backed by the product today. If Jordan needs a mention here at all, keep it to the same general non-judgmental, flexible task system every persona gets.

---

## How Tasks connects to the rest of MRT

- **The Tasks tile lives on the Dashboard** — one tap from the home screen (see `docs/marketing/dashboard.md`).
- **AI Pattern Analysis (Journal) and Insights Log can both create tasks directly** — an insight becomes an action item without leaving the flow that generated it.
- **Tasks feeds nothing back into Journal or Insights** — it's a one-way handoff (insight → task), not a two-way sync; completing a task doesn't itself generate a journal entry or insight.

---

## Brand voice & marketing guardrails

Everything from `docs/marketing/journal.md`'s guardrails applies here too. Tasks-specific additions:

- **Automatic/silent streak protection (Smart Reset) is now safe to claim** — fixed and live as of 2026-09-03 (`TD-25`). It joins the Forgiveness Tap (an explicit user choice) and the Rhythm Score's forgiving math as verified anti-punishment mechanics. "The app looks out for you overnight" is now an accurate claim, not background-magic overclaiming.
- **Don't market Tasks as a private, encrypted space.** Unlike Journal, task content is stored unencrypted (a deliberate tradeoff so streak/habit logic can run). Copy shouldn't imply the same "not even we can read it" promise applies here.
- **Don't promise medication/dose-tracking for Jordan.** That's a documented persona need, not a shipped Tasks feature — see Jordan's section above.
- **Streak language is fine; failure language is not.** "Momentum," "rhythm," "consistency" are all accurate. "Don't break your streak," "you failed today," or any framing of a missed day as a loss is off-brand and inaccurate to how the feature actually behaves.

---

## Quick reference: personas at a glance

| Persona | Stage | Path | Tasks' job for them |
|---|---|---|---|
| David | Day 1–30 | CA | Free, frictionless, minimal-effort capture |
| Ned | Day 30–90 | NA | Daily momentum with forgiving math, built for his Day 90 risk window |
| Lisa | 7 years | AA | Not a primary story here |
| Walt | 35+ years | AA → Recovery Dharma | Not his primary screen — no gamification in his flow |
| Maya | 6–18 months | SMART/CBT/secular | Where AI-spotted patterns become traceable, concrete actions |
| Jordan | Day 1–12mo+ | MAT + MARA/SMART | General-purpose only — dose-tracking isn't a built feature |
