> Formalized by `docs/projects/79_DAILY_CROSSWORD.md` (PROJ-79, shipped). Kept as the as-built origin draft, same treatment as `docs/projects/archive/27_SMART_TOOLS.md`.

# SPEC-CROSSWORD-001: Daily Recovery Crossword

**Status:** Draft
**Owner:** Ryan Douglas
**Module:** MRT2 — Recovery Games
**Design System Reference:** MRT Design System, Momentum Kinetic v3.0
**Inputs:** Internal gap analysis review (2026-07-26)
**Last Updated:** 2026-07-26

---

## 1. Overview

A single daily crossword puzzle, AI-generated each night, themed around a rotating recovery/wellness concept (e.g. Boundaries, Gratitude, Mindfulness). One puzzle exists per calendar date, shared by all users — no per-user or per-modality variation.

This is the 8th entry in the Recovery Games set, filling a gap none of the existing seven games cover: low-stakes, solo, vocabulary/reflection-based engagement with recovery concepts, playable in a couple of minutes with zero time pressure.

## 2. Goals

- Give users a daily, low-friction touchpoint that reinforces recovery vocabulary and concepts
- Zero AI cost at runtime — all generation happens offline, ahead of time
- Fully automated content pipeline; no daily human authoring required
- Consistent with MRT's non-manipulation and anti-shame design commitments (no streaks, no scores, no wrong-answer penalty)
- Leave the user with one small, memorable recovery concept per session — the puzzle is the vehicle, not the point

## 3. Non-Goals

- Not modality-linked (does not pull from daily readings across the 7+ reading modalities)
- Not competitive or social — no leaderboard, no sharing of results
- Not a difficulty-adaptive or personalized puzzle; every user sees the same puzzle on a given date

## 4. Content Pipeline

### 4.1 Generation cadence

- **Nightly batch job**, run several hours ahead of day rollover, via the Batch API (not time-sensitive, ~50% cheaper than standard calls)
- **One AI call per day**, generating the following day's puzzle content
- Output is cached permanently, keyed by `calendar_date` — no regeneration once generated

### 4.2 Repetition guards

The generation call receives, as input constraints:
- A rolling log of **words used in the last 30–60 days**, to exclude from selection
- A rolling log of **themes used recently**, so the theme pool doesn't repeat back-to-back or within a short window

**Theme pool sizing**: launch with a substantially larger pool than the original 3 examples — target 80–120+ themes (e.g. Acceptance, Honesty, Humility, Surrender, Hope, HALT, Relapse Prevention, Service, Resilience, Forgiveness, Self-Compassion, Routine, Sleep, Connection, Vulnerability, Purpose, and similar). A pool this size makes the recency-exclusion window trivial to satisfy without ever feeling repetitive, and gives room for themed rotations (see §9) later without new engineering work.

### 4.3 Model call responsibilities

The AI call is responsible only for **content selection and clue writing** — never grid layout (see 4.5).

**Input:**
- Theme pool (minus recently used themes)
- Recently-used word exclusion list

**Output (structured JSON):** see §4.6 for schema.

### 4.4 Model tier & generation stages

Two-stage generation, both stages still part of the same offline nightly batch (not two separate runtime costs):

1. **Word selection stage** (cheap tier): picks 10–12 candidate words against the theme, exclusion lists, and an internal difficulty mix (see below), with direct/dictionary-style clues attached
2. **Clue polish stage** (cheap tier by default, escalate only if needed): rewrites the 2–3 themed clues for tone/quality, and assigns each word a `clue_style` (see §4.6)

Escalate to a stronger model only for the polish stage, and only if the cheap tier's output is inconsistent — start with the cheap tier as the baseline assumption for both stages, not a fallback-first design.

**Internal difficulty mix** (not surfaced in UI — see §6 open question on this): the word-selection stage should intentionally mix easy, mid, and advanced-vocabulary words within each puzzle (e.g. CARE/HOPE/REST vs. BOUNDARY/COURAGE vs. AMBIVALENCE/ACCOUNTABILITY) so puzzles feel solvable throughout rather than uniformly easy or uniformly hard. This is a generation-quality constraint, not a user-facing difficulty label.

### 4.5 Grid layout

- Handled by a **non-AI, deterministic crossword-layout library** (constraint-based word interlocking)
- The AI never computes grid coordinates — LLMs are unreliable at exact letter-overlap math, and this step is a solved problem outside of AI
- Layout is **asymmetric** (not NYT-style rotationally symmetric) — appropriate for a casual daily companion puzzle, and dramatically simpler to auto-generate reliably
- Target size: 8–10 answers, grid roughly 8×8 to 11×11 depending on longest word

### 4.6 Output JSON schema (draft)

