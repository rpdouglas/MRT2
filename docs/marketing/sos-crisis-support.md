# My SOS / Crisis Support — Marketing & Persona Brief

**What this document is for:** briefing material for an LLM writing marketing copy about MRT's SOS / Crisis Support feature — the always-on emergency access point built into every screen of the app. Grounded in the real, verified product. **This is the most sensitive marketing surface in the whole series** — read the guardrails section closely, and see the note at the end about human review before anything generated from this brief ships.

Bonus brief, added after a full-app review found this feature had no documentation at all (technical or marketing) despite being one of the most important in the product — it isn't tied to a route, so it fell outside the original per-screen sweep. Built on `docs/screens/sos-modal.md`, written and verified against live source in the same pass as this brief.

---

## The one-sentence pitch

**One button, on every screen, that gets you a real person or a real tool in seconds — no PIN, no menu, no waiting.**

---

## Why this matters in recovery

- **Friction is dangerous in a crisis.** A safety feature that takes multiple steps, a login, or a menu to reach is a safety feature that won't get used in the moment it matters most. This one is designed around that fact directly — reachable in one tap, from anywhere, without unlocking anything first.
- **Real emergency resources come first, not MRT's own tools.** 988 (the US Suicide & Crisis Lifeline) and 911 sit right alongside sponsor contact — this app is honest that it's a companion, not a replacement for real emergency care.
- **Different people need different doors in a crisis.** Some people need to talk to someone. Some need to move their body. Some need to write it down. Some need a meeting. This screen offers all of them at once, instead of forcing one "correct" response.

**Marketing framing:** "always there, one tap away" — calm reassurance, never alarm. This is a safety net, not a warning siren.

---

## What it actually does

- **Always reachable, two ways** — a small button lives on every screen of the app, plus another in the page header most screens show. Both open the same instant menu.
- **Works even if the vault is locked.** This is a deliberate design choice, not an accident: crisis access was never going to be gated behind a PIN.
- **Sponsor Connect** — one tap to call, or one tap to message on WhatsApp, addressed by name if it's been added.
- **988 and 911, always visible.** Never buried, never secondary.
- **Choose your own path** — Urge Surfer (a guided grounding technique) or Craving Buster (a short breathing-rhythm game): two different ways to ride out an urge, whichever fits the moment.
- **A calming breathing exercise** — the same somatic tool available in Vitality, one tap away.
- **A place to write it out** — opens directly into a private journal entry, already set up for the moment.
- **A real meeting, right now** — direct links to meeting finders for AA, NA, SMART Recovery, Recovery Dharma, and Women for Sobriety.

---

## How each persona uses this

MRT designs around six real recovery personas (full detail in `docs/PERSONAS.md`). This feature is unusual in the series: it isn't "one persona's flavor of a shared feature" — it exists specifically because of one persona's worst-case moment, and stays available to everyone else as a genuine safety net.

### David — "The Survivor" (Day 1–30, Cocaine Anonymous)
> *"I just need the noise to stop right now."*

This feature *is* David's worst-case design floor, made real. Every choice on this screen — no PIN required, one tap to open, multiple paths that don't demand the same kind of effort — is built around his 2 AM moment specifically.

**Marketing angle:** the whole reason this exists. Lead with him, honestly.

### Walt — "The Zen Master" (35+ years, AA-origin, now Recovery Dharma)
> *"Recovery is a lifelong practice of mindfulness and reflection."*

Per his own persona documentation, this screen isn't built for Walt — his rare hard days call for the Journal, not a crisis intervention tool. Don't force a story here for him.

### Ned, Lisa, Maya, Jordan
No dedicated design story for any of these four — but that's the point of a safety net: it's there if any of them ever need it, without being a defining feature of their day-to-day use of the app. Don't invent a persona-specific angle for this screen beyond "it's there if you need it."

---

## How this connects to the rest of MRT

- **One screen, four different tools, one tap each** — Urge Surfer (Tools), Craving Buster (Recovery Games), the breathing exercise (Vitality), and a pre-set journal entry (Journal) are all reachable directly from here.
- **Sponsor contact set in Profile powers this directly** — add it once, and it's available the moment it's needed.

---

## Brand voice & marketing guardrails — read carefully, this section matters more than usual

Everything from `docs/marketing/journal.md`'s guardrails applies here too, plus these, specific to crisis content:

- **988 and 911 must always read as the real, primary resource — never visually or tonally secondary to anything MRT built.** This app is a peer-support companion, not a clinical or emergency service, and copy must never blur that line.
- **Never imply MRT's own tools are a substitute for calling 988 or 911 in a real emergency.** Frame them as "while you decide" or "alongside real help," never "instead of."
- **Never claim this feature detects, predicts, or prevents a crisis.** It's a fast door to help that already exists — not a monitoring or intervention system, and it shouldn't be marketed as one.
- **Don't imply Sponsor Connect works automatically or connects someone to a stranger/counselor.** It only works if the user has already added their own sponsor's contact information — it's a fast path to someone they already know, not a hotline to a new person.
- **Never use fear-based or alarming language to market this.** No "in case you're about to relapse," no crisis-baiting copy. The right tone is calm reassurance: "always there," "one tap away," never urgency-manufacturing.
- **Don't claim a dedicated clinician or medical-emergency contact feature.** What exists is sponsor contact plus 988/911 — there's no separate clinician-shortcut mechanism, for Jordan or anyone else.

**Recommend a human review pass — not just this brief — on any copy generated from it before it ships.** Crisis-adjacent marketing carries real risk if a single line reads wrong; this is worth more scrutiny than any other feature in the series.

---

## Quick reference: personas at a glance

| Persona | Stage | Path | This feature's job for them |
|---|---|---|---|
| David | Day 1–30 | CA | The reason this feature exists |
| Ned | Day 30–90 | NA | A safety net, not a defining feature |
| Lisa | 7 years | AA | A safety net, not a defining feature |
| Walt | 35+ years | AA → Recovery Dharma | Not built for him — his hard days go to Journal |
| Maya | 6–18 months | SMART/CBT/secular | A safety net, not a defining feature |
| Jordan | Day 1–12mo+ | MAT + MARA/SMART | A safety net, not a defining feature — no dedicated clinician-contact option |
