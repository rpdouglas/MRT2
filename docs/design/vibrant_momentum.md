# MRT Design System — Vibrant Momentum

**Status:** Current — this is what MRT actually looks like today, and what all new UI work must match.
**Companion doc:** `.claude/skills/design/SKILL.md` carries the same system as a terse, checklist-format skill that Claude Code loads before implementing UI work. This document is the fuller reference — more context, more rationale, real code citations — for anyone (human or agent) who wants the detail behind those rules. The two must never drift; if you change one, check the other.
**Not this:** `docs/design/mrt_design_system.md` ("Momentum Kinetic v3.0") is a separate, unimplemented future-vision document — a different name, a different (fictional) token architecture, and it's missing 2 of MRT's 6 current personas. See its own status banner for the audit that confirmed none of its headline architecture exists in code. Don't cite it as current, and don't treat it as a prior version of this document — it isn't.

---

## Core Philosophy

Recovery is a return to life, not a punishment. MRT's UI actively rejects the gloomy, clinical aesthetic that dominates health and recovery apps.

- **Alive & Forward-Moving** — colour, space, and motion signal hope, not deficit. High-saturation gradients throughout; no flat, muted, or grey-dominant palettes anywhere a persona spends real time.
- **Frictionless** — minimalistic layouts for cognitively overloaded users, especially David in acute crisis. Every added tap is a cost.
- **Persona-Adaptive** — the UI's vibe shifts with recovery stage and need, not just its content. A crisis screen and a reflective long-term-sobriety screen should *feel* different, not just say different things.

These three pillars aren't decoration guidance — they're the lens every review question in the Checklist section below is derived from.

---

## Global UI Architecture

- **Layout:** `100dvh` (dynamic viewport height), not `100vh` — mobile browser chrome resizes constantly, and `100dvh` is what keeps MRT's full-screen modals and bottom-nav layouts from jumping or clipping as that chrome shows/hides.
- **Materiality:** Glassmorphism — translucent cards with `backdrop-blur`, layered depth. This is a real, widely-used pattern in the codebase (38+ components use `backdrop-blur` today), not an aspirational token — it's the default card treatment, not a special case.
- **Navigation:** sidebar on desktop, bottom-weighted on mobile, for reachability in one-handed use — a direct concession to David's crisis-state UX floor, since a bottom-weighted layout is what a thumb can reach one-handed under stress.
- **Touch targets:** 44px minimum on every interactive element. This is not a nice-to-have — it's the same WCAG-derived floor that keeps a shaking or panicked hand able to hit the right target.
- **Images:** WebP only, always resolved through the typed `ASSETS` dictionary in `src/data/assets.ts` — never a hardcoded path in a component. This is what let PROJ-108's persona-asset refresh swap 18 image files app-wide without touching a single consuming component's source beyond the two places (`Welcome.tsx`, `Login.tsx`) that map persona IDs to props.

---

## Module Colour System

Every built module owns a gradient — not an arbitrary brand palette, but one chosen to carry a specific psychological signal for the work that happens in that space. The table below is the human-readable summary; `src/lib/theme.ts` (`THEME.<module>`) is the literal source of truth the app reads at render time, reproduced in full further down so the two can never silently drift.

| Module | Vibe | Gradient | Psychological Goal |
|---|---|---|---|
| Dashboard | Personal, hero-derived | Follows the user's chosen Sobriety Hero color | Reflects the identity the user picked for themselves |
| Journal | Reflective & Rich | Indigo → Purple → Violet | Quiet introspection, safe disclosure |
| Tasks | Energy & Action | Cyan → Teal → Emerald | Momentum and dopamine feedback |
| Workbooks | Structured Growth | Emerald → Green → Lime | Guided progress, herbal groundedness |
| Service | Warmth & Connection | Rose → Amber | Human-to-human empathy — **⏸️ Paused (PROJ-05), no UI built.** No live route/component uses this gradient; `THEME` has no `service` entry. Listed here for whenever `05_SERVICE_MODULE.md` is unpaused, not as evidence the module exists today. |
| Insights | Mystical & AI | Fuchsia → Pink → Rose | Deep pattern finding, introspection |
| Vitality | Somatic Health | Rose → Orange → Amber | Calm, grounding, vital energy |
| Profile | Grounded & Secure | Slate → Gray → Zinc | Settled, trustworthy, in control |
| Tools | Bright Clarity | Blue → Sky | Quick utility, sharp focus |
| Games | Playful Mastery | Indigo → Violet → Purple | Lighthearted skill-building, zero shame |

