import { describe, it, expect } from 'vitest';
import { getMilestone, getMilestoneLabel } from '../milestones';

describe('milestones.ts', () => {
    describe('getMilestone', () => {
        it('returns milestone number for standard milestones', () => {
            expect(getMilestone(30)).toBe(30);
            expect(getMilestone(60)).toBe(60);
            expect(getMilestone(365)).toBe(365);
        });

        it('returns milestone number for yearly milestones', () => {
            expect(getMilestone(730)).toBe(730); // 2 years
            expect(getMilestone(1095)).toBe(1095); // 3 years
        });

        it('returns null for non-milestone days', () => {
            expect(getMilestone(42)).toBeNull();
            expect(getMilestone(366)).toBeNull();
            expect(getMilestone(0)).toBeNull();
            expect(getMilestone(-5)).toBeNull();
        });
    });

    describe('getMilestoneLabel', () => {
        it('correctly formats days', () => {
            expect(getMilestoneLabel(1)).toBe('24 Hours');
            expect(getMilestoneLabel(7)).toBe('1 Week');
            expect(getMilestoneLabel(30)).toBe('1 Month');
            expect(getMilestoneLabel(365)).toBe('1 Year');
            expect(getMilestoneLabel(42)).toBe('42 Days');
        });

        it('correctly formats years', () => {
            expect(getMilestoneLabel(365)).toBe('1 Year');
            expect(getMilestoneLabel(730)).toBe('2 Years');
        });
    });
});
