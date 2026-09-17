# 📁 Project 120: Daily Crossword On-Screen Keyboard

**Status:** ⚪ Planned
**Primary Persona:** All (same non-persona-exclusive scope as the Daily Crossword game itself, PROJ-79)
**Objective:** Replace the system/native mobile keyboard trigger in Daily Crossword with a custom, docked on-screen QWERTY keyboard (NYT-crossword-style), so typing never pops the OS keyboard, autocorrect bar, or causes the unpredictable layout collapse that currently forces `DailyCrossword.tsx` to hide its own chrome while the keyboard is open.

---

## 1. The Executive Summary
**User Story:** As any MRT user solving the Daily Crossword on a phone, I want a purpose-built on-screen keyboard docked to the bottom of the screen, so that the game's own clue bar and grid stay visible and stable instead of being shoved around (or hidden) by my phone's system keyboard.
**Competitive Gap:** N/A — presentational/UX parity with the standard crossword-app interaction pattern (NYT, etc.), not a competitive differentiator. Lightweight spec per protocol, same category as PROJ-88 (Daily Crossword Immersive Shell Restyle): purely presentational, no new data/schema/AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
*This section MUST be completed before any code is written.*
- [x] **Data Sensitivity:** No. Purely presentational input-mechanism change. `useDailyCrossword`, `useGameProgress`/`recordProgress`, and the `crossword_puzzles/{date}` / `game_progress/{id}` collections are all unchanged — nothing about how or what gets persisted is touched by this spec.
- [x] **Encryption Strategy:** N/A — no new data touched, no change to `src/lib/crypto.ts` usage.
- [x] **Key Rotation:** N/A — no new collection or field. `game_progress` coverage in `executePinRotation`/`executeCryptoShredding` (PROJ-79) is unaffected.

---

## 3. Schema & Architecture 🗄️
*Define the exact Firestore paths and TypeScript interfaces.*

**Firestore Collections Impacted:** None. No schema change.

**Types:** None new. `CrosswordGrid`/`CrosswordDirection`/`CrosswordSelection` (`src/lib/games/crossword/types.ts`) and `CrosswordWordEntry`/`CrosswordPuzzleRecord` (`src/lib/db.ts`) are all reused as-is.

