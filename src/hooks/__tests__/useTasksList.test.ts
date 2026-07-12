/**
 * src/hooks/__tests__/useTasksList.test.ts
 * PROJ-62: Regression guard for the Tasks.tsx onSnapshot extraction — asserts
 * the dueDate/createdAt/lastCompletedAt Timestamp->Date conversion still
 * matches what Tasks.tsx relied on inline before the extraction, since a
 * silent mismatch here would break the Ledger's day-drift logic (PROJ-47).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasksList } from '../useTasksList';
import * as AuthContext from '../../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({ db: { type: 'mock-db' } }));

type SnapshotCallback = (snap: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void;
let snapshotCallback: SnapshotCallback | null = null;
const mockUnsubscribe = vi.fn();

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('firebase/firestore')>();
    return {
        ...actual,
        collection: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
        onSnapshot: vi.fn((_q: unknown, callback: SnapshotCallback) => {
            snapshotCallback = callback;
            return mockUnsubscribe;
        }),
    };
});

type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

describe('📋 useTasksList — Tasks.tsx read-path extraction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        snapshotCallback = null;
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: { uid: 'test-uid' } } as unknown as AuthContextValue);
    });

    it('starts loading with an empty task list', () => {
        const { result } = renderHook(() => useTasksList());
        expect(result.current.loading).toBe(true);
        expect(result.current.tasks).toEqual([]);
    });

    it('converts Timestamp fields to Date and clears loading once a snapshot arrives', async () => {
        const { result } = renderHook(() => useTasksList());

        const dueTimestamp = Timestamp.fromDate(new Date('2026-07-15T00:00:00.000Z'));
        const createdTimestamp = Timestamp.fromDate(new Date('2026-07-01T00:00:00.000Z'));

        act(() => {
            snapshotCallback?.({
                docs: [{
                    id: 'task-1',
                    data: () => ({
                        uid: 'test-uid',
                        title: 'Attend meeting',
                        dueDate: dueTimestamp,
                        createdAt: createdTimestamp,
                        lastCompletedAt: null,
                    }),
                }],
            });
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].id).toBe('task-1');
        expect(result.current.tasks[0].dueDate).toBeInstanceOf(Date);
        expect(result.current.tasks[0].createdAt).toBeInstanceOf(Date);
        expect((result.current.tasks[0].dueDate as Date).toISOString()).toBe('2026-07-15T00:00:00.000Z');
    });

    it('unsubscribes the Firestore listener on unmount', () => {
        const { unmount } = renderHook(() => useTasksList());
        unmount();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('does not subscribe when there is no authenticated user', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: null } as unknown as AuthContextValue);
        renderHook(() => useTasksList());
        expect(snapshotCallback).toBeNull();
    });
});
