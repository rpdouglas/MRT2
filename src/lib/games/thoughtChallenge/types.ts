// src/lib/games/thoughtChallenge/types.ts
// PROJ-72 (Recovery Games), Phase 5.
export interface ThoughtChallengeScenario {
  thought: string;
  distortion: string; // must be one of DISTORTIONS' labels (src/lib/distortions.ts)
  distractors: [string, string, string]; // 3 other distortion labels
  explanation: string;
}

export interface ThoughtChallengeStats {
  correct: number;
  total: number;
}
