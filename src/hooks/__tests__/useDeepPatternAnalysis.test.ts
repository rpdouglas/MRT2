/**
 * src/hooks/__tests__/useDeepPatternAnalysis.test.ts
 * PROJ-50: Guided CBT/REBT Interactive Workflows
 * Verifies DRAFT-tagged (in-progress guided-tool) journal entries are excluded
 * from the Deep Pattern Recognition AI analysis pipeline.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeepPatternAnalysis } from '../useDeepPatternAnalysis';

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-uid' } }),
}));

vi.mock('../../contexts/EncryptionContext', () => ({
    useEncryption: () => ({ decrypt: vi.fn(async (c: string) => c.replace(/^ENC:/, '')) }),
}));

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

const mockDoc = (tags: string[], content: string) => ({
    tags,
    content: `ENC:${content}`,
    isEncrypted: true,
    moodScore: 5,
    createdAt: { toDate: () => new Date('2026-01-01') },
});

const { getDocsMock } = vi.hoisted(() => ({ getDocsMock: vi.fn() }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getDocs: getDocsMock,
    };
});

const { mockGenerateDeepPatternAnalysis } = vi.hoisted(() => ({ mockGenerateDeepPatternAnalysis: vi.fn() }));
vi.mock('../../lib/gemini', () => ({
    generateDeepPatternAnalysis: mockGenerateDeepPatternAnalysis,
}));

describe('🔎 useDeepPatternAnalysis — DRAFT exclusion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGenerateDeepPatternAnalysis.mockResolvedValue({
            pattern_summary: 'ok', core_triggers: [], hidden_correlations: [], emotional_velocity: '', relapse_risk_level: 'Low', long_term_advice: [],
        });
    });

    it('excludes DRAFT-tagged entries from the text sent to Gemini', async () => {
        getDocsMock.mockResolvedValue({
            empty: false,
            docs: [
                { data: () => mockDoc(['SMART Tool', 'ABC', 'DRAFT'], 'incomplete draft content') },
                { data: () => mockDoc(['SMART Tool', 'ABC'], 'completed entry content') },
            ],
        });

        const { result } = renderHook(() => useDeepPatternAnalysis());
        await act(async () => { await result.current.analyze(); });

        await waitFor(() => expect(mockGenerateDeepPatternAnalysis).toHaveBeenCalledTimes(1));
        const combinedText = mockGenerateDeepPatternAnalysis.mock.calls[0][0] as string;
        expect(combinedText).toContain('completed entry content');
        expect(combinedText).not.toContain('incomplete draft content');
    });

    it('reports an error if every fetched entry is a DRAFT', async () => {
        getDocsMock.mockResolvedValue({
            empty: false,
            docs: [{ data: () => mockDoc(['SMART Tool', 'ABC', 'DRAFT'], 'incomplete draft content') }],
        });

        const { result } = renderHook(() => useDeepPatternAnalysis());
        await act(async () => { await result.current.analyze(); });

        await waitFor(() => expect(result.current.error).toBe('Not enough journal entries to analyze.'));
        expect(mockGenerateDeepPatternAnalysis).not.toHaveBeenCalled();
    });
});
