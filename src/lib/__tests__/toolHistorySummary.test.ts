/**
 * src/lib/__tests__/toolHistorySummary.test.ts
 * PROJ-50 §5: Tools Hub Redesign
 */
import { describe, it, expect } from 'vitest';
import { HEADLINE_FIELD, humanizeKey, getFieldLabel, formatFieldValueText } from '../toolHistorySummary';

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

    describe('getFieldLabel', () => {
        it('returns the real question text for a static mapped field', () => {
            expect(getFieldLabel('ABC', 'activatingEvent', {})).toBe(
                'What happened? Describe just the facts — what you saw, heard, or experienced.'
            );
        });

        it('returns a dynamically templated question using another field in the same payload', () => {
            expect(getFieldLabel('FIVE_QUESTIONS', 'q1Explanation', { thought: 'I need this drink' })).toBe(
                'Is the thought "I need this drink" true?'
            );
        });

        it('falls back to the tool\'s own placeholder text when the referenced field is empty', () => {
            expect(getFieldLabel('FIVE_QUESTIONS', 'q1Explanation', { thought: '' })).toBe(
                'Is the thought "this thought" true?'
            );
        });

        it('falls back to humanizeKey for an unmapped field on a known tool type', () => {
            expect(getFieldLabel('CBA', 'someNewField', {})).toBe('Some New Field');
        });

        it('falls back to humanizeKey when toolType is undefined', () => {
            expect(getFieldLabel(undefined, 'activatingEvent', {})).toBe('Activating Event');
        });

        it('falls back to humanizeKey for a tool type with no mapping (e.g. no shipped UI yet)', () => {
            expect(getFieldLabel('SMART_GOAL', 'specific', {})).toBe('Specific');
        });
    });

    describe('formatFieldValueText', () => {
        it('formats an emotion-intensity array inline', () => {
            expect(formatFieldValueText('THOUGHT_RECORD', [{ emotion: 'Anxious', intensity: 80 }, { emotion: 'Sad', intensity: 30 }]))
                .toBe('Anxious 80%, Sad 30%');
        });

        it('formats an array of plain objects using field labels, excluding the id key', () => {
            const personas = [{ id: 1, name: 'The Critic', action: 'You always fail.', result: "That's not true." }];
            expect(formatFieldValueText('PERSONIFY', personas)).toBe(
                "Rogue's Name: The Critic, The Lie It Tells: You always fail., The Truth (Disarm): That's not true."
            );
        });

        it('joins a plain string array with commas', () => {
            expect(formatFieldValueText('CBA', ['Relief from stress', 'Fits in socially'])).toBe('Relief from stress, Fits in socially');
        });

        it('formats a boolean as Yes/No', () => {
            expect(formatFieldValueText('FIVE_QUESTIONS', true)).toBe('Yes');
            expect(formatFieldValueText('FIVE_QUESTIONS', false)).toBe('No');
        });

        it('stringifies a plain value', () => {
            expect(formatFieldValueText('CBA', 'Drinking')).toBe('Drinking');
        });
    });
});
