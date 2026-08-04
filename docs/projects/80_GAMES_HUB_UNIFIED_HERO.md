# 📁 Project 80: Games Hub Unified Hero Restyle

**Status:** ✅ Shipped
**Primary Persona:** All (persona shows up only as a per-row icon tint — the whole point of this restyle is dropping persona grouping in favor of one flat list)
**Objective:** Restyle `GamesHub.tsx` from a grid of separately-colored gradient tiles into one unified dark card containing a flat list of game rows (per a design-reference mockup, `docs/reports/RecoveryGamesUnifiedHero.jsx` — since deleted as a misfile during the 2026-08-04 governance sweep; its layout is fully realized in the shipped `GamesHub.tsx`, so nothing was lost), and hide the Craving Buster / Thought Challenge entries from that list without deleting their routes, components, or any other code. Thought Challenge is re-surfaced as a Tools Hub entry (see Phase 2 addendum) rather than left fully unreachable, since — unlike Craving Buster, which keeps its SOS-button entry point — it had no other access route left in the app.

---

## 1. The Executive Summary

**User Story:** As any MRT user opening Recovery Games, I want one calm, unified list instead of a busy multi-color tile grid, so the page feels like the rest of the app's "Today's Focus" dark-card pattern rather than a separate visual language bolted onto the games module.

**Competitive Gap:** N/A — this is a presentational restyle of an already-shipped, already-differentiated feature (PROJ-72), not a new competitive surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️

- [x] **Data Sensitivity:** No new sensitive data surfaced. Purely presentational — no new Firestore collections, no new writes, no new Gemini calls.
- [x] **Encryption Strategy:** N/A for new data. The only "new" read on this page is an *existing* one: `useGameSave('fast-lane')` (`src/hooks/useGameSave.ts`), already encrypted at rest and already decrypted client-side by that hook, now surfaced as a "Continue · Week N" progress chip instead of not being read at all. `GamesHub` is already behind `VaultGate` (`src/App.tsx`), so there's no locked-vault fallback branch needed for that read.
- [x] **Key Rotation:** N/A — no new persisted fields; `game_saves` was already covered by `executePinRotation`/`executeCryptoShredding` under PROJ-72.

---

## 3. Schema & Architecture 🗄️

No Firestore schema changes. No new collections or fields. `useGameSave` is reused exactly as it exists today.

**Types:** No new types in `src/lib/db.ts`. A local, component-scoped `GAMES` config array and `PERSONA_COLORS` map live in `src/pages/GamesHub.tsx` (mirroring that file's existing precedent of hardcoding its own gradient rather than reading from `src/lib/theme.ts`, which has no `THEME.games` entry today).

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* No new hooks. Reuse `useGameSave('fast-lane')` to derive the Fast Lane row's progress chip from real save data (`state.week`) instead of the design mockup's hardcoded `"Continue · Week 4"` string. No chip renders if no save exists.

### Phase 2: UI/UX & Gamification
* Replace the existing tile-grid `GamesHub.tsx` body with one dark unified card (`linear-gradient(160deg, #2E1A47 0%, #1B0F2E 100%)`, blurred radial accent blooms), containing a flat list of `GameRow` buttons — ported from `docs/reports/RecoveryGamesUnifiedHero.jsx` (design-reference mockup, since deleted — its content is fully realized in the shipped `GamesHub.tsx`).
* `GAMES` array ports the mockup's entries **except** `"Anchor Words"`, which does not exist anywhere in this codebase (no route, no component) and is excluded rather than invented.
* Craving Buster and Thought Challenge are kept in the `GAMES` array with `active: false` — exactly as the mockup's own comment block prescribes — so their metadata isn't lost and re-enabling either is a one-line flip. Their routes (`/games/craving-buster`, `/games/thought-challenge`) and components are untouched; they simply don't render as rows (`ACTIVE_GAMES = GAMES.filter(g => g.active)`).
* Icons ported from the mockup's `lucide-react` set to already-installed `@heroicons/react/24/outline` equivalents (verified to exist in `node_modules`): `UserGroupIcon` (Recovery Jeopardy), `RocketLaunchIcon` (Fast Lane), `ArrowTrendingUpIcon` (Goal Ladder), `ViewfinderCircleIcon` (Trigger Match), `BookOpenIcon` (Knowledge Quests), `Squares2X2Icon` (Daily Crossword), `CloudIcon` (Craving Buster, kept inactive), `LightBulbIcon` (Thought Challenge, kept inactive).
* **Deviation from the mockup:** the mockup's `<style>` block does a runtime `@import` of Google Fonts (DM Sans, JetBrains Mono). This app has no existing custom font stack (Tailwind defaults only) and is an offline-first PWA — a network font fetch would silently fail offline and has no precedent anywhere else in the codebase. The font import is dropped; the app's default font classes are used instead. No other visual aspect of the mockup is affected.
* **Somatic Check:** No red/failure states introduced. Footer copy ("No timer, no streak, no score kept.") carries over unchanged — a promise about UI framing, not about the underlying `game_progress.score` field, which is unaffected.
* **Reward:** N/A — no XP/leveling logic touched by this restyle.
* **Addendum (found during ticket-close, PROJ-80):** delisting Thought Challenge from `GamesHub` left it with zero UI entry points anywhere in the app (confirmed via grep — only `App.tsx`'s route registration referenced it), unlike Craving Buster which keeps its SOS-button access. Resolved by adding a `thought-challenge` entry to `src/lib/toolsRegistry.ts`'s `TOOLS` array (`phase: 'after'`, no `toolType`/`hasGuidedFlow` since it isn't a journal-persisted guided flow — same "simple card" shape as Urge Surfer/Resentment Burner), linking straight to the existing `/games/thought-challenge` route. No new component, route, or Firestore surface — purely a second navigation entry point into code that already shipped under PROJ-72.

### Phase 3: Edge Cases
* [x] `navigator.onLine` false — no change; `useGameSave`'s existing offline persistence is unaffected.
* [x] `isVaultUnlocked` false — N/A, `/games` is already gated behind `VaultGate`.
* [x] 320px viewport (iPhone SE) — row title/description use `truncate`, matching the mockup; verified visually during implementation.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** New `src/pages/__tests__/GamesHub.test.tsx` — renders exactly the 6 active games; asserts Craving Buster/Thought Challenge are absent from the DOM; each row links to its correct route; Fast Lane chip renders from real `useGameSave` data and is absent when no save exists. New case added to `src/pages/__tests__/ToolsHub.test.tsx` confirming Thought Challenge renders as a simple card in "After a Hard Moment" linking to `/games/thought-challenge`.
* [x] **The Subway Test:** N/A — no new network/offline behavior introduced (reuses `useGameSave`'s existing offline persistence, already covered by PROJ-72/PROJ-73).
* [x] **The "Lost PIN" Test:** N/A — no new encrypted fields introduced.
