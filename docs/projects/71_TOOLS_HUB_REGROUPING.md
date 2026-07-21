# 📁 Project 71: Tools Hub Regrouping

**Status:** 🟡 Active
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
