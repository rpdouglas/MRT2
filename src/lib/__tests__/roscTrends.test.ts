import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildROSCTrendSeries, summariseTrendForA11y } from '../roscTrends';
import type { ROSCAssessment, ROSCScore } from '../types/rosc';

function buildScore(score: number): ROSCScore['health'] {
    return { score, selfReportedScore: 3, evidenceCount: 1 };
}

function buildAssessment(daysAgo: number, totalScore: number, overrides: Partial<ROSCAssessment> = {}): ROSCAssessment {
    const createdAt = Timestamp.fromDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));
    const perDomain = Math.round(totalScore / 4);
    return {
        id: `a-${daysAgo}`,
        uid: 'test-uid',
        createdAt,
        periodStart: createdAt,
        periodEnd: createdAt,
        scores: {
            health: buildScore(perDomain),
            home: buildScore(perDomain),
            purpose: buildScore(perDomain),
            community: buildScore(perDomain),
        },
        totalScore,
        trajectory: 'Stable',
        journalEntriesAnalysed: 5,
        encryptedAIContext: '',
        ...overrides,
    };
}

describe('buildROSCTrendSeries', () => {
    it('returns an empty array for no assessments', () => {
        expect(buildROSCTrendSeries([], 'monthly')).toEqual([]);
    });

    it('does not crash with exactly one assessment', () => {
        const points = buildROSCTrendSeries([buildAssessment(0, 30)], 'monthly');
        expect(points).toHaveLength(1);
        expect(points[0].total).toBe(30);
    });

    it('sorts ascending by date even when input is latest-first', () => {
        // getROSCAssessments returns orderBy('createdAt','desc') — latest first.
        const latestFirst = [
            buildAssessment(0, 32),
            buildAssessment(7, 28),
            buildAssessment(14, 20),
        ];
        const points = buildROSCTrendSeries(latestFirst, 'weekly');
        expect(points.map(p => p.total)).toEqual([20, 28, 32]);
        for (let i = 1; i < points.length; i++) {
            expect(points[i].ts).toBeGreaterThan(points[i - 1].ts);
        }
    });

    it('trims to the requested window, keeping the most recent points', () => {
        const assessments = Array.from({ length: 10 }, (_, i) => buildAssessment(i * 7, 10 + i));
        const points = buildROSCTrendSeries(assessments, 'weekly', 6);
        expect(points).toHaveLength(6);
        // Most recent 6 => totals 10..15 (i=0..5, since totalScore = 10+i and lower i = more recent)
        expect(points[points.length - 1].total).toBe(10);
        expect(points[0].total).toBe(15);
    });

    it('skips assessments with an unparseable createdAt instead of throwing', () => {
        const bad = buildAssessment(0, 30, { createdAt: 'not-a-date' as unknown as Timestamp });
        const good = buildAssessment(7, 20);
        const points = buildROSCTrendSeries([bad, good], 'monthly');
        expect(points).toHaveLength(1);
        expect(points[0].total).toBe(20);
    });
});

describe('summariseTrendForA11y', () => {
    it('describes an empty series', () => {
        expect(summariseTrendForA11y([])).toMatch(/no recovery capital check-ins yet/i);
    });

    it('describes a single-point series', () => {
        const points = buildROSCTrendSeries([buildAssessment(0, 24)], 'monthly');
        expect(summariseTrendForA11y(points)).toMatch(/one check-in so far/i);
    });

    it('describes an upward multi-point trend', () => {
        const points = buildROSCTrendSeries([buildAssessment(0, 32), buildAssessment(30, 20)], 'monthly');
        const summary = summariseTrendForA11y(points);
        expect(summary).toMatch(/up 12 points/i);
    });
});
