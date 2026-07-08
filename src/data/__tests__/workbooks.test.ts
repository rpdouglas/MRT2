/**
 * src/data/__tests__/workbooks.test.ts
 * Guardrail for the workbook content data model. Two of these assertions are
 * intentionally written *before* Project 55's Steps 2-11 content rewrite and are
 * expected to fail until that rewrite lands — they document the target shape
 * (no templated placeholder text, unique per-question context for Steps 2-11)
 * so the content work has a concrete definition of done.
 */
import { describe, it, expect } from 'vitest';
import { WORKBOOKS, getWorkbook, type Question } from '../workbooks';

const KNOWN_WORKBOOK_IDS = ['general_recovery', '12_steps', 'recovery_dharma', 'womens_recovery'];
const PLACEHOLDER_PATTERN = /Reflection Q\d/;

describe('📚 Workbook Data Model', () => {
    describe('getWorkbook', () => {
        it.each(KNOWN_WORKBOOK_IDS)('returns a defined workbook for id "%s"', (id) => {
            expect(getWorkbook(id)).toBeDefined();
        });

        it('returns undefined for an unknown id', () => {
            expect(getWorkbook('not_a_real_workbook')).toBeUndefined();
        });
    });

    describe('structural sanity across all workbooks', () => {
        it('every workbook has at least one section', () => {
            for (const wb of WORKBOOKS) {
                expect(wb.sections.length).toBeGreaterThan(0);
            }
        });

        it('every section has at least one question', () => {
            for (const wb of WORKBOOKS) {
                for (const sec of wb.sections) {
                    expect(sec.questions.length).toBeGreaterThan(0);
                }
            }
        });

        it('every input-type question has non-empty text', () => {
            for (const wb of WORKBOOKS) {
                for (const sec of wb.sections) {
                    for (const q of sec.questions.filter((q: Question) => q.type !== 'read_only')) {
                        expect(q.text.trim().length).toBeGreaterThan(0);
                    }
                }
            }
        });

        it('no question text contains the old templated placeholder pattern ("Reflection Q1", etc.)', () => {
            for (const wb of WORKBOOKS) {
                for (const sec of wb.sections) {
                    for (const q of sec.questions) {
                        expect(q.text).not.toMatch(PLACEHOLDER_PATTERN);
                    }
                }
            }
        });

        it('the total answerable (non-read_only) question count across all workbooks matches the known baseline', () => {
            const total = WORKBOOKS.reduce(
                (sum, wb) => sum + wb.sections.reduce(
                    (s, sec) => s + sec.questions.filter((q: Question) => q.type !== 'read_only').length, 0
                ), 0
            );
            // Content authoring (Project 55) swaps placeholder text for real text 1:1 —
            // it should not change question counts. Update this constant only if a
            // workbook's question count intentionally changes.
            expect(total).toBe(280);
        });
    });

    describe('12_steps workbook shape', () => {
        const twelveSteps = getWorkbook('12_steps')!;

        it('has exactly 12 sections, one per step', () => {
            expect(twelveSteps.sections).toHaveLength(12);
        });

        it.each(twelveSteps.sections.map((sec, i) => [i + 1, sec] as const))(
            'Step %i has exactly 16 questions (1 read_only intro + 15 input)',
            (_stepNum, sec) => {
                expect(sec.questions).toHaveLength(16);
                expect(sec.questions.filter((q: Question) => q.type === 'read_only')).toHaveLength(1);
                expect(sec.questions.filter((q: Question) => q.type !== 'read_only')).toHaveLength(15);
            }
        );

        it.each(twelveSteps.sections.map((sec, i) => [i + 1, sec] as const))(
            'Step %i preserves the s{n}_intro / s{n}_q1..q15 id convention',
            (stepNum, sec) => {
                expect(sec.questions[0].id).toBe(`s${stepNum}_intro`);
                for (let i = 1; i <= 15; i++) {
                    expect(sec.questions[i].id).toBe(`s${stepNum}_q${i}`);
                }
            }
        );

        // Steps 2-11 are the ones being rewritten from templated placeholder content
        // to real, step-specific questions with a unique context per question.
        it.each(twelveSteps.sections.slice(1, 11).map((sec, i) => [i + 2, sec] as const))(
            'Step %i has a unique, non-empty context string per input question',
            (_stepNum, sec) => {
                const inputQuestions = sec.questions.filter((q: Question) => q.type !== 'read_only');
                const contexts = inputQuestions.map((q: Question) => q.context);

                for (const context of contexts) {
                    expect(context && context.trim().length).toBeTruthy();
                }
                expect(new Set(contexts).size).toBe(contexts.length);
            }
        );
    });
});
