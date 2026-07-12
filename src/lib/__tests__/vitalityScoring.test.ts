import { describe, it, expect } from 'vitest';
import { calculateBioBalance, inferMoodFromRecentEntries } from '../vitalityScoring';

describe('🧭 calculateBioBalance', () => {
    it('returns 0 when no relevant tags are present', () => {
        expect(calculateBioBalance([])).toBe(0);
        expect(calculateBioBalance([{ tags: ['SomethingElse'] }])).toBe(0);
    });

    it('adds 33.3 per pillar (Movement, Nutrition, Mindfulness/Meditation)', () => {
        expect(calculateBioBalance([{ tags: ['Vitality', 'Movement'] }])).toBeCloseTo(33.3);
        expect(calculateBioBalance([
            { tags: ['Vitality', 'Movement'] },
            { tags: ['Vitality', 'Nutrition'] },
        ])).toBeCloseTo(66.6);
    });

    it('treats Mindfulness and Meditation tags as the same pillar', () => {
        expect(calculateBioBalance([{ tags: ['Mindfulness'] }])).toBeCloseTo(33.3);
        expect(calculateBioBalance([{ tags: ['Meditation'] }])).toBeCloseTo(33.3);
        expect(calculateBioBalance([{ tags: ['Mindfulness'] }, { tags: ['Meditation'] }])).toBeCloseTo(33.3);
    });

    it('caps at 100 when all three pillars are logged', () => {
        const logs = [{ tags: ['Movement'] }, { tags: ['Nutrition'] }, { tags: ['Mindfulness'] }];
        expect(calculateBioBalance(logs)).toBeLessThanOrEqual(100);
        expect(calculateBioBalance(logs)).toBeCloseTo(99.9);
    });
});

describe('🧠 inferMoodFromRecentEntries', () => {
    it('defaults to 5 with no entries', () => {
        expect(inferMoodFromRecentEntries([])).toBe(5);
    });

    it('defaults to 5 when no entries have a valid positive moodScore', () => {
        expect(inferMoodFromRecentEntries([{ moodScore: 0 }, {}])).toBe(5);
    });

    it('averages valid mood scores', () => {
        expect(inferMoodFromRecentEntries([{ moodScore: 8 }, { moodScore: 6 }, { moodScore: 7 }])).toBe(7);
    });

    it('ignores entries beyond the most recent 7', () => {
        // First 7 entries: 10,2,10,2,10,2,10 -> sum 46 -> avg 6.57 -> rounds to 7.
        // An 8th entry of 2 would pull the average down to 6 if it were included.
        const entries = [
            { moodScore: 10 }, { moodScore: 2 }, { moodScore: 10 }, { moodScore: 2 },
            { moodScore: 10 }, { moodScore: 2 }, { moodScore: 10 }, { moodScore: 2 },
        ];
        expect(inferMoodFromRecentEntries(entries)).toBe(7);
    });
});
