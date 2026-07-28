# 📁 Project 86: Recovery Jeopardy Setup Screen Immersive Restyle

**Status:** ✅ Shipped
**Primary Persona:** Lisa (Recovery Jeopardy's `recordProgress` persona target; the setup screen's group/multiplayer framing is also the game's Games-Hub "groups" tile identity)
**Objective:** Restyle Recovery Jeopardy's "Group Setup" screen to match Goal Ladder's dark-immersive full-bleed treatment (PROJ-85), while leaving the actual Jeopardy board, scoreboard, question modal, and Final Jeopardy exactly as they are.

---

## 1. The Executive Summary
**User Story:** As Lisa setting up a Recovery Jeopardy session with her group, I want the setup screen to feel as polished and "Vibrant Momentum" as the rest of the app's game screens, instead of the plain white/indigo card left over from the original port.
**Competitive Gap:** N/A — visual polish only, no new mechanic. Lightweight spec per protocol (written alongside implementation, same category as PROJ-85's retroactive lightweight spec): purely presentational, no new data/schema/AI surface.

---

## 2. Security & Zero-Knowledge Audit 🛡️
* [x] **Data Sensitivity:** No. Purely presentational — player/team names entered here were already plaintext locally-held UI state (not persisted anywhere; `game_progress` only stores the eventual winner's name/score, unchanged by this change).
* [x] **Encryption Strategy:** N/A — no new data touched.
* [x] **Key Rotation:** N/A.

---

## 3. Schema & Architecture 🗄️
No Firestore, hook, or type changes. Modified: `src/components/games/jeopardy/RecoveryJeopardy.tsx` (the `setup` round now renders its own dark-immersive full-bleed screen instead of being hosted inside `GameShell`; all other rounds render unchanged, now assembled from `GameHeader`/`GameFooter` directly instead of via `GameShell`, since a second `GameShell` would add a conflicting second `GameSessionProvider`), `src/components/games/jeopardy/PlayerSetup.tsx` (restyled card/inputs/buttons for the dark scene; all logic and copy — including the `"Group Setup"`/`"Start Game"` strings asserted on by `RecoveryJeopardy.test.tsx` — unchanged).

---

## 4. Implementation Phases 🏗️

### Phase 1: Logic & State
* No new hooks or Firebase rules. `RecoveryJeopardy.tsx`'s existing round/scoring state machine (`setup` → `jeopardy` → `double` → `final`) is untouched — only which JSX chrome wraps the `setup` round changed.

### Phase 2: UI/UX & Gamification
* **File:** `src/components/games/jeopardy/RecoveryJeopardy.tsx`
  * `setup` round: full-bleed dark-immersive background (`linear-gradient(160deg,#2E1A47,#1B0F2E)` + ambient glow blobs), same visual family as `GoalLadder.tsx`/`GlassCard.tsx`/`ROSCAssessmentCard.tsx`/`UrgeSurfer.tsx`. Custom minimal header (title only, no score chip — score is 0 pre-game) and footer (Exit only — no Pause/Resume pre-game).
  * Accent color: `#C084FC` ("groups" purple, already used for Recovery Jeopardy's icon tint on the Games Hub list) instead of Goal Ladder's Ned-teal, since this game isn't persona-exclusive the way Goal Ladder is.
  * All other rounds (`jeopardy`/`double`/`final`) render pixel-identical to before — same `GameHeader`/`GameFooter` chrome, just imported directly instead of via `GameShell`.
* **File:** `src/components/games/jeopardy/PlayerSetup.tsx`
  * Glass card (`bg-white/[0.07] border-white/10 backdrop-blur-sm`) replacing the flat white card; `text-white`/`text-white/70` labels; player-count and "Start Game" buttons use the `#C084FC` accent; name inputs restyled for the dark background (`bg-white/10 border-white/20 text-white`).
* **Somatic Check:** No red/alarm states introduced. Setup is a neutral, welcoming pre-game screen; Exit is a neutral action per `GameFooter`'s existing anti-shame convention (docs/projects/72_RECOVERY_GAMES.md §4).
* **Reward:** N/A — no scoring/XP change, purely visual polish for the group-setup moment.

### Phase 3: Edge Cases
* [x] Confirmed `RecoveryJeopardy.test.tsx` (renders `PlayerSetup` for real, unmocked) still passes unmodified — the restyle only changed class names, not the `"Group Setup"`/`"Start Game"` text or `handleStart`/`onStartGame` wiring it asserts on.
* [x] Confirmed the previously separate `"← Back to Games"` link (rendered below `PlayerSetup` in the old `GameShell`-wrapped layout) is no longer needed — the new dark footer's Exit button covers the same "leave setup" action, matching Goal Ladder's convention of one Exit affordance rather than two.
* [x] `GameShell.tsx`, `GameHeader.tsx`, `GameFooter.tsx` themselves are untouched — still used as-is by `CravingBuster`/`ThoughtChallenge`/`TriggerMatch`/`FastLane`.

---

## 5. QA & Verification 🧪
* [x] **Unit Tests:** `npm run test:once` — `RecoveryJeopardy.test.tsx` passing unmodified (setup screen renders, full setup→jeopardy→double→final flow completes, `recordProgress` called with the winner).
* [x] **Visual/manual check:** `npm run dev`, visited `/games/recovery-jeopardy` — dark full-bleed purple setup screen renders correctly, starting a game transitions cleanly into the untouched light board/scoreboard, Exit from setup returns to `/games`.
* [x] **The Subway Test:** N/A (no network/data dependency in this change).
* [x] **The "Lost PIN" Test:** N/A (no encrypted data involved).