### Why Dashboard is the exception

Every other built module has a fixed gradient. Dashboard doesn't — it derives its header and background from whichever of the 5 Sobriety Hero colors the user picked in `src/lib/heroColors.ts` (`HERO_COLORS.<key>.dashboardHeader`/`.dashboardPage`). The dashboard header tone is deliberately darker than the hero card's own palette — not lighter — specifically so the header's white title text stays legible against it (a real bug this shade choice was fixing; see PROJ-56's follow-up notes). This is the one place in the app where "which module is this" and "which gradient applies" aren't the same question — the answer is "whatever the user chose for themselves," which is itself the point: Dashboard is the one screen that should feel personally owned, not module-categorized.

### The literal source of truth (`src/lib/theme.ts`)

```typescript
export const THEME = {
  journal:    { page: 'bg-indigo-200',  header: { from: 'from-indigo-600',  via: 'via-purple-600', to: 'to-violet-600' } },
  tasks:      { page: 'bg-cyan-200',    header: { from: 'from-cyan-600',    via: 'via-teal-600',   to: 'to-emerald-600' }, ring: '#34d399' },
  workbooks:  { page: 'bg-emerald-200', header: { from: 'from-emerald-600', via: 'via-green-600',  to: 'to-lime-600' },   ring: '#a3e635' },
  insights:   { page: 'bg-fuchsia-200', header: { from: 'from-fuchsia-600', via: 'via-pink-600',   to: 'to-rose-500' } },
  vitality:   { page: 'bg-orange-200',  header: { from: 'from-rose-500',    via: 'via-orange-500', to: 'to-amber-500' },  ring: '#fbbf24' },
  profile:    { page: 'bg-zinc-300',    header: { from: 'from-slate-700',   via: 'via-gray-800',   to: 'to-zinc-900' } },
  tools:      { page: 'bg-blue-200',    header: { from: 'from-blue-600',    via: 'via-blue-500',   to: 'to-sky-500' } },
  games:      { page: 'bg-violet-200',  header: { from: 'from-indigo-500',  via: 'via-violet-500', to: 'to-purple-600' } },
} as const;
```

Classes here are fully spelled out (`from-indigo-600`, not a template-literal-built `from-${x}-600`) deliberately — Tailwind's JIT content scanner can't detect dynamically-constructed class names, so any module color that isn't written out literally somewhere in the source simply won't get generated into the build. This is the same reason `heroColors.ts` (below) spells out all 5 full class combinations rather than composing them from a `key` variable.

### The 5 Sobriety Hero presets (`src/lib/heroColors.ts`)

| Key | Label | Gradient | Dashboard Header (darker) |
|---|---|---|---|
| `amber` (default) | Amber | `from-amber-400 via-orange-400 to-yellow-500` | `from-amber-700 via-orange-700 to-yellow-700` |
| `sky` | Sky | `from-sky-400 via-blue-500 to-indigo-500` | `from-sky-600 via-blue-500 to-indigo-500` |
| `emerald` | Emerald | `from-emerald-400 via-green-500 to-teal-500` | `from-emerald-600 via-green-700 to-teal-600` |
| `violet` | Violet | `from-violet-400 via-purple-500 to-fuchsia-500` | `from-violet-500 via-purple-500 to-fuchsia-500` |
| `rose` | Rose | `from-rose-400 via-pink-500 to-red-500` | `from-rose-500 via-pink-500 to-red-500` |

---

## Persona Design Constraints

All 6 current personas — David, Ned, Lisa, Walt, Maya, Jordan — carry real, distinct UI constraints. Full persona journeys, anti-personas, and overlap resolution live in `docs/PERSONAS.md`; the constraints below are the design-specific subset that should shape every UI decision.

**David (Day 1 — Crisis User)**
- Zero friction. Large SOS buttons. "Skip for Now" always available.
- Immediate access to grounding tools — never more than 2 taps away.
- PIN lock screen reinforces Vault security visually.
- NEVER show red "overdue" or failure states.

