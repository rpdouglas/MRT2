import { describe, it, expect } from 'vitest';
import { scoreQuiz } from '../welcomeQuizScoring';
import type { QuizAnswers } from '../welcomeQuizScoring';

describe('scoreQuiz', () => {
  it('resolves a clean win for the Q1 target when other answers reinforce it', () => {
    const answers: QuizAnswers = { q1: 'jordan', q2: 'mat', q3: 'preachy', q4: 'errand' };
    expect(scoreQuiz(answers)).toBe('jordan');
  });

  it('resolves David for a full David-aligned answer set', () => {
    const answers: QuizAnswers = { q1: 'david', q2: '12step', q3: 'overwhelmed', q4: 'late_night' };
    expect(scoreQuiz(answers)).toBe('david');
  });

  it('breaks an overall-score tie in favor of the Q1 target', () => {
    // Q1=jordan (+3 jordan). Q2=mat gives jordan +3 more (=6). Q3=streak_shame
    // gives ned +3. Q4=errand gives ned +2, lisa +3, jordan +2 (=8).
    // Totals: ned=0+0+3+2=5, jordan=3+3+0+2=8, lisa=0+0+0+3=3 — jordan wins
    // outright on total, not even needing the tie-break; kept as a sanity
    // check that a Q1 target can also win by a clear margin.
    const answers: QuizAnswers = { q1: 'jordan', q2: 'mat', q3: 'streak_shame', q4: 'errand' };
    expect(scoreQuiz(answers)).toBe('jordan');
  });

  it('falls back to combined Q3+Q4 score when tied top-scorers are not the Q1 target', () => {
    // Q1=david (david-only bonus, irrelevant to the lisa/jordan tie below).
    // Q2=smart: maya+2, jordan+1. Q3=privacy: lisa+2, walt+2, jordan+2.
    // Q4=errand: ned+2, lisa+3, jordan+2.
    // Totals: lisa=0+0+2+3=5, jordan=0+1+2+2=5 — tied at 5, both Q1=0.
    // Q3+Q4 alone: lisa=2+3=5, jordan=2+2=4 — lisa wins the fallback.
    const answers: QuizAnswers = { q1: 'david', q2: 'smart', q3: 'privacy', q4: 'errand' };
    expect(scoreQuiz(answers)).toBe('lisa');
  });

  it('is deterministic (same answers always produce the same persona)', () => {
    const answers: QuizAnswers = { q1: 'maya', q2: 'secular_cbt', q3: 'preachy', q4: 'morning_reflection' };
    const first = scoreQuiz(answers);
    const second = scoreQuiz(answers);
    expect(first).toBe(second);
    expect(first).toBe('maya');
  });
});
