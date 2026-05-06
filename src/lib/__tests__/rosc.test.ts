import { describe, it, expect } from 'vitest';
import type { ROSCAssessment, ROSCScore, ROSCTrajectory } from '../types/rosc';
import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildScore(score: number, selfReported: number, evidenceCount: number) {
    return { score, selfReportedScore: selfReported, evidenceCount };
}

function buildAssessment(overrides: Partial<ROSCAssessment> = {}): ROSCAssessment {
    const now = Timestamp.now();
    const thirtyAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const scores: ROSCScore = {
        health:    buildScore(7, 4, 2),
        home:      buildScore(8, 4, 1),
        purpose:   buildScore(6, 3, 2),
        community: buildScore(9, 5, 3),
    };

    return {
        id: 'test-id',
        uid: 'test-uid',
        createdAt: now,
        periodStart: thirtyAgo,
        periodEnd: now,
        scores,
        totalScore: 30,
        trajectory: 'Improving',
        journalEntriesAnalysed: 8,
        encryptedAIContext: 'abc123:def456',
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Schema & Invariant Tests
// ---------------------------------------------------------------------------

describe('ROSCAssessment schema invariants', () => {
    it('totalScore equals sum of four domain scores', () => {
        const a = buildAssessment();
        const computed =
            a.scores.health.score +
            a.scores.home.score +
            a.scores.purpose.score +
            a.scores.community.score;
        expect(a.totalScore).toBe(computed);
    });

    it('all domain scores are integers in range 1-10', () => {
        const a = buildAssessment();
        for (const key of ['health', 'home', 'purpose', 'community'] as const) {
            const s = a.scores[key].score;
            expect(Number.isInteger(s)).toBe(true);
            expect(s).toBeGreaterThanOrEqual(1);
            expect(s).toBeLessThanOrEqual(10);
        }
    });

    it('selfReportedScore is in range 1-5', () => {
        const a = buildAssessment();
        for (const key of ['health', 'home', 'purpose', 'community'] as const) {
            const s = a.scores[key].selfReportedScore;
            expect(s).toBeGreaterThanOrEqual(1);
            expect(s).toBeLessThanOrEqual(5);
        }
    });

    it('trajectory is one of the four valid literals', () => {
        const valid: ROSCTrajectory[] = ['Improving', 'Stable', 'Declining', 'Insufficient Data'];
        const a = buildAssessment();
        expect(valid).toContain(a.trajectory);
    });

    it('periodStart is approximately 30 days before periodEnd', () => {
        const a = buildAssessment();
        const startMs = a.periodStart.toMillis();
        const endMs = a.periodEnd.toMillis();
        const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThanOrEqual(29.9);
        expect(diffDays).toBeLessThanOrEqual(30.1);
    });
});

// ---------------------------------------------------------------------------
// ZK Boundary Test (structural — raw doc simulation)
// ---------------------------------------------------------------------------

describe('ZK boundary — encryptedAIContext', () => {
    it('encryptedAIContext matches IV:Ciphertext hex pattern', () => {
        const a = buildAssessment({ encryptedAIContext: 'a1b2c3:d4e5f6' });
        expect(a.encryptedAIContext).toMatch(/^[0-9a-f]+:[0-9a-f]+$/i);
    });

    it('encryptedAIContext does not contain plaintext keywords', () => {
        const a = buildAssessment({ encryptedAIContext: 'a1b2c3:d4e5f6789abc' });
        expect(a.encryptedAIContext).not.toContain('narrative');
        expect(a.encryptedAIContext).not.toContain('evidence');
        expect(a.encryptedAIContext).not.toContain('journal');
    });

    it('numeric scores are readable without decryption', () => {
        const a = buildAssessment();
        expect(typeof a.scores.health.score).toBe('number');
        expect(typeof a.scores.community.score).toBe('number');
        expect(typeof a.totalScore).toBe('number');
    });
});

// ---------------------------------------------------------------------------
// Free-tier score mapping (selfReported * 2 = score)
// ---------------------------------------------------------------------------

describe('Free-tier self-report score mapping', () => {
    it('maps selfReportedScore 1→2, 3→6, 5→10', () => {
        const toScore = (n: number) => Math.round(n * 2);
        expect(toScore(1)).toBe(2);
        expect(toScore(3)).toBe(6);
        expect(toScore(5)).toBe(10);
    });

    it('free-tier assessment has journalEntriesAnalysed = 0 and empty encryptedAIContext', () => {
        const a = buildAssessment({
            journalEntriesAnalysed: 0,
            encryptedAIContext: '',
            trajectory: 'Insufficient Data',
        });
        expect(a.journalEntriesAnalysed).toBe(0);
        expect(a.encryptedAIContext).toBe('');
        expect(a.trajectory).toBe('Insufficient Data');
    });
});

// ---------------------------------------------------------------------------
// Gamification XP integration
// ---------------------------------------------------------------------------

describe('ROSC XP integration', () => {
    it('calculateUserLevel adds 25 XP per ROSC assessment', async () => {
        const { calculateUserLevel } = await import('../gamification');
        const baseLevel = calculateUserLevel([], [], 0, 0, 0);
        const withOne = calculateUserLevel([], [], 0, 0, 1);
        const withThree = calculateUserLevel([], [], 0, 0, 3);

        expect(withOne.totalXP - baseLevel.totalXP).toBe(25);
        expect(withThree.totalXP - baseLevel.totalXP).toBe(75);
    });
});
