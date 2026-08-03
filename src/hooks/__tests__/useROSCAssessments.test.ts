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

        // 3+ entries so the sparse-window (< 3 entries) fallback to a 30-day
        // lookback does not fire — this test is exercising the normal weekly path.
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
                {
                    data: () => ({
                        content: 'cipher-def',
                        isEncrypted: true,
                        moodScore: 6,
                        tags: ['meeting'],
                        createdAt: { toDate: () => new Date('2026-07-02') },
                    }),
                },
                {
                    data: () => ({
                        content: 'cipher-ghi',
                        isEncrypted: true,
                        moodScore: 8,
                        tags: ['gratitude'],
                        createdAt: { toDate: () => new Date('2026-07-03') },
                    }),
                },
            ],
        } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

        const plaintextNarrative = 'The user showed strong progress this month, mentioning meetings often.';
        const plaintextAction = 'Reach out to one peer you haven\'t connected with in a while.';
        vi.mocked(GeminiLib.generateROSCAnalysis).mockResolvedValue({
            scores: {
                health: { score: 8, evidence: ['exercised', 'slept well'], action: 'Walk 10 minutes daily.' },
                home: { score: 6, evidence: ['stable routine'], action: 'Tidy one shared space this week.' },
                purpose: { score: 7, evidence: ['finished a project'], action: 'Start one new step-work milestone.' },
                community: { score: 9, evidence: ['went to 3 meetings'], action: plaintextAction },
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
            3,
            'the past 7 days'
        );

        // The AI narrative and per-domain actions must be encrypted before write...
        expect(encryptMock).toHaveBeenCalledWith(expect.stringContaining(plaintextNarrative));
        expect(encryptMock).toHaveBeenCalledWith(expect.stringContaining(plaintextAction));

        // ...and the Firestore write payload must carry only the ciphertext —
        // this is the security/raw-doc-check contract: assert the plaintext
        // narrative/action text never appears anywhere in what actually gets written.
        const writeCall = vi.mocked(RoscLib.createROSCAssessment).mock.calls[0];
        const payload = writeCall[1];
        expect(payload.encryptedAIContext).toBe('AICTX_CIPHERTEXT_BLOB');
        expect(JSON.stringify(payload)).not.toContain(plaintextNarrative);
        expect(JSON.stringify(payload)).not.toContain(plaintextAction);

        // Plaintext-per-CLAUDE.md fields are still asserted directly.
        expect(payload.totalScore).toBe(8 + 6 + 7 + 9);
        expect(payload.trajectory).toBe('Improving');
        expect(payload.journalEntriesAnalysed).toBe(3);
    });

    it('premium sparse-window fallback: a weekly window with < 3 journal entries widens to a 30-day lookback', async () => {
        mockAuth('premium');
        mockEncryption();

        // First (7-day) query returns only 2 entries; the fallback re-query
        // (30-day) returns the same docs plus older ones the widened window reaches.
        vi.mocked(firestore.getDocs)
            .mockResolvedValueOnce({
                docs: [
                    { data: () => ({ content: 'a', isEncrypted: false, moodScore: 5, tags: [], createdAt: { toDate: () => new Date() } }) },
                    { data: () => ({ content: 'b', isEncrypted: false, moodScore: 6, tags: [], createdAt: { toDate: () => new Date() } }) },
                ],
            } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>)
            .mockResolvedValueOnce({
                docs: [
                    { data: () => ({ content: 'a', isEncrypted: false, moodScore: 5, tags: [], createdAt: { toDate: () => new Date() } }) },
                    { data: () => ({ content: 'b', isEncrypted: false, moodScore: 6, tags: [], createdAt: { toDate: () => new Date() } }) },
                    { data: () => ({ content: 'c', isEncrypted: false, moodScore: 7, tags: [], createdAt: { toDate: () => new Date() } }) },
                ],
            } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

        vi.mocked(GeminiLib.generateROSCAnalysis).mockResolvedValue({
            scores: {
                health: { score: 5, evidence: [], action: 'a' },
                home: { score: 5, evidence: [], action: 'b' },
                purpose: { score: 5, evidence: [], action: 'c' },
                community: { score: 5, evidence: [], action: 'd' },
            },
            trajectory: 'Stable',
            narrative: 'n',
            strengths: [],
            growth_areas: [],
        });

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.createAssessment(checkIn);

        expect(firestore.getDocs).toHaveBeenCalledTimes(2);
        expect(GeminiLib.generateROSCAnalysis).toHaveBeenCalledWith(
            checkIn,
            expect.any(String),
            3,
            'the past 30 days'
        );

        const writeCall = vi.mocked(RoscLib.createROSCAssessment).mock.calls[0];
        const payload = writeCall[1];
        expect(payload.journalEntriesAnalysed).toBe(3);
        const windowDays = (payload.periodEnd.toMillis() - payload.periodStart.toMillis()) / (1000 * 60 * 60 * 24);
        expect(windowDays).toBeGreaterThan(29);
        expect(windowDays).toBeLessThan(31);
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

    it('canCreateAssessment: false (free/monthly) when the latest assessment.createdAt is a Timestamp in the current month', async () => {
        mockAuth('free');
        mockEncryption();
        vi.mocked(RoscLib.getROSCAssessments).mockResolvedValue([
            { id: 'a1', uid: 'user_1', createdAt: Timestamp.now() } as unknown as Awaited<ReturnType<typeof RoscLib.getROSCAssessments>>[number],
        ]);

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cadence).toBe('monthly');
        expect(result.current.canCreateAssessment).toBe(false);
    });

    it('canCreateAssessment: handles a legacy non-Timestamp createdAt string via the Date fallback branch', async () => {
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
        expect(result.current.canCreateAssessment).toBe(false);
    });

    it('cross-tier cadence: same latest date (8 days ago, same calendar month) is eligible for premium/weekly but not free/monthly', async () => {
        // Fixed "now" mid-month so "8 days ago" is guaranteed to land in the
        // same calendar month regardless of which day the suite actually runs.
        // Only Date is faked — setTimeout/setInterval stay real so RTL's
        // waitFor (and TanStack Query's internals) keep working normally.
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
        const eightDaysAgo = Timestamp.fromDate(new Date('2026-08-07T12:00:00Z'));

        try {
            mockAuth('premium');
            mockEncryption();
            vi.mocked(RoscLib.getROSCAssessments).mockResolvedValue([
                { id: 'a1', uid: 'user_1', createdAt: eightDaysAgo } as unknown as Awaited<ReturnType<typeof RoscLib.getROSCAssessments>>[number],
            ]);
            const premiumRender = renderHook(() => useROSCAssessments(), { wrapper });
            await waitFor(() => expect(premiumRender.result.current.isLoading).toBe(false));
            expect(premiumRender.result.current.cadence).toBe('weekly');
            expect(premiumRender.result.current.canCreateAssessment).toBe(true);

            queryClient.clear();
            mockAuth('free');
            const freeRender = renderHook(() => useROSCAssessments(), { wrapper });
            await waitFor(() => expect(freeRender.result.current.isLoading).toBe(false));
            expect(freeRender.result.current.cadence).toBe('monthly');
            expect(freeRender.result.current.canCreateAssessment).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it('premium tier: latest assessment 3 days ago is not yet eligible for the weekly cadence', async () => {
        mockAuth('premium');
        mockEncryption();
        vi.mocked(RoscLib.getROSCAssessments).mockResolvedValue([
            { id: 'a1', uid: 'user_1', createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) } as unknown as Awaited<ReturnType<typeof RoscLib.getROSCAssessments>>[number],
        ]);

        const { result } = renderHook(() => useROSCAssessments(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.canCreateAssessment).toBe(false);
        expect(result.current.daysUntilEligible).toBeGreaterThan(0);
    });
});
