# 📁 Project 71: Tools Hub Regrouping

**Status:** ✅ Shipped
**Primary Persona:** David (primary), Walt (secondary)
**Objective:** Regroup the flat "My Tools" list into four moment-based sections (Right Now / Before It Happens / After a Hard Moment / Big Picture) and bring the page onto the Momentum Kinetic v3.0 visual system already shipped in Insights (PROJ-54) and the ROSC Matrix (PROJ-53).

---

## 1. The Executive Summary

**User Story:** As David in an acute crisis moment, I want the app's grounding tools (Urge Surfer, Resentment Burner) surfaced first and expanded by default — not buried in an alphabetical/registry-order list next to planning tools like SMART Goal — so I can act in seconds, not scroll.

**Competitive Gap:** Competitors like "I Am Sober" and "Reframe" present CBT tools as an undifferentiated list or a generic "toolbox" grid with no crisis-moment prioritization. MRT's Tools Hub already has richer per-tool metadata (`bestFor`, time estimate, completion/resume state) than either competitor — this project makes that metadata do real information-architecture work instead of being decorative badge text.

**Origin:** Requested directly by the product owner during a design review of the current My Tools page screenshots (2026-07-20/21). Not from BACKLOG.md — a fresh idea, reviewed and scoped via `/plan` the same session, confirmed via `AskUserQuestion` (moment-based grouping over modality-based or usage-based; new dedicated color token; collapsible accordions with "Right Now" expanded by default).

---

## 2. Security & Zero-Knowledge Audit 🛡️

* [x] **Data Sensitivity:** None. `toolsRegistry.ts` stays a static, non-sensitive TypeScript module (tool metadata only — titles, descriptions, icons, colors). No new Firestore reads/writes, no new PII or emotional content touched. The resume-callout and completion-count logic reuse the existing `useGuidedDraft`/`useSmartToolCompletions` hooks unchanged.
* [x] **Encryption Strategy:** N/A — no new data persisted. `src/lib/crypto.ts` is not touched.
* [x] **Key Rotation:** N/A — no new fields participate in `executePinRotation`.

---

## 3. Schema & Architecture 🗄️

No Firestore schema changes. This is a client-side data-model + presentation change only.

**Types (`src/lib/toolsRegistry.ts`):**
```typescript
export interface ToolRegistryEntry {
    // ...existing fields unchanged...
    /** Which recovery moment this tool is grouped under in the Tools Hub. */
    phase: 'right-now' | 'before' | 'after' | 'big-picture';
}

export const PHASE_META: Record<ToolRegistryEntry['phase'], { label: string; subtitle: string; icon: IconType }> = {
    'right-now':   { label: 'Right Now',          subtitle: 'In the moment — for cravings and crisis', icon: ShieldExclamationIcon },
    'before':      { label: 'Before It Happens',  subtitle: 'Plan ahead of a risky moment',             icon: BoltIcon },
    'after':       { label: 'After a Hard Moment', subtitle: 'Process what just happened',              icon: ArrowPathIcon },
    'big-picture': { label: 'Big Picture',        subtitle: 'Step back and plan',                       icon: FlagIcon },
};
```

