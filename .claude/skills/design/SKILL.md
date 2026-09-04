---
name: design
description: MRT design system guidelines. Invoke before implementing any UI component, styling change, or new screen. Ensures output matches the Vibrant Momentum design language.
---

# MRT Design System — Vibrant Momentum

> This is the canonical, currently-enforced design system — what's actually built and what new UI work must match. This file is the terse, checklist-format version for quick reference before implementing UI work — see `docs/design/vibrant_momentum.md` for the fuller reference with rationale and real code citations. `docs/design/mrt_design_system.md` ("Momentum Kinetic v3.0") is a different, separate, unimplemented future-vision document (semantic CSS tokens, custom fonts, an adaptive per-persona rendering engine) — none of that exists in code today. Don't treat it as interchangeable with, or a different version of, this system.

## Core Philosophy
Recovery is a return to life — not a punishment. Reject gloomy health app aesthetics.
- **Alive & Forward-Moving:** colour, space, and motion signal hope
- **Frictionless:** minimalistic layouts for cognitively overloaded users (especially David in crisis)
- **Persona-Adaptive:** UI shifts vibe depending on recovery stage

## Global UI Architecture
- Layout: `100dvh` (dynamic viewport height) — perfect mobile fit always
- Materiality: Glassmorphism — translucent cards with `backdrop-blur`, layered depth
- Navigation: sidebar desktop / bottom-weighted mobile for one-handed use
- Touch targets: minimum `44px` on all interactive elements (accessibility non-negotiable)
- Images: WebP only, mapped through `src/data/assets.ts` typed dictionary — no direct image paths

## Module Colour System

| Module | Vibe | Gradient | Psychological Goal |
|---|---|---|---|
| Dashboard | Personal, hero-derived | Follows the user's chosen Sobriety Hero color (see below) | Reflects the identity the user picked for themselves |
| Journal | Reflective & Rich | Indigo → Purple → Violet | Quiet introspection, safe disclosure |
| Tasks | Energy & Action | Cyan → Teal → Emerald | Momentum and dopamine feedback |
| Workbooks | Structured Growth | Emerald → Green → Lime | Guided progress, herbal groundedness |
| Service | Warmth & Connection | Rose → Amber | Human-to-human empathy — **⏸️ Paused (PROJ-05), no UI built yet.** No live route/component uses this gradient; `src/lib/theme.ts` has no `service` entry. Documented here for whenever `05_SERVICE_MODULE.md` is unpaused — do not treat this row as evidence the module exists. |
| Insights | Mystical & AI | Fuchsia → Pink → Rose | Deep pattern finding, introspection |
| Vitality | Somatic Health | Rose → Orange → Amber | Calm, grounding, vital energy |
| Profile | Grounded & Secure | Slate → Gray → Zinc | Settled, trustworthy, in control |
| Tools | Bright Clarity | Blue → Sky | Quick utility, sharp focus |
| Games | Playful Mastery | Indigo → Violet → Purple | Lighthearted skill-building, zero shame |

High-saturation gradients. No flat, muted, or grey-dominant palettes. Every *built* row except Dashboard must stay in sync with the per-module gradient stops in `src/lib/theme.ts` (`THEME.<module>.header.{from,via,to}`) — that file is the source of truth consumed by code; this table is the human-readable summary. **Service has no `THEME` entry because it has no code yet** (see row above) — its gradient here is a design placeholder, not a sync target. **Dashboard is the one *built* module without a static entry in `THEME`** — its header/background instead derive from whichever of the 5 Sobriety Hero colors the user has picked (`src/lib/heroColors.ts`, `HERO_COLORS.<key>.dashboardHeader`/`.dashboardPage`), one shade darker than the hero card's own tones to keep the header's white title text legible, with the page background going pale (100-tier). Keep `heroColors.ts` in sync the same way.

## Persona Design Constraints

**David (Day 1 — Crisis User)**
- Zero friction. Large SOS buttons. "Skip for Now" always available.
- Immediate access to grounding tools — never more than 2 taps away.
- PIN lock screen reinforces Vault security visually.
- NEVER show red "overdue" or failure states.

**Ned (30–90 Days — Pink Cloud)**
- Visual reward first. Prominent clean-time counter, XP bars, streak visualisations.
- High-energy dashboard with momentum indicators.
- Gamification elements must be immediately visible, not buried.

**Lisa (7+ Years — Service Superstar)**
- Boundary management. Clean sponsee list organisation.
- Amber tones for calm — prevent burnout aesthetic.
- Self-care check-ins surfaced proactively.

**Walt (35+ Years — Zen Master)**
- Data sovereignty. High-legibility text — never sacrifice readability for style.
- Deep-dive pattern charts, structured export views.
- Density is acceptable; clutter is not.

**Maya (6–18 Months — Systematiser)**
- Structured progression. Linear navigation, completion % always visible — never hide progress behind a tap.
- Data density is welcome here — unlike Walt, don't soften charts or numbers for her.
- Progress framing shows what's *complete*, not what's *remaining* — deficit framing reads as failure to her too, just via a different mechanism than Ned's streaks.
- Every AI insight must show its source data inline (which entries, which date range) — an untraceable insight is a broken one for Maya, not just a nice-to-have.

**Jordan (Day 1–365+, MAT — Stabiliser)**
- Non-judgmental stability. No language implying prescribed recovery medication is "cheating" or "not really clean."
- Custom counter labels — never force "Days Sober" if the user has renamed it (e.g. "Days of Stability").
- Notifications and lock-screen previews must be generic — no drug names, no clinical terms visible without unlocking.
- Dose logging and check-ins are single-tap from the dashboard widget — same zero-friction bar as David, different reason (medical compliance, not crisis).

## The "No-Guilt" Engine
- NEVER use red "Overdue" text or failure language.
- Missed tasks → silently moved to "Today" via Smart Reset logic.
- No shame spirals in the UI — every state has a compassionate framing.

## Security UI Rules
- Encrypted / locked content: always use Blurred Overlay fallback when Vault is locked.
- Encrypted content must be visually distinct from plaintext content.
- PIN entry screens must visually reinforce the security and privacy of the Vault.

## AI Integration UI
- AI-generated suggestions: marked with Purple Sparkle icon (✦) and `+7 Days` badge.
- Clearly distinguishes automated suggestions from user-created tasks.
- Never present AI output as authoritative — always as a "suggestion."

## Asset Protocol
- All images: WebP format only
- All image references: typed `ASSETS` dictionary in `src/data/assets.ts`
- No hardcoded image paths anywhere in components
- Avatars and personas only — never real names or faces (anonymity compliance)

## Marketing & Public-Facing Rules
- NEVER use black-and-white or shadowy imagery of people looking depressed.
- Show, don't tell: use stylised app UI mockups on modern devices.
- Positioning: "Sidekick" or "Companion Tool" — never a clinical medical device.
- Anonymity: avatars/personas only, never real names or photos.
- Neutrality: avoid trademarked names (AA/NA/CA) or official logos in public-facing material.

## Before Implementing Any UI Component — Checklist
1. Which module is this? Apply the correct colour/gradient from the module system.
2. Which persona will use this most? Apply their design constraint.
3. Touch targets ≥ 44px on all interactive elements?
4. Does it pass the David test — can a user in acute crisis complete the action in ≤ 3 taps?
5. Is glassmorphism applied consistently with the rest of the module?
6. Are there any guilt/shame/failure states that need compassionate reframing?
7. If AI-generated content is shown — is the purple sparkle + badge present?