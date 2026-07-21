import { describe, it, expect } from 'vitest';
import { calculateCravingBusterStats, CRAVING_BUSTER_TOTAL_CYCLES } from '../cravingBuster';

describe('🎮 calculateCravingBusterStats', () => {
    it('computes rhythm accuracy as a rounded percentage of hits over total cycles', () => {
        expect(calculateCravingBusterStats(6, 8)).toEqual({ tapsHit: 6, tapsTotal: 8, rhythmAccuracy: 75 });
    });

    it('returns 0% accuracy with zero total cycles instead of dividing by zero', () => {
        expect(calculateCravingBusterStats(0, 0)).toEqual({ tapsHit: 0, tapsTotal: 0, rhythmAccuracy: 0 });
    });

    it('clamps a hit count above the total down to the total (defensive, should never happen in practice)', () => {
        expect(calculateCravingBusterStats(10, 8)).toEqual({ tapsHit: 8, tapsTotal: 8, rhythmAccuracy: 100 });
    });

    it('clamps a negative hit count to zero', () => {
        expect(calculateCravingBusterStats(-3, 8)).toEqual({ tapsHit: 0, tapsTotal: 8, rhythmAccuracy: 0 });
    });

    it('full accuracy after completing every cycle in the standard game length', () => {
        expect(calculateCravingBusterStats(CRAVING_BUSTER_TOTAL_CYCLES, CRAVING_BUSTER_TOTAL_CYCLES).rhythmAccuracy).toBe(100);
    });
});
