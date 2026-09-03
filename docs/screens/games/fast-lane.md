# Games → Fast Lane — `/games/fast-lane`

**Source:** `src/components/games/fastLane/FastLane.tsx` + `PlayerStatus.tsx`, `LocationBoard.tsx`, `GameLog.tsx`, `src/lib/games/fastLane/{gameData,turnEngine}.ts`
**Personas:** Walt — `personaTarget: 'Walt'`. The only Recovery Game built as a multi-week, multi-session simulation rather than a single sitting.
**Tier:** Free.
**Zero-knowledge status:** Autosaves continuously to `game_saves/{uid}_fast-lane` (fully AES-GCM encrypted, no plaintext fields) via `useGameSave`; writes one `game_progress/{id}` doc (partial encryption) only when the player wins.

## What it does

A multi-week economic life-management simulation, ported from a legacy `RecoverySimulatorGame`: work jobs, take courses, buy wellbeing items, upgrade housing, take/repay loans, invest/cash out stock — racing an AI rival ("Casey," renamed from the legacy's "John G") toward player-chosen wealth/wellbeing/education/career goals. Three difficulty presets (`DIFFICULTY_LEVELS`: Stabilization, Maintenance, Thriving) set starting cash (and, for Thriving, starting debt of $500).

## How it works

### The `game_saves` resumable-save mechanism
This is the one game using `useGameSave` (`src/hooks/useGameSave.ts`), not just `useGameProgress`. Every state-changing action (`persist()`) does two things at once: updates `localState` (for instant UI feedback) and fires `saveGame({ gameId: 'fast-lane', state })`, which encrypts the entire game-state object and `setDoc`s it to the deterministic doc ID `${uid}_fast-lane` — an upsert, not an append, so there's exactly one save doc per player at any time. On mount, `gameState = localState ?? save` — the component reads whatever `useGameSave` returned from Firestore if there's no in-memory state yet (a fresh page load / different device). If no save exists, `DifficultySelector` starts a brand-new game. All autosaves are best-effort (`.catch(() => {})`) — a failed save doesn't block or interrupt play.

### Turn structure
- **Weekly Planner** (`LocationBoard`) exposes every player action for the week: `applyWork`, `applyJobSearch`, `applyStudy`, `applyPurchaseItem`, `applyPurchaseApartment`, `applyRest`, `applyAttendSupportMeeting`, `applyShadyGig`, `applyTakeLoan`/`applyRepayLoan`, `applySellItem`, `applyInvest`/`applyCashOut` — all pure functions in `turnEngine.ts`, individually unit-tested. Actions are blocked once `player.inCrisis` is true (`runPlayerUpdate` short-circuits).
- **End Turn** (`handleEndTurn`) calls `resolveWeekEnd` (player finances/stress/crisis resolution) and `runRivalTurn` (AI rival's own turn) together, appends both sets of log messages plus a rival-tie note if applicable, and checks `checkWinCondition` (total wealth ≥ goal, wellbeing/education ≥ goal, `currentJob.id` ≥ goal job ID).
- **Crisis state:** stress reaching 100 sets `inCrisis`, blocking further player actions until it resolves — the mechanic that replaces the legacy's blocking "you lose" popup (see next section).
- **Win:** on `weekResult.playerWon`, `completeSession(wealth)` sets the final score, `recordProgress()` writes the one-time `game_progress` doc, and `clearSave()` deletes the `game_saves` doc — a completed game leaves no resumable save behind. The win screen supports the same `useShareImage` milestone-sharing pattern as Recovery Jeopardy's winner reveal.
- **Start over:** a two-tap confirm (`confirmingReset`) resets local state and calls `clearSave()`.

### Deliberate deviation from the legacy source
The legacy game used a blocking `alert()` for both the player's win and the rival's win, the latter hard-stopping play ("💔 JOHN G WINS!"). Here, the rival reaching her goals first is a calm, non-blocking log line ("No penalty for taking longer — keep going at your own pace") — the competitive comparison-bar mechanic (`PlayerStatus.tsx`) stays intact by design (a standing product decision to keep the AI-rival framing, not soften it), only the forced-loss popup was removed.

### Compliance
The legacy source's "Attend 12-Step Meeting" self-care action was renamed "Attend a Support Meeting" (Tradition 6 scrub), enforced by a denylist guard test (`gameData.test.ts`).

## Data model

| Collection | Field | Encrypted? | Notes |
|---|---|---|---|
| `game_saves/{uid}_fast-lane` | `encryptedState` | ✅ AES-GCM (whole blob) | `JSON.stringify` of the entire `FastLaneSaveState` (player, rival, goals, difficulty, log, week) — upserted via `setDoc`, deleted on win |
| `game_progress/{id}` | `encryptedStats` | ✅ AES-GCM | `{ weeksToWin, difficulty, finalRole }` — written once, on win |
| `game_progress/{id}` | `score` / `gameId` / `personaTarget` | ❌ Plaintext | `score` = rounded total wealth at win (`money + stockShares * stockValue`) |

## Gating & limits

None — free tier, `VaultGate`-protected (per `src/App.tsx`, like all `/games/*` routes except Craving Buster).

## Known gaps / debt

- A bug in the legacy port (win condition compared a free-text job title string that never matched any real title, making the career goal permanently unwinnable) was fixed during the PROJ-72 port by targeting a real `careerJobId` — noted here as history, not a current gap.
- This is the only Recovery Game covered by the automated Subway Test (`e2e/golden-paths/subway.spec.ts`, PROJ-73) for offline-then-resume behavior, specifically because it's the only game with genuine multi-session state worth exercising that way.

## Related docs

- `docs/screens/games/README.md` — `game_progress` vs `game_saves` distinction, shared mechanics.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 2 (Fast Lane subsection) and §5 (Subway Test detail) — full port history, deviations, and test coverage.
