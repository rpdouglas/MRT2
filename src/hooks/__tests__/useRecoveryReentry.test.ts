/**
 * src/hooks/__tests__/useRecoveryReentry.test.ts
 * PROJ-112: boundary-case coverage for isReentry/daysBack/streakResurfaced,
 * plus the two write paths (client-side fallback set, streak-resurfaced clear).
 * Uses the real useUserProfile() (mirrors useUserProfile.test.ts's own
 * mocking strategy) rather than mocking it wholesale, so patchFields'
 * real updateDoc call shape is exercised end to end.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { Timestamp } from 'firebase/firestore';
import * as firestore from 'firebase/firestore';
import * as AuthContext from '../../contexts/AuthContext';
import { useRecoveryReentry } from '../useRecoveryReentry';
import type { ScorableJournal } from '../../lib/gamification';

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: vi.fn((_db, ...pathSegments: string[]) => pathSegments.join('/')),
        getDoc: vi.fn(),
        updateDoc: vi.fn().mockResolvedValue(undefined),
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

const daysAgo = (n: number) => Timestamp.fromDate(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

const makeDocSnap = (data: Record<string, unknown>) => ({ exists: () => true, data: () => data });

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

function mockAuth(previousLastLogin: Timestamp | null) {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: { uid: 'test-user-123' },
        previousLastLogin,
    } as unknown as AuthContextValue);
}

describe('🌅 useRecoveryReentry (PROJ-112)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    });

    it('is not reentry for a brand-new user (no previousLastLogin to compare)', async () => {
        mockAuth(null);
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap({ uid: 'test-user-123' }) as unknown as firestore.DocumentSnapshot);

        const { result } = renderHook(() => useRecoveryReentry([]), { wrapper });
        await waitFor(() => expect(result.current).toEqual({ isReentry: false, daysBack: 0, streakResurfaced: false }));

        expect(firestore.updateDoc).not.toHaveBeenCalled();
    });

    it('does not set reentryStartedAt under the 14-day threshold (13 days)', async () => {
        mockAuth(daysAgo(13));
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap({ uid: 'test-user-123' }) as unknown as firestore.DocumentSnapshot);

        renderHook(() => useRecoveryReentry([]), { wrapper });
        await waitFor(() => expect(firestore.getDoc).toHaveBeenCalled());

        expect(firestore.updateDoc).not.toHaveBeenCalled();
    });

    it('sets reentryStartedAt client-side exactly at the 14-day threshold when the server has not already', async () => {
        mockAuth(daysAgo(14));
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap({ uid: 'test-user-123' }) as unknown as firestore.DocumentSnapshot);

        renderHook(() => useRecoveryReentry([]), { wrapper });

        await waitFor(() => {
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                'users/test-user-123',
                { reentryStartedAt: expect.any(Timestamp) }
            );
        });
    });

    it('does not attempt a client-side set when the server already set reentryStartedAt', async () => {
        mockAuth(daysAgo(20));
        vi.mocked(firestore.getDoc).mockResolvedValue(
            makeDocSnap({ uid: 'test-user-123', reentryStartedAt: daysAgo(1) }) as unknown as firestore.DocumentSnapshot
        );

        const { result } = renderHook(() => useRecoveryReentry([]), { wrapper });
        await waitFor(() => expect(result.current.isReentry).toBe(true));

        expect(firestore.updateDoc).not.toHaveBeenCalled();
    });

    it('computes daysBack from journal entries on/after reentryStartedAt and stays suppressed under 7 active days', async () => {
        mockAuth(daysAgo(20));
        vi.mocked(firestore.getDoc).mockResolvedValue(
            makeDocSnap({ uid: 'test-user-123', reentryStartedAt: daysAgo(5) }) as unknown as firestore.DocumentSnapshot
        );
        const journals: ScorableJournal[] = [
            { createdAt: daysAgo(4) },
            { createdAt: daysAgo(3) },
        ] as unknown as ScorableJournal[];

        const { result } = renderHook(() => useRecoveryReentry(journals), { wrapper });
        await waitFor(() => expect(result.current.isReentry).toBe(true));

        expect(result.current.daysBack).toBe(2);
        expect(result.current.streakResurfaced).toBe(false);
        expect(firestore.updateDoc).not.toHaveBeenCalled();
    });

    it('clears reentryStartedAt once daysBack reaches the 7-day resurfacing threshold', async () => {
        mockAuth(daysAgo(20));
        vi.mocked(firestore.getDoc).mockResolvedValue(
            makeDocSnap({ uid: 'test-user-123', reentryStartedAt: daysAgo(7) }) as unknown as firestore.DocumentSnapshot
        );
        const journals: ScorableJournal[] = Array.from({ length: 7 }, (_, i) => ({ createdAt: daysAgo(i) })) as unknown as ScorableJournal[];

        renderHook(() => useRecoveryReentry(journals), { wrapper });

        await waitFor(() => {
            expect(firestore.updateDoc).toHaveBeenCalledWith(
                'users/test-user-123',
                { reentryStartedAt: null }
            );
        });
    });
});