**Ned (30–90 Days — Pink Cloud)**
- Visual reward first. Prominent clean-time counter, XP bars, streak visualisations.
- High-energy dashboard with momentum indicators.
- Gamification elements must be immediately visible, not buried.
- Watch the Day 90 Pink Cloud Crash — a streak break must never read as failure (see No-Guilt Engine, below).

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
- Every AI insight must show its source data inline (which entries, which date range) — an untraceable insight is a broken one for Maya, not a nice-to-have.

**Jordan (Day 1–365+, MAT — Stabiliser)**
- Non-judgmental stability. No language implying prescribed recovery medication is "cheating" or "not really clean."
- Custom counter labels — never force "Days Sober" if the user has renamed it (e.g. "Days of Stability").
- Notifications and lock-screen previews must be generic — no drug names, no clinical terms visible without unlocking.
- Dose logging and check-ins are single-tap from the dashboard widget — same zero-friction bar as David, different reason (medical compliance, not crisis).

---

## The "No-Guilt" Engine

This is MRT's most load-bearing behavioral rule, and it's real, tested code — not aspiration:

- NEVER use red "Overdue" text or failure language, anywhere in the app.
- Missed recurring tasks are silently moved forward to "Today" via Smart Reset logic (`reconcileOverdueTask()` in `src/lib/tasks.ts`) rather than shown as broken or overdue.
- No shame spirals in the UI — every state has a compassionate framing (see the Empty & Failure State language table below).

This directly serves Ned's Pink Cloud Crash risk and David's crisis-state floor at once: a missed day reads as "here's today," not "you failed."

---

## Security UI Rules

- Encrypted/locked content always uses a Blurred Overlay fallback when the Vault is locked — never an empty state that implies the content doesn't exist.
- Encrypted content must be visually distinct from plaintext content at a glance.
- PIN entry screens visually reinforce the security and privacy of the Vault — this isn't just a functional gate, it's meant to *feel* like a vault.

---

## AI Integration UI

- AI-generated suggestions carry a purple Sparkle icon (`SparklesIcon`, `text-purple-400`) and, where relevant, a `+7 Days` badge — see `src/components/tasks/TaskRow.tsx`'s `task.source === 'ai'` branch for the real, live implementation of this rule.
- This marking must clearly distinguish an automated suggestion from something the user created themselves.
- AI output is never presented as authoritative — always framed as a suggestion the user can accept, edit, or ignore.

This rule applies to every one of the nine approved Gemini flows listed in `CLAUDE.md`'s Zero-Knowledge Encryption Boundary section — any new AI-surfaced content needs this same visual marking before it ships.

---

## Asset Protocol

- All images: WebP format only.
- All image references: the typed `ASSETS` dictionary in `src/data/assets.ts` — never a hardcoded path in a component.
- Avatars and personas only — never real names or real faces (anonymity compliance runs through imagery too, not just data).

---

## Marketing & Public-Facing Rules

- NEVER use black-and-white or shadowy imagery of people looking depressed — MRT's public face rejects the gloomy health-app aesthetic as hard as its in-app UI does.
- Show, don't tell: stylised app UI mockups on modern devices, not stock photography of suffering.
- Positioning: "Sidekick" or "Companion Tool" — never a clinical medical device.
- Anonymity: avatars/personas only, never real names or photos, in any public-facing material.
- Neutrality: avoid trademarked fellowship names (AA/NA/CA) or official logos in public-facing material.

---

## Before Implementing Any UI Component — Checklist

1. Which module is this? Apply the correct colour/gradient from the Module Colour System.
2. Which persona will use this most? Apply their design constraint from the table above.
3. Touch targets ≥ 44px on all interactive elements?
4. Does it pass the David test — can a user in acute crisis complete the action in ≤ 3 taps?
5. Is glassmorphism applied consistently with the rest of the module?
6. Are there any guilt/shame/failure states that need compassionate reframing per the No-Guilt Engine?
7. If AI-generated content is shown — is the purple Sparkle icon + badge present?

---

*MRT · Vibrant Momentum · Current design system reference · Companion to `.claude/skills/design/SKILL.md`*
