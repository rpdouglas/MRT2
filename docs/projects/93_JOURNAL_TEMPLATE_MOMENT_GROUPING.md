# 📁 Project 93: Journal Template Moment-Based Grouping

**Status:** ✅ Shipped
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

**Moment assignment** (confirmed and shipped exactly as drafted — unlike PROJ-71's `phase` table, there was no existing per-template field to derive this from mechanically, so this was a product judgment call, approved unchanged during planning):

| moment | templates |
|---|---|
| `in-the-moment` | Urge Log (SOS), Ride the Wave (TIPP), Urge Surfing, Body Check |
| `daily-rituals` | Morning Intention, Nightly Inventory, Daily Check-In (No Program), MAT Check-In |
| `reflection-insight` | Thought Check-In, Cost-Benefit Check (ABC Model), Meeting Reflection, Values Compass, Readiness Ruler, After a Slip, Safer Choices Check-In |
| *(own section)* | Free Write |
| *(own section, unchanged)* | My Templates (custom, user-created — stays ungrouped by moment, matching current behavior) |

---

## 4. Implementation Phases 🏗️
Built per the approved `/planning` Strategy A (bottom-sheet accordion, reusing `QuickCaptureSheet.tsx`'s `Dialog`/`Transition` shell pattern) over the inline-accordion and dedicated-route alternatives.

### Phase 1: Data
* Added `JournalMoment`/`MOMENT_ORDER`/`MOMENT_META` to `src/data/journalTemplates.ts`, plus `FREE_WRITE_META`/`MY_TEMPLATES_META` for the two non-`JournalMoment` sections (Free Write isn't a template; My Templates is user-authored with no fixed moment) — a small addition beyond this spec's original type sketch, same single-source-of-truth pattern as `MOMENT_META`. Assigned all 15 default templates exactly per the draft table in §3 (confirmed as-is, no changes needed).
* Existing `group`/`GROUP_ORDER` (PROJ-57 modality labels) **kept, not removed** — rendered as a small badge on each template row in the new picker, so the clinical-modality information Walt/Maya value for traceability isn't lost, only demoted from primary grouping to a detail.

### Phase 2: UI/UX
* New `src/components/journal/TemplatePickerSheet.tsx` — bottom-sheet accordion grouped by `moment` (+ Free Write, + My Templates when non-empty), styled in `THEME.journal`'s indigo/purple/violet identity (light `bg-indigo-200` panel, white/indigo-tinted section cards) rather than the reference prototype's own dark-purple background, per-section colored dot per `MOMENT_META.dotColor`/`FREE_WRITE_META`/`MY_TEMPLATES_META`. One section open at a time; "In the Moment" open by default, matching the reference screenshot.
* `JournalEditor.tsx`'s old `<select>`/`<optgroup>` replaced with a "Choose Template" button that opens the sheet; `handleTemplateSelect(tId)` itself is completely unchanged, just now invoked from the sheet's row `onClick` instead of a native `onChange`.
* **Somatic Check:** No red/urgency styling. "In the Moment" is about crisis *tools*, not failure — no alarm framing, consistent with PROJ-71's identical Somatic Check for "Right Now."
* **Reward:** None — template selection is not a gamification surface (unchanged from PROJ-57).

### Phase 3: Edge Cases
* [x] 320px-wide screen (iPhone SE) — verified via Playwright screenshot, no clipping/overflow in the sheet.
* [x] `isVaultUnlocked`/offline — unchanged, no new dependency (static bundled data).
* [x] Custom "My Templates" section with zero custom templates — whole section omitted, matching the old optgroup's behavior (`customTemplates.length > 0` guard carried over verbatim).
* [x] `initialTemplateId` deep-link (e.g. `?template=mat_check_in`) — unaffected by construction, since it calls `handleTemplateSelect` directly in an effect, bypassing the picker UI entirely.
* [x] **Caught during real-browser QA (not TypeScript/lint/JSDOM):** the toolbar trigger button's label used two responsive `<span>`s (`sm:hidden` / `hidden sm:inline`) with no explicit `aria-label`. JSDOM doesn't apply real CSS, so unit tests passed even though a real browser's accessible-name computation correctly excludes `display:none` content — at mobile width the button's accessible name silently became just "Template" instead of matching "Choose Template", which a Playwright pass at 390px caught immediately (a locator timeout) where the unit test suite couldn't. Fixed with a stable `aria-label="Choose Template"` on the button and `aria-hidden="true"` on both decorative inner spans.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `JournalEditor.test.tsx`'s `selectTemplate()` helper rewritten to open the sheet and click the target section header (if not the default-open one) then the template row, instead of firing a native `<select>` change event. All 3 existing PROJ-57 assertions pass unmodified. Full suite: 662/662.
* [x] **The Subway Test:** N/A — static bundled data, no network dependency, same as PROJ-57.
* [x] **The "Lost PIN" Test:** N/A — no encrypted data involved.
* [x] **Persona/Manual Test:** Real Playwright/Chromium pass via the `?mockUser=` bypass (no Firebase credentials in this environment) — verified accordion expand/collapse, one-section-open-at-a-time behavior, colored dots, modality badges, template selection → guided form (Thought Check-In), and the Free Write flow (→ blank compose mode), at both 390px and 320px widths.
