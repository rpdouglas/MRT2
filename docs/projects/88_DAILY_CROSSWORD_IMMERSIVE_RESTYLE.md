# 📁 Project 88: Daily Crossword Immersive Shell Restyle

**Status:** ✅ Shipped
**Primary Persona:** All (Daily Crossword's `recordProgress` persona target is `'All'` — it's the one deliberately non-persona-exclusive, unscored Recovery Game).
**Objective:** Restyle Daily Crossword's surrounding shell (header, footer, page background, clue bar, hint/reveal controls, celebration/insight banners) to match Goal Ladder's/Recovery Jeopardy's/Trigger Match's/Knowledge Quests' dark-immersive full-bleed treatment (PROJ-85/86/87) — while leaving the grid's spec-mandated somatic-action colors (cyan selected cell, cyan-100 in-word highlight) untouched, mirroring Recovery Jeopardy's precedent of restyling the shell around `JeopardyBoard.tsx` without touching the board itself.

---

## 1. The Executive Summary
**User Story:** As any user opening the Daily Crossword, I want it to feel as polished and "Vibrant Momentum" as every other Recovery Game, instead of being the one remaining light `GameShell` screen in the set.
**Competitive Gap:** N/A — visual polish/consistency, not a competitive differentiator. Lightweight spec per protocol, matching PROJ-85/86/87's precedent: purely presentational, no new data/schema/AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Purely presentational. `recordProgress`/`useDailyCrossword` are unchanged. `crossword_puzzles/{date}` stays unencrypted server-write-only editorial content per the existing ZK boundary table row — nothing about this change touches that.
* [x] **Encryption Strategy:** N/A — no new data touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes. Modified: `src/components/games/crossword/DailyCrossword.tsx` only.
* Drops `GameShell` for a self-contained dark-immersive shell (full-bleed gradient + ambient glow blobs), matching `GoalLadder.tsx`/`RecoveryJeopardy.tsx`/`TriggerMatch.tsx`/`KnowledgeQuests.tsx`. Unlike those four, this game never calls `useGameSession` (no score/pause mechanic, per the source spec's anti-shame "no timer/streak/score" requirement) — so the new footer is a plain Exit link with no `GameSessionProvider` wrap, rather than dead session plumbing.
* Shell accent reuses the grid's own pre-existing `SOMATIC_SELECTED` cyan (`#06B6D4`) rather than introducing an unrelated color (e.g. the Games Hub `'everyone'` persona pink already used by Knowledge Quests) that would visually fight the grid's still-cyan selection state.
* Grid cell colors (`SOMATIC_SELECTED` selected-cell cyan, `SOMATIC_IN_WORD` in-word light-cyan, white unselected-cell background) are **unchanged** — explicitly protected per the file's own header comment, matching Recovery Jeopardy's precedent of leaving `JeopardyBoard.tsx` untouched. Only the grid's *container* frame (gutter color, outer padding/border) was restyled, the same category of change PROJ-86 made to `Scoreboard`/`QuestionModal`/`FinalJeopardy`'s containers.
* `isLoading`/`isError` states moved from being rendered bare inside the old `GameShell` wrap to being rendered inside the new dark shell, so there's no light-mode flash before the puzzle loads.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* No new hooks, no session state added. All existing crossword logic (`grid`/`selected`/`direction`/`solved`/`hintedWord`/`showInsight`/`viewport` state, `selectCell`, `handleKey`, `revealLetter`, `requestHint`, `handleSolved`, the `visualViewport` keyboard-tracking effect) is copied verbatim — only the JSX chrome changed.

### Phase 2: UI/UX & Gamification
* Full-bleed dark-immersive background (`linear-gradient(160deg,#2E1A47,#1B0F2E)` + cyan/purple ambient glow blobs), matching the established family. Minimal header (title only — no score chip, since this game is intentionally unscored) and footer (Exit only — no Pause/Resume, since `phase` never left `'idle'` here even under the old `GameShell`/`GameFooter`, as this game never called `startSession`).
* Theme banner, clue bar, hint banner, insight-reflection card, Reveal/Hint buttons: all converted from flat light cards (`bg-white border-slate-200`) to the family's dark-glass treatment (`bg-white/[0.07] border-white/10 backdrop-blur-sm`).
* Solved celebration banner: kept in the amber family (a positive/celebratory signal, not the red/alarm states CLAUDE.md's Somatic Check warns against) but adapted to a dark-glass amber (`bg-amber-400/15 border-amber-400/40`, amber-200/300 text) instead of the old solid pale-amber card.
* **Somatic Check:** No red/alarm states introduced. Exit remains a neutral action. The one existing celebratory (non-alarm) amber state is preserved, just re-tinted for the dark background.
* **Reward:** No scoring/XP change — purely visual polish, matching the family's precedent.

### Phase 3: Edge Cases
* [x] Confirmed the grid's protected somatic colors render identically to before (verified via screenshot: cyan selected cell, light-cyan in-word highlight, white unselected cells).
* [x] Confirmed `isLoading`/`isError` states render inside the new dark shell (no light-mode flash) — verified via screenshot (no Firebase credentials available in this environment, so the real network-error path was exercised naturally).
* [x] Confirmed `GameShell.tsx`/`GameHeader.tsx`/`GameFooter.tsx` remain used as-is by their other consumers (`CravingBuster`, `ThoughtChallenge`, `FastLane`) — no edits to any of the three files.
* [x] 320px-wide screen check — no clipping or overflow in header/theme-banner/clue-bar/grid/footer.
* [x] Confirmed the mobile-keyboard `visualViewport` height-clamp behavior (`keyboardOpen` hiding the theme banner, hint/reveal buttons, and footer copy) is unaffected by the shell restructure — the same conditional logic, now just rendering inside the new dark wrapper instead of `GameShell`.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — 662/662 passing (no crossword unit test file exists yet — pre-existing gap, not introduced by this change).
* [x] **Visual/manual check:** `npm run dev` + Playwright screenshots via the `?mockUser=` auth bypass and a temporary local data stub (no Firebase credentials available in this environment, so `useDailyCrossword`'s real Firestore call was stubbed for rendering purposes only — reverted before commit, not part of the shipped diff). Verified idle, mid-solve (correct/in-progress states), and fully-solved/celebration states, at both 390px and 320px widths.
* [x] **The Subway Test:** N/A (no network/data dependency in this change beyond the pre-existing `useDailyCrossword` fetch, unchanged).
* [x] **The "Lost PIN" Test:** N/A (no encrypted data involved).
