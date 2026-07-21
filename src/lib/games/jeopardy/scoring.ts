// src/lib/games/jeopardy/scoring.ts
// PROJ-72 (Recovery Games), Phase 3. Pure scoring functions extracted from
// the Jeopardy components for independent testability — same pattern as
// src/lib/games/cravingBuster.ts's calculateCravingBusterStats.
import type { JeopardyPlayer, JeopardyRound } from './types';

/** Double Jeopardy round doubles every question's point value. */
export function calculateAnswerScoreChange(questionValue: number, round: JeopardyRound, wasCorrect: boolean): number {
  const amount = round === 'double' ? questionValue * 2 : questionValue;
  return wasCorrect ? amount : -amount;
}

/** Final Jeopardy: a correct answer wins the wager, an incorrect one loses it. */
export function calculateWagerOutcome(wager: number, isCorrect: boolean): number {
  return isCorrect ? wager : -wager;
}

/** Ties resolve to whichever player appears first, matching the legacy game's behavior. */
export function determineWinner(players: JeopardyPlayer[]): JeopardyPlayer {
  return players.reduce(
    (prev, current) => (current.score > prev.score ? current : prev),
    { name: '', score: -Infinity },
  );
}
