/**
 * src/hooks/__tests__/useTaskOperations.test.ts
 * PURPOSE: Validates Task CRUD mutations and cache invalidation.
 * STACK: Vitest + React Testing Library + React Query
 * PROJ-101 Phase 3: the optimistic-update/rollback tests this file used to
 * have were deleted along with the optimistic-update machinery itself — see
 * useTaskOperations.ts's header comment for why (it targeted a cache key
 * the real Tasks page never read).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTaskOperations } from '../useTaskOperations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import * as AuthContext from '../../contexts/AuthContext';
import * as TaskLib from '../../lib/tasks';
import { Timestamp } from 'firebase/firestore';

// --- MOCKS ---
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../lib/tasks', () => ({ addTask: vi.fn(), toggleTask: vi.fn(), deleteTask: vi.fn(), updateTask: vi.fn(), }));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: ReactNode }) => (
    createElement(QueryClientProvider, { client: queryClient }, children)
);

// Helper type for mocking
type AuthContextValue = ReturnType<typeof AuthContext.useAuth>;

describe('📋 useTaskOperations (Optimistic UI)', () => {
    const mockUser = { uid: 'test-user' };
    const mockTask: TaskLib.Task = {
        id: 't1',
        uid: 'test-user',
        title: 'Test Task',
        completed: false,
        status: 'pending',
        isRecurring: false,
        frequency: 'once',
        priority: 'Medium',
        currentStreak: 0,
        createdAt: Timestamp.now(),
        dueDate: Timestamp.now()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: mockUser } as unknown as AuthContextValue);
        queryClient.setQueryData(['tasks', mockUser.uid], [mockTask]);
    });

    it('1. should call TaskLib.toggleTask and invalidate the tasks cache key', async () => {
        const { result } = renderHook(() => useTaskOperations(), { wrapper });

        result.current.toggleTask({ task: mockTask, isCompleting: true });

        await waitFor(() => {
            expect(TaskLib.toggleTask).toHaveBeenCalledWith(mockTask, true);
        });

        await waitFor(() => {
            const state = queryClient.getQueryState(['tasks', mockUser.uid]);
            expect(state?.isInvalidated).toBe(true);
        });
    });

    it('2. should not throw synchronously when the API rejects (error surfaces via mutation state, not a thrown exception on the UI thread)', async () => {
        vi.mocked(TaskLib.toggleTask).mockRejectedValue(new Error("Network Error"));

        const { result } = renderHook(() => useTaskOperations(), { wrapper });

        expect(() => result.current.toggleTask({ task: mockTask, isCompleting: true })).not.toThrow();

        await waitFor(() => {
            expect(TaskLib.toggleTask).toHaveBeenCalled();
        });

        // No optimistic cache patch exists to roll back — the cache should
        // simply remain whatever it was before the mutation (untouched).
        const cached = queryClient.getQueryData<TaskLib.Task[]>(['tasks', mockUser.uid]);
        expect(cached?.[0].status).toBe('pending');
    });
});
