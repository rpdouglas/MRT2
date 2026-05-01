---
name: design
description: MRT design system guidelines. Invoke before implementing any UI component, styling change, or new screen. Ensures output matches the Vibrant Momentum design language.
---

# MRT Design System — Vibrant Momentum

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
| Dashboard | Hope & Clarity | Sky Blue → Blue | Open horizons, fresh start |
| Tasks | Energy & Action | Cyan → Teal | Momentum and dopamine feedback |
| Service | Warmth & Connection | Rose → Amber | Human-to-human empathy |
| Insights | Mystical & AI | Fuchsia → Rose | Deep pattern finding, introspection |
| Vitality | Somatic Health | Amber → Orange | Calm, grounding, vital energy |

High-saturation gradients. No flat, muted, or grey-dominant palettes.

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