**Phase assignment** (derived directly from each tool's existing `bestFor`/description — no new judgment calls):

| phase | tools |
|---|---|
| `right-now` | Urge Surfer, Resentment Burner |
| `before` | D.E.N.T.S. Strategy, Cost Benefit Analysis |
| `after` | ABC Coping, Personify & Disarm, Thought Record, Five Questions |
| `big-picture` | Lifestyle Balance, SMART Goal |

**Files impacted:**
* `src/lib/toolsRegistry.ts` — add `phase` field + `PHASE_META` export.
* `src/components/ui/GlassCard.tsx` — add a `tools` variant (`amber #FBBF24 → orange #EA580C`), distinct from the 5 existing module tokens (dashboard/tasks/service/insights/workbooks).
* `src/pages/ToolsHub.tsx` — restructure rendering into grouped, collapsible accordion sections.
* `src/pages/__tests__/ToolsHub.test.tsx` — updated for accordion behavior.

---

## 4. Implementation Phases 🏗️

### Phase 1: Data & Theme Foundation
* Add `phase` to `ToolRegistryEntry` and populate all 10 entries.
* Add `PHASE_META` export.
* Add the `tools` variant to `GlassCard.tsx`'s `MODULE_TOKENS`.

### Phase 2: UI/UX
* Group `TOOLS` by `phase`, rendered in the fixed order `right-now → before → after → big-picture` (not object key order).
* Each section is a collapsible accordion: a real `<button>` header (≥44px touch target) with `PHASE_META` icon + label + a tool-count badge + rotating chevron; body wrapped in `GlassCard variant="tools"`.
* `right-now` expanded by default; the other three collapsed by default.
* Resume callout: computed once above the sections from the existing per-tool `canResume` expression (`hasGuidedFlow && (hasGuidedDraft || hasDraftDoc)`) — a slim `GlassCard variant="tools"` banner linking straight to the resumable tool's `path`. No new streak/gamification element — carries forward PROJ-50 §8's explicit exclusion of CBT completion streaks.
* Re-skin existing card text/icon-chip colors for legibility against the dark glass background (e.g. `text-gray-900` → `text-white`, `bg-{color}-50`/`text-{color}-600` chips → `bg-{color}-500/20`/`text-{color}-300`). Card *structure* (the three existing coming-soon/rich/legacy branches) is unchanged.
* **Somatic Check:** No red used for anything except the pre-existing Resentment Burner icon accent (already shipped, not a failure/overdue state — this project doesn't add or change any guilt/failure language). Collapsed sections still show a tool count so nothing feels hidden or punitive.
* **Reward:** N/A — deliberately no new XP/streak hook, consistent with PROJ-50's decision not to gamify CBT tool usage.

### Phase 3: Edge Cases
* [x] What happens if `navigator.onLine` is false? No change — `toolsRegistry.ts` is static and `useSmartToolCompletions`/`useGuidedDraft` already handle offline the same way they do today.
* [x] What happens if `isVaultUnlocked` is false? No change — this page doesn't render encrypted content.
* [x] What happens on a 320px wide screen (iPhone SE)? Accordion headers and the resume callout must wrap/truncate cleanly at 320px; verified manually in the dev server at that viewport width.
* [x] What if a user has drafts in progress for more than one tool? Resume callout shows up to 2-3 as compact chips rather than picking one arbitrarily.
* [x] What if `prefers-reduced-motion` is set? Expand/collapse transition and any reveal stagger must respect it (no forced animation).

---

## 5. QA & Verification 🧪

* [x] **Unit Tests:** `src/pages/__tests__/ToolsHub.test.tsx` — Right Now section content visible by default; other sections' cards hidden until their header is clicked, then visible; resume callout renders only when a resumable draft exists and links to the plain (non-`?fresh=1`) path. `src/pages/__tests__/ToolHistory.test.tsx` re-verified against the new `phase`/`PHASE_META` registry additions (that page also imports from `toolsRegistry.ts`).
* [x] **The Subway Test:** N/A — no new network dependency introduced.
* [x] **The "Lost PIN" Test:** N/A — no encrypted content on this page.
* [x] **Design system checklist (per `.claude/skills/design/SKILL.md`):** correct module color (new dedicated `tools` token), David's ≤3-tap test still holds (Tools Hub → Start Fresh is still 2 taps, unchanged), 44px touch targets on accordion headers, glassmorphism consistent with Insights/ROSC, no guilt/shame states introduced.
* [x] **Full pipeline:** `npm run check` (lint, `docs:check-specs`, tests, build) clean.

---

## 6. Approved Deviations From Plan

* **"Best for" badge overflow, found via visual QA:** Manual Playwright screenshot verification at a 412px mobile viewport (§5's 320px edge case) caught the "Best for" badge clipping off the right edge of the card on narrow screens — the additional `GlassCard` nesting introduced by this project narrows available card width versus the original flat layout, which had less padding to divide. Fixed by changing the title/badge header row from `flex items-start justify-between` to `flex flex-wrap items-start`, letting the badge wrap onto its own line under the title instead of being squeezed. No plan change beyond this: card structure, colors, and grouping are unchanged from §4.
* **Icon chips left unchanged, not re-skinned:** The plan's Phase 2 suggested re-skinning `tool.bg`/`tool.color` icon-chip classes (e.g. `bg-indigo-50` → `bg-indigo-500/20`) for dark-glass legibility. On inspection this wasn't necessary — each icon chip is a self-contained light box independent of the card's background, so the existing per-tool color combinations remain legible unchanged against the new dark card. Only the surrounding title/description/badge text (previously assuming a white card) was recolored for legibility.

---

## 7. Post-Ship Amendments

* **Resume callout removed (2026-07-21):** The "Continue where you left off" callout (§4 Phase 2) was removed at the product owner's request shortly after shipping — direct product feedback, not a bug. Per-card **Resume** entry points (§5 Phase 2 of the original PROJ-50 spec) are unaffected; only the standalone top-of-page callout and its `resumableTools` computation were deleted from `ToolsHub.tsx`. `docs/specs/18_CBT_ENGINE.md` §4 and the user guide (`docs-site/guide/08-cbt-tools.md`) updated to match.
* **Font sizes increased 10% (2026-07-21):** All text sizes within `ToolsHub.tsx` (both `ToolCard` and the page shell) bumped ~10% via arbitrary Tailwind values (e.g. `text-sm` → `text-[15.4px]`, `text-base` → `text-[17.6px]`) at the product owner's request. Scoped to this page only — shared components (`VibrantHeader`, `GlassCard`) were not touched, so no other page is affected.
* **Accordion color scheme reversed (2026-07-21):** Product owner feedback via screenshot: the dark `GlassCard` glass treatment on the *expanded* card body (holding full descriptions, badges, and multiple buttons) was hard to read, while the plain white collapsed header carried no module identity. Reversed which half is dark: the collapsed section header now carries the dark amber/orange glass treatment (same token values as the `tools` `GlassCard` variant, applied via an inline gradient-border + blurred-`<button>` recipe — mirroring the pattern `ROSCAssessmentCard.tsx` already uses for its own dark-glass state, since `GlassCard.tsx`'s fixed inner padding doesn't suit a clickable header). The expanded body reverted to the exact pre-PROJ-71 opaque white card styling (colors only — structure, branch logic, font sizes, and button behavior unchanged); the `<GlassCard variant="tools">` wrapper around the expanded grid was removed. Chosen over two alternatives (solid-gradient header + frosted body; dark-glass header + new light-toned `GlassCard` variant) as the lowest-risk option, since both halves now reuse styles already proven in production rather than introducing anything new. `GlassCard.tsx` itself is untouched — its `tools` variant remains available for other future use, just no longer used on this page.
* **Adopted the shared `THEME` system; switched Tools' identity from amber/orange to blue/sky; added a dark-glass hero for "Right Now" (2026-07-21):** Product owner feedback comparing this page against the Dashboard, ROSC Matrix, and Workbooks pages found it "dreary" by comparison. Root cause: `ToolsHub.tsx` was the only page in the app not wired into `src/lib/theme.ts`'s shared `THEME` object, which gives every other module page a light color-tinted page background (e.g. Workbooks' `bg-emerald-200`, Insights' `bg-fuchsia-200`) instead of a plain gray — it hardcoded `bg-slate-50` and a one-off amber/orange header gradient instead. Separately, the Dashboard's actual "Tools" entry tile (`Dashboard.tsx:361-375`) turned out to already be a solid **blue→sky** gradient (`from-blue-500 to-sky-600`), not amber/orange — a mismatch introduced when this page's color identity was invented independently. Fixed both: added a `tools` entry to `THEME` (`bg-blue-200` page wash, blue→sky header gradient tracing the same direction as the Dashboard tile) and retinted `GlassCard.tsx`'s `tools` `MODULE_TOKENS` from amber/orange hex to the literal `blue-500`/`sky-600` hex equivalents of the Dashboard tile's gradient stops — now every "Tools" surface in the app (Dashboard tile, Tools Hub header/page, its `GlassCard` variant) shares one blue/sky identity. Also restored a dark-glass hero treatment for just the "Right Now" section's expanded body (wrapped in `<GlassCard variant="tools">` again, now blue-tinted) — echoing how the ROSC Matrix pairs one dramatic dark jewel-tone card with an otherwise light, tinted page — while Before/After/Big Picture stay light. Low-risk specifically for Right Now because it only ever renders the "legacy simple card" branch (Urge Surfer, Resentment Burner — title + one short paragraph, no badges/buttons), not the busier "rich card" branch that caused the original readability complaint two amendments ago. Also recolored the "Best for" pill from flat `bg-slate-100 text-slate-400` to `bg-blue-50 text-blue-700`, matching Workbooks' colorful pastel pill pattern (e.g. its "12-Step Compatible" tag) — the "Coming Soon" badge was deliberately left muted/slate, since recoloring a disabled-looking element vividly would fight its own affordance. Chosen over two alternatives (Approach B: keep amber, just add a tinted background and colorful pills, no new hero; Approach C: an entirely new persistent hero stat/visualization, not reusing the Right Now section) as the option that both resolves the Dashboard color mismatch and reuses proven patterns (the THEME system, Workbooks' pills, `ROSCAssessmentCard`'s dark-hero-on-light-page composition) rather than inventing new ones.