**Files touched:**
* `src/components/games/crossword/DailyCrossword.tsx` — remove the hidden-`<input>` focus-to-trigger-native-keyboard mechanism; remove the `visualViewport`-driven `isKeyboardOpen` chrome-hiding logic (no longer needed once there's no native keyboard to react to); restructure layout to dock the new keyboard at the bottom with a sticky clue bar above it.
* `src/components/games/crossword/CrosswordKeyboard.tsx` *(new)* — the on-screen QWERTY component.
* `src/lib/games/crossword/crosswordLogic.ts` — extract `applyLetter`/`applyBackspace` pure functions out of the component (see Phase 1) so both the on-screen keys and a physical-keyboard listener call the same logic. `isKeyboardOpen` becomes dead code and is deleted along with its test coverage; `computeCellPx` is kept as-is (still needed for responsive grid width, unrelated to the native-keyboard-height concern it was previously paired with).

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* Extract the letter-entry and backspace bodies currently inline in `handleInput`/`handleKeyDown` (`DailyCrossword.tsx:151-188`) into two pure(ish) functions in `crosswordLogic.ts` — `applyLetter(grid, selection, direction, letter)` and `applyBackspace(grid, selection, direction)` — each returning the next grid + next selection, mirroring the existing `advanceCell`/`checkSolved` style. This is a refactor of existing logic, not new behavior.
* Add a `keydown` listener (scoped to the game's container ref, not a focused `<input>`) that maps physical-keyboard input — `/^[a-zA-Z]$/` → `applyLetter`, `Backspace` → `applyBackspace` — to the same two functions. This covers desktop/hardware-keyboard users, who keep typing normally; no on-screen keyboard is forced on them.
* Remove the hidden `<input>` entirely, along with `focusHidden()`/`inputRef` and the Android-IME `input`-event workaround described in the current file header comment — that workaround existed specifically to read native-keyboard `input` events, which no longer exist in this flow once cell taps stop focusing a text input.
* Remove the `viewport`/`visualViewport` resize effect and `isKeyboardOpen` (`crosswordLogic.ts:99-102`) plus its call site and unit test coverage — there is no more native keyboard whose height needs tracking.
* No React Query / hook changes. No new Firebase security rules.

### Phase 2: UI/UX & Gamification
* New `CrosswordKeyboard.tsx`: standard QWERTY rows + a backspace key, styled with the existing dark-glass shell treatment (`bg-white/[0.07] border-white/10 backdrop-blur-sm`) and the grid's established `SHELL_ACCENT`/`SOMATIC_SELECTED` cyan for key-press feedback. Keys are plain `<button type="button" onClick={...}>` calling `applyLetter`/`applyBackspace` — no focus, no native keyboard side effect.
* Layout, matching the reference screenshot: sticky clue bar directly above the keyboard (prev/next chevrons already exist conceptually via word navigation — reuse `wordAt`/`advanceCell` to wire them if not already present), keyboard docked to the bottom of the game area with a fixed, known height, grid scrollable in the remaining space between the header and the docked keyboard.
* **Somatic Check:** No correctness color-coding on keys (no green/red key states) — consistent with the existing "no wrong-answer flagging mid-solve" rule already enforced in this component. No new stress signal introduced; Exit/hint/reveal affordances are unchanged.
* **Reward:** No scoring/XP change — this game stays unscored (`score: 0`, excluded from `gameProgressCount` per PROJ-79 §4). Purely an input-mechanism swap.

### Phase 3: Edge Cases
* [ ] What happens if `navigator.onLine` is false? — Unaffected; this change touches only client-side input handling, not data fetching (`useDailyCrossword`'s existing offline behavior is untouched).
* [ ] What happens if `isVaultUnlocked` is false? — Unaffected; `/games/daily-crossword` still sits behind `VaultGate` as before (PROJ-79 §4 Phase 3), unchanged by this spec.
* [ ] What happens on a 320px wide screen (iPhone SE)? — Needs explicit verification: the on-screen keyboard's fixed key-row layout must not overflow or force horizontal scroll at 320px. (PROJ-79 §4 flagged the same check as an outstanding, non-blocking gap for the grid itself — this spec should close it for the new keyboard component specifically.)
* [ ] Real-device check: confirm the system/native keyboard genuinely never appears on iOS Safari and Android Chrome once the hidden `<input>` is removed — this is the core acceptance criterion and can't be fully proven by unit tests alone.
* [ ] Physical-keyboard desktop users: confirm typing still works end-to-end (letter entry, backspace, auto-advance) via the new `keydown` listener, with no regression versus today's hardware-keyboard experience.

---

## 5. QA & Verification 🧪
* [ ] **Unit Tests:** Extend `src/lib/games/crossword/__tests__/crosswordLogic.test.ts` to cover the extracted `applyLetter`/`applyBackspace` functions directly (letter write + auto-advance, backspace-on-filled-cell, backspace-on-empty-cell-moves-back, boundary/no-op cases at word start/end). Remove the now-dead `isKeyboardOpen` test cases.
* [ ] **The Subway Test:** N/A — no data/network dependency introduced or changed beyond the pre-existing `useDailyCrossword` fetch.
* [ ] **The "Lost PIN" Test:** N/A — no encrypted data involved, no schema change.
* [ ] **Manual/visual verification:** `npm run dev` + on-device (or emulator) check on iOS Safari and Android Chrome confirming the native keyboard never opens; 320px and 390px width checks for the new docked keyboard; desktop physical-keyboard smoke test.
