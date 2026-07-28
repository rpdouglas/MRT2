# 📁 Project 81: Games Hub Design System Alignment

**Status:** 🟢 Done
**Primary Persona:** All (David and Walt specifically called out below — the header regression directly affects David's SOS access floor)
**Objective:** Bring `GamesHub.tsx`'s header and hero-card color back in line with the rest of the app's design system — replace its one-off back-button header with the shared `VibrantHeader` component, and retint its dark hero card to match the Dashboard's "My Games" bento tile, using primitives (`THEME`, `GlassCard`) that already exist elsewhere in the codebase.

---

## 1. The Executive Summary

**User Story:** As any MRT user opening Recovery Games, I want the page to look and behave like every other module (Journal, Tasks, Vitality, Workbooks) — including having the SOS button always available — instead of a visually orphaned one-off design.

**Competitive Gap:** N/A — internal consistency fix, not a new competitive surface.

**Origin note:** PROJ-80 (shipped 2026-07-27) ported a standalone design mockup onto `GamesHub.tsx` without checking it against the app's actual design system. This spec corrects that drift; PROJ-80 itself is left as-is (its GAMES config, `GameRow`, and Fast Lane chip logic are untouched by this ticket — only the page's outer chrome changes).

---

## 2. Security & Zero-Knowledge Audit 🛡️

- [x] **Data Sensitivity:** No data touched. Presentational-only change (header component swap, card component swap, two color-token edits).
- [x] **Encryption Strategy:** N/A — no Firestore reads/writes added or changed. `useGameSave('fast-lane')` (the Fast Lane progress chip) is untouched.
- [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️

No Firestore schema changes, no new types. Two existing shared primitives gain a `games` registration that didn't exist before:
* `src/lib/theme.ts` — new `THEME.games` entry (`page: 'bg-violet-200'`, `header.from/via/to: indigo-500/violet-500/purple-600`), matching the shape every other module already has.
* `src/components/ui/GlassCard.tsx` — `MODULE_TOKENS.games` corrected from `{ gradA: '#818CF8' (indigo-400), gradB: '#9333EA' }` to `{ gradA: '#6366F1' (indigo-500), gradB: '#9333EA' }` so it's a pixel-exact match to the Dashboard's My Games tile (`from-indigo-500 to-purple-600`), the same way `MODULE_TOKENS.tools` already exact-matches its own Dashboard tile. This token existed since PROJ-72 but had never been consumed by any component until this ticket.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* None — no hooks added or changed.

### Phase 2: UI/UX & Gamification
* `GamesHub.tsx`: replace the custom `<Link>`/`ChevronLeftIcon` header block with `<VibrantHeader title="Recovery Games" subtitle="Zero-knowledge, anti-shame mini-games" icon={TrophyIcon} fromColor={THEME.games.header.from} viaColor={THEME.games.header.via} toColor={THEME.games.header.to} backLink="/dashboard" />` — restoring the hamburger/Help/SOS affordances every other module page has, which the PROJ-80 header silently dropped.
* `GamesHub.tsx`: replace the hand-rolled `linear-gradient(160deg, #2E1A47 0%, #1B0F2E 100%)` card and its two manual blurred bloom `<div>`s with `<GlassCard variant="games">` wrapping the existing `ACTIVE_GAMES` row list and footer line — reusing the shared dark-card recipe instead of a bespoke one.
* `GamesHub.tsx`: outer wrapper's background becomes `THEME.games.page`; the `GlassCard` sits inside a `max-w-4xl mx-auto px-4 -mt-10 relative z-30` container, matching the `-mt-10` convention shared by Journal/Tasks/Vitality/Workbooks.
* `.claude/skills/design/SKILL.md`: add the missing "Games" row to the Module Colour System table so this module is no longer undocumented there.
* **Somatic Check:** No change to failure/red states — this ticket touches chrome only.
* **Reward:** N/A.

### Phase 3: Edge Cases
* [x] 320px viewport — `VibrantHeader`/`GlassCard` are both already proven at this width on every other module page; no new risk introduced.
* [x] `isVaultUnlocked` false — N/A, `/games` is already gated behind `VaultGate`.
* [x] `navigator.onLine` false — no change.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** Existing `src/pages/__tests__/GamesHub.test.tsx` (5 cases) must keep passing unchanged — none of its assertions target header markup. Full suite run to confirm the `theme.ts`/`GlassCard.tsx` edits don't ripple into other `THEME`/`GlassCard` consumers (Journal, Insights, ToolsHub).
* [x] **Manual verification:** `/games` header structure matches Journal/Tasks/Vitality/Workbooks (back arrow, centered title/subtitle, Help icon, SOS button present and functional); hero card color visually matches the Dashboard's My Games bento tile.
