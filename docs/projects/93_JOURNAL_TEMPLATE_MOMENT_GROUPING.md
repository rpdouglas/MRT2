# 📁 Project 93: Journal Template Moment-Based Grouping

**Status:** ⚪ Planned
**Primary Persona:** David (primary — crisis-moment templates surfaced first, mirroring PROJ-71's Tools Hub precedent), Ned/Walt (secondary — daily-ritual and reflection templates benefit from the same clarity).
**Objective:** Regroup the Journal Editor's template picker from PROJ-57's 11 clinical-modality groups (Twelve-Step, CBT/SMART, DBT, ...) into moment-based sections (In the Moment / Daily Rituals / Reflection & Insight / Free Write), rendered as a collapsible accordion in the Journal's own indigo/purple/violet color identity — replacing the current native `<select>`/`<optgroup>` dropdown.

---

## 1. The Executive Summary
**User Story:** As David reaching for a journal template mid-craving, I want the crisis-relevant templates (Urge Log, Ride the Wave, Urge Surfing) grouped together and easy to find by *when I need them*, not buried alphabetically inside an 11-item clinical-modality dropdown I'd have to scan to recognize.
**Competitive Gap:** N/A directly — this is an information-architecture/UX improvement to an existing feature (PROJ-57's template picker), not a new capability. Directly mirrors PROJ-71's Tools Hub regrouping (also moment-based, also collapsible accordion), extending that already-validated mental model to the Journal.
**Origin:** Requested directly by the product owner, referencing a personal 3-concept prototype (accordion / pill+grid / rail) built outside this repo; "Concept 1 — Accordion" was the confirmed direction, restyled to Journal's own color identity rather than the prototype's own dark-purple placeholder theme.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. `DEFAULT_TEMPLATES` stays static, non-personal, non-Firestore prompt scaffolding (per PROJ-57 §2) — only its `group`-driven presentation changes. Custom user-created templates (`users/{uid}/templates`) are unencrypted structural metadata per `CLAUDE.md`'s ZK boundary table already; this ticket doesn't change their storage, only (possibly) where they render in the picker.
* [x] **Encryption Strategy:** N/A — no new data touched, no new Firestore reads/writes.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore schema changes. Client-side data-model + presentation change only, mirroring PROJ-71's `phase`/`PHASE_META` precedent on `toolsRegistry.ts`.

**Types (`src/data/journalTemplates.ts`):**
```typescript
export interface StaticJournalTemplate {
  id: string;
  name: string;
  tags: string[];
  group: string;      // UNCHANGED — PROJ-57's modality label, kept as secondary metadata (see §4)
  moment: JournalMoment; // NEW — drives picker section
  content?: string;
  prompts?: string[];
}

export type JournalMoment = 'in-the-moment' | 'daily-rituals' | 'reflection-insight';

export const MOMENT_META: Record<JournalMoment, { label: string; subtitle: string; dotColor: string }> = {
  'in-the-moment':     { label: 'In the Moment',       subtitle: 'When you need help right now',        dotColor: '#F472B6' /* pink */ },
  'daily-rituals':     { label: 'Daily Rituals',       subtitle: 'Morning and evening check-ins',        dotColor: '#818CF8' /* indigo */ },
  'reflection-insight':{ label: 'Reflection & Insight', subtitle: 'Deeper work, when you have time',      dotColor: '#34D399' /* emerald */ },
};
```
`Free Write` is not a `StaticJournalTemplate` — it's the existing `<option value="none">` today, and becomes its own 4th accordion section with a single selectable row, not a `moment` enum member.

**Draft moment assignment** (needs confirmation during planning — unlike PROJ-71's `phase` table, there's no existing per-template field to derive this from mechanically):

| moment | templates |
|---|---|
| `in-the-moment` | Urge Log (SOS), Ride the Wave (TIPP), Urge Surfing, Body Check |
| `daily-rituals` | Morning Intention, Nightly Inventory, Daily Check-In (No Program), MAT Check-In |
| `reflection-insight` | Thought Check-In, Cost-Benefit Check (ABC Model), Meeting Reflection, Values Compass, Readiness Ruler, After a Slip, Safer Choices Check-In |
| *(own section)* | Free Write |
| *(own section, unchanged)* | My Templates (custom, user-created — stays ungrouped by moment, matching current behavior) |

---

## 4. Implementation Phases 🏗️
*Phases intentionally left high-level — the `/planning` skill's 3-strategy proposal (next step after this spec) determines the concrete component approach (inline accordion vs. bottom-sheet picker vs. dedicated route) before any code is written.*

### Phase 1: Data
* Add `moment`/`MOMENT_META` to `src/data/journalTemplates.ts`; assign all 15 default templates per the table above (confirm/adjust during planning).
* Existing `group`/`GROUP_ORDER` (PROJ-57 modality labels) are **kept, not removed** — surfaced as secondary metadata (e.g. a small tag) on each template row, so the clinical-modality information Walt/Maya value for traceability isn't lost, only demoted from primary grouping to a detail.

### Phase 2: UI/UX
* Replace the native `<select>`/`<optgroup>` template picker in `JournalEditor.tsx` with a collapsible-accordion picker grouped by `moment`, styled in `THEME.journal`'s indigo/purple/violet identity (not the reference prototype's own dark-purple background) — per-section colored dot indicators per `MOMENT_META.dotColor`, matching the reference screenshot's visual language.
* **Somatic Check:** No red/urgency styling. "In the Moment" is about crisis *tools*, not failure — no alarm framing, consistent with PROJ-71's identical Somatic Check for "Right Now."
* **Reward:** None — template selection is not a gamification surface (unchanged from PROJ-57).

### Phase 3: Edge Cases
* [ ] 320px-wide screen (iPhone SE) — the current picker already handles this via responsive width classes; new picker must too.
* [ ] `isVaultUnlocked`/offline — unchanged, no new dependency (static bundled data).
* [ ] Custom "My Templates" section with zero custom templates (current behavior: whole optgroup omitted) — new picker must match.
* [ ] `initialTemplateId` deep-link (journal entry opened with a template pre-selected, e.g. from `?template=mat_check_in`) — must still resolve correctly against the new grouped structure.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** `src/components/journal/__tests__/JournalEditor.test.tsx`'s existing `selectTemplate()` test helper interacts with a native `<select>` — will need updating to the new picker's interaction model; the 3 existing PROJ-57 tests' *assertions* (content-shaped template drops into free-write, prompts-shaped renders a guided form, save interpolates prompts) should need zero logic changes, only how the template gets selected.
* [ ] **The Subway Test:** N/A — static bundled data, no network dependency, same as PROJ-57.
* [ ] **The "Lost PIN" Test:** N/A — no encrypted data involved.
* [ ] **Persona/Manual Test:** Recommend a real browser pass (accordion expand/collapse, colored dots, template selection → guided form) before shipping — same recommendation PROJ-57 made and flagged as not-yet-done at the time.
