/**
 * src/hooks/__tests__/useTaskOperations.test.ts
 * PURPOSE: Validates optimistic UI updates and error rollbacks for Tasks.
 * STACK: Vitest + React Testing Library + React Query
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

vi.mock('../../lib/tasks', () => ({
    addTask: vi.fn(),
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
    updateTask: vi.fn(),
}));

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
        // FIX: Cast via unknown to avoid 'any' violation
        vi.mocked(AuthContext.useAuth).mockReturnValue({ user: mockUser } as unknown as AuthContextValue);
        // Pre-seed cache
        queryClient.setQueryData(['tasks', mockUser.uid], [mockTask]);
    });

    it('1. should perform optimistic update when toggling task', async () => {
        const { result } = renderHook(() => useTaskOperations(), { wrapper });

        // Trigger Mutation
        result.current.toggleTask(mockTask);

        // IMMEDIATE: Cache should be updated before API returns
        // FIX: Wrapped in waitFor because onMutate is async (microtask delay)
        await waitFor(() => {
            const cached = queryClient.getQueryData<TaskLib.Task[]>(['tasks', mockUser.uid]);
            expect(cached?.[0].status).toBe('completed');
        });
        
        // EVENTUAL: API called
        await waitFor(() => {
            expect(TaskLib.toggleTask).toHaveBeenCalled();
        });
    });

    it('2. should rollback optimistic update if API fails', async () => {
        // Mock API failure
        vi.mocked(TaskLib.toggleTask).mockRejectedValue(new Error("Network Error"));

        const { result } = renderHook(() => useTaskOperations(), { wrapper });

        try {
            await result.current.toggleTask(mockTask);
        } catch {
            // FIX: Removed unused 'e' variable
            // Expected error
        }

        // ROLLBACK: Status should be 'pending' again
        await waitFor(() => {
            const cached = queryClient.getQueryData<TaskLib.Task[]>(['tasks', mockUser.uid]);
            expect(cached?.[0].status).toBe('pending');
        });
    });
});
