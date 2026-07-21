// src/lib/games/jeopardy/types.ts
// PROJ-72 (Recovery Games), Phase 3: legacy port of "Recovery Jeopardy" —
// a local pass-the-device, 1-3 player/team trivia game. Genuinely
// multiplayer (unlike every other Recovery Game), per the /planning
// decision in docs/projects/72_RECOVERY_GAMES.md Phase 3.
export interface JeopardyQuestion {
  question: string;
  answer: string;
  value: number;
}

export interface JeopardyCategory {
  name: string;
  questions: JeopardyQuestion[];
}

export interface JeopardyData {
  categories: JeopardyCategory[];
  finalJeopardy: {
    category: string;
    question: string;
    answer: string;
  };
}

export interface JeopardyPlayer {
  name: string;
  score: number;
}

export type JeopardyRound = 'setup' | 'jeopardy' | 'double' | 'final';

export interface SelectedQuestion {
  category: JeopardyCategory;
  question: JeopardyQuestion;
}
