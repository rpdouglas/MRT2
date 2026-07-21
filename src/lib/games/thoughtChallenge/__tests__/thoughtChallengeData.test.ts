import { describe, it, expect } from 'vitest';
import { THOUGHT_CHALLENGE_SCENARIOS, buildThoughtChallengeItems, VALID_DISTORTION_LABELS } from '../thoughtChallengeData';

describe('🧠 Thought Challenge data', () => {
  it('every scenario is tagged with a real distortion label', () => {
    for (const scenario of THOUGHT_CHALLENGE_SCENARIOS) {
      expect(VALID_DISTORTION_LABELS.has(scenario.distortion)).toBe(true);
    }
  });

  it('every distractor is a real distortion label, distinct from the correct answer', () => {
    for (const scenario of THOUGHT_CHALLENGE_SCENARIOS) {
      expect(scenario.distractors).toHaveLength(3);
      for (const distractor of scenario.distractors) {
        expect(VALID_DISTORTION_LABELS.has(distractor)).toBe(true);
        expect(distractor).not.toBe(scenario.distortion);
      }
      // No duplicate options within one scenario's choice set.
      expect(new Set(scenario.distractors).size).toBe(3);
    }
  });

  it('covers every one of the 12 distortions at least once', () => {
    const covered = new Set(THOUGHT_CHALLENGE_SCENARIOS.map((s) => s.distortion));
    expect(covered.size).toBe(VALID_DISTORTION_LABELS.size);
  });

  it('builds quiz items with the correct option present in its own options list', () => {
    const items = buildThoughtChallengeItems();
    expect(items).toHaveLength(THOUGHT_CHALLENGE_SCENARIOS.length);
    for (const item of items) {
      expect(item.options).toHaveLength(4);
      expect(item.options).toContain(item.correctOption);
      expect(new Set(item.options).size).toBe(4);
    }
  });
});
