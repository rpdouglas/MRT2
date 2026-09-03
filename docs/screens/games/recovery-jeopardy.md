# Games → Recovery Jeopardy — `/games/recovery-jeopardy`

**Source:** `src/components/games/jeopardy/RecoveryJeopardy.tsx` + `PlayerSetup.tsx`, `JeopardyBoard.tsx`, `Scoreboard.tsx`, `QuestionModal.tsx`, `FinalJeopardy.tsx`, `src/lib/games/jeopardy/scoring.ts` + `jeopardyData.ts`
**Personas:** Lisa (sponsor) — `personaTarget: 'Lisa'`. The one deliberately **multiplayer, pass-the-device** Recovery Game (1–3 players/teams), meant for a sponsor/sponsee session or a home-group activity.
**Tier:** Free.
**Zero-knowledge status:** Writes `game_progress/{id}` once, at Final Jeopardy reveal — `encryptedStats` (AES-GCM) holds the full player/score roster; `score`/`gameId`/`personaTarget`/`createdAt` plaintext.

## What it does

A ported version of a legacy local trivia game: 2 standard rounds (6 categories × 5 questions each, $ values) plus a wagering Final Jeopardy round. Self-graded (honor-system) — the app never checks free-text answers against the real one except in Final Jeopardy, where it does a case-insensitive string match.

## How it works

- **Setup:** `PlayerSetup` picks 1–3 players/teams and names (default "Team 1/2/3").
- **Board:** 12 categories are shuffled once per game from the full pool (`jeopardyData.categories`) and split 6/6 across the standard round and Double Jeopardy. `TOTAL_QUESTIONS_PER_ROUND = 30` (6×5) gates the round transition: `jeopardy → double → final`.
- **Scoring per question** (`calculateAnswerScoreChange`, `src/lib/games/jeopardy/scoring.ts`): Double Jeopardy doubles every question's value; a correct answer adds the value, incorrect subtracts it. An incorrect answer also rotates to the next player (`currentPlayerIndex`).
- **Self-grading** (`QuestionModal.tsx`): the player types a free-text answer (not checked), clicks "Reveal Answer," sees the real answer, then the group honestly clicks "We Were Correct" / "We Were Incorrect" — same honor-system design as the legacy game, matching how a pass-the-device trivia game is actually played.
- **Final Jeopardy** (`FinalJeopardy.tsx`): each player wagers up to their current score, answers the same final question, and — unlike the regular rounds — the app auto-grades this one (`answers[index].trim().toLowerCase() === finalQuestion.answer.toLowerCase()`), applying `calculateWagerOutcome` (win/lose the wager).
- **Compliance:** `docs/projects/72_RECOVERY_GAMES.md` documents a full Tradition-6 content scrub of the 24-category pool (7 categories renamed/rewritten to drop fellowship-specific names, 5 paraphrased away from verbatim Step text), enforced going forward by a denylist guard test (`jeopardyData.test.ts`).
- **Completion & sharing:** `FinalJeopardy`'s reveal stage calls `onComplete(finalPlayers)` exactly once, which fires `recordProgress` with the full roster and the winner (`determineWinner` — ties resolve to whichever player appears first). `useShareImage` (extracted from `SobrietyHero.tsx`'s milestone-share pattern) lets the group share a PNG of the final-scores card via the Web Share API or download fallback.
- **Shell:** does **not** use `GameShell` — a self-contained dark-immersive full-bleed shell (`GameSessionProvider` wrapped directly), matching `GoalLadder.tsx`'s visual family. `JeopardyBoard` itself is deliberately styled to look like the real Jeopardy board rather than the app's own chrome; `Scoreboard`/`QuestionModal`/`FinalJeopardy` keep light cards floating on the dark shell.

## Data model

| Field on `game_progress/{id}` | Encrypted? | Value |
|---|---|---|
| `gameId` | ❌ Plaintext | `'recovery-jeopardy'` |
| `personaTarget` | ❌ Plaintext | `'Lisa'` |
| `score` | ❌ Plaintext | Winning player/team's final score |
| `encryptedStats` | ✅ AES-GCM | `{ players: [{ name, score }, ...], winner: string }` |

Written once, at Final Jeopardy reveal — not per-round.

## Gating & limits

None — free tier, and, unlike Craving Buster, **does** require `VaultGate` (per `src/App.tsx`) since it isn't a crisis-adjacent flow.

## Known gaps / debt

- None specific to this game beyond the standing content-compliance requirement (any future category edit must stay clear of the denylist).

## Related docs

- `docs/screens/games/README.md` — shared mechanics, shell styles.
- `docs/projects/72_RECOVERY_GAMES.md` §4 Phase 2 — port history and Tradition-6 compliance scrub detail.
