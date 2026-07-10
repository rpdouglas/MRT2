# 📁 Project 57: Journal Template Modality Expansion

**Status:** 🟡 Active
**Primary Persona:** Ned, Walt (Lisa benefits indirectly via sponsee variety). David's crisis path is unaffected.
**Objective:** Expand the Journal Editor's default template picker from 4 Twelve-Step-only templates to 15 templates spanning 11 recovery modalities (CBT/SMART, DBT, Mindfulness, Harm Reduction, Trauma-Informed, ACT, Motivational, MAT, General), grouped in the picker by modality.

---

## 1. The Executive Summary

**User Story:** As Ned or Walt, I want journal templates that match my actual recovery approach (not just Twelve-Step), so that guided journaling feels relevant instead of generic.

**Competitive Gap:** Competitors like "I Am Sober" and "Reframe" offer generic mood/craving logs; MRT's existing templates are Twelve-Step-only. Covering CBT, DBT, ACT, harm reduction, and MAT modalities in one picker differentiates MRT for users outside (or alongside) 12-Step programs, mirroring the modality breadth already shipped for Daily Readings (PROJ-42).

**Origin:** Unpromoted idea in `docs/TRIAGE_REPORT.md` (reported 2026-03-24, ID `YXOguurnDGHPUPqD3bK9`) — "we should have something like a template ... that provides daily prompted journaling guides ... pick a modality of recovery." This spec formalizes and scopes that idea for the picker-grouping mechanism only (no date-based auto-rotation — that's out of scope, see §6).

---

## 2. Security & Zero-Knowledge Audit 🛡️

*Completed before any code was written.*
- [x] **Data Sensitivity:** No. Templates are static, non-personal prompt scaffolding shipped in app code — not user data, not stored per-user.
- [x] **Encryption Strategy:** N/A. Templates never pass through `src/lib/crypto.ts`. (The journal *entries* a user fills in from a template are still encrypted exactly as today — this feature does not touch that path.)
- [x] **Key Rotation:** N/A — nothing here is included in `executePinRotation`.

---

## 3. Schema & Architecture 🗄️

**Firestore Collections Impacted:** None. `DEFAULT_TEMPLATES` remains a static in-app TypeScript array (`src/data/journalTemplates.ts`), not a Firestore-backed collection. User-created custom templates (`users/{uid}/templates`, typed in `src/lib/db.ts`) are untouched by this work.

**Types (`src/data/journalTemplates.ts`):**
```typescript
export interface StaticJournalTemplate {
  id: string;
  name: string;
  tags: string[];
  group: string;        // NEW — drives picker optgroup
  content?: string;      // now optional — legacy free-text templates
  prompts?: string[];    // NEW — guided multi-prompt templates
}

export const GROUP_ORDER = [
  'Twelve-Step', 'CBT / SMART', 'DBT', 'Mindfulness', 'Harm Reduction',
  'Reset', 'Trauma-Informed', 'ACT', 'Motivational', 'MAT', 'General',
];
```

A template has either `content` (dropped into free-write textarea, as today) or `prompts` (renders one labeled textarea per prompt in the existing guided-form view — this rendering path and its save-time interpolation already exist in `JournalEditor.tsx` for user-created custom templates; this feature reuses it, it does not invent a new one).

---

## 4. Implementation Phases 🏗️

### Phase 1: Data
- `src/data/journalTemplates.ts`: add `group`/`prompts` fields via targeted edits (existing 4 templates' `content` preserved byte-for-byte), append 11 new template objects, add `GROUP_ORDER` export.

### Phase 2: UI/UX
- `src/components/journal/JournalEditor.tsx`: import `GROUP_ORDER`; extend `handleTemplateSelect` to branch on `content` vs `prompts` for default templates (mirroring the existing branch already used for custom templates); replace the single `"Standard"` `<optgroup>` with one `<optgroup>` per `GROUP_ORDER` group.
- **Somatic Check:** No red/urgency styling introduced. Twelve-Step stays first in the list (unchanged position) to preserve muscle memory for existing users.
- **Reward:** No XP/gamification hook — templates are a content/UX feature, not a streak/achievement trigger.

### Phase 3: Edge Cases
- [x] `navigator.onLine` false — no-op, templates are static bundled data, no network dependency.
- [x] `isVaultUnlocked` false — no-op, template picker is only reachable from within the (already-unlocked) Journal Editor; no new vault-gate interaction.
- [x] 320px wide screen (iPhone SE) — picker `<select>` already uses responsive width classes (`w-[130px] sm:w-48`); native `<optgroup>` rendering is OS-handled and unaffected by group count.
- [x] Empty `formAnswers` on save — already handled generically by existing `handleSave` (`formAnswers[idx] || '-(Skipped)-'`); no new logic needed since new templates reuse the existing `prompts` contract.

---

## 5. QA & Verification 🧪

- [ ] **Unit Tests** (new file `src/components/journal/__tests__/JournalEditor.test.tsx`, following `src/components/smart_tools/__tests__/ThoughtRecordTool.test.tsx` conventions):
  - `handleTemplateSelect` with a `content`-shaped default template sets `newEntry` and clears `activeTemplate`.
  - `handleTemplateSelect` with a `prompts`-shaped default template sets `activeTemplate`, sizes `formAnswers` to `prompts.length`, clears `newEntry`.
  - `handleSave` with an active prompts-based default template interpolates `**{prompt}**\n{answer}` per prompt (reuses existing save logic — regression check only).
- [ ] **The Subway Test:** Confirm template picker and selection work fully offline (static data, no fetch) — expected trivially green given no network calls added.
- [ ] **The "Lost PIN" Test:** N/A — no encrypted data or keys involved in this feature.
- [ ] **Persona/Manual Test:** All 15 templates selectable in dev server; groups render in `GROUP_ORDER`; original 4 templates behave identically to before (free-text, same content/tags); SOS modal's `/journal?template=urge_log` deep link still opens the Urge Log template correctly (its `content` field is unchanged).
- [ ] `npm run check` (lint + test + build) passes with zero errors.

---

## 6. Out of Scope (This Rollout)

- Date-based auto-rotation through prompts (raised in the original triage idea) — not built; each template is user-selected per entry, same interaction model as today.
- New checkbox-style prompt shape (e.g. for a DBT/HALT-style checklist) — the `prompts: string[]` shape only supports plain textareas. `Urge Log` intentionally stays on the legacy `content` shape rather than being migrated, since checklist items don't fit `prompts`. Extending the shape to support `{ label, type: 'text' | 'checklist', options? }[]` is a candidate follow-up ticket, not part of this spec.
- In-app "new templates available" callout/banner — no existing reusable banner pattern confirmed in the codebase at time of writing; revisit if/when one exists.
- Usage analytics on template `group`/`tags` selection — backlog; add only if an analytics pipeline for in-app feature usage already exists or is separately scoped.
