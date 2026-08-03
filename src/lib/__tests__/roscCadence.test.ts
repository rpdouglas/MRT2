import { describe, it, expect } from 'vitest';
import {
    getROSCCadence,
    canCreateForCadence,
    roscPeriodKey,
    toDateSafe,
    daysUntilEligible,
} from '../roscCadence';
import { Timestamp } from 'firebase/firestore';

describe('getROSCCadence', () => {
    it('premium tier is weekly', () => {
        expect(getROSCCadence('premium')).toBe('weekly');
    });

    it('free tier (and undefined) is monthly', () => {
        expect(getROSCCadence('free')).toBe('monthly');
        expect(getROSCCadence(undefined)).toBe('monthly');
    });
});

describe('canCreateForCadence', () => {
    const now = new Date('2026-08-15T12:00:00Z');

    it('no prior assessment is always eligible', () => {
        expect(canCreateForCadence('weekly', null, now)).toBe(true);
        expect(canCreateForCadence('monthly', null, now)).toBe(true);
    });

    it('weekly: eligible at exactly 7 days, not before', () => {
        const sixDaysAgo = new Date('2026-08-09T12:00:00Z');
        const sevenDaysAgo = new Date('2026-08-08T12:00:00Z');
        const eightDaysAgo = new Date('2026-08-07T12:00:00Z');
        expect(canCreateForCadence('weekly', sixDaysAgo, now)).toBe(false);
        expect(canCreateForCadence('weekly', sevenDaysAgo, now)).toBe(true);
        expect(canCreateForCadence('weekly', eightDaysAgo, now)).toBe(true);
    });

    it('monthly: eligible only once the calendar month changes', () => {
        const earlierThisMonth = new Date('2026-08-01T12:00:00Z');
        const lastMonth = new Date('2026-07-20T12:00:00Z');
        expect(canCreateForCadence('monthly', earlierThisMonth, now)).toBe(false);
        expect(canCreateForCadence('monthly', lastMonth, now)).toBe(true);
    });

    it('the cross-tier case: same latest date, different cadence verdicts', () => {
        // 8 days ago, but still within the same calendar month as `now`.
        const eightDaysAgo = new Date('2026-08-07T12:00:00Z');
        expect(canCreateForCadence('weekly', eightDaysAgo, now)).toBe(true);
        expect(canCreateForCadence('monthly', eightDaysAgo, now)).toBe(false);
    });
});

describe('roscPeriodKey', () => {
    it('monthly key is stable across a whole calendar month', () => {
        const early = new Date('2026-08-01T00:00:00Z');
        const late = new Date('2026-08-31T23:00:00Z');
        expect(roscPeriodKey('monthly', early)).toBe(roscPeriodKey('monthly', late));
    });

    it('weekly key differs for dates in different ISO weeks within the same month', () => {
        const weekOne = new Date('2026-08-03T12:00:00Z');
        const weekTwo = new Date('2026-08-10T12:00:00Z');
        expect(roscPeriodKey('weekly', weekOne)).not.toBe(roscPeriodKey('weekly', weekTwo));
    });

    it('weekly key does not collide across a Dec/Jan year boundary', () => {
        const lateDec = new Date('2025-12-29T12:00:00Z');
        const earlyJan = new Date('2026-01-05T12:00:00Z');
        expect(roscPeriodKey('weekly', lateDec)).not.toBe(roscPeriodKey('weekly', earlyJan));
    });
});

describe('toDateSafe', () => {
    it('handles a Firestore Timestamp', () => {
        const ts = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'));
        expect(toDateSafe(ts)?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });

    it('handles an ISO string', () => {
        expect(toDateSafe('2026-01-01T00:00:00Z')?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });

    it('handles undefined/null', () => {
        expect(toDateSafe(undefined)).toBeNull();
        expect(toDateSafe(null)).toBeNull();
    });
});

describe('daysUntilEligible', () => {
    it('counts down to zero for a weekly cadence', () => {
        const now = new Date('2026-08-15T12:00:00Z');
        const latest = new Date('2026-08-12T12:00:00Z');
        expect(daysUntilEligible('weekly', latest, now)).toBe(4);
    });
});