```json
{
  "date": "2026-07-27",
  "theme": "Boundaries",
  "theme_intro": "Today's puzzle explores boundaries.",
  "generator_version": "1.2.0",
  "prompt_version": "3",
  "words": [
    {
      "answer": "SPACE",
      "clue": "Where boundaries create room to breathe",
      "clue_style": "reflective",
      "hint": "What a healthy limit protects room for.",
      "themed": true,
      "difficulty": "mid"
    },
    {
      "answer": "ARM",
      "clue": "Limb, or a support you lean on",
      "clue_style": "dictionary",
      "hint": null,
      "themed": false,
      "difficulty": "easy"
    }
  ],
  "insight_card": {
    "text": "Healthy boundaries protect recovery — not by pushing people away, but by making room for what matters.",
    "framework_tags": ["ACT", "12-Step"]
  }
}
```

- `words`: 8–10 entries, over-generated slightly (10–12 candidates) upstream of layout so the layout step can drop any that fail to interlock well
- `themed: true` flags the 2–3 words whose clue should lean into the day's theme language rather than a flat dictionary definition
- `clue_style`: one of `dictionary` / `recovery` / `reflective` / `metaphor` — light variety guard so clue tone doesn't feel flat across a puzzle or repetitive across days
- `hint`: optional gentle-hint text, distinct from the clue itself, surfaced only if the user asks for a hint rather than a straight letter reveal (see §5.4)
- `difficulty`: `easy` / `mid` / `advanced` — internal only, drives generation mix, never rendered in UI
- `insight_card`: single short reflection (1–2 sentences) tied to the theme, generated offline alongside the puzzle at zero runtime cost — see §5.6 for UI treatment
- `framework_tags`: internal metadata only (e.g. CBT, ACT, DBT, 12-Step, Motivational Interviewing) — lets the theme pool stay balanced across recovery frameworks over time without ever surfacing the framework name to the user
- `generator_version` / `prompt_version`: stored for reproducibility and rollback if a batch of puzzles needs regenerating after a prompt change
- Post-layout, a second object (grid coordinates, numbering, across/down direction) is attached by the layout library, not the AI

### 4.7 QC

- Since this is one puzzle/day (not per-modality), a **daily spot-check is feasible** rather than a sampled review
- No mandatory human sign-off required before publish (confirmed: recovery-content cultural review process applies to the Pawn Shop brand only, not MRT)

### 4.8 Storage

- Key: `calendar_date`
- One record per date, generated once, served to all users from that point forward
- No per-user, per-modality, or per-session variation

### 4.9 Word validation

Automated post-generation checks before a puzzle is cached, in addition to the layout step:
- No obscure abbreviations or common crossword-filler words ("crosswordese" — e.g. ETUI, OAST, ERNE) that add solving friction without adding recovery value
- No duplicate clue wording within the same puzzle
- Spelling and basic readability check on all clue text
- Anything flagged fails the batch entry and falls back to on-demand regeneration for that date (rare, since this runs offline ahead of need)

### 4.10 Analytics

Aggregate, anonymized, opt-in only — consistent with the design system's ARRE requirement that analytics be anonymized and opt-in. Useful signals for improving generation quality over time:
- Completion rate, average solve time, reveal/hint usage rate, theme popularity
- Which clues get revealed most often (signals a clue is too obscure or ambiguous)

**Guardrail**: these metrics are for tuning the content pipeline only. None of this data is ever surfaced back to an individual user or used to personalize, nudge, or re-engage them (e.g. no "you abandoned yesterday's puzzle" messaging) — that would conflict directly with the Non-Manipulation Commitment.

## 5. UI/UX Specification

Built against **MRT Design System v3.0 (Momentum Kinetic)** tokens. See attached reference mockup: `DailyCrossword.jsx`.

### 5.1 Layer assignment

