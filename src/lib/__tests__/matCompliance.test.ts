import { describe, it, expect } from 'vitest';
import { format, subDays } from 'date-fns';
import { computeMatComplianceRate } from '../matCompliance';
import type { MatDoseLog } from '../db';

function doseOn(daysAgo: number): MatDoseLog {
    return {
        uid: 'u1',
        date: format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'),
        loggedAt: {} as MatDoseLog['loggedAt'],
        isEncrypted: false,
    };
}

describe('computeMatComplianceRate', () => {
    it('returns 100 when every day in the window has a logged dose', () => {
        const doses = [0, 1, 2, 3, 4, 5, 6].map(doseOn);
        expect(computeMatComplianceRate(doses, 7)).toBe(100);
    });

    it('is forgiving of one missed day, not zero — same shape as rhythmScore', () => {
        const doses = [1, 2, 3, 4, 5, 6].map(doseOn); // day 0 missed
        expect(computeMatComplianceRate(doses, 7)).toBe(86); // 6/7 rounded
    });

    it('returns 0 for an empty dose history', () => {
        expect(computeMatComplianceRate([], 14)).toBe(0);
    });

    it('dedupes multiple entries on the same day rather than double-counting', () => {
        const doses = [doseOn(0), doseOn(0), doseOn(1)];
        expect(computeMatComplianceRate(doses, 14)).toBe(Math.round((2 / 14) * 100));
    });

    it('ignores doses outside the requested window', () => {
        const doses = [doseOn(0), doseOn(20)]; // day 20 is outside a 14-day window
        expect(computeMatComplianceRate(doses, 14)).toBe(Math.round((1 / 14) * 100));
    });

    it('returns 0 for a non-positive window', () => {
        expect(computeMatComplianceRate([doseOn(0)], 0)).toBe(0);
    });
});
