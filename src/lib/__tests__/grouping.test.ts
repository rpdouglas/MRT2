import { describe, it, expect } from 'vitest';
import { groupItemsByYearAndMonth } from '../grouping';
import { Timestamp } from 'firebase/firestore';

describe('grouping.ts', () => {
    describe('groupItemsByYearAndMonth', () => {
        it('correctly sorts an array of Timestamp objects', () => {
            const items = [
                { id: 1, createdAt: Timestamp.fromDate(new Date('2026-03-15T00:00:00Z')) },
                { id: 2, createdAt: Timestamp.fromDate(new Date('2026-03-20T00:00:00Z')) },
                { id: 3, createdAt: Timestamp.fromDate(new Date('2025-12-01T00:00:00Z')) },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(2); // March is index 2
            expect(grouped['2025'][11]).toHaveLength(1); // December is index 11
        });

        it('correctly sorts an array of Date objects', () => {
            const items = [
                { id: 1, createdAt: new Date('2026-03-15T00:00:00Z') },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(1);
        });

        it('correctly sorts an array of string dates', () => {
            const items = [
                { id: 1, createdAt: '2026-03-15T00:00:00Z' },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(1);
        });

        it('correctly sorts an array of numeric timestamps', () => {
            const items = [
                { id: 1, createdAt: new Date('2026-03-15T00:00:00Z').getTime() },
            ];

            const grouped = groupItemsByYearAndMonth(items);

            expect(grouped['2026'][2]).toHaveLength(1);
        });
    });
});
