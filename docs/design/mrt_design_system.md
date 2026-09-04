# MRT Design System

## Momentum Kinetic v3.0

**My Recovery Toolkit — Complete Design System Specification**

---

> ## ⚠️ Status: Future-Vision Document — Not the Current Design System
>
> **This is not what MRT looks like today, and nothing below should be treated as implemented.** The app's actual, currently-enforced design system is **"Vibrant Momentum"** — documented in full at `docs/design/vibrant_momentum.md` (or as a terse checklist at `.claude/skills/design/SKILL.md`) — a different name, a different color architecture (per-module Tailwind gradients driven by `src/lib/theme.ts`/`src/lib/heroColors.ts`), and different persona coverage. When in doubt about what to build, use that document, not this one.
>
> A 2026-09 audit (prompted by this doc missing 2 of the app's 6 current personas — Lisa and Jordan) confirmed none of this document's headline architecture exists in code:
> - No `somatic-action-*`/`analytical-insight-*` CSS tokens anywhere in `src/` — `tailwind.config.js` extends one unrelated `blue` scale only.
> - None of the three documented fonts (DM Sans, JetBrains Mono, Playfair Display) are loaded anywhere.
> - The "Recovery State Rendering Engine" (Section VI) — this doc's own headline differentiator — is `docs/projects/45_ADAPTIVE_PERSONA_UI.md` (PROJ-45), which is explicitly **PARKED**, gated behind a feature flag that defaults `false`, with no code written and its own companion prototype files (`mrt_adaptive_ui.jsx`, `mrt_brand_review.jsx`) absent from the repo.
> - This doc's own companion sample file, `mrt_design_samples.jsx`, doesn't even use the tokens specified below — it hardcodes a different, incompatible five-module palette.
> - The Persona Architecture (Section I) and every persona-scoped table below (Recovery State Rendering Engine, AI Verbosity Limits) cover only David, Ned, Walt, and Maya — **Lisa and Jordan are entirely absent**, and would need real design work (not a mechanical table edit) before this doc could be treated as current.
>
> **Treat this as a north-star/pitch artifact** — useful for the conceptual framing (persona-as-state, empty-state psychology, AI confidence visualization, trust ritual design) if MRT ever revives PROJ-45 — not as a working reference for what to build this week. See `.claude/skills/design/SKILL.md` for that.

---

**Document Status:** Future-Vision — Not Implemented (see banner above)
**Classification:** Internal Design & Engineering Reference
**Replaces:** Momentum Kinetic v2.0
**Review Cadence:** Quarterly, or upon PROJ-45 reactivation

---

# Foreword: From UI to Behavioral Architecture

This document graduates MRT from a visual style guide into something rarer: a behavioral interface architecture.

Recovery is not a static destination. It is a fluctuating, non-linear human process — sometimes triumphant, sometimes desperate, always courageous. Every pixel, every motion curve, every interaction pattern in this system must honor that truth.

The competitive landscape — Loosid, WEconnect, I Am Sober, Reframe, Sober Grid — largely treats design as decoration on top of features. MRT's differentiation is not a prettier gradient. It is that the interface itself responds to the user's emotional state.

The UI breathes, slows, simplifies, energizes, or stabilizes depending on where the user is in their recovery arc.

This is what makes MRT category-defining.

---

# Core Philosophy

Recovery is a dynamic, forward-moving process. The interface must be a living companion — not a static tool — that meets users exactly where they are, without judgment, and guides them forward with quiet intelligence.

Three pillars govern every design decision:

* **Somatic Safety First** — The nervous system comes before aesthetics. No design choice should spike anxiety, induce shame, or create cognitive overload during vulnerable states.
* **Adaptive Presence** — The interface modulates its own visual density, motion intensity, and information hierarchy based on the user's detected or self-reported emotional state.
* **Earned Trust** — Every privacy interaction, every AI output, every community touchpoint must reinforce — not assume — the user's trust.

---

# I. Persona Architecture

The following four personas drive all adaptive rendering decisions. They are not demographic segments — they are recovery states that any user may inhabit at different times.

| Persona   | State Needs                                                   | Design Voice                                                               |
| --------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **David** | Active craving, relapse risk, emotional flooding              | Fewer choices, larger targets, calming presence, immediate grounding tools |
| **Ned**   | Strong engagement, active streak, high task completion        | Celebration, visible progress, energy, forward motion                      |
| **Walt**  | Journaling, nightly review, long-term sobriety, contemplative | Space, quiet, narrative, depth, retrospection                              |
| **Maya**  | Workbook, data analysis, clinical integration, pattern study  | Precision, density, structure, evidence                                    |

---

# II. Typography Hierarchy

Typography separates emotional narrative from hard data. Every type choice signals context to the user's nervous system before they consciously read the words.

## Primary Font — Prose & Emotional UI

**Font:** DM Sans
**Fallback:** `system-ui, -apple-system, sans-serif`

### Usage

* Navigation
* Journal entries
* Educational content
* Button labels
* Emotional copy
* Onboarding

### Weight Range

* 300 Light (ambient states)
* 400 Regular (body)
* 500 Medium (UI)
* 600 SemiBold (emphasis)

### Psychology

DM Sans carries warmth and approachability with a humanist character. It feels like a trusted friend who is also competent.

---

## Secondary Font — Data & Analytics

**Font:** JetBrains Mono
**Fallback:** `Fira Code, SF Mono, monospace`

### Usage

* Sobriety counters
* Streak numbers
* Rhythm scores
* Chart axes
* Timestamps
* Vault confirmation codes

### Psychology

Instantly signals objective measurement. When users see mono type, they know they are looking at verified, mathematical progress — not interpretation.

---

## Tertiary Font — Milestone & Celebration

**Font:** Playfair Display

### Usage

* Milestone achievement banners
* Major streak celebrations
* Onboarding welcome moments

### Psychology

Introduces a sense of occasion. Milestones deserve to feel different from daily tasks.

---

## Type Scale

| Role           | Font             | Size | Weight | Line Height | Notes                      |
| -------------- | ---------------- | ---- | ------ | ----------- | -------------------------- |
| Display / Hero | DM Sans          | 40px | 300    | 1.1         | Emotional anchor           |
| H1 Page Title  | DM Sans          | 28px | 600    | 1.2         | Primary navigation context |
| Body Copy      | DM Sans          | 16px | 400    | 1.6         | All prose content          |
| Data Primary   | JetBrains Mono   | 32px | 400    | 1.0         | Streak counter, key metric |
| Data Label     | JetBrains Mono   | 12px | 400    | 1.2         | Chart axes, timestamps     |
| Milestone      | Playfair Display | 36px | 700    | 1.1         | Celebratory moments only   |

---

# III. The Kinetic Color System

Token naming convention follows semantic structure — never raw hex values in component code:

```
[layer]-[role]-[modifier]
```

Example:

```
somatic-action-primary
analytical-insight-secondary
```

---

## A. Somatic Action Layer

**Purpose:** Daily tasks, grounding exercises, breathwork, active momentum, primary CTAs

| Token                  | Hex                       | Tailwind | Usage                                        |
| ---------------------- | ------------------------- | -------- | -------------------------------------------- |
| somatic-action-primary | #06B6D4                   | cyan-500 | Primary CTA, swipe-to-complete, task buttons |
| somatic-action-peak    | #14B8A6                   | teal-500 | Gradient endpoint, breathwork pacer ring     |
| somatic-action-muted   | #CFFAFE                   | cyan-100 | Subtle backgrounds, selected state fills     |
| somatic-gradient       | from-cyan-500 to-teal-500 | —        | Primary gradient, always left-to-right       |

---

## B. Analytical Insight Layer

**Purpose:** AI generation, Vault security, macro-data charts, pattern insights, deep analytics

| Token                      | Hex                           | Tailwind   | Usage                                          |
| -------------------------- | ----------------------------- | ---------- | ---------------------------------------------- |
| analytical-insight-primary | #C084FC                       | purple-400 | AI response bubbles, insight cards             |
| analytical-insight-peak    | #8B5CF6                       | violet-500 | Chart fills, Vault accent, gradient endpoint   |
| analytical-insight-muted   | #EDE9FE                       | violet-100 | Subtle AI backgrounds, pattern highlights      |
| analytical-gradient        | from-purple-400 to-violet-500 | —          | AI outputs, Vault interactions, insight charts |

---

## C. Semantic State Colors

| Token             | Hex     | Purpose                                            |
| ----------------- | ------- | -------------------------------------------------- |
| state-milestone   | #F59E0B | Streak celebrations, achievements                  |
| state-neutral     | #94A3B8 | Missed tasks, failure states                       |
| state-risk-gentle | #FB923C | Gentle risk pattern alerts                         |
| state-grounding   | #6EE7B7 | Stabilization mode accents, breathwork completions |

### Critical Color Rules

* No red for failure states
* No stark black backgrounds
* Amber for celebration only

---

# IV. Data Visualization Rules

## A. Chart Styling Standards

* Kinetic Lines — Data paths use Analytical gradient
* Translucent Fills — Area charts drop from 15% opacity to 0%
* Micro-Markers — Replace heavy circular dots with horizontal ticks
* The Grid — Max 5% opacity in dark mode, 8% in light mode
* No Volatile Axes — Y-axes must not auto-scale to recent values

---

## B. Compassionate Trend Visualization

* Smooth curves over jagged lines
* Rolling averages preferred
* Never surface single data points prominently
* Long-term view default
* Progress narrative over raw numbers

---

## C. Temporal Visualization Standards

| View       | Default Window | Chart Type                    | Tone              |
| ---------- | -------------- | ----------------------------- | ----------------- |
| Today      | 24 hours       | Single metric hero            | Immediate, warm   |
| This Week  | 7 days         | Bar + average line            | Pattern-aware     |
| This Month | 30 days        | Smooth area chart             | Reflective        |
| 90 Days    | 90 days        | Area + milestone annotations  | Calm              |
| All Time   | Full history   | Gradient-filled horizon chart | Narrative journey |

---

# V. Component Physics & Motion

Motion in MRT communicates emotional intelligence. It is never decorative.

## Motion Vocabulary by State

| Motion Type        | Duration      | Easing           | Use Case          |
| ------------------ | ------------- | ---------------- | ----------------- |
| Micro-confirm      | 120ms         | ease-out         | Button press      |
| Hover lift         | 200ms         | ease-out         | Card hover        |
| Page transition    | 250ms         | ease-out         | Route changes     |
| Modal entrance     | 300ms         | spring(1,80,12)  | Dialog appearance |
| Celebration pulse  | 600ms × 3     | ease-in-out loop | Milestones        |
| AI response reveal | 400ms stagger | ease-out         | Token fade-in     |
| Stabilization fade | 500ms         | ease-in-out      | David mode        |

### Accessibility Rule

`prefers-reduced-motion` must always be respected.

---

# VI. Recovery State Rendering Engine

This is MRT's core differentiation.

States can be triggered by:

* User self-report
* AI pattern detection
* Time of day
* Journal content
* Manual selection

---

## A. Stabilization State — David Mode

Activated during:

* Craving
* Relapse risk
* Panic
* Emotional flooding

### Rules

* Collapse navigation to 2 items maximum
* Suppress charts and analytics
* Enlarge touch targets by 40%
* Single-action focus per screen
* Disable decorative motion
* Surface breathwork pacer
* AI tone: grounding and directive
* Increase body text to 18px
* Remove streak counters

---

## B. Momentum State — Ned Mode

Activated during:

* Strong engagement
* Active streaks
* Milestone proximity

### Rules

* Full kinetic gradients
* Celebratory motion
* Prominent streak counters
* Progress-forward language
* AI tone: affirming and energetic

---

## C. Reflection State — Walt Mode

Activated during:

* Journaling
* Long-term sobriety
* Nightly reflection

### Rules

* Reduce saturation 25%
* Increase whitespace 40%
* Ambient motion only
* Distraction-free journaling
* Reflective AI tone
* Suppress notification badges

---

## D. Analytical State — Maya Mode

Activated during:

* Workbook completion
* Pattern analysis
* Clinical integration

### Rules

* Higher information density
* Chart-first layouts
* Mono font for numbers
* Structured AI outputs
* Export actions prioritized

---

# VII. AI Interaction Standards

The AI layer is part of the UX.

---

## A. AI Confidence Visualization

| AI Output Type        | Background   | Border Style | Icon | Context         |
| --------------------- | ------------ | ------------ | ---- | --------------- |
| Reflection            | Muted cyan   | Solid        | ○    | Mirroring       |
| Pattern insight       | Violet tint  | Solid        | ◇    | Trends          |
| Behavioral suggestion | Amber accent | Solid        | →    | Coping strategy |
| Uncertain inference   | Neutral gray | Dashed       | ~    | Low-confidence  |
| Crisis detection      | Risk orange  | Pulsing      | ⚠    | Crisis language |

### Dashed Border Rule

Low-confidence outputs must use dashed borders.

---

## B. AI Verbosity Limits

| Persona | Min Words | Max Words | Tone Constraints |
| ------- | --------- | --------- | ---------------- |
| David   | 10        | 30        | Grounding        |
| Ned     | 30        | 80        | Affirming        |
| Walt    | 30        | Unlimited | Reflective       |
| Maya    | 50        | 300       | Structured       |

### Universal AI Constraints

* Never use shame-adjacent language
* Never make diagnoses
* Never create false urgency
* Always offer an exit
* Model uncertainty honestly

---

# VIII. Trust & Privacy Ritual Design

The Zero-Knowledge Vault must feel sacred.

---

## A. Vault Entry Ritual

When entering Vault-protected areas:

* Slow transitions to 500ms
* Heavy haptic impact
* Lock animation
* Darken interface 10%
* Remove distractions
* Persistent encryption confirmation
* Silence AI prompts

---

## B. Trust Escalation Language

| Event                   | Copy                                   | Visual Treatment      |
| ----------------------- | -------------------------------------- | --------------------- |
| Share request           | "This will leave your device."         | Amber border          |
| Export                  | "A copy of your data will be created." | Neutral               |
| Clinical partner view   | Explicit field disclosure              | Confirmation required |
| Third-party integration | Full disclosure                        | Full-screen modal     |

---

# IX. Empty & Failure State Psychology

No blank dashboard states.

---

## A. Empty State Copy Examples

| Context            | Avoid                       | Preferred                                         |
| ------------------ | --------------------------- | ------------------------------------------------- |
| No journal entries | "No journal entries found." | "Every journey starts with a first reflection."   |
| Empty dashboard    | "No activity tracked."      | "This is your space."                             |
| Missed check-in    | "You missed your check-in." | "Yesterday is behind you."                        |
| No community posts | "Nothing to show here."     | "The community is here when you want to connect." |

---

## B. Recovery Reentry States

After 14+ days away:

* No broken streak shown
* No guilt copy
* Warm reentry language
* Streak resurfaces after 7 days of re-engagement

---

# X. Notification & Attention Architecture

MRT is a recovery tool, not an engagement platform.

---

## The Non-Manipulation Commitment

MRT does not use:

* Artificial scarcity
* Social pressure
* Loss-framed reminders
* Dopamine-trigger badge systems

---

## Notification Severity Levels

| Type           | Delivery          | Timing          | Tone         |
| -------------- | ----------------- | --------------- | ------------ |
| Grounding      | Silent push       | User-defined    | Gentle       |
| Milestone      | Full notification | Real-time       | Celebratory  |
| Risk pattern   | Silent push       | Never overnight | Calm         |
| Accountability | Standard push     | User-configured | Neutral      |
| Clinical alert | In-app only       | Clinical hours  | Professional |

---

# XI. Accessibility & Neurodivergence Standards

---

## A. WCAG 2.1 AA Baseline

* Contrast minimum 4.5:1
* Full keyboard navigation
* Visible focus states
* Screen reader semantics
* 44px touch targets minimum

---

## B. Cognitive Load Modes

### Minimal Mode

* Hide analytics
* Remove decorative motion
* Simplify navigation

### Focus Mode

* One task per screen
* Remove secondary actions

### Grounding Mode

* 18px body minimum
* Slow pulse animations
* Reduced contrast spikes

---

## C. Motion Sensitivity Controls

| Motion Element         | Reduced Motion Behavior |
| ---------------------- | ----------------------- |
| Page transitions       | Instant                 |
| Celebration animations | Static                  |
| AI loading pulse       | Static                  |
| Breathwork pacer       | Numeric timer           |
| Hover lifts            | Color change only       |

### Accessibility Rule

Never communicate status through color alone.

---

# XII. Community Emotional Safety Patterns

Recovery communities are fragile.

---

## A. Identity & Privacy Defaults

* Pseudonyms by default
* City-level location only
* Full profile visibility controls

---

## B. Content Safety Patterns

* Sensitive content collapsible
* Compassionate relapse handling
* Clear sponsor/sponsee boundaries

---

## C. Escalation Visual Language

| Signal                 | Treatment           | Action           |
| ---------------------- | ------------------- | ---------------- |
| Crisis language        | Orange border       | Crisis resources |
| Member absent 30+ days | No public indicator | Private outreach |
| Peer request for help  | Reach out card      | Support tools    |

---

# XIII. Clinical & Consumer Boundary Design

---

## A. Consumer UI

* Vibrant gradients
* Emotional language
* Adaptive rendering
* Community-forward
* Celebration-focused

---

## B. Clinical Partner UI

* Restrained palette
* Grid-first layouts
* Outcome metrics
* Audit-friendly exports
* Default anonymization
* No celebration animations

---

# XIV. Design Token Governance

---

## A. Naming Convention

```
[semantic-layer]-[role]-[modifier]
```

Examples:

```
somatic-action-primary
analytical-insight-secondary
canvas-background-elevated
```

### Never Use Raw Values

```
❌ color: #06B6D4;
✅ color: var(--somatic-action-primary);
```

---

## B. Token Hierarchy

### Tier 1 — Primitive Tokens

```
--color-cyan-500: #06B6D4;
```

### Tier 2 — Semantic Tokens

```
--somatic-action-primary: var(--color-cyan-500);
```

### Tier 3 — Component Tokens

```
--btn-primary-background: var(--somatic-action-primary);
```

---

## C. Deprecation Policy

* 2-sprint warning minimum
* Console warnings in development
* Search-and-replace audit required
* Changelog entry mandatory

---

# XV. Adaptive Recovery Rendering Engine (ARRE)

ARRE translates user state signals into real-time UI behavior.

---

## A. State Detection Inputs

| Signal Source        | Weight  | Examples             |
| -------------------- | ------- | -------------------- |
| User self-report     | Highest | "I'm struggling"     |
| Journal sentiment    | High    | Negative language    |
| Check-in response    | High    | Difficult day rating |
| Time of day          | Medium  | 2am weighting        |
| AI pattern detection | Medium  | Missed check-ins     |
| Streak status        | Low     | Day 1 vs Day 100     |

---

## B. State Transition Rules

* Never abrupt
* David state has highest priority
* Persists between sessions
* User overrides AI
* States are invisible to user
* Fallback defaults to Ned

---

## C. ARRE Technical Requirements

* State stored client-side first
* Analytics anonymized and opt-in
* Under 100ms UI update latency

---

# XVI. System Maturity Assessment

| Dimension                       | v2.0     | v3.0 Target | Status         |
| ------------------------------- | -------- | ----------- | -------------- |
| Psychological Sophistication    | 9.8      | 9.9         | Refined        |
| Brand-System Alignment          | 9.7      | 9.9         | Refined        |
| Recovery-Aware UX Intelligence  | 8.0      | 9.5         | Major addition |
| Adaptive Runtime Architecture   | N/A      | 9.0         | New            |
| Accessibility & Neurodivergence | N/A      | 9.0         | New            |
| AI Interface Psychology         | N/A      | 9.2         | New            |
| Trust & Privacy Ritual Design   | Implicit | 9.5         | Formalized     |
| Empty & Failure Psychology      | N/A      | 9.0         | New            |
| Notification Ethics             | N/A      | 9.0         | New            |
| Community Emotional Safety      | N/A      | 9.0         | New            |
| Clinical/Consumer Boundary      | N/A      | 9.0         | New            |
| Token Governance                | N/A      | 8.5         | New            |
| Longitudinal Data Philosophy    | N/A      | 9.0         | New            |

---

# Closing Principle

The most advanced recovery app is not the one with the most features.

It is the one that understands that every user who opens it is doing something extraordinarily brave.

Design accordingly.

Every screen is a handshake. Every interaction is a promise kept. The interface should never betray the courage it took to open the app.

---

**MRT Design System v3.0 — Momentum Kinetic**
**Review Cadence:** Quarterly or upon major persona research updates
