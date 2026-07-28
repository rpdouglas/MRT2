# 📁 Project 86: Recovery Jeopardy Immersive Shell Restyle

**Status:** ✅ Shipped
**Primary Persona:** Lisa (Recovery Jeopardy's `recordProgress` persona target; the setup screen's group/multiplayer framing is also the game's Games-Hub "groups" tile identity)
**Objective:** Restyle Recovery Jeopardy's surrounding shell (header, footer, page background) to match Goal Ladder's dark-immersive full-bleed treatment (PROJ-85) across every round — setup, both trivia rounds, and Final Jeopardy — while leaving the actual Jeopardy board (the category/dollar-value grid) exactly as it is, since it's intentionally styled to look like the real TV-show board.

---

## 1. The Executive Summary
**User Story:** As Lisa running a Recovery Jeopardy session with her group, I want the game's chrome (header/footer/background) to feel as polished and "Vibrant Momentum" as the rest of the app's game screens throughout the whole session, not just flip back to plain light chrome once the group starts playing.
**Competitive Gap:** N/A — visual polish only, no new mechanic. Lightweight spec per protocol (written alongside implementation, same category as PROJ-85's retroactive lightweight spec): purely presentational, no new data/schema/AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Purely presentational — player/team names entered here were already plaintext locally-held UI state (not persisted anywhere; `game_progress` only stores the eventual winner's name/score, unchanged by this change).
* [x] **Encryption Strategy:** N/A — no new data touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes. Modified: `src/components/games/jeopardy/RecoveryJeopardy.tsx` (every round — `setup`/`jeopardy`/`double`/`final` — now renders inside one persistent dark-immersive full-bleed shell instead of `GameShell`'s light header/footer; `GameShell` is bypassed entirely in favor of `GameSessionProvider` + inline header/footer chrome, mirroring `GoalLadder.tsx`'s pattern), `src/components/games/jeopardy/PlayerSetup.tsx` (restyled card/inputs/buttons for the dark scene; all logic and copy — including the `"Group Setup"`/`"Start Game"` strings asserted on by `RecoveryJeopardy.test.tsx` — unchanged), `Scoreboard.tsx`/`QuestionModal.tsx`/`FinalJeopardy.tsx` (container `shadow`/`ring`/`border` touched up so their unchanged light cards read as intentional "light cards on a dark stage" rather than an unstyled leftover — no color/text/logic changes inside them). `JeopardyBoard.tsx` is completely untouched.

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* No new hooks or Firebase rules. `RecoveryJeopardy.tsx`'s existing round/scoring state machine (`setup` → `jeopardy` → `double` → `final`) is untouched — only which JSX chrome wraps the `setup` round changed.

### Phase 2: UI/UX & Gamification
* **File:** `src/components/games/jeopardy/RecoveryJeopardy.tsx`
  * One persistent full-bleed dark-immersive background (`linear-gradient(160deg,#2E1A47,#1B0F2E)` + ambient glow blobs) across all rounds, same visual family as `GoalLadder.tsx`/`GlassCard.tsx`/`ROSCAssessmentCard.tsx`/`UrgeSurfer.tsx`. Minimal header (title + score chip once `phase !== 'idle'`, mirroring `GoalLadder.tsx`'s trophy chip) and footer (Exit always; Pause/Resume conditionally on `phase`, mirroring `GoalLadder.tsx`'s footer) replace `GameHeader`/`GameFooter` for every round, not just `setup`.
  * Accent color: `#C084FC` ("groups" purple, already used for Recovery Jeopardy's icon tint on the Games Hub list) instead of Goal Ladder's Ned-teal, since this game isn't persona-exclusive the way Goal Ladder is.
  * Inner content max-width stays `max-w-[420px]` for `setup` (matching the `PlayerSetup` card's width) and widens to `max-w-2xl` for `jeopardy`/`double`/`final` (unchanged from `GameShell`'s prior width, since `JeopardyBoard`'s 6-column grid needs the room).
  * `JeopardyBoard.tsx` itself: zero changes — still the indigo/slate grid that intentionally looks like the real Jeopardy board.
* **Files:** `src/components/games/jeopardy/Scoreboard.tsx`, `QuestionModal.tsx`, `FinalJeopardy.tsx`
  * Container-only touch-up (`shadow-sm border-slate-200` → `shadow-xl shadow-black/40 border-white/10`, and a `ring-1 ring-white/10` added to `QuestionModal`'s panel) so each stays visually a plain light card but reads as deliberately floating on the new dark shell rather than an unstyled leftover. No colors, text, or logic inside any of the three changed.
* **File:** `src/components/games/jeopardy/PlayerSetup.tsx`
  * Glass card (`bg-white/[0.07] border-white/10 backdrop-blur-sm`) replacing the flat white card; `text-white`/`text-white/70` labels; player-count and "Start Game" buttons use the `#C084FC` accent; name inputs restyled for the dark background (`bg-white/10 border-white/20 text-white`).
* **Somatic Check:** No red/alarm states introduced. Setup is a neutral, welcoming pre-game screen; Exit is a neutral action per the original `GameFooter`'s anti-shame convention (docs/projects/72_RECOVERY_GAMES.md §4), preserved verbatim in the new inline footer.
* **Reward:** N/A — no scoring/XP change, purely visual polish for the shell surrounding every round.

### Phase 3: Edge Cases
* [x] Confirmed `RecoveryJeopardy.test.tsx` (renders `PlayerSetup` for real, unmocked, and drives the full setup→jeopardy→double→final flow via stubbed `JeopardyBoard`/`QuestionModal`/`FinalJeopardy`) still passes unmodified — the restyle only changed class names/chrome placement, not any text, state, or wiring the test asserts on.
* [x] Confirmed the previously separate `"← Back to Games"` link (rendered below `PlayerSetup` in the old `GameShell`-wrapped layout) is no longer needed — the persistent dark footer's Exit button covers the same "leave setup" action, matching Goal Ladder's convention of one Exit affordance rather than two.
* [x] Confirmed Pause/Resume — previously always available across all non-setup rounds via `GameShell`'s single wrap — behaves identically now that the header/footer are assembled inline per-round instead of via one shared `GameShell`: `phase` still lives in the single `GameSessionProvider` wrapping the whole component, so pausing during `jeopardy`/`double`/`final` is unchanged.
* [x] `GameShell.tsx`, `GameHeader.tsx`, `GameFooter.tsx` themselves are untouched — still used as-is by `CravingBuster`/`ThoughtChallenge`/`TriggerMatch`/`FastLane`.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — full suite (662/662) passing, including `RecoveryJeopardy.test.tsx` unmodified (setup screen renders, full setup→jeopardy→double→final flow completes, `recordProgress` called with the winner).
* [x] **Visual/manual check:** `npm run dev` + Playwright screenshots via the `?mockUser=` auth bypass (no real credentials available in this environment) — dark full-bleed shell renders correctly across setup, the trivia board (unchanged grid, lifted Scoreboard card), an open question modal (lifted panel), and Final Jeopardy's wager stage (lifted card) — header score chip and footer Exit/Pause/Resume all behave correctly per round.
* [x] **The Subway Test:** N/A (no network/data dependency in this change).
* [x] **The "Lost PIN" Test:** N/A (no encrypted data involved).
