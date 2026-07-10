/**
 * src/hooks/__tests__/useUserProfile.test.ts
 * QA: Project 58 Phase 1 — verifies Profile's read/write now flows through TanStack
 * Query under the exact `['profile', uid]` key that useAnchorStatus/useHeroColor/
 * useReadingPreferences already depend on, and that both write paths (top-level
 * merge via updateProfile, dot-path patch via patchFields) invalidate that key.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserProfile } from '../useUserProfile';
import * as AuthContext from '../../contexts/AuthContext';
import * as firestore from 'firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

vi.mock('../../lib/firebase', () => ({
    db: { type: 'mock-db' }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        doc: vi.fn((_db, ...pathSegments: string[]) => pathSegments.join('/')),
        getDoc: vi.fn(),
        setDoc: vi.fn().mockResolvedValue(undefined),
        updateDoc: vi.fn().mockResolvedValue(undefined),
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

const makeDocSnap = (exists: boolean, data?: Record<string, unknown>) => ({
    exists: () => exists,
    data: () => data,
});

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

describe('👤 useUserProfile Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { uid: 'test-user-123' },
        } as unknown as AuthContextValue);

        vi.spyOn(queryClient, 'invalidateQueries');
    });

    it('1. reads under the exact ["profile", uid] key shared with useAnchorStatus/useHeroColor', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue(
            makeDocSnap(true, { uid: 'test-user-123', displayName: 'Walt' }) as unknown as firestore.DocumentSnapshot
        );

        const { result } = renderHook(() => useUserProfile(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(queryClient.getQueryData(['profile', 'test-user-123'])).toMatchObject({ displayName: 'Walt' });
        expect(result.current.profile).toMatchObject({ displayName: 'Walt' });
    });

    it('2. returns null (not undefined) when no profile document exists yet', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap(false) as unknown as firestore.DocumentSnapshot);

        const { result } = renderHook(() => useUserProfile(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.profile).toBeNull();
    });

    it('3. updateProfile merge-writes scalar fields and invalidates the profile cache key', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap(true, { uid: 'test-user-123' }) as unknown as firestore.DocumentSnapshot);
        const { result } = renderHook(() => useUserProfile(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.updateProfile.mutateAsync({ displayName: 'New Name' });

        expect(firestore.setDoc).toHaveBeenCalledWith(
            'users/test-user-123',
            { displayName: 'New Name' },
            { merge: true }
        );
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile', 'test-user-123'] });
    });

    it('4. patchFields writes dot-path keys via updateDoc (not a raw nested merge) and invalidates the cache key', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap(true, { uid: 'test-user-123' }) as unknown as firestore.DocumentSnapshot);
        const { result } = renderHook(() => useUserProfile(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.patchFields.mutateAsync({ 'anchorSettings.notifyCheckIn': false });

        expect(firestore.updateDoc).toHaveBeenCalledWith(
            'users/test-user-123',
            { 'anchorSettings.notifyCheckIn': false }
        );
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile', 'test-user-123'] });
    });

    it('5. this is the regression fix for Critical Finding #2: writes invalidate the same key useAnchorStatus reads', async () => {
        vi.mocked(firestore.getDoc).mockResolvedValue(makeDocSnap(true, { uid: 'test-user-123' }) as unknown as firestore.DocumentSnapshot);
        const { result } = renderHook(() => useUserProfile(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await result.current.patchFields.mutateAsync({ 'anchorSettings.notifyCheckIn': false });

        // useAnchorStatus.ts queries this exact key — invalidating it is what lets
        // the Dashboard badge reflect a Profile change without a manual refetch.
        const anchorStatusQueryKey = ['profile', 'test-user-123'];
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: anchorStatusQueryKey });
    });
});
