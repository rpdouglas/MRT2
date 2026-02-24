import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInsightHistory } from '../insights';
import * as firestore from 'firebase/firestore';

vi.mock('../firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual as any,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        getDocs: vi.fn()
    };
});

describe('🧠 Insights Engine (Firebase Recovery)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Spy on console.warn and console.error to keep test output clean
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should map Firestore docs to SavedInsight objects correctly', async () => {
        const mockDate = new Date();
        const mockSnapshot = {
            docs: [{
                id: 'insight_1',
                data: () => ({
                    uid: 'user_1',
                    type: 'workbook',
                    summary: 'You are doing great.',
                    createdAt: { toDate: () => mockDate }
                })
            }]
        };

        vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as any);

        const results = await getInsightHistory('user_1');
        
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('insight_1');
        expect(results[0].type).toBe('workbook');
        expect(results[0].createdAt).toBe(mockDate);
    });

    it('should gracefully return empty array and catch missing index errors', async () => {
        // Simulate Firebase throwing a missing index error
        vi.mocked(firestore.getDocs).mockRejectedValue(new Error("FAILED_PRECONDITION: The query requires an index"));

        const results = await getInsightHistory('user_1');
        
        // It should catch the error and return [] without crashing the app
        expect(results).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("MISSING INDEX"));
    });
});
