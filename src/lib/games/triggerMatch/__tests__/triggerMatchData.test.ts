import { describe, it, expect } from 'vitest';
import { TRIGGER_MATCH_SCENARIOS, buildTriggerMatchItems } from '../triggerMatchData';

const VALID_CATEGORIES = new Set(['Hungry', 'Angry', 'Lonely', 'Tired', 'Social', 'Environmental']);

describe('🧩 Trigger Match data', () => {
  it('every scenario is tagged with a valid trigger category', () => {
    for (const scenario of TRIGGER_MATCH_SCENARIOS) {
      expect(VALID_CATEGORIES.has(scenario.category)).toBe(true);
    }
  });

  it('covers every H.A.L.T. category plus Social and Environmental', () => {
    const covered = new Set(TRIGGER_MATCH_SCENARIOS.map((s) => s.category));
    expect(covered).toEqual(VALID_CATEGORIES);
  });

  it('builds quiz items with a unique, valid option set including the correct answer', () => {
    const items = buildTriggerMatchItems();
    expect(items).toHaveLength(TRIGGER_MATCH_SCENARIOS.length);
    for (const item of items) {
      expect(item.options).toHaveLength(4);
      expect(item.options).toContain(item.correctOption);
      expect(new Set(item.options).size).toBe(4);
      for (const option of item.options) {
        expect(VALID_CATEGORIES.has(option)).toBe(true);
      }
    }
  });

  it('has non-empty explanations for every scenario', () => {
    for (const scenario of TRIGGER_MATCH_SCENARIOS) {
      expect(scenario.explanation.trim().length).toBeGreaterThan(0);
    }
  });
});
