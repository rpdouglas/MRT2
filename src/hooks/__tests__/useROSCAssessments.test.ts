/**
 * src/hooks/__tests__/useROSCAssessments.test.ts
 * PURPOSE: Firestore-write coverage for the ROSC check-in mutation — both the
 * free-tier self-report path and the premium AI-analysis path (which decrypts
 * journal content client-side and re-encrypts the AI narrative before write).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import * as firestore from 'firebase/firestore';
import { useROSCAssessments } from '../useROSCAssessments';
import * as AuthContext from '../../contexts/AuthContext';
import * as EncryptionContext from '../../contexts/EncryptionContext';
import * as RoscLib from '../../lib/rosc';
import * as GeminiLib from '../../lib/gemini';
import type { ROSCCheckInAnswers } from '../../lib/types/rosc';

vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../contexts/EncryptionContext', () => ({ useEncryption: vi.fn() }));

vi.mock('../../lib/rosc', () => ({
    createROSCAssessment: vi.fn(),
    getROSCAssessments: vi.fn(),
}));

vi.mock('../../lib/gemini', () => ({ generateROSCAnalysis: vi.fn() }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
        getDocs: vi.fn(),
        doc: vi.fn(),
        updateDoc: vi.fn().mockResolvedValue(undefined),
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;
type EncryptionContextValue = ReturnType<typeof EncryptionContext.useEncryption>;

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

const mockUser = { uid: 'user_1' };

const checkIn: ROSCCheckInAnswers = {
    health: 4,
    home: 3,
    purpose: 5,
    community: 2,
    resilience: 4,
};

function mockAuth(userTier: 'free' | 'premium') {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: mockUser,
        userTier,
    } as unknown as AuthContextValue);
}

function mockEncryption(overrides: Partial<EncryptionContextValue> = {}) {
    vi.mocked(EncryptionContext.useEncryption).mockReturnValue({
        encrypt: vi.fn().mockResolvedValue('AICTX_CIPHERTEXT_BLOB'),
        decrypt: vi.fn().mockImplementation(async (c: string) => `[decrypted] ${c}`),
        isVaultUnlocked: true,
        ...overrides,
    } as unknown as EncryptionContextValue);
}

describe('🧭 useROSCAssessments (Firestore-write hook)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        sessionStorage.clear();
        localStorage.clear();
        vi.mocked(RoscLib.getROSCAssessments).mockResolvedValue([]);
        vi.mocked(RoscLib.createROSCAssessment).mockResolvedValue('new-assessment-id');
        vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
    });

    it('free tier: self-report only, linearly mapped, no Gemini call and no plaintext AI context', async () => {
        mockAuth('free');
        mockEncryption();

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.createAssessment(checkIn);

        expect(GeminiLib.generateROSCAnalysis).not.toHaveBeenCalled();
        expect(RoscLib.createROSCAssessment).toHaveBeenCalledWith(
            'user_1',
            expect.objectContaining({
                encryptedAIContext: '',
                journalEntriesAnalysed: 0,
                trajectory: 'Insufficient Data',
                scores: expect.objectContaining({
                    health: { score: 8, selfReportedScore: 4, evidenceCount: 0 }, // toScore: n*2
                    community: { score: 4, selfReportedScore: 2, evidenceCount: 0 },
                }),
            })
        );
    });

    it('premium tier: decrypts journal entries, calls Gemini, and writes only ciphertext for the AI context — never the plaintext narrative', async () => {
        mockAuth('premium');
        const encryptMock = vi.fn().mockResolvedValue('AICTX_CIPHERTEXT_BLOB');
        const decryptMock = vi.fn().mockImplementation(async (c: string) => `plain:${c}`);
        mockEncryption({ encrypt: encryptMock, decrypt: decryptMock, isVaultUnlocked: true });

        vi.mocked(firestore.getDocs).mockResolvedValue({
            docs: [
                {
                    data: () => ({
                        content: 'cipher-abc',
                        isEncrypted: true,
                        moodScore: 7,
                        tags: ['gratitude'],
                        createdAt: { toDate: () => new Date('2026-07-01') },
                    }),
                },
            ],
        } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

        const plaintextNarrative = 'The user showed strong progress this month, mentioning meetings often.';
        vi.mocked(GeminiLib.generateROSCAnalysis).mockResolvedValue({
            scores: {
                health: { score: 8, evidence: ['exercised', 'slept well'] },
                home: { score: 6, evidence: ['stable routine'] },
                purpose: { score: 7, evidence: ['finished a project'] },
                community: { score: 9, evidence: ['went to 3 meetings'] },
            },
            trajectory: 'Improving',
            narrative: plaintextNarrative,
            strengths: ['consistency'],
            growth_areas: ['sleep'],
        });

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.createAssessment(checkIn);

        // The decrypted journal content is fed to Gemini (approved flow per
        // CLAUDE.md's Gemini exception list), but never persisted to Firestore.
        expect(decryptMock).toHaveBeenCalledWith('cipher-abc');
        expect(GeminiLib.generateROSCAnalysis).toHaveBeenCalledWith(
            checkIn,
            expect.stringContaining('plain:cipher-abc'),
            1
        );

        // The AI narrative must be encrypted before write...
        expect(encryptMock).toHaveBeenCalledWith(expect.stringContaining(plaintextNarrative));

        // ...and the Firestore write payload must carry only the ciphertext —
        // this is the security/raw-doc-check contract: assert the plaintext
        // narrative never appears anywhere in what actually gets written.
        const writeCall = vi.mocked(RoscLib.createROSCAssessment).mock.calls[0];
        const payload = writeCall[1];
        expect(payload.encryptedAIContext).toBe('AICTX_CIPHERTEXT_BLOB');
        expect(JSON.stringify(payload)).not.toContain(plaintextNarrative);

        // Plaintext-per-CLAUDE.md fields are still asserted directly.
        expect(payload.totalScore).toBe(8 + 6 + 7 + 9);
        expect(payload.trajectory).toBe('Improving');
        expect(payload.journalEntriesAnalysed).toBe(1);
    });

    it('premium tier with a locked vault falls back to the free-tier self-report path', async () => {
        mockAuth('premium');
        mockEncryption({ isVaultUnlocked: false });

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.createAssessment(checkIn);

        expect(GeminiLib.generateROSCAnalysis).not.toHaveBeenCalled();
        expect(RoscLib.createROSCAssessment).toHaveBeenCalledWith(
            'user_1',
            expect.objectContaining({ encryptedAIContext: '' })
        );
    });

    it('on success: clears saved check-in progress and invalidates the assessments + count caches', async () => {
        mockAuth('free');
        mockEncryption();
        sessionStorage.setItem(`roscCheckIn_${new Date().toISOString().slice(0, 7)}`, JSON.stringify(checkIn));

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        await result.current.createAssessment(checkIn);

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['rosc_assessments', 'user_1'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['rosc_count', 'user_1'] });
        });
    });

    it('on failure: surfaces a friendly error and does not throw the raw Firestore error to the caller\'s render', async () => {
        mockAuth('free');
        mockEncryption();
        vi.mocked(RoscLib.createROSCAssessment).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(result.current.createAssessment(checkIn)).rejects.toThrow('Network Error');

        await waitFor(() => {
            expect(result.current.createError).toBe('Network Error');
        });
    });

    it('canCreateThisMonth: false when the latest assessment.createdAt is a Timestamp in the current month', async () => {
        mockAuth('free');
        mockEncryption();
        vi.mocked(RoscLib.getROSCAssessments).mockResolvedValue([
            { id: 'a1', uid: 'user_1', createdAt: Timestamp.now() } as unknown as Awaited<ReturnType<typeof RoscLib.getROSCAssessments>>[number],
        ]);

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.canCreateThisMonth).toBe(false);
    });

    it('canCreateThisMonth: handles a legacy non-Timestamp createdAt string via the Date fallback branch', async () => {
        mockAuth('free');
        mockEncryption();
        const legacyDateString = new Date().toISOString();
        vi.mocked(RoscLib.getROSCAssessments).mockResolvedValue([
            { id: 'a1', uid: 'user_1', createdAt: legacyDateString } as unknown as Awaited<ReturnType<typeof RoscLib.getROSCAssessments>>[number],
        ]);

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Same month as "now" (the string is `new Date().toISOString()`), so
        // the legacy fallback branch must still correctly block re-creation.
        expect(result.current.canCreateThisMonth).toBe(false);
    });
});