Crossword is classified under the **Somatic Action layer** (daily tasks / active momentum), not the Analytical Insight layer — despite being AI-generated, the AI is invisible to the user; what's surfaced is a daily task, so it inherits:
- `somatic-gradient` (cyan-500 → teal-500, left-to-right) for the header
- `somatic-action-primary` (#06B6D4) for active/selected cell state
- `somatic-action-muted` (#CFFAFE) for in-word highlight state

### 5.2 Typography

| Element | Font | Notes |
|---|---|---|
| Page title ("Daily Crossword") | DM Sans, 600 | H1 scale |
| Theme label | DM Sans, 400/500 | Subhead under title |
| Clue text | DM Sans, 400 | Body copy |
| Puzzle number | JetBrains Mono | Objective counter, not prose |
| Grid letters | DM Sans, 600 | Not mono — letters are content, not data |

### 5.3 Screen states

1. **Default / in-progress** — clue strip above grid, current word cells tinted, selected cell filled solid
2. **Empty selection** — clue strip reads "Select a cell to begin"
3. **Solved** — amber (`state-milestone`, #F59E0B) confirmation banner, check icon + text (never color alone), celebration-pulse animation (600ms × 3, `ease-in-out`, per Motion Vocabulary spec), respects `prefers-reduced-motion`. Copy leans effort-oriented rather than achievement-oriented — e.g. "A few minutes spent strengthening recovery vocabulary" rather than a bare "You solved it" — then the banner transitions into the Insight Card (§5.6).

### 5.4 Interaction rules

- Tapping a cell selects it; tapping the same cell again toggles across/down if both directions exist at that cell
- Typing (native mobile keyboard, triggered via hidden input) auto-advances to the next cell in the active word
- Backspace clears the current cell, or steps back if already empty
- **Reveal a letter**: no counter, no penalty, no visual "hint used" flag — consistent with the anti-shame design language used elsewhere in Recovery Games
- **No wrong-answer state**: incorrect letters are never flagged red or otherwise marked wrong mid-solve; correctness is only surfaced on full completion
- **No timer, no streak, no score** — stated explicitly in-UI (footer copy) per the Non-Manipulation Commitment (§X of design system: no artificial scarcity, no loss-framed reminders, no dopamine-trigger badge systems)

### 5.5 Hint tiers

Two hint options, both free, both un-penalized, both without any "hint used" indicator anywhere in the UI:
- **Reveal a letter** (existing) — fills the active cell
- **Gentle hint** (new) — surfaces the word's `hint` text (distinct from its clue) without giving away letters, e.g. for BOUNDARY: "A healthy limit protecting wellbeing." Lets someone stay engaged with the puzzle a little longer before reaching for a straight reveal, without it reading as a harder or easier path.

### 5.6 Post-completion Insight Card

Replaces the plain confirmation-only banner with a single short reflection, shown automatically once the puzzle is solved:

- One card, one short reflection (1–2 sentences), tied to the day's theme, pulled directly from `insight_card.text` in the stored puzzle JSON — zero runtime AI cost, generated offline alongside the puzzle
- **No interaction required** — it's read, not acted on; no "reflect further," no journaling prompt, no follow-up task
- Deliberately kept to a single card rather than stacking a separate word-definition block, quote block, and reflection block — multiple stacked post-solve content blocks would work against the design system's cognitive-load principles
- Dismissible with a single tap; does not block navigation away from the screen

### 5.7 Accessibility

**v1 (this spec):**
- Touch targets: 56px grid cells (exceeds 44px WCAG minimum)
- Status never communicated by color alone (completion state pairs color + icon + text)
- Full `prefers-reduced-motion` compliance on celebration animation
- Screen reader clue navigation (clue text and cell position announced together)
- VoiceOver auto-reads the active clue on cell selection
- Keyboard shortcuts for cell navigation and direction toggle (web/tablet)

**Backlog (future iteration, not this spec):**
- High-contrast mode
- OpenDyslexic font option
- Large-print mode
- Landscape tablet layout optimization

## 6. Open Questions

1. **David-mode rendering**: Design system's David (stabilization) state calls for single-action, low-cognitive-load screens. A crossword is multi-step and moderately cognitive. Decide whether:
   - (a) Crossword simply doesn't surface in the Recovery Games list while David mode is active, routing attention to Craving Buster instead, or
   - (b) It renders unchanged regardless of persona state.
2. ~~Theme pool size~~ — **resolved**: launch with 80–120+ themes (§4.2), comfortably larger than the recency-exclusion window needs.
3. **Backlog/history**: can users browse and solve past dates' puzzles, or is only "today" ever accessible? (Affects whether a puzzle archive UI is in scope.)
4. **Difficulty label visibility**: this spec keeps difficulty mix internal-only (§4.4) to avoid a shame-adjacent "Easy/Medium/Advanced" label. Confirm this stays hidden, or if a softer framing (e.g. "Gentle Challenge") is worth testing later — not a launch blocker either way.
5. **Special theme editions**: the theme-pool architecture supports zero-code seasonal/awareness-month theme sets (e.g. a grief-awareness week, a Step One week) by simply tagging a subset of the pool for a date range. Worth a lightweight roadmap note even if not built now.

## 7. Out of Scope (this iteration)

- Modality-linked content (superseded — see §2/§3 decision history)
- Per-user difficulty adjustment
- Social sharing of completion
- Multiplayer / synchronous group play (that's Recovery Jeopardy's role)
- **Visible difficulty ratings** — considered and deliberately excluded (not deferred for capacity reasons, but on design grounds): a user-facing "Easy/Medium/Advanced" label risks self-judgment in this population and cuts against the anti-shame commitment. Internal difficulty mixing stays; the label doesn't.
- High-contrast mode, OpenDyslexic option, large-print mode, landscape tablet layout — genuinely good accessibility ideas, moved to backlog (§5.7) rather than blocking this spec
- Individual-level analytics or engagement nudges based on solve behavior — analytics stay aggregate/anonymized for content tuning only (§4.10)

---

**Change history**
- Superseded earlier design direction: reading-anchored, per-modality crossword with lazy per-(modality, date) generation. Replaced with a single daily recovery/wellness-themed puzzle after scope simplification.
- Incorporated internal gap analysis (2026-07-26): added post-completion Insight Card, expanded theme pool, two-stage generation, clue-style variety, gentle-hint tier, word validation, aggregate analytics with explicit non-manipulation guardrail, and accessibility roadmap tiering. Deliberately excluded visible difficulty ratings on anti-shame grounds — see §7.
