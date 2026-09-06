// PROJ-116: "Find Your Recovery Season" quiz scoring engine.
// Pure logic, no React/DOM/Firestore — the quiz result is ephemeral
// (component state + sessionStorage only) and is never persisted server-side.

export type RecoveryPersona = 'david' | 'ned' | 'lisa' | 'walt' | 'maya' | 'jordan';

export const RECOVERY_PERSONAS: RecoveryPersona[] = ['david', 'ned', 'lisa', 'walt', 'maya', 'jordan'];

export type QuizQ1Answer = RecoveryPersona;
export type QuizQ2Answer = '12step' | 'smart' | 'dharma' | 'mat' | 'secular_cbt';
export type QuizQ3Answer = 'streak_shame' | 'privacy' | 'preachy' | 'overwhelmed';
export type QuizQ4Answer = 'late_night' | 'errand' | 'morning_reflection';

export interface QuizAnswers {
  q1: QuizQ1Answer;
  q2: QuizQ2Answer;
  q3: QuizQ3Answer;
  q4: QuizQ4Answer;
}

type ScoreVector = Record<RecoveryPersona, number>;

const ZERO_VECTOR: ScoreVector = { david: 0, ned: 0, lisa: 0, walt: 0, maya: 0, jordan: 0 };

// SPEC-WELCOMEPAGE-002 §7.3 — LOCKED scoring matrix.
const Q2_SCORES: Record<QuizQ2Answer, ScoreVector> = {
  '12step': { david: 1, ned: 1, lisa: 1, walt: 0, maya: 0, jordan: 0 },
  smart: { david: 0, ned: 0, lisa: 0, walt: 0, maya: 2, jordan: 1 },
  dharma: { david: 0, ned: 0, lisa: 0, walt: 2, maya: 1, jordan: 0 },
  mat: { david: 0, ned: 0, lisa: 0, walt: 0, maya: 0, jordan: 3 },
  secular_cbt: { david: 0, ned: 0, lisa: 0, walt: 0, maya: 3, jordan: 0 },
};

const Q3_SCORES: Record<QuizQ3Answer, ScoreVector> = {
  streak_shame: { david: 1, ned: 3, lisa: 0, walt: 0, maya: 0, jordan: 0 },
  privacy: { david: 0, ned: 0, lisa: 2, walt: 2, maya: 0, jordan: 2 },
  preachy: { david: 0, ned: 0, lisa: 0, walt: 0, maya: 1, jordan: 3 },
  overwhelmed: { david: 3, ned: 0, lisa: 1, walt: 0, maya: 0, jordan: 0 },
};

const Q4_SCORES: Record<QuizQ4Answer, ScoreVector> = {
  late_night: { david: 3, ned: 0, lisa: 0, walt: 0, maya: 0, jordan: 0 },
  errand: { david: 0, ned: 2, lisa: 3, walt: 0, maya: 0, jordan: 2 },
  morning_reflection: { david: 0, ned: 0, lisa: 0, walt: 3, maya: 2, jordan: 0 },
};

function addVectors(a: ScoreVector, b: ScoreVector): ScoreVector {
  const result = { ...a };
  for (const persona of RECOVERY_PERSONAS) {
    result[persona] += b[persona];
  }
  return result;
}

/**
 * Resolves quiz answers to a single persona per the locked §7.3 matrix.
 *
 * Tie-break: highest Q1 score wins (Q1 awards +3 to its target persona only,
 * so this only matters if the Q1 target is among the tied top scorers).
 * If none of the tied personas is the Q1 target (all tied at Q1=0), fall
 * back to highest combined Q3+Q4 score. If that also ties — a case the
 * source spec doesn't define — fall back to a fixed persona priority order
 * (RECOVERY_PERSONAS) so the result is always deterministic.
 */
export function scoreQuiz(answers: QuizAnswers): RecoveryPersona {
  const q1Vector: ScoreVector = { ...ZERO_VECTOR, [answers.q1]: 3 };
  const q3q4Vector = addVectors(Q3_SCORES[answers.q3], Q4_SCORES[answers.q4]);
  const totalVector = addVectors(addVectors(q1Vector, Q2_SCORES[answers.q2]), q3q4Vector);

  const maxTotal = Math.max(...RECOVERY_PERSONAS.map((p) => totalVector[p]));
  let tied = RECOVERY_PERSONAS.filter((p) => totalVector[p] === maxTotal);
  if (tied.length === 1) return tied[0];

  const maxQ1 = Math.max(...tied.map((p) => q1Vector[p]));
  tied = tied.filter((p) => q1Vector[p] === maxQ1);
  if (tied.length === 1) return tied[0];

  const maxQ3Q4 = Math.max(...tied.map((p) => q3q4Vector[p]));
  tied = tied.filter((p) => q3q4Vector[p] === maxQ3Q4);
  return tied[0];
}
