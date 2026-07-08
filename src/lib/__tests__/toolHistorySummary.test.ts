/**
 * src/lib/__tests__/toolHistorySummary.test.ts
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect } from 'vitest';
import { HEADLINE_FIELD, humanizeKey } from '../toolHistorySummary';

describe('🏷️ toolHistorySummary', () => {
    describe('HEADLINE_FIELD', () => {
        it('maps each guided tool with a natural single-string field', () => {
            expect(HEADLINE_FIELD.CBA).toBe('behavior');
            expect(HEADLINE_FIELD.ABC).toBe('activatingEvent');
            expect(HEADLINE_FIELD.DENTS).toBe('scenario');
            expect(HEADLINE_FIELD.THOUGHT_RECORD).toBe('situation');
            expect(HEADLINE_FIELD.FIVE_QUESTIONS).toBe('thought');
        });

        it('omits tools with no natural single-string headline', () => {
            expect(HEADLINE_FIELD.LIFESTYLE_BALANCE).toBeUndefined();
            expect(HEADLINE_FIELD.PERSONIFY).toBeUndefined();
        });
    });

    describe('humanizeKey', () => {
        it('splits camelCase into title case words', () => {
            expect(humanizeKey('activatingEvent')).toBe('Activating Event');
            expect(humanizeKey('outcomeEmotions')).toBe('Outcome Emotions');
        });

        it('capitalizes a single lowercase word', () => {
            expect(humanizeKey('scenario')).toBe('Scenario');
        });

        it('handles a leading acronym-like run correctly', () => {
            expect(humanizeKey('q1Explanation')).toBe('Q1 Explanation');
        });
    });
});